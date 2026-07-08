<?php

namespace App\Controller;

use App\Entity\Listing;
use App\Entity\Player;
use App\Entity\Team;
use App\Entity\TeamMembership;
use App\Entity\Transfer\TransferAgentInvitation;
use App\Entity\Transfer\TransferAgreement;
use App\Entity\Transfer\TransferNegociation;
use App\Entity\Transfer\TransferOffer;
use App\Entity\User;
use App\Enum\ListingStatusEnum;
use App\Enum\OfferStatusEnum;
use App\Enum\TransferNegociationStatusEnum;
use App\Enum\TransferOfferKindEnum;
use App\Repository\ListingRepository;
use App\Repository\PlayerRepository;
use App\Repository\TeamMembershipRepository;
use App\Repository\Transfer\TransferNegociationRepository;
use App\Repository\Transfer\TransferOfferRepository;
use App\Repository\Transfer\TransferAgentInvitationRepository;
use App\Service\Subscription\SubscriptionLimits;
use App\Service\Contract\ContractNegotiationWorkflow;
use App\Service\MarketRealtimePublisher;
use App\Service\MercureSubscriberTokenFactory;
use App\Service\Notification\NotificationService;
use App\Service\PublicFeed\PublicFeedPublisher;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/transfers')]
final class TransferController extends AbstractController
{
    #[Route('/mercure-token', name: 'app_transfer_mercure_token', methods: ['GET'])]
    public function mercureToken(
        #[CurrentUser] ?User $user,
        MercureSubscriberTokenFactory $tokenFactory,
        MarketRealtimePublisher $marketRealtimePublisher,
    ): JsonResponse {
        if (!$user instanceof User) {
            return $this->json(['errorMessage' => 'Utilisateur non authentifié.'], 401);
        }

        $topic = $marketRealtimePublisher->topicForUser($user);
        $token = $tokenFactory->create([$topic]);
        $response = $this->json([
            'hubUrl' => $this->getParameter('mercure_public_url'),
            'topic' => $topic,
        ]);

        $response->headers->setCookie(Cookie::create('mercureAuthorization')
            ->withValue($token)
            ->withPath('/.well-known/mercure')
            ->withSecure(false)
            ->withHttpOnly(true)
            ->withSameSite(Cookie::SAMESITE_LAX));

        return $response;
    }

    #[Route('/offers/mine', name: 'app_transfer_offers_mine', methods: ['GET'])]
    public function mine(
        #[CurrentUser] ?User $user,
        TeamMembershipRepository $teamMembershipRepository,
        TransferOfferRepository $transferOfferRepository,
    ): JsonResponse {
        $membership = $this->getCurrentMembership($user, $teamMembershipRepository);

        if ($membership instanceof JsonResponse) {
            return $membership;
        }

        $team = $membership->getTeam();

        return $this->json([
            'sentOffers' => array_map(
                fn (TransferOffer $offer): array => $this->serializeOffer($offer, $team),
                $transferOfferRepository->findSentByTeam($team),
            ),
            'receivedOffers' => array_map(
                fn (TransferOffer $offer): array => $this->serializeOffer($offer, $team),
                $transferOfferRepository->findReceivedByTeam($team),
            ),
        ]);
    }

    #[Route('/history', name: 'app_transfer_history', methods: ['GET'])]
    public function history(
        #[CurrentUser] ?User $user,
        TeamMembershipRepository $teamMembershipRepository,
        TransferOfferRepository $transferOfferRepository,
    ): JsonResponse {
        $membership = $this->getCurrentMembership($user, $teamMembershipRepository);

        if ($membership instanceof JsonResponse) {
            return $membership;
        }

        $team = $membership->getTeam();
        $offers = $transferOfferRepository->findAcceptedForTeam($team);
        $items = array_map(
            fn (TransferOffer $offer): array => $this->serializeHistoryItem($offer, $team),
            $offers,
        );
        $totalAmount = array_sum(array_map(
            static fn (TransferOffer $offer): int => $offer->getAmount() ?? 0,
            $offers,
        ));
        $freeCount = count(array_filter(
            $offers,
            static fn (TransferOffer $offer): bool => 0 === ($offer->getAmount() ?? 0),
        ));

        return $this->json([
            'transfers' => $items,
            'stats' => [
                'totalTransfers' => count($offers),
                'totalAmount' => $this->formatMoney($totalAmount),
                'totalAmountValue' => $totalAmount / 100,
                'freeTransfers' => $freeCount,
                'paidTransfers' => count($offers) - $freeCount,
            ],
        ]);
    }

    #[Route('/negotiate-context', name: 'app_transfer_negotiate_context', methods: ['GET'])]
    public function negotiateContext(
        Request $request,
        #[CurrentUser] ?User $user,
        TeamMembershipRepository $teamMembershipRepository,
        ListingRepository $listingRepository,
        TransferOfferRepository $transferOfferRepository,
        TransferNegociationRepository $transferNegociationRepository,
    ): JsonResponse {
        $membership = $this->getCurrentMembership($user, $teamMembershipRepository);

        if ($membership instanceof JsonResponse) {
            return $membership;
        }

        $team = $membership->getTeam();
        $offerId = trim($request->query->getString('offerId', ''));
        $listingId = trim($request->query->getString('listingId', ''));
        $sourceOffer = null;
        $negociation = null;

        if ('' !== $offerId) {
            $sourceOffer = $transferOfferRepository->find($offerId);

            if (!$sourceOffer instanceof TransferOffer) {
                return $this->json(['errorMessage' => 'Offre introuvable.'], 404);
            }

            $negociation = $sourceOffer->getTransferNegociation();
            $listing = $negociation?->getListing();
        } else {
            $listing = $listingRepository->find($listingId);

            if (!$listing instanceof Listing || ListingStatusEnum::ACTIVE !== $listing->getStatus()) {
                return $this->json(['errorMessage' => 'Annonce introuvable ou inactive.'], 404);
            }

            if ($listing->getSellerTeam()?->getId()?->toRfc4122() === $team->getId()?->toRfc4122()) {
                return $this->json(['errorMessage' => 'Vous ne pouvez pas négocier votre propre joueur comme acheteur.'], 422);
            }

            $negociation = $transferNegociationRepository->findOneForListingAndBuyer($listing, $team);
        }

        if (!$listing instanceof Listing) {
            return $this->json(['errorMessage' => 'Annonce introuvable.'], 404);
        }

        $sellerTeam = $listing->getSellerTeam();
        $buyerTeam = $negociation?->getBuyerTeam() ?? $team;
        $isSeller = $sellerTeam?->getId()?->toRfc4122() === $team->getId()?->toRfc4122();
        $isBuyer = $buyerTeam?->getId()?->toRfc4122() === $team->getId()?->toRfc4122();

        if (!$isSeller && !$isBuyer) {
            return $this->json(['errorMessage' => 'Vous ne pouvez pas accéder à cette négociation.'], 403);
        }

        return $this->json([
            'context' => $this->serializeNegotiationContext(
                $listing,
                $buyerTeam,
                $team,
                $teamMembershipRepository,
                $negociation,
                $sourceOffer,
            ),
        ]);
    }

