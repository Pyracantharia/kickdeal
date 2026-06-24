<?php

namespace App\Controller;

use App\Entity\Agent;
use App\Entity\Contract\ContractNegociation;
use App\Entity\Contract\ContractOffer;
use App\Entity\Player;
use App\Entity\Team;
use App\Entity\User;
use App\Enum\ContractNegotiationTypeEnum;
use App\Enum\OfferStatusEnum;
use App\Enum\PlayerContractNegociationStatusEnum;
use App\Repository\AgentRepository;
use App\Repository\Contract\ContractNegociationRepository;
use App\Repository\TeamMembershipRepository;
use App\Repository\Transfer\TransferNegociationRepository;
use App\Service\Contract\ContractNegotiationWorkflow;
use App\Service\PublicFeed\PublicFeedPublisher;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Csrf\CsrfToken;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/contracts/negotiations')]
final class ContractNegotiationController extends AbstractController
{
    #[Route('/players/{id}', name: 'api_contract_negotiation_start_for_player', methods: ['POST'])]
    public function startForPlayer(
        Player $player,
        Request $request,
        #[CurrentUser] ?User $user,
        TeamMembershipRepository $teamMembershipRepository,
        ContractNegociationRepository $contractNegociationRepository,
        CsrfTokenManagerInterface $csrfTokenManager,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        if ($csrfError = $this->validateCsrf($request, $csrfTokenManager)) {
            return $csrfError;
        }

        if (!$user instanceof User) {
            return $this->json(['errorMessage' => 'Utilisateur non authentifié.'], 401);
        }

        $team = $teamMembershipRepository->findPrimaryForUser($user)?->getTeam();
        if (!$team instanceof Team || $player->getTeam()?->getId()?->toRfc4122() !== $team->getId()?->toRfc4122()) {
            return $this->json(['errorMessage' => 'Ce joueur ne fait pas partie de votre club.'], 403);
        }

        $agent = $player->getAgent();
        if (!$agent instanceof Agent) {
            return $this->json([
                'errorMessage' => 'Ce joueur n’a pas encore d’agent vérifié avec qui négocier.',
            ], 422);
        }

        $payload = json_decode($request->getContent(), true);
        $type = match (is_array($payload) ? ($payload['type'] ?? null) : null) {
            ContractNegotiationTypeEnum::TERMINATION->value => ContractNegotiationTypeEnum::TERMINATION,
            ContractNegotiationTypeEnum::RENEWAL->value => ContractNegotiationTypeEnum::RENEWAL,
            default => null,
        };
        if (!$type instanceof ContractNegotiationTypeEnum) {
            return $this->json(['errorMessage' => 'Type de négociation invalide.'], 422);
        }

        $negociation = $contractNegociationRepository->findActiveForPlayerTeamAndType($player, $team, $type);
        if (!$negociation instanceof ContractNegociation) {
            $negociation = (new ContractNegociation())
                ->setPlayer($player)
                ->setBuyerTeam($team)
                ->setAgent($agent)
                ->setType($type)
                ->setStatus(PlayerContractNegociationStatusEnum::OPEN)
                ->setCreatedBy($user)
                ->setCreatedAt(new \DateTimeImmutable())
                ->setUpdatedAt(new \DateTimeImmutable());
            $entityManager->persist($negociation);
            $entityManager->flush();
        }

        return $this->json([
            'negotiation' => $this->serializeNegotiation($negociation, 'club'),
        ], 201);
    }

