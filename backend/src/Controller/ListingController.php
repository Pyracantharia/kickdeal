<?php

namespace App\Controller;

use App\Entity\Listing;
use App\Entity\Player;
use App\Entity\Team;
use App\Entity\TransferTarget;
use App\Entity\User;
use App\Enum\ListingStatusEnum;
use App\Enum\PlayerMarketStatusEnum;
use App\Enum\TransferTypeEnum;
use App\Repository\ListingRepository;
use App\Repository\PlayerRepository;
use App\Repository\TeamMembershipRepository;
use App\Repository\TransferTargetRepository;
use App\Service\PublicFeed\PublicFeedPublisher;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/listings')]
final class ListingController extends AbstractController
{
    #[Route('/mine', name: 'app_listing_mine', methods: ['GET'])]
    public function mine(
        #[CurrentUser] ?User $user,
        TeamMembershipRepository $teamMembershipRepository,
        ListingRepository $listingRepository,
        TransferTargetRepository $transferTargetRepository,
    ): JsonResponse {
        $team = $this->getCurrentTeam($user, $teamMembershipRepository);

        if ($team instanceof JsonResponse) {
            return $team;
        }

        $targets = [];
        foreach ($transferTargetRepository->findForTeam($team) as $target) {
            $player = $target->getPlayer();

            if ($player?->getTeam()?->getId()?->toRfc4122() === $team->getId()?->toRfc4122()) {
                $transferTargetRepository->removeForTeamAndPlayer($team, $player);
                continue;
            }

            $targets[] = $this->serializeTarget($target, $listingRepository);
        }

        return $this->json([
            'listings' => $targets,
        ]);
    }

    #[Route('', name: 'app_listing_create', methods: ['POST'])]
    public function create(
        Request $request,
        #[CurrentUser] ?User $user,
        TeamMembershipRepository $teamMembershipRepository,
        PlayerRepository $playerRepository,
        ListingRepository $listingRepository,
        TransferTargetRepository $transferTargetRepository,
        EntityManagerInterface $entityManager,
        PublicFeedPublisher $publicFeedPublisher,
    ): JsonResponse {
        $team = $this->getCurrentTeam($user, $teamMembershipRepository);

        if ($team instanceof JsonResponse) {
            return $team;
        }

        $payload = json_decode($request->getContent(), true);
        $playerId = is_array($payload) ? ($payload['playerId'] ?? null) : null;

        if (!is_string($playerId) || '' === trim($playerId)) {
            return $this->json([
                'errorMessage' => 'Joueur requis.',
            ], 400);
        }

        $player = $playerRepository->find($playerId);

        if (!$player instanceof Player) {
            return $this->json([
                'errorMessage' => 'Joueur introuvable.',
            ], 404);
        }

        $sellerTeam = $player->getTeam();

        if (null === $sellerTeam) {
            return $this->json([
                'errorMessage' => 'Ce joueur n\'est rattaché à aucun club.',
            ], 422);
        }

        if ($sellerTeam->getId()?->toRfc4122() === $team->getId()?->toRfc4122()) {
            return $this->json([
                'errorMessage' => 'Vous ne pouvez ajouter que des joueurs d\'autres clubs à votre liste de transferts.',
            ], 403);
        }

        $transferType = $this->getTransferType($payload['transferType'] ?? null);
        $askingPrice = $this->getAskingPrice($payload['askingPrice'] ?? null);
        $listing = $listingRepository->findOneForPlayer($player) ?? new Listing();
        $target = $transferTargetRepository->findOneForTeamAndPlayer($team, $player) ?? new TransferTarget();

        $listing
            ->setPlayer($player)
            ->setSellerTeam($sellerTeam)
            ->setTransferType($transferType)
            ->setStatus(ListingStatusEnum::ACTIVE)
            ->setAskingPrice($askingPrice)
            ->setCreatedBy($user);

        if (null === $listing->getCreatedAt()) {
            $listing->setCreatedAt(new \DateTimeImmutable());
        }

        $target
            ->setTeam($team)
            ->setPlayer($player);

        if (null === $target->getCreatedAt()) {
            $target->setCreatedAt(new \DateTimeImmutable());
        }

        $player->setListing($listing);

        $entityManager->persist($listing);
        $entityManager->persist($target);
        $entityManager->persist($player);
        $publicFeedPublisher->publishListing($listing);
        $entityManager->flush();

        return $this->json([
            'listing' => $this->serializeTarget($target, $listingRepository),
        ], 201);
    }