    #[Route('/negotiations/{id}/public-feed', name: 'app_transfer_negotiation_public_feed', methods: ['PUT', 'PATCH'])]
    public function updateNegotiationPublicFeed(
        TransferNegociation $negociation,
        Request $request,
        #[CurrentUser] ?User $user,
        TeamMembershipRepository $teamMembershipRepository,
        EntityManagerInterface $entityManager,
        PublicFeedPublisher $publicFeedPublisher,
        NotificationService $notificationService,
        MarketRealtimePublisher $marketRealtimePublisher,
    ): JsonResponse {
        $membership = $this->getCurrentMembership($user, $teamMembershipRepository);

        if ($membership instanceof JsonResponse) {
            return $membership;
        }

        $team = $membership->getTeam();
        $listing = $negociation->getListing();
        $isSeller = $listing?->getSellerTeam()?->getId()?->toRfc4122() === $team->getId()?->toRfc4122();
        $isBuyer = $negociation->getBuyerTeam()?->getId()?->toRfc4122() === $team->getId()?->toRfc4122();

        if (!$isSeller && !$isBuyer) {
            return $this->json(['errorMessage' => 'Vous ne pouvez pas modifier cette négociation.'], 403);
        }

        $payload = json_decode($request->getContent(), true);
        $enabled = true === (is_array($payload) ? ($payload['enabled'] ?? false) : false);

        $negociation->setPublicFeedEnabled($enabled);
        if ($enabled) {
            foreach ($negociation->getTransferOffers() as $offer) {
                $publicFeedPublisher->publishTransferOffer($offer);
                if (OfferStatusEnum::ACCEPTED === $offer->getStatus()) {
                    $publicFeedPublisher->publishTransferAgreement($offer);
                }
            }
        }
        $entityManager->flush();

        return $this->json([
            'publicFeedEnabled' => $negociation->isPublicFeedEnabled(),
        ]);
    }

    #[Route('/offers', name: 'app_transfer_offer_create', methods: ['POST'])]
    public function createOffer(
        Request $request,
        #[CurrentUser] ?User $user,
        TeamMembershipRepository $teamMembershipRepository,
        ListingRepository $listingRepository,
        PlayerRepository $playerRepository,
        TransferNegociationRepository $transferNegociationRepository,
        SubscriptionLimits $subscriptionLimits,
        EntityManagerInterface $entityManager,
        PublicFeedPublisher $publicFeedPublisher,
        NotificationService $notificationService,
        MarketRealtimePublisher $marketRealtimePublisher,
    ): JsonResponse {
        $membership = $this->getCurrentMembership($user, $teamMembershipRepository);

        if ($membership instanceof JsonResponse) {
            return $membership;
        }

        $payload = json_decode($request->getContent(), true);

        if (!is_array($payload)) {
            return $this->json(['errorMessage' => 'Payload invalide.'], 400);
        }

        $listing = $this->getListing($payload['listingId'] ?? null, $listingRepository);

        if ($listing instanceof JsonResponse) {
            return $listing;
        }

        $buyerTeam = $membership->getTeam();

        if (!$subscriptionLimits->canCreateClubOffer($user)) {
            return $this->json([
                'errorMessage' => 'Vous avez atteint la limite du plan gratuit.',
                'upgradePath' => '/subscription',
            ], 402);
        }

        if ($listing->getSellerTeam()?->getId()?->toRfc4122() === $buyerTeam->getId()?->toRfc4122()) {
            return $this->json([
                'errorMessage' => 'Vous ne pouvez pas émettre une offre pour votre propre joueur.',
            ], 422);
        }

        $negociation = $transferNegociationRepository->findOneForListingAndBuyer($listing, $buyerTeam);

        if (!$negociation instanceof TransferNegociation) {
            $negociation = (new TransferNegociation())
                ->setListing($listing)
                ->setBuyerTeam($buyerTeam)
                ->setStatus(TransferNegociationStatusEnum::OPEN)
                ->setCreatedBy($user)
                ->setCreatedAt(new \DateTimeImmutable());

            $entityManager->persist($negociation);
        }

        $offer = $this->buildOfferFromPayload($payload, $negociation, $user, $buyerTeam, $playerRepository);

        if ($offer instanceof JsonResponse) {
            return $offer;
        }

        $latestOffer = $this->getLatestOffer($negociation);
        if ($latestOffer instanceof TransferOffer && $this->isSameTransferOffer($offer, $latestOffer)) {
            return $this->json([
                'errorMessage' => 'Cette proposition est identique à la dernière offre. Acceptez-la directement ou modifiez au moins un élément.',
            ], 422);
        }

        $entityManager->persist($offer);
        $publicFeedPublisher->publishTransferOffer($offer);
        $entityManager->flush();
        $marketRealtimePublisher->publishTransferOfferUpdate($offer, 'transfer_offer.created');

        if ($listing->getSellerTeam() instanceof Team) {
            foreach ($teamMembershipRepository->findUsersByTeam($listing->getSellerTeam()) as $recipient) {
                $notificationService->notify(
                    recipient: $recipient,
                    type: 'transfer_offer.received',
                    category: 'negotiations',
                    title: 'Nouvelle offre de transfert',
                    body: sprintf('%s a transmis une offre pour %s.', $buyerTeam->getName(), $this->playerName($listing->getPlayer())),
                    actionUrl: sprintf('/market/transfers?offerId=%s', $offer->getId()?->toRfc4122()),
                    targetRoute: '/market',
                    requiresAction: true,
                    severity: 'warning',
                    actor: $user,
                    sourceType: 'transfer_offer',
                    sourceId: $offer->getId()?->toRfc4122(),
                );
            }
        }

        return $this->json([
            'offer' => $this->serializeOffer($offer, $buyerTeam),
        ], 201);
    }