    #[Route('/mine', name: 'api_contract_negotiations_mine', methods: ['GET'])]
    public function mine(
        #[CurrentUser] ?User $user,
        AgentRepository $agentRepository,
        TeamMembershipRepository $teamMembershipRepository,
        ContractNegociationRepository $contractNegociationRepository,
        TransferNegociationRepository $transferNegociationRepository,
        ContractNegotiationWorkflow $workflow,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        if (!$user instanceof User) {
            return $this->json(['errorMessage' => 'Utilisateur non authentifié.'], 401);
        }

        foreach ($transferNegociationRepository->findAwaitingContractNegotiation() as $transferNegociation) {
            $workflow->ensureForTransfer($transferNegociation, $user);
        }
        $entityManager->flush();

        $agent = $agentRepository->findOneBy(['user' => $user]);
        if ($agent instanceof Agent) {
            $negociations = $contractNegociationRepository->findForAgent($agent);

            return $this->json([
                'viewerRole' => 'agent',
                'negotiations' => array_map(
                    fn (ContractNegociation $negociation): array => $this->serializeNegotiation($negociation, 'agent'),
                    $negociations,
                ),
            ]);
        }

        $team = $teamMembershipRepository->findPrimaryForUser($user)?->getTeam();
        if ($team instanceof Team) {
            $negociations = $contractNegociationRepository->findForBuyerTeam($team);

            return $this->json([
                'viewerRole' => 'club',
                'negotiations' => array_map(
                    fn (ContractNegociation $negociation): array => $this->serializeNegotiation($negociation, 'club'),
                    $negociations,
                ),
            ]);
        }

        return $this->json(['viewerRole' => null, 'negotiations' => []]);
    }

    #[Route('/{id}', name: 'api_contract_negotiation_show', methods: ['GET'])]
    public function show(
        ContractNegociation $negociation,
        #[CurrentUser] ?User $user,
        AgentRepository $agentRepository,
        TeamMembershipRepository $teamMembershipRepository,
    ): JsonResponse {
        $viewerRole = $this->resolveViewerRole($user, $negociation, $agentRepository, $teamMembershipRepository);
        if (null === $viewerRole) {
            return $this->json(['errorMessage' => 'Vous ne pouvez pas accéder à cette négociation.'], 403);
        }

        return $this->json([
            'negotiation' => $this->serializeNegotiation($negociation, $viewerRole),
        ]);
    }

    #[Route('/{id}/public-feed', name: 'api_contract_negotiation_public_feed', methods: ['PUT', 'PATCH'])]
    public function updatePublicFeed(
        ContractNegociation $negociation,
        Request $request,
        #[CurrentUser] ?User $user,
        AgentRepository $agentRepository,
        TeamMembershipRepository $teamMembershipRepository,
        CsrfTokenManagerInterface $csrfTokenManager,
        PublicFeedPublisher $publicFeedPublisher,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        if ($csrfError = $this->validateCsrf($request, $csrfTokenManager)) {
            return $csrfError;
        }

        $viewerRole = $this->resolveViewerRole($user, $negociation, $agentRepository, $teamMembershipRepository);
        if ('club' !== $viewerRole) {
            return $this->json(['errorMessage' => 'Seul le club concerné peut publier cette négociation.'], 403);
        }

        $payload = json_decode($request->getContent(), true);
        $enabled = true === (is_array($payload) ? ($payload['enabled'] ?? false) : false);

        $negociation->setPublicFeedEnabled($enabled);
        if ($enabled) {
            $publicFeedPublisher->publishContractNegotiation($negociation);
        }
        $entityManager->flush();

        return $this->json([
            'publicFeedEnabled' => $negociation->isPublicFeedEnabled(),
        ]);
    }