    private function getCurrentTeam(?User $user, TeamMembershipRepository $teamMembershipRepository): Team|JsonResponse
    {
        if (!$user) {
            return $this->json([
                'errorMessage' => 'Utilisateur non authentifie.',
            ], 401);
        }

        $membership = $teamMembershipRepository->findPrimaryForUser($user);
        $team = $membership?->getTeam();

        if (null === $team) {
            return $this->json([
                'errorMessage' => 'Aucun club associe a votre compte.',
            ], 403);
        }

        return $team;
    }

    private function getTransferType(mixed $value): TransferTypeEnum
    {
        if (!is_string($value)) {
            return TransferTypeEnum::PERMANENT;
        }

        return TransferTypeEnum::tryFrom($value) ?? TransferTypeEnum::PERMANENT;
    }

    private function getAskingPrice(mixed $value): ?int
    {
        if (is_numeric($value)) {
            return (int) $value;
        }

        return null;
    }

    private function serializeTarget(TransferTarget $target, ListingRepository $listingRepository): array
    {
        $player = $target->getPlayer();
        $listing = $player ? $listingRepository->findOneForPlayer($player) : null;

        return [
            'id' => $target->getId()?->toRfc4122(),
            'listingId' => $listing?->getId()?->toRfc4122(),
            'playerId' => $player?->getId()?->toRfc4122(),
            'addedDate' => $target->getCreatedAt()?->format('Y-m-d') ?? '',
            'transferType' => $listing?->getTransferType()?->value,
            'status' => 'active',
            'askingPrice' => null !== $listing?->getAskingPrice()
                ? $this->formatMoney($listing->getAskingPrice())
                : null,
            'player' => $player ? $this->serializePlayer($player) : null,
        ];
    }

    private function serializePlayer(Player $player): array
    {
        $team = $player->getTeam();

        return [
            'id' => $player->getId()?->toRfc4122(),
            'firstName' => $player->getFirstName(),
            'lastName' => $player->getLastName(),
            'photoUrl' => $player->getPhotoUrl(),
            'age' => $this->getAge($player),
            'position' => $player->getPosition(),
            'nationality' => $player->getNationality() ?? 'Inconnue',
            'country' => $team?->getCountry() ?? '',
            'league' => $team?->getLeague() ?? '',
            'club' => $team?->getName() ?? 'Sans club',
            'clubLogoUrl' => $team?->getLogoUrl(),
            'transferStatus' => $this->getMarketStatusLabel($player->getMarketStatus()),
            'height' => $player->getHeightCm(),
            'weight' => $player->getWeightKg(),
            'foot' => $player->getPreferredFoot(),
            'marketValue' => $this->formatMoney($player->getMarketValue()),
            'weeklySalary' => $this->formatMoney($player->getWeeklySalary()),
            'releaseClause' => $this->formatMoney($player->getReleaseClause(), true),
        ];
    }

    private function getAge(Player $player): int
    {
        $birthDate = $player->getBirthDate();

        if (null === $birthDate) {
            return 0;
        }

        return (int) $birthDate->diff(new \DateTimeImmutable())->y;
    }

    private function formatMoney(int|string|null $amountInCents, bool $allowNone = false): string
    {
        if (null === $amountInCents) {
            return $allowNone ? 'Aucun(e)' : '-';
        }

        $amount = ((int) $amountInCents) / 100;

        if ($amount >= 1_000_000_000) {
            return number_format($amount / 1_000_000_000, 1, ',', ' ').' Md EUR';
        }

        if ($amount >= 1_000_000) {
            return number_format($amount / 1_000_000, 1, ',', ' ').' M EUR';
        }

        if ($amount >= 1_000) {
            return number_format($amount / 1_000, 0, ',', ' ').' K EUR';
        }

        return number_format($amount, 0, ',', ' ').' EUR';
    }

    private function getMarketStatusLabel(?PlayerMarketStatusEnum $status): string
    {
        return match ($status) {
            PlayerMarketStatusEnum::ON_MARKET => 'Sur le marche',
            PlayerMarketStatusEnum::LOAN_LISTED => 'Liste de pret',
            PlayerMarketStatusEnum::NOT_LISTED => 'Non liste',
            default => 'Inconnu',
        };
    }
}