    #[Route('/offers/{id}/accept', name: 'app_transfer_offer_accept', methods: ['PUT', 'PATCH'])]
    public function accept(
        TransferOffer $offer,
        #[CurrentUser] ?User $user,
        TeamMembershipRepository $teamMembershipRepository,
        ContractNegotiationWorkflow $contractNegotiationWorkflow,
        EntityManagerInterface $entityManager,
        PublicFeedPublisher $publicFeedPublisher,
        NotificationService $notificationService,
        MarketRealtimePublisher $marketRealtimePublisher,
    ): JsonResponse {
        $membership = $this->getCurrentMembership($user, $teamMembershipRepository);

        if ($membership instanceof JsonResponse) {
            return $membership;
        }

        $team = $membership->getTeam();
        $listing = $offer->getTransferNegociation()?->getListing();
        $buyerTeam = $offer->getTransferNegociation()?->getBuyerTeam();
        $sellerTeam = $listing?->getSellerTeam();
        $isSeller = $sellerTeam?->getId()?->toRfc4122() === $team->getId()?->toRfc4122();
        $isBuyer = $buyerTeam?->getId()?->toRfc4122() === $team->getId()?->toRfc4122();
        $authorMembership = $offer->getAuthor() ? $teamMembershipRepository->findPrimaryForUser($offer->getAuthor()) : null;
        $authorTeamId = $authorMembership?->getTeam()?->getId()?->toRfc4122();

        if (!$isSeller && !$isBuyer) {
            return $this->json(['errorMessage' => 'Vous ne pouvez pas accepter cette offre.'], 403);
        }

        if (null !== $authorTeamId && $authorTeamId === $team->getId()?->toRfc4122()) {
            return $this->json(['errorMessage' => 'Le club qui a emis une offre ne peut pas accepter sa propre proposition.'], 403);
        }

        $contractNegociation = $entityManager->wrapInTransaction(function () use (
            $offer,
            $user,
            $contractNegotiationWorkflow,
            $entityManager,
            $publicFeedPublisher,
        ) {
            $offer->setStatus(OfferStatusEnum::ACCEPTED);
            $transferNegociation = $offer->getTransferNegociation();
            $player = $transferNegociation?->getListing()?->getPlayer();
            $nextStatus = null === $player?->getAgent()
                ? TransferNegociationStatusEnum::PENDING_AGENT
                : TransferNegociationStatusEnum::AGREED_CLUBS;
            $transferNegociation
                ?->setStatus($nextStatus)
                ->setAgreedAt(new \DateTimeImmutable());

            if ($transferNegociation && TransferNegociationStatusEnum::PENDING_AGENT === $nextStatus) {
                $this->ensureTransferAgreement($transferNegociation, $offer, $entityManager);
            }

            $contractNegociation = $transferNegociation && $user && TransferNegociationStatusEnum::AGREED_CLUBS === $nextStatus
                ? $contractNegotiationWorkflow->ensureForTransfer($transferNegociation, $user)
                : null;
            $publicFeedPublisher->publishTransferAgreement($offer);
            $entityManager->flush();

            return $contractNegociation;
        });

        $notificationService->resolveSource('transfer_offer', $offer->getId()?->toRfc4122() ?? '');
        $marketRealtimePublisher->publishTransferOfferUpdate($offer, 'transfer_offer.accepted');
        if ($contractNegociation instanceof \App\Entity\Contract\ContractNegociation) {
            $marketRealtimePublisher->publishContractNegotiationUpdate($contractNegociation, 'contract_negociation.opened');
        }
        if ($offer->getAuthor() instanceof User) {
            $notificationService->notify(
                recipient: $offer->getAuthor(),
                type: 'transfer_offer.accepted',
                category: 'negotiations',
                title: 'Offre de transfert acceptée',
                body: sprintf('Votre offre pour %s a été acceptée.', $this->playerName($listing?->getPlayer())),
                actionUrl: sprintf('/market/transfers?offerId=%s', $offer->getId()?->toRfc4122()),
                targetRoute: '/market',
                requiresAction: false,
                severity: 'success',
                actor: $user,
                sourceType: 'transfer_offer',
                sourceId: $offer->getId()?->toRfc4122(),
            );
        }

        return $this->json([
            'offer' => $this->serializeOffer($offer, $team),
            'contractNegociationId' => $contractNegociation?->getId()?->toRfc4122(),
        ]);
    }

    #[Route('/negotiations/{id}/agent-invitations', name: 'app_transfer_agent_invitation_create', methods: ['POST'])]
    public function inviteAgent(
        TransferNegociation $negociation,
        Request $request,
        #[CurrentUser] ?User $user,
        TeamMembershipRepository $teamMembershipRepository,
        EntityManagerInterface $entityManager,
        MailerInterface $mailer,
    ): JsonResponse {
        $membership = $this->getCurrentMembership($user, $teamMembershipRepository);

        if ($membership instanceof JsonResponse) {
            return $membership;
        }

        $team = $membership->getTeam();
        $teamId = $team->getId()?->toRfc4122();
        $sellerTeamId = $negociation->getListing()?->getSellerTeam()?->getId()?->toRfc4122();
        $buyerTeamId = $negociation->getBuyerTeam()?->getId()?->toRfc4122();

        if ($sellerTeamId !== $teamId && $buyerTeamId !== $teamId) {
            return $this->json(['errorMessage' => 'Seuls les clubs impliqués dans cette négociation peuvent inviter l’agent.'], 403);
        }

        if (TransferNegociationStatusEnum::PENDING_AGENT !== $negociation->getStatus()) {
            return $this->json(['errorMessage' => 'Cette négociation n’est pas en attente d’agent.'], 422);
        }

        $payload = json_decode($request->getContent(), true);
        $email = is_array($payload) ? mb_strtolower(trim((string) ($payload['email'] ?? ''))) : '';
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->json(['errorMessage' => 'Adresse email invalide.'], 422);
        }

        $token = bin2hex(random_bytes(24));
        $invitation = (new TransferAgentInvitation())
            ->setTransferNegociation($negociation)
            ->setInvitedBy($user)
            ->setEmail($email)
            ->setToken($token)
            ->setCreatedAt(new \DateTimeImmutable())
            ->setUpdatedAt(new \DateTimeImmutable());

        $entityManager->persist($invitation);
        $entityManager->flush();

        $invitationUrl = rtrim((string) $this->getParameter('frontend_url'), '/').'/agent/invitation?token='.rawurlencode($token);
        $this->sendAgentInvitationEmail($email, $invitationUrl, $negociation, $mailer);