    #[Route('/{id}/offers', name: 'api_contract_negotiation_offer_create', methods: ['POST'])]
    public function createOffer(
        ContractNegociation $negociation,
        Request $request,
        #[CurrentUser] ?User $user,
        AgentRepository $agentRepository,
        TeamMembershipRepository $teamMembershipRepository,
        CsrfTokenManagerInterface $csrfTokenManager,
        EntityManagerInterface $entityManager,
        PublicFeedPublisher $publicFeedPublisher,
    ): JsonResponse {
        if ($csrfError = $this->validateCsrf($request, $csrfTokenManager)) {
            return $csrfError;
        }

        $viewerRole = $this->resolveViewerRole($user, $negociation, $agentRepository, $teamMembershipRepository);
        if (null === $viewerRole || !$user instanceof User) {
            return $this->json(['errorMessage' => 'Vous ne pouvez pas intervenir dans cette négociation.'], 403);
        }

        if ($this->isClosed($negociation)) {
            return $this->json(['errorMessage' => 'Cette négociation est terminée.'], 422);
        }

        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload)) {
            return $this->json(['errorMessage' => 'Payload invalide.'], 400);
        }

        $annualSalary = $this->moneyToCents($payload['annualSalary'] ?? null);
        $signingBonus = $this->moneyToCents($payload['signingBonus'] ?? null);
        $releaseClause = $this->moneyToCents($payload['releaseClause'] ?? null);
        $terminationCompensation = $this->moneyToCents($payload['terminationCompensation'] ?? null);
        $durationMonths = is_numeric($payload['durationMonths'] ?? null)
            ? (int) $payload['durationMonths']
            : null;
        $effectiveDate = $this->parseDate($payload['effectiveDate'] ?? null);
        $validUntilDate = $this->parseDate($payload['validUntil'] ?? null);
        $notes = $this->optionalString($payload['notes'] ?? null);

        if (ContractNegotiationTypeEnum::TERMINATION === $negociation->getType()) {
            if (null === $terminationCompensation || $terminationCompensation < 0) {
                return $this->json(['errorMessage' => 'L’indemnité de résiliation est requise.'], 422);
            }
        } else {
            if (null === $annualSalary || $annualSalary <= 0) {
                return $this->json(['errorMessage' => 'Le salaire annuel est requis.'], 422);
            }
            if (null === $durationMonths || $durationMonths < 1 || $durationMonths > 120) {
                return $this->json(['errorMessage' => 'La durée doit être comprise entre 1 et 120 mois.'], 422);
            }
        }

        foreach ($negociation->getContractOffers() as $previousOffer) {
            if (
                OfferStatusEnum::PENDING === $previousOffer->getStatus()
                && $previousOffer->getAuthor()?->getId()?->toRfc4122() === $user->getId()?->toRfc4122()
                && $this->isSameOfferPayload(
                    $previousOffer,
                    $annualSalary,
                    $durationMonths,
                    $signingBonus,
                    $releaseClause,
                    $terminationCompensation,
                    $effectiveDate,
                    $validUntilDate,
                    $notes,
                )
            ) {
                return $this->json([
                    'offer' => $this->serializeOffer($previousOffer, $negociation, $viewerRole),
                    'negotiation' => $this->serializeNegotiation($negociation, $viewerRole),
                ]);
            }
        }

        $hadPreviousOffer = false;
        foreach ($negociation->getContractOffers() as $previousOffer) {
            if (OfferStatusEnum::PENDING === $previousOffer->getStatus()) {
                $previousOffer->setStatus(OfferStatusEnum::REJECTED);
                $hadPreviousOffer = true;
            }
        }

        $offer = (new ContractOffer())
            ->setContractNegociation($negociation)
            ->setAuthor($user)
            ->setAnnualSalary($annualSalary)
            ->setDurationMonths($durationMonths)
            ->setSigningBonus($signingBonus)
            ->setReleaseClause($releaseClause)
            ->setTerminationCompensation($terminationCompensation)
            ->setEffectiveDate($effectiveDate)
            ->setValidUntil($validUntilDate)
            ->setNotes($notes)
            ->setStatus(OfferStatusEnum::PENDING)
            ->setCreatedAt(new \DateTimeImmutable());

        $negociation->setStatus(
            $hadPreviousOffer
                ? PlayerContractNegociationStatusEnum::COUNTER_OFFER
                : PlayerContractNegociationStatusEnum::OPEN
        )->setUpdatedAt(new \DateTimeImmutable());
        $negociation->addContractOffer($offer);

        $entityManager->persist($offer);
        $publicFeedPublisher->publishContractNegotiation($negociation);
        $entityManager->flush();

        return $this->json([
            'offer' => $this->serializeOffer($offer, $negociation, $viewerRole),
            'negotiation' => $this->serializeNegotiation($negociation, $viewerRole),
        ], 201);
    }

    #[Route('/{id}', name: 'api_contract_negotiation_cancel', methods: ['DELETE'])]
    public function cancel(
        ContractNegociation $negociation,
        Request $request,
        #[CurrentUser] ?User $user,
        AgentRepository $agentRepository,
        TeamMembershipRepository $teamMembershipRepository,
        CsrfTokenManagerInterface $csrfTokenManager,
        EntityManagerInterface $entityManager,
        PublicFeedPublisher $publicFeedPublisher,
    ): JsonResponse {
        if ($csrfError = $this->validateCsrf($request, $csrfTokenManager)) {
            return $csrfError;
        }

        $viewerRole = $this->resolveViewerRole($user, $negociation, $agentRepository, $teamMembershipRepository);
        if ('club' !== $viewerRole || !$user instanceof User) {
            return $this->json(['errorMessage' => 'Seul le club peut annuler cette négociation.'], 403);
        }

        if ($this->isClosed($negociation)) {
            return $this->json(['errorMessage' => 'Cette négociation est déjà terminée.'], 422);
        }

        if (ContractNegotiationTypeEnum::TRANSFER === $negociation->getType()) {
            return $this->json(['errorMessage' => 'Une négociation de transfert contractualisée ne peut pas être annulée ici.'], 422);
        }

        if ($negociation->getContractOffers()->count() > 0) {
            return $this->json(['errorMessage' => 'Cette négociation ne peut plus être annulée car des propositions ont déjà été échangées.'], 422);
        }

        $entityManager->remove($negociation);
        $entityManager->flush();

        return $this->json([
            'message' => 'La négociation contractuelle a été annulée.',
        ]);
    }

    #[Route('/offers/{id}/accept', name: 'api_contract_negotiation_offer_accept', methods: ['PUT'])]
    public function acceptOffer(
        ContractOffer $offer,
        Request $request,
        #[CurrentUser] ?User $user,
        AgentRepository $agentRepository,
        TeamMembershipRepository $teamMembershipRepository,
        CsrfTokenManagerInterface $csrfTokenManager,
        ContractNegotiationWorkflow $workflow,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        if ($csrfError = $this->validateCsrf($request, $csrfTokenManager)) {
            return $csrfError;
        }

        $negociation = $offer->getContractNegociation();
        if (!$negociation instanceof ContractNegociation) {
            return $this->json(['errorMessage' => 'Négociation introuvable.'], 404);
        }

        $viewerRole = $this->resolveViewerRole($user, $negociation, $agentRepository, $teamMembershipRepository);
        if (null === $viewerRole || !$user instanceof User) {
            return $this->json(['errorMessage' => 'Vous ne pouvez pas accepter cette offre.'], 403);
        }
        if ($offer->getAuthor()?->getId()?->toRfc4122() === $user->getId()?->toRfc4122()) {
            return $this->json(['errorMessage' => 'Vous ne pouvez pas accepter votre propre proposition.'], 403);
        }
        if (OfferStatusEnum::PENDING !== $offer->getStatus() || $this->isClosed($negociation)) {
            return $this->json(['errorMessage' => 'Cette offre ne peut plus être acceptée.'], 422);
        }

        try {
            $entityManager->wrapInTransaction(function () use ($workflow, $negociation, $offer, $entityManager): void {
                $workflow->finalize($negociation, $offer);
                $entityManager->flush();
            });
        } catch (\LogicException $exception) {
            return $this->json(['errorMessage' => $exception->getMessage()], 422);
        }

        return $this->json([
            'message' => match ($negociation->getType()) {
                ContractNegotiationTypeEnum::TRANSFER => 'Accord contractuel validé. Le transfert du joueur est finalisé.',
                ContractNegotiationTypeEnum::RENEWAL => 'Le nouveau contrat du joueur est désormais en vigueur.',
                ContractNegotiationTypeEnum::TERMINATION => 'La résiliation est validée. Le joueur est désormais libre.',
            },
            'negotiation' => $this->serializeNegotiation($negociation, $viewerRole),
        ]);
    }

    #[Route('/offers/{id}/reject', name: 'api_contract_negotiation_offer_reject', methods: ['PUT'])]
    public function rejectOffer(
        ContractOffer $offer,
        Request $request,
        #[CurrentUser] ?User $user,
        AgentRepository $agentRepository,
        TeamMembershipRepository $teamMembershipRepository,
        CsrfTokenManagerInterface $csrfTokenManager,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        if ($csrfError = $this->validateCsrf($request, $csrfTokenManager)) {
            return $csrfError;
        }

        $negociation = $offer->getContractNegociation();
        if (!$negociation instanceof ContractNegociation) {
            return $this->json(['errorMessage' => 'Négociation introuvable.'], 404);
        }

        $viewerRole = $this->resolveViewerRole($user, $negociation, $agentRepository, $teamMembershipRepository);
        if (null === $viewerRole || !$user instanceof User) {
            return $this->json(['errorMessage' => 'Vous ne pouvez pas rejeter cette offre.'], 403);
        }
        if ($offer->getAuthor()?->getId()?->toRfc4122() === $user->getId()?->toRfc4122()) {
            return $this->json(['errorMessage' => 'Vous ne pouvez pas rejeter votre propre proposition.'], 403);
        }

        $offer->setStatus(OfferStatusEnum::REJECTED);
        $negociation
            ->setStatus(PlayerContractNegociationStatusEnum::OPEN)
            ->setUpdatedAt(new \DateTimeImmutable());
        $publicFeedPublisher->publishContractNegotiation($negociation);
        $entityManager->flush();

        return $this->json([
            'negotiation' => $this->serializeNegotiation($negociation, $viewerRole),
        ]);
    }

    private function resolveViewerRole(
        ?User $user,
        ContractNegociation $negociation,
        AgentRepository $agentRepository,
        TeamMembershipRepository $teamMembershipRepository,
    ): ?string {
        if (!$user instanceof User) {
            return null;
        }

        $agent = $agentRepository->findOneBy(['user' => $user]);
        if ($agent instanceof Agent && $agent->getId()?->toRfc4122() === $negociation->getAgent()?->getId()?->toRfc4122()) {
            return 'agent';
        }

        $team = $teamMembershipRepository->findPrimaryForUser($user)?->getTeam();
        if ($team instanceof Team && $team->getId()?->toRfc4122() === $negociation->getBuyerTeam()?->getId()?->toRfc4122()) {
            return 'club';
        }

        return null;
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeNegotiation(ContractNegociation $negociation, string $viewerRole): array
    {
        $offers = $negociation->getContractOffers()->toArray();
        usort(
            $offers,
            fn (ContractOffer $left, ContractOffer $right): int =>
                (($right->getCreatedAt()?->getTimestamp() ?? 0) <=> ($left->getCreatedAt()?->getTimestamp() ?? 0))
                ?: ($this->offerStatusPriority($right) <=> $this->offerStatusPriority($left))
        );
        $latestOffer = $offers[0] ?? null;
        $player = $negociation->getPlayer();
        $currentTeam = $player?->getTeam();
        $buyerTeam = $negociation->getBuyerTeam();
        $sellerTeam = $negociation->getTransferNegociation()?->getListing()?->getSellerTeam();
        $acceptedTransferOffer = $this->findAcceptedTransferOffer($negociation);
        $type = $negociation->getType();

        return [
            'id' => $negociation->getId()?->toRfc4122(),
            'viewerRole' => $viewerRole,
            'type' => $type->value,
            'typeLabel' => $this->typeLabel($type),
            'status' => $negociation->getStatus()?->value,
            'statusLabel' => $this->statusLabel($negociation),
            'player' => [
                'id' => $player?->getId()?->toRfc4122(),
                'firstName' => $player?->getFirstName(),
                'lastName' => $player?->getLastName(),
                'photoUrl' => $player?->getPhotoUrl(),
                'position' => $player?->getPosition(),
                'age' => $player?->getBirthDate() ? (int) $player->getBirthDate()->diff(new \DateTimeImmutable())->y : 0,
                'currentClub' => $currentTeam?->getName() ?? 'Sans club',
                'weeklySalary' => $this->formatMoney($player?->getWeeklySalary()),
                'annualSalaryValue' => null !== $player?->getWeeklySalary()
                    ? ($player->getWeeklySalary() * 52) / 100
                    : null,
                'releaseClause' => $this->formatMoney($player?->getReleaseClause()),
                'releaseClauseValue' => null !== $player?->getReleaseClause()
                    ? $player->getReleaseClause() / 100
                    : null,
                'contractEndDate' => $player?->getContractEndDate()?->format('Y-m-d'),
            ],
            'sellerTeam' => $this->serializeTeam($sellerTeam ?? $player?->getTeam()),
            'buyerTeam' => $this->serializeTeam($buyerTeam),
            'agent' => [
                'agencyName' => $negociation->getAgent()?->getAgencyName(),
                'name' => trim(($negociation->getAgent()?->getUser()?->getFirstName() ?? '').' '.($negociation->getAgent()?->getUser()?->getLastName() ?? '')),
            ],
            'transferAgreement' => [
                'amount' => ContractNegotiationTypeEnum::TRANSFER === $type
                    ? $this->formatMoney($acceptedTransferOffer?->getAmount())
                    : '-',
                'amountValue' => null !== $acceptedTransferOffer?->getAmount()
                    ? $acceptedTransferOffer->getAmount() / 100
                    : null,
            ],
            'latestOffer' => $latestOffer instanceof ContractOffer
                ? $this->serializeOffer($latestOffer, $negociation, $viewerRole)
                : null,
            'history' => array_map(
                fn (ContractOffer $offer): array => $this->serializeOffer($offer, $negociation, $viewerRole),
                $offers,
            ),
            'updatedAt' => ($negociation->getUpdatedAt() ?? $negociation->getCreatedAt())?->format(DATE_ATOM),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeOffer(
        ContractOffer $offer,
        ContractNegociation $negociation,
        string $viewerRole,
    ): array {
        $authorRole = $offer->getAuthor()?->getId()?->toRfc4122()
            === $negociation->getAgent()?->getUser()?->getId()?->toRfc4122()
            ? 'agent'
            : 'club';

        return [
            'id' => $offer->getId()?->toRfc4122(),
            'authorRole' => $authorRole,
            'authorLabel' => 'agent' === $authorRole
                ? 'Agent du joueur'
                : ($negociation->getBuyerTeam()?->getName() ?? 'Club'),
            'isMine' => $authorRole === $viewerRole,
            'annualSalary' => $this->formatMoney($offer->getAnnualSalary()),
            'annualSalaryValue' => null !== $offer->getAnnualSalary() ? $offer->getAnnualSalary() / 100 : null,
            'weeklySalary' => $this->formatMoney(
                null !== $offer->getAnnualSalary() ? (int) round($offer->getAnnualSalary() / 52) : null
            ),
            'durationMonths' => $offer->getDurationMonths(),
            'signingBonus' => $this->formatMoney($offer->getSigningBonus()),
            'signingBonusValue' => null !== $offer->getSigningBonus() ? $offer->getSigningBonus() / 100 : null,
            'releaseClause' => $this->formatMoney($offer->getReleaseClause()),
            'releaseClauseValue' => null !== $offer->getReleaseClause() ? $offer->getReleaseClause() / 100 : null,
            'terminationCompensation' => $this->formatMoney($offer->getTerminationCompensation()),
            'terminationCompensationValue' => null !== $offer->getTerminationCompensation()
                ? $offer->getTerminationCompensation() / 100
                : null,
            'effectiveDate' => $offer->getEffectiveDate()?->format('Y-m-d'),
            'validUntil' => $offer->getValidUntil()?->format('Y-m-d'),
            'notes' => $offer->getNotes(),
            'status' => $offer->getStatus()?->value,
            'createdAt' => $offer->getCreatedAt()?->format(DATE_ATOM),
        ];
    }

    /**
     * @return array{id: string|null, name: string|null, logoUrl: string|null}
     */
    private function serializeTeam(?Team $team): array
    {
        return [
            'id' => $team?->getId()?->toRfc4122(),
            'name' => $team?->getName(),
            'logoUrl' => $team?->getLogoUrl(),
        ];
    }

    private function findAcceptedTransferOffer(ContractNegociation $negociation): ?\App\Entity\Transfer\TransferOffer
    {
        foreach ($negociation->getTransferNegociation()?->getTransferOffers() ?? [] as $offer) {
            if (OfferStatusEnum::ACCEPTED === $offer->getStatus()) {
                return $offer;
            }
        }

        return null;
    }

    private function statusLabel(ContractNegociation $negociation): string
    {
        $status = $negociation->getStatus();
        if (PlayerContractNegociationStatusEnum::COMPLETED === $status) {
            return match ($negociation->getType()) {
                ContractNegotiationTypeEnum::TRANSFER => 'Contrat signé et transfert finalisé',
                ContractNegotiationTypeEnum::RENEWAL => 'Nouveau contrat signé',
                ContractNegotiationTypeEnum::TERMINATION => 'Résiliation signée',
            };
        }

        return match ($status) {
            PlayerContractNegociationStatusEnum::OPEN => 'Discussion contractuelle ouverte',
            PlayerContractNegociationStatusEnum::COUNTER_OFFER => 'Contre-proposition reçue',
            PlayerContractNegociationStatusEnum::REJECTED => 'Négociation refusée',
            PlayerContractNegociationStatusEnum::EXPIRED => 'Négociation expirée',
            default => 'Négociation en cours',
        };
    }

    private function typeLabel(ContractNegotiationTypeEnum $type): string
    {
        return match ($type) {
            ContractNegotiationTypeEnum::TRANSFER => 'Contrat de transfert',
            ContractNegotiationTypeEnum::RENEWAL => 'Renouvellement de contrat',
            ContractNegotiationTypeEnum::TERMINATION => 'Résiliation du contrat',
        };
    }

    private function isClosed(ContractNegociation $negociation): bool
    {
        return in_array($negociation->getStatus(), [
            PlayerContractNegociationStatusEnum::COMPLETED,
            PlayerContractNegociationStatusEnum::REJECTED,
            PlayerContractNegociationStatusEnum::EXPIRED,
        ], true);
    }

    private function validateCsrf(Request $request, CsrfTokenManagerInterface $csrfTokenManager): ?JsonResponse
    {
        $token = (string) $request->headers->get('X-CSRF-TOKEN');
        if (!$csrfTokenManager->isTokenValid(new CsrfToken('api_auth', $token))) {
            return $this->json(['errorMessage' => 'Token CSRF invalide.'], 403);
        }

        return null;
    }

    private function moneyToCents(mixed $value): ?int
    {
        if (!is_numeric($value)) {
            return null;
        }

        return (int) round(((float) $value) * 100);
    }

    private function formatMoney(int|string|null $amount): string
    {
        if (null === $amount) {
            return '-';
        }

        $value = ((int) $amount) / 100;
        if ($value >= 1_000_000) {
            return number_format($value / 1_000_000, 1, ',', ' ').' M EUR';
        }
        if ($value >= 1_000) {
            return number_format($value / 1_000, 0, ',', ' ').' K EUR';
        }

        return number_format($value, 0, ',', ' ').' EUR';
    }

    private function isSameOfferPayload(
        ContractOffer $offer,
        ?int $annualSalary,
        ?int $durationMonths,
        ?int $signingBonus,
        ?int $releaseClause,
        ?int $terminationCompensation,
        ?\DateTimeInterface $effectiveDate,
        ?\DateTimeInterface $validUntil,
        ?string $notes,
    ): bool {
        return $offer->getAnnualSalary() === $annualSalary
            && $offer->getDurationMonths() === $durationMonths
            && $offer->getSigningBonus() === $signingBonus
            && $offer->getReleaseClause() === $releaseClause
            && $offer->getTerminationCompensation() === $terminationCompensation
            && $this->sameDate($offer->getEffectiveDate(), $effectiveDate)
            && $this->sameDate($offer->getValidUntil(), $validUntil)
            && $offer->getNotes() === $notes;
    }

    private function sameDate(?\DateTimeInterface $left, ?\DateTimeInterface $right): bool
    {
        return $left?->format('Y-m-d') === $right?->format('Y-m-d');
    }

    private function offerStatusPriority(ContractOffer $offer): int
    {
        return match ($offer->getStatus()) {
            OfferStatusEnum::PENDING => 3,
            OfferStatusEnum::ACCEPTED => 2,
            OfferStatusEnum::REJECTED => 1,
            OfferStatusEnum::EXPIRED => 0,
            default => 0,
        };
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

    private function optionalString(mixed $value): ?string
    {
        if (!is_string($value)) {
            return null;
        }

        $value = trim($value);

        return '' === $value ? null : $value;
    }
}