        return $this->json([
            'message' => 'Invitation envoyée à l’agent.',
            'invitationUrl' => $invitationUrl,
        ], 201);
    }

    #[Route('/agent-invitations/{token}', name: 'app_transfer_agent_invitation_show', methods: ['GET'])]
    public function invitation(
        string $token,
        TransferAgentInvitationRepository $invitationRepository,
    ): JsonResponse {
        $invitation = $invitationRepository->findActiveByToken($token);

        if (!$invitation instanceof TransferAgentInvitation) {
            return $this->json(['errorMessage' => 'Invitation introuvable.'], 404);
        }

        return $this->json(['invitation' => $this->serializeAgentInvitation($invitation)]);
    }

    #[Route('/agent-invitations/{token}/claim', name: 'app_transfer_agent_invitation_claim', methods: ['POST'])]
    public function claimInvitation(
        string $token,
        #[CurrentUser] ?User $user,
        TransferAgentInvitationRepository $invitationRepository,
        ContractNegotiationWorkflow $contractNegotiationWorkflow,
        EntityManagerInterface $entityManager,
        MarketRealtimePublisher $marketRealtimePublisher,
    ): JsonResponse {
        if (!$user) {
            return $this->json(['errorMessage' => 'Utilisateur non authentifié.'], 401);
        }

        $agent = $user->getAgentProfile();
        if (null === $agent) {
            return $this->json(['errorMessage' => 'Cette invitation doit être acceptée avec un compte agent.'], 403);
        }

        $invitation = $invitationRepository->findActiveByToken($token);
        if (!$invitation instanceof TransferAgentInvitation) {
            return $this->json(['errorMessage' => 'Invitation introuvable.'], 404);
        }

        $player = $invitation->getTransferNegociation()?->getListing()?->getPlayer();
        if (!$player instanceof Player) {
            return $this->json(['errorMessage' => 'Joueur introuvable.'], 404);
        }

        if (null !== $player->getAgent() && $player->getAgent()?->getId()?->toRfc4122() !== $agent->getId()?->toRfc4122()) {
            return $this->json(['errorMessage' => 'Ce joueur est déjà rattaché à un autre agent.'], 409);
        }

        $contractNegociations = $entityManager->wrapInTransaction(function () use (
            $agent,
            $contractNegotiationWorkflow,
            $entityManager,
            $invitation,
            $player,
            $user,
        ): array {
            $player->setAgent($agent);
            $invitation
                ->setAcceptedBy($agent)
                ->setAcceptedAt(new \DateTimeImmutable())
                ->setUpdatedAt(new \DateTimeImmutable());
            $contractNegociations = $contractNegotiationWorkflow->ensurePendingAgentNegotiationsForPlayer($player, $user);
            $entityManager->flush();

            return $contractNegociations;
        });

        foreach ($contractNegociations as $contractNegociation) {
            if ($contractNegociation instanceof \App\Entity\Contract\ContractNegociation) {
                $marketRealtimePublisher->publishContractNegotiationUpdate($contractNegociation, 'contract_negociation.opened');
            }
        }

        return $this->json([
            'message' => 'Représentation confirmée. La négociation contractuelle est prête.',
            'contractNegociationIds' => array_map(
                static fn ($negociation): ?string => $negociation->getId()?->toRfc4122(),
                $contractNegociations,
            ),
        ]);
    }

    #[Route('/negotiations/{id}/external-contract-agreement', name: 'app_transfer_external_contract_agreement', methods: ['POST'])]
    public function confirmExternalContractAgreement(
        TransferNegociation $negociation,
        Request $request,
        #[CurrentUser] ?User $user,
        TeamMembershipRepository $teamMembershipRepository,
        ContractNegotiationWorkflow $contractNegotiationWorkflow,
        EntityManagerInterface $entityManager,
        MarketRealtimePublisher $marketRealtimePublisher,
    ): JsonResponse {
        $membership = $this->getCurrentMembership($user, $teamMembershipRepository);

        if ($membership instanceof JsonResponse) {
            return $membership;
        }

        $team = $membership->getTeam();
        $listing = $negociation->getListing();
        $isSeller = $listing?->getSellerTeam()?->getId()?->toRfc4122() === $team->getId()?->toRfc4122();
        $isBuyer = $negociation->getBuyerTeam()?->getId()?->toRfc4122() === $team->getId()?->toRfc4122();

        if (!$isSeller && !$isBuyer) {
            return $this->json(['errorMessage' => 'Vous ne pouvez pas valider cet accord.'], 403);
        }

        if (!in_array($negociation->getStatus(), [TransferNegociationStatusEnum::PENDING_AGENT, TransferNegociationStatusEnum::AGREED_CLUBS], true)) {
            return $this->json(['errorMessage' => 'Cette négociation ne peut pas être finalisée par accord externe.'], 422);
        }

        $now = new \DateTimeImmutable();
        if ($isBuyer) {
            $payload = json_decode($request->getContent(), true);
            $weeklySalary = $this->moneyToCents(is_array($payload) ? ($payload['weeklySalary'] ?? null) : null);
            $durationMonths = is_numeric(is_array($payload) ? ($payload['durationMonths'] ?? null) : null)
                ? (int) $payload['durationMonths']
                : null;

            if (null === $weeklySalary || $weeklySalary <= 0) {
                return $this->json(['errorMessage' => 'Le salaire hebdomadaire convenu est requis.'], 422);
            }

            if (null === $durationMonths || $durationMonths < 1 || $durationMonths > 120) {
                return $this->json(['errorMessage' => 'La durée du contrat convenue doit être comprise entre 1 et 120 mois.'], 422);
            }

            $negociation->setExternalContractWeeklySalary($weeklySalary);
            $negociation->setExternalContractDurationMonths($durationMonths);
            $negociation->setExternalContractBuyerConfirmedAt($now);
        }
        if ($isSeller) {
            $negociation->setExternalContractSellerConfirmedAt($now);
        }

        if (
            null !== $negociation->getExternalContractBuyerConfirmedAt()
            && null !== $negociation->getExternalContractSellerConfirmedAt()
            && null !== $negociation->getExternalContractWeeklySalary()
            && null !== $negociation->getExternalContractDurationMonths()
        ) {
            $contractNegotiationWorkflow->finalizeExternalTransfer($negociation);
        }

        $entityManager->flush();
        $latestOffer = $this->getLatestOffer($negociation);
        if ($latestOffer instanceof TransferOffer) {
            $marketRealtimePublisher->publishTransferNegotiationUpdate($latestOffer, 'transfer_external_contract.updated');
        }

        return $this->json([
            'negociation' => $this->serializeNegotiationState($negociation, $team),
        ]);
    }

    #[Route('/offers/{id}/reject', name: 'app_transfer_offer_reject', methods: ['PUT', 'PATCH'])]
    public function reject(
        TransferOffer $offer,
        #[CurrentUser] ?User $user,
        TeamMembershipRepository $teamMembershipRepository,
        EntityManagerInterface $entityManager,
        PublicFeedPublisher $publicFeedPublisher,
        NotificationService $notificationService,
        MarketRealtimePublisher $marketRealtimePublisher,
    ): JsonResponse {
        $membership = $this->getCurrentMembership($user, $teamMembershipRepository);

        if ($membership instanceof JsonResponse) {
            return $membership;
        }

        $team = $membership->getTeam();
        $listing = $offer->getTransferNegociation()?->getListing();
        $isSeller = $listing?->getSellerTeam()?->getId()?->toRfc4122() === $team->getId()?->toRfc4122();
        $isBuyer = $offer->getTransferNegociation()?->getBuyerTeam()?->getId()?->toRfc4122() === $team->getId()?->toRfc4122();

        if (!$isSeller && !$isBuyer) {
            return $this->json(['errorMessage' => 'Vous ne pouvez pas rejeter cette offre.'], 403);
        }

        $offer->setStatus(OfferStatusEnum::REJECTED);
        $offer->getTransferNegociation()?->setStatus(TransferNegociationStatusEnum::REJECTED);
        $publicFeedPublisher->publishTransferOffer($offer);

        $entityManager->flush();
        $marketRealtimePublisher->publishTransferOfferUpdate($offer, 'transfer_offer.rejected');

        $notificationService->resolveSource('transfer_offer', $offer->getId()?->toRfc4122() ?? '');
        if ($offer->getAuthor() instanceof User) {
            $notificationService->notify(
                recipient: $offer->getAuthor(),
                type: 'transfer_offer.rejected',
                category: 'negotiations',
                title: 'Offre de transfert refusée',
                body: sprintf('Votre offre pour %s a été refusée.', $this->playerName($listing?->getPlayer())),
                actionUrl: sprintf('/market/transfers?offerId=%s', $offer->getId()?->toRfc4122()),
                targetRoute: '/market',
                requiresAction: false,
                severity: 'danger',
                actor: $user,
                sourceType: 'transfer_offer',
                sourceId: $offer->getId()?->toRfc4122(),
            );
        }

        return $this->json(['offer' => $this->serializeOffer($offer, $team)]);
    }

    #[Route('/offers/{id}/counter', name: 'app_transfer_offer_counter', methods: ['POST'])]
    public function counter(
        Request $request,
        TransferOffer $sourceOffer,
        #[CurrentUser] ?User $user,
        TeamMembershipRepository $teamMembershipRepository,
        PlayerRepository $playerRepository,
        SubscriptionLimits $subscriptionLimits,
        EntityManagerInterface $entityManager,
        PublicFeedPublisher $publicFeedPublisher,
        NotificationService $notificationService,
        MarketRealtimePublisher $marketRealtimePublisher,
    ): JsonResponse {
        $membership = $this->getCurrentMembership($user, $teamMembershipRepository);

        if ($membership instanceof JsonResponse) {
            return $membership;
        }

        $team = $membership->getTeam();
        $negociation = $sourceOffer->getTransferNegociation();
        $listing = $negociation?->getListing();
        $isSeller = $listing?->getSellerTeam()?->getId()?->toRfc4122() === $team->getId()?->toRfc4122();
        $isBuyer = $negociation?->getBuyerTeam()?->getId()?->toRfc4122() === $team->getId()?->toRfc4122();

        if (!$isSeller && !$isBuyer) {
            return $this->json(['errorMessage' => 'Vous ne pouvez pas contre-proposer sur cette offre.'], 403);
        }

        if (!$subscriptionLimits->canCreateClubOffer($user)) {
            return $this->json([
                'errorMessage' => 'Vous avez atteint la limite du plan gratuit.',
                'upgradePath' => '/subscription',
            ], 402);
        }

        $payload = json_decode($request->getContent(), true);

        if (!is_array($payload)) {
            return $this->json(['errorMessage' => 'Payload invalide.'], 400);
        }

        $counterOffer = $this->buildOfferFromPayload(
            $payload,
            $negociation,
            $user,
            $team,
            $playerRepository,
        );

        if ($counterOffer instanceof JsonResponse) {
            return $counterOffer;
        }

        if ($this->isSameTransferOffer($counterOffer, $sourceOffer)) {
            return $this->json([
                'errorMessage' => 'Cette proposition est identique à la dernière offre. Acceptez-la directement ou modifiez au moins un élément.',
            ], 422);
        }

        $sourceOffer->setStatus(OfferStatusEnum::REJECTED);
        $negociation?->setStatus(TransferNegociationStatusEnum::COUNTER_OFFER);

        $entityManager->persist($counterOffer);
        $publicFeedPublisher->publishTransferOffer($counterOffer);
        $entityManager->flush();
        $marketRealtimePublisher->publishTransferOfferUpdate($counterOffer, 'transfer_offer.counter_created');

        $notificationService->resolveSource('transfer_offer', $sourceOffer->getId()?->toRfc4122() ?? '');
        $targetTeam = $isSeller ? $negociation?->getBuyerTeam() : $listing?->getSellerTeam();
        if ($targetTeam instanceof Team) {
            foreach ($teamMembershipRepository->findUsersByTeam($targetTeam) as $recipient) {
                $notificationService->notify(
                    recipient: $recipient,
                    type: 'transfer_offer.counter_received',
                    category: 'negotiations',
                    title: 'Contre-offre reçue',
                    body: sprintf('%s a envoyé une contre-offre pour %s.', $team->getName(), $this->playerName($listing?->getPlayer())),
                    actionUrl: sprintf('/market/transfers?offerId=%s', $counterOffer->getId()?->toRfc4122()),
                    targetRoute: '/market',
                    requiresAction: true,
                    severity: 'warning',
                    actor: $user,
                    sourceType: 'transfer_offer',
                    sourceId: $counterOffer->getId()?->toRfc4122(),
                );
            }
        }

        return $this->json(['offer' => $this->serializeOffer($counterOffer, $team)], 201);
    }

    private function getCurrentMembership(?User $user, TeamMembershipRepository $teamMembershipRepository): TeamMembership|JsonResponse
    {
        if (!$user) {
            return $this->json(['errorMessage' => 'Utilisateur non authentifié.'], 401);
        }

        $membership = $teamMembershipRepository->findPrimaryForUser($user);

        if (!$membership instanceof TeamMembership || null === $membership->getTeam()) {
            return $this->json(['errorMessage' => 'Aucun club associé à votre compte.'], 403);
        }

        return $membership;
    }

    private function getListing(mixed $listingId, ListingRepository $listingRepository): Listing|JsonResponse
    {
        if (!is_string($listingId) || '' === trim($listingId)) {
            return $this->json(['errorMessage' => 'Annonce requise.'], 422);
        }

        $listing = $listingRepository->find($listingId);

        if (!$listing instanceof Listing || ListingStatusEnum::ACTIVE !== $listing->getStatus()) {
            return $this->json(['errorMessage' => 'Annonce introuvable ou inactive.'], 404);
        }

        return $listing;
    }

    private function buildOfferFromPayload(
        array $payload,
        TransferNegociation $negociation,
        User $author,
        Team $currentTeam,
        PlayerRepository $playerRepository,
    ): TransferOffer|JsonResponse {
        $amount = $this->moneyToCents($payload['amount'] ?? null);

        if (null === $amount || $amount < 0) {
            return $this->json(['errorMessage' => 'Montant requis.'], 422);
        }

        $buyerTeam = $negociation->getBuyerTeam();
        $performanceBonus = $this->moneyToCents($payload['performanceBonus'] ?? null);
        $maxFinancialCommitment = $amount + ($performanceBonus ?? 0);

        if (null !== $buyerTeam && $maxFinancialCommitment > ($buyerTeam->getTransferBudget() ?? 0)) {
            return $this->json([
                'errorMessage' => sprintf(
                    'Cette offre dépasse le budget de %s.',
                    $buyerTeam->getName() ?? 'ce club',
                ),
            ], 422);
        }

        $kind = $this->getOfferKind($payload['kind'] ?? null, $payload['type'] ?? null);
        $exchangePlayer = null;
        $exchangePlayerId = $payload['exchangePlayerId'] ?? null;
        $sellerTeam = $negociation->getListing()?->getSellerTeam();
        $exchangeTeam = $sellerTeam?->getId()?->toRfc4122() === $currentTeam->getId()?->toRfc4122()
            ? $buyerTeam
            : $currentTeam;

        if (is_string($exchangePlayerId) && '' !== trim($exchangePlayerId)) {
            $exchangePlayer = $playerRepository->find($exchangePlayerId);

            if (!$exchangePlayer instanceof Player || null === $exchangeTeam || $exchangePlayer->getTeam()?->getId()?->toRfc4122() !== $exchangeTeam->getId()?->toRfc4122()) {
                return $this->json(['errorMessage' => 'Le joueur échangé doit appartenir au club acheteur.'], 422);
            }
        }

        return (new TransferOffer())
            ->setTransferNegociation($negociation)
            ->setAuthor($author)
            ->setKind($kind)
            ->setAmount($amount)
            ->setDurationMonths($this->optionalInt($payload['durationMonths'] ?? null))
            ->setPaymentInstallments($this->optionalInt($payload['paymentInstallments'] ?? null))
            ->setPerformanceBonus($performanceBonus)
            ->setPerformanceBonusCondition($this->optionalString($payload['performanceBonusCondition'] ?? null))
            ->setResalePercentage($this->optionalInt($payload['resalePercentage'] ?? null))
            ->setBuyBackPriority(true === ($payload['buyBackPriority'] ?? false))
            ->setFutureTransferPriority(true === ($payload['futureTransferPriority'] ?? false))
            ->setExchangePlayer($exchangePlayer)
            ->setMessage($this->optionalString($payload['message'] ?? null))
            ->setValidUntil($this->parseDate($payload['validUntil'] ?? null))
            ->setStatus(OfferStatusEnum::PENDING)
            ->setCreatedAt(new \DateTimeImmutable());
    }

    private function getOfferKind(mixed $kind, mixed $type): TransferOfferKindEnum
    {
        if (is_string($kind) && null !== TransferOfferKindEnum::tryFrom($kind)) {
            return TransferOfferKindEnum::from($kind);
        }

        return match ($type) {
            'loan' => TransferOfferKindEnum::LOAN,
            'exchange' => TransferOfferKindEnum::EXCHANGE,
            default => TransferOfferKindEnum::INITIAL,
        };
    }

    private function getLatestOffer(TransferNegociation $negociation): ?TransferOffer
    {
        $offers = $negociation->getTransferOffers()->toArray();

        usort(
            $offers,
            static fn (TransferOffer $a, TransferOffer $b): int => ($b->getCreatedAt()?->getTimestamp() ?? 0) <=> ($a->getCreatedAt()?->getTimestamp() ?? 0),
        );

        return $offers[0] ?? null;
    }

    private function isSameTransferOffer(TransferOffer $nextOffer, TransferOffer $previousOffer): bool
    {
        return $nextOffer->getKind() === $previousOffer->getKind()
            && $nextOffer->getAmount() === $previousOffer->getAmount()
            && $nextOffer->getDurationMonths() === $previousOffer->getDurationMonths()
            && $nextOffer->getPaymentInstallments() === $previousOffer->getPaymentInstallments()
            && $nextOffer->getPerformanceBonus() === $previousOffer->getPerformanceBonus()
            && $this->normalizeComparableString($nextOffer->getPerformanceBonusCondition()) === $this->normalizeComparableString($previousOffer->getPerformanceBonusCondition())
            && $nextOffer->getResalePercentage() === $previousOffer->getResalePercentage()
            && $nextOffer->hasBuyBackPriority() === $previousOffer->hasBuyBackPriority()
            && $nextOffer->hasFutureTransferPriority() === $previousOffer->hasFutureTransferPriority()
            && $nextOffer->getExchangePlayer()?->getId()?->toRfc4122() === $previousOffer->getExchangePlayer()?->getId()?->toRfc4122()
            && $this->normalizeComparableString($nextOffer->getMessage()) === $this->normalizeComparableString($previousOffer->getMessage());
    }

    private function normalizeComparableString(?string $value): string
    {
        return trim($value ?? '');
    }

    private function serializeOffer(TransferOffer $offer, Team $viewerTeam): array
    {
        $negociation = $offer->getTransferNegociation();
        $listing = $negociation?->getListing();
        $player = $listing?->getPlayer();
        $sellerTeam = $listing?->getSellerTeam();
        $buyerTeam = $negociation?->getBuyerTeam();
        $isSent = $buyerTeam?->getId()?->toRfc4122() === $viewerTeam->getId()?->toRfc4122();
        $viewerRole = $sellerTeam?->getId()?->toRfc4122() === $viewerTeam->getId()?->toRfc4122() ? 'seller' : 'buyer';

        return [
            'id' => $offer->getId()?->toRfc4122(),
            'negociationId' => $negociation?->getId()?->toRfc4122(),
            'listingId' => $listing?->getId()?->toRfc4122(),
            'playerId' => $player?->getId()?->toRfc4122(),
            'negociationStatus' => $negociation?->getStatus()?->value,
            'buyerTeamId' => $buyerTeam?->getId()?->toRfc4122(),
            'sellerTeamId' => $sellerTeam?->getId()?->toRfc4122(),
            'viewerRole' => $viewerRole,
            'contractResolution' => $negociation ? $this->serializeContractResolution($negociation, $viewerTeam) : null,
            'player' => $player ? $this->serializePlayer($player) : null,
            'type' => $this->serializeOfferType($offer->getKind()),
            'kind' => $offer->getKind()?->value,
            'status' => $offer->getStatus()?->value,
            'amount' => $this->formatMoney($offer->getAmount()),
            'amountValue' => null !== $offer->getAmount() ? $offer->getAmount() / 100 : null,
            'duration' => $offer->getDurationMonths(),
            'paymentStructure' => $offer->getPaymentInstallments()
                ? sprintf('Paiement en %d fois', $offer->getPaymentInstallments())
                : 'Paiement comptant',
            'paymentPerInstallment' => $offer->getPaymentInstallments() && $offer->getAmount()
                ? $this->formatMoney((int) round($offer->getAmount() / $offer->getPaymentInstallments()))
                : null,
            'performanceBonus' => null !== $offer->getPerformanceBonus() ? $this->formatMoney($offer->getPerformanceBonus()) : null,
            'performanceBonusValue' => null !== $offer->getPerformanceBonus() ? $offer->getPerformanceBonus() / 100 : null,
            'performanceBonusCondition' => $offer->getPerformanceBonusCondition(),
            'resalePercentage' => null !== $offer->getResalePercentage() ? $offer->getResalePercentage().'%' : null,
            'resalePercentageValue' => $offer->getResalePercentage(),
            'buyBackPriority' => $offer->hasBuyBackPriority(),
            'futureTransferPriority' => $offer->hasFutureTransferPriority(),
            'exchangePlayerName' => $offer->getExchangePlayer()
                ? $offer->getExchangePlayer()->getFirstName().' '.$offer->getExchangePlayer()->getLastName()
                : null,
            'advancedOptions' => array_values(array_filter([
                $offer->getExchangePlayer() ? 'Échange joueur inclus' : null,
                null !== $offer->getResalePercentage() ? 'Clause de revente' : null,
                null !== $offer->getPerformanceBonus() ? 'Bonus de performance' : null,
                $offer->hasBuyBackPriority() ? 'Priorité de rachat' : null,
                $offer->hasFutureTransferPriority() ? 'Priorité future' : null,
            ])),
            'customMessage' => $offer->getMessage(),
            'date' => $offer->getCreatedAt()?->format('Y-m-d') ?? '',
            'fromClub' => $isSent ? ($buyerTeam?->getName() ?? '') : ($buyerTeam?->getName() ?? ''),
            'toClub' => $isSent ? ($sellerTeam?->getName() ?? '') : ($sellerTeam?->getName() ?? ''),
        ];
    }

    private function serializeNegotiationContext(
        Listing $listing,
        Team $buyerTeam,
        Team $viewerTeam,
        TeamMembershipRepository $teamMembershipRepository,
        ?TransferNegociation $negociation = null,
        ?TransferOffer $sourceOffer = null,
    ): array {
        $sellerTeam = $listing->getSellerTeam();
        $player = $listing->getPlayer();
        $viewerRole = $sellerTeam?->getId()?->toRfc4122() === $viewerTeam->getId()?->toRfc4122() ? 'seller' : 'buyer';
        $offers = $negociation?->getTransferOffers()->toArray() ?? [];

        usort(
            $offers,
            static fn (TransferOffer $a, TransferOffer $b): int => ($b->getCreatedAt()?->getTimestamp() ?? 0) <=> ($a->getCreatedAt()?->getTimestamp() ?? 0),
        );

        return [
            'listingId' => $listing->getId()?->toRfc4122(),
            'sourceOfferId' => $sourceOffer?->getId()?->toRfc4122(),
            'negociationId' => $negociation?->getId()?->toRfc4122(),
            'negociationStatus' => $negociation?->getStatus()?->value,
            'viewerRole' => $viewerRole,
            'exchangeTeamId' => 'seller' === $viewerRole ? $buyerTeam->getId()?->toRfc4122() : $viewerTeam->getId()?->toRfc4122(),
            'contractResolution' => $negociation ? $this->serializeContractResolution($negociation, $viewerTeam) : null,
            'player' => $player ? $this->serializePlayer($player) : null,
            'sellerTeam' => $sellerTeam ? $this->serializeTeam($sellerTeam) : null,
            'buyerTeam' => $this->serializeTeam($buyerTeam),
            'viewerTeam' => $this->serializeTeam($viewerTeam),
            'latestOffer' => $offers[0] ?? null ? $this->serializeOffer($offers[0], $viewerTeam) : null,
            'history' => array_map(
                fn (TransferOffer $offer): array => $this->serializeOfferHistoryItem($offer, $teamMembershipRepository),
                $offers,
            ),
        ];
    }

    private function serializeHistoryItem(TransferOffer $offer, Team $viewerTeam): array
    {
        $negociation = $offer->getTransferNegociation();
        $listing = $negociation?->getListing();
        $player = $listing?->getPlayer();
        $sellerTeam = $listing?->getSellerTeam();
        $buyerTeam = $negociation?->getBuyerTeam();
        $isSale = $sellerTeam?->getId()?->toRfc4122() === $viewerTeam->getId()?->toRfc4122();

        return [
            'id' => $offer->getId()?->toRfc4122(),
            'date' => $offer->getCreatedAt()?->format('Y-m-d') ?? '',
            'player' => $player ? $this->serializePlayer($player) : null,
            'sellerTeam' => $sellerTeam ? $this->serializeTeam($sellerTeam) : null,
            'buyerTeam' => $buyerTeam ? $this->serializeTeam($buyerTeam) : null,
            'amount' => $this->formatMoney($offer->getAmount()),
            'amountValue' => null !== $offer->getAmount() ? $offer->getAmount() / 100 : null,
            'type' => $this->serializeOfferType($offer->getKind()),
            'status' => $negociation?->getStatus()?->value,
            'direction' => $isSale ? 'sale' : 'purchase',
            'exchangePlayerName' => $offer->getExchangePlayer()
                ? $offer->getExchangePlayer()->getFirstName().' '.$offer->getExchangePlayer()->getLastName()
                : null,
        ];
    }

    private function serializeOfferHistoryItem(TransferOffer $offer, TeamMembershipRepository $teamMembershipRepository): array
    {
        $authorTeam = $offer->getAuthor() ? $teamMembershipRepository->findPrimaryForUser($offer->getAuthor())?->getTeam() : null;
        $summary = sprintf('Offre de %s', $this->formatMoney($offer->getAmount()));
        $details = array_values(array_filter([
            null !== $offer->getPerformanceBonus() ? '+ '.$this->formatMoney($offer->getPerformanceBonus()).' de bonus' : null,
            null !== $offer->getResalePercentage() ? $offer->getResalePercentage().'% à la revente' : null,
            $offer->getExchangePlayer() ? 'échange avec '.$offer->getExchangePlayer()->getFirstName().' '.$offer->getExchangePlayer()->getLastName() : null,
        ]));

        if ([] !== $details) {
            $summary .= ' + '.implode(' + ', $details);
        }

        return [
            'id' => $offer->getId()?->toRfc4122(),
            'clubName' => $authorTeam?->getName() ?? 'Club inconnu',
            'clubLogoUrl' => $authorTeam?->getLogoUrl(),
            'summary' => $summary,
            'createdAt' => $offer->getCreatedAt()?->format(\DateTimeInterface::ATOM),
        ];
    }

    private function serializeTeam(Team $team): array
    {
        return [
            'id' => $team->getId()?->toRfc4122(),
            'name' => $team->getName(),
            'logoUrl' => $team->getLogoUrl(),
            'league' => $team->getLeague(),
            'country' => $team->getCountry(),
            'transferBudgetValue' => null !== $team->getTransferBudget() ? $team->getTransferBudget() / 100 : null,
            'transferBudget' => null !== $team->getTransferBudget() ? $this->formatMoney($team->getTransferBudget()) : null,
        ];
    }

    private function serializeNegotiationState(TransferNegociation $negociation, Team $viewerTeam): array
    {
        return [
            'id' => $negociation->getId()?->toRfc4122(),
            'status' => $negociation->getStatus()?->value,
            'contractResolution' => $this->serializeContractResolution($negociation, $viewerTeam),
        ];
    }

    private function serializeContractResolution(TransferNegociation $negociation, Team $viewerTeam): array
    {
        $listing = $negociation->getListing();
        $sellerTeam = $listing?->getSellerTeam();
        $buyerTeam = $negociation->getBuyerTeam();
        $viewerRole = $sellerTeam?->getId()?->toRfc4122() === $viewerTeam->getId()?->toRfc4122() ? 'seller' : 'buyer';
        $buyerContractTermsComplete = null !== $negociation->getExternalContractBuyerConfirmedAt()
            && null !== $negociation->getExternalContractWeeklySalary()
            && null !== $negociation->getExternalContractDurationMonths();
        $sellerConfirmedExternalAgreement = null !== $negociation->getExternalContractSellerConfirmedAt();

        return [
            'requiresAction' => TransferNegociationStatusEnum::PENDING_AGENT === $negociation->getStatus(),
            'playerHasAgent' => null !== $listing?->getPlayer()?->getAgent(),
            'buyerConfirmedExternalAgreement' => $buyerContractTermsComplete,
            'sellerConfirmedExternalAgreement' => $sellerConfirmedExternalAgreement,
            'viewerConfirmedExternalAgreement' => 'buyer' === $viewerRole
                ? $buyerContractTermsComplete
                : $sellerConfirmedExternalAgreement,
            'viewerRole' => $viewerRole,
            'canInviteAgent' => in_array($viewerRole, ['buyer', 'seller'], true) && TransferNegociationStatusEnum::PENDING_AGENT === $negociation->getStatus(),
            'canConfirmExternalAgreement' => in_array($negociation->getStatus(), [TransferNegociationStatusEnum::PENDING_AGENT, TransferNegociationStatusEnum::AGREED_CLUBS], true),
            'buyerTeamName' => $buyerTeam?->getName(),
            'sellerTeamName' => $sellerTeam?->getName(),
            'externalContractDurationMonths' => $negociation->getExternalContractDurationMonths(),
            'externalContractWeeklySalary' => null !== $negociation->getExternalContractWeeklySalary()
                ? $this->formatMoney($negociation->getExternalContractWeeklySalary())
                : null,
        ];
    }

    private function serializeAgentInvitation(TransferAgentInvitation $invitation): array
    {
        $negociation = $invitation->getTransferNegociation();
        $listing = $negociation?->getListing();
        $player = $listing?->getPlayer();
        $buyerTeam = $negociation?->getBuyerTeam();
        $sellerTeam = $listing?->getSellerTeam();

        return [
            'email' => $invitation->getEmail(),
            'acceptedAt' => $invitation->getAcceptedAt()?->format(\DateTimeInterface::ATOM),
            'player' => $player ? $this->serializePlayer($player) : null,
            'buyerTeam' => $buyerTeam ? $this->serializeTeam($buyerTeam) : null,
            'sellerTeam' => $sellerTeam ? $this->serializeTeam($sellerTeam) : null,
            'negociationStatus' => $negociation?->getStatus()?->value,
        ];
    }

    private function ensureTransferAgreement(
        TransferNegociation $transferNegociation,
        TransferOffer $acceptedOffer,
        EntityManagerInterface $entityManager,
    ): void {
        if ($acceptedOffer->getTransferAgreement() instanceof TransferAgreement) {
            return;
        }

        foreach ($transferNegociation->getTransferAgreements() as $agreement) {
            if ($agreement->getAcceptedOffer()?->getId()?->toRfc4122() === $acceptedOffer->getId()?->toRfc4122()) {
                return;
            }
        }

        $agreement = (new TransferAgreement())
            ->setTransferNegociation($transferNegociation)
            ->setAcceptedOffer($acceptedOffer)
            ->setCreatedAt(new \DateTimeImmutable())
            ->setUpdatedAt(new \DateTimeImmutable());
        $entityManager->persist($agreement);
    }

    private function sendAgentInvitationEmail(
        string $email,
        string $invitationUrl,
        TransferNegociation $negociation,
        MailerInterface $mailer,
    ): void {
        $player = $negociation->getListing()?->getPlayer();
        $sellerTeam = $negociation->getListing()?->getSellerTeam();
        $buyerTeam = $negociation->getBuyerTeam();
        $playerName = trim(($player?->getFirstName() ?? '').' '.($player?->getLastName() ?? '')) ?: 'un joueur';
        $subject = sprintf('KickDeal - transfert en attente pour %s', $playerName);
        $text = sprintf(
            "Bonjour,\n\nUn transfert impliquant %s est en attente sur KickDeal. %s et %s ont déjà trouvé un accord entre clubs.\n\nRejoignez KickDeal pour confirmer que vous représentez le joueur et négocier son contrat directement sur la plateforme :\n%s\n\nL'équipe KickDeal",
            $playerName,
            $buyerTeam?->getName() ?? 'le club acheteur',
            $sellerTeam?->getName() ?? 'le club vendeur',
            $invitationUrl,
        );

        $message = (new Email())
            ->from('kickdeal@no-reply.com')
            ->to($email)
            ->subject($subject)
            ->text($text);

        try {
            $mailer->send($message);
        } catch (\Throwable) {
            // In local environments MAILER_DSN may be null; the invitation URL is still returned by the API.
        }
    }

    private function serializeOfferType(?TransferOfferKindEnum $kind): string
    {
        return match ($kind) {
            TransferOfferKindEnum::LOAN => 'loan',
            TransferOfferKindEnum::EXCHANGE => 'exchange',
            default => 'purchase',
        };
    }

    private function serializePlayer(Player $player): array
    {
        $team = $player->getTeam();

        return [
            'id' => $player->getId()?->toRfc4122(),
            'firstName' => $player->getFirstName(),
            'lastName' => $player->getLastName(),
            'photoUrl' => $player->getPhotoUrl(),
            'age' => $player->getBirthDate() ? (int) $player->getBirthDate()->diff(new \DateTimeImmutable())->y : 0,
            'position' => $player->getPosition(),
            'nationality' => $player->getNationality() ?? 'Inconnue',
            'country' => $team?->getCountry() ?? '',
            'league' => $team?->getLeague() ?? '',
            'club' => $team?->getName() ?? 'Sans club',
            'clubLogoUrl' => $team?->getLogoUrl(),
            'transferStatus' => 'Sur le marche',
            'height' => $player->getHeightCm(),
            'weight' => $player->getWeightKg(),
            'foot' => $player->getPreferredFoot(),
            'marketValue' => $this->formatMoney($player->getMarketValue()),
            'weeklySalary' => $this->formatMoney($player->getWeeklySalary()),
            'releaseClause' => $this->formatMoney($player->getReleaseClause(), true),
        ];
    }

    private function moneyToCents(mixed $value): ?int
    {
        if (null === $value || '' === $value || !is_numeric($value)) {
            return null;
        }

        return (int) round(((float) $value) * 100);
    }

    private function optionalInt(mixed $value): ?int
    {
        if (null === $value || '' === $value || !is_numeric($value)) {
            return null;
        }

        return (int) $value;
    }

    private function optionalString(mixed $value): ?string
    {
        if (!is_string($value)) {
            return null;
        }

        $value = trim($value);

        return '' === $value ? null : $value;
    }

    private function parseDate(mixed $value): ?\DateTimeImmutable
    {
        if (!is_string($value) || '' === trim($value)) {
            return null;
        }

        try {
            return new \DateTimeImmutable($value);
        } catch (\Throwable) {
            return null;
        }
    }

    private function playerName(?Player $player): string
    {
        if (!$player instanceof Player) {
            return 'ce joueur';
        }

        $name = trim(sprintf('%s %s', $player->getFirstName(), $player->getLastName()));

        return '' !== $name ? $name : 'ce joueur';
    }

    private function formatMoney(int|string|null $amountInCents, bool $allowNone = false): string
    {
        if (null === $amountInCents) {
            return $allowNone ? 'Aucun(e)' : '-';
        }

        $amount = ((int) $amountInCents) / 100;

        if ($amount >= 1_000_000) {
            return number_format($amount / 1_000_000, 1, ',', ' ').' M EUR';
        }

        if ($amount >= 1_000) {
            return number_format($amount / 1_000, 0, ',', ' ').' K EUR';
        }

        return number_format($amount, 0, ',', ' ').' EUR';
    }
}
