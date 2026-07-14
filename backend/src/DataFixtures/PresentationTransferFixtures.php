<?php

namespace App\DataFixtures;

use App\Entity\Agent;
use App\Entity\Contract\ContractNegociation;
use App\Entity\Contract\ContractOffer;
use App\Entity\Listing;
use App\Entity\Player;
use App\Entity\PublicFeedPost;
use App\Entity\Team;
use App\Entity\Transfer\TransferAgreement;
use App\Entity\Transfer\TransferNegociation;
use App\Entity\Transfer\TransferOffer;
use App\Entity\User;
use App\Enum\ContractNegotiationTypeEnum;
use App\Enum\ListingStatusEnum;
use App\Enum\OfferStatusEnum;
use App\Enum\PlayerAvailabilityStatusEnum;
use App\Enum\PlayerContractNegociationStatusEnum;
use App\Enum\PlayerContractStatusEnum;
use App\Enum\PlayerMarketStatusEnum;
use App\Enum\TransferNegociationStatusEnum;
use App\Enum\TransferOfferKindEnum;
use App\Enum\TransferTypeEnum;
use App\Service\Contract\ContractNegotiationWorkflow;
use App\Service\PublicFeed\PublicFeedPublisher;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Bundle\FixturesBundle\FixtureGroupInterface;
use Doctrine\Common\DataFixtures\OrderedFixtureInterface;
use Doctrine\Persistence\ObjectManager;
use Normalizer;

final class PresentationTransferFixtures extends Fixture implements FixtureGroupInterface, OrderedFixtureInterface
{
    /** @var array<string, Player> */
    private array $playersByName = [];

    public function __construct(
        private readonly ContractNegotiationWorkflow $workflow,
        private readonly PublicFeedPublisher $publicFeedPublisher,
    ) {
    }

    public static function getGroups(): array
    {
        return ['presentation'];
    }

    public function getOrder(): int
    {
        return 40;
    }

    public function load(ObjectManager $manager): void
    {
        $teams = $this->loadTeams($manager);
        $agents = $this->loadAgents($manager);
        $this->indexPlayers($manager);

        foreach (PresentationFixtureData::transfers() as $index => $transferData) {
            $sellerTeam = $teams[$transferData['from']];
            $buyerTeam = $teams[$transferData['to']];
            $player = $this->findOrCreatePlayer($manager, $transferData, $sellerTeam, $index);

            if ($this->transferAlreadyExists($manager, $player, $sellerTeam, $buyerTeam)) {
                continue;
            }

            if ($player->getListing() instanceof Listing) {
                continue;
            }

            $agent = $player->getAgent() ?? $agents[$index % count($agents)];
            if (null === $player->getAgent()) {
                $player->setAgent($agent);
                $agent->addPlayer($player);
            }

            $buyerUser = $this->buyerUser($manager, $transferData['to']);
            $dealDate = (new \DateTimeImmutable('2026-06-13 18:00:00'))
                ->modify(sprintf('+%d days', $index))
                ->setTime(18 + ($index % 4), ($index * 7) % 60);
            $transferType = TransferTypeEnum::from($transferData['type']);
            $amount = $this->eurosToCents($transferData['amount']);

            [$listing, $negociation, $offer, $agreement] = $this->createClubAgreement(
                manager: $manager,
                player: $player,
                sellerTeam: $sellerTeam,
                buyerTeam: $buyerTeam,
                buyerUser: $buyerUser,
                transferType: $transferType,
                amount: $amount,
                dealDate: $dealDate,
            );

            if (TransferTypeEnum::LOAN === $transferType) {
                $this->finalizeLoan(
                    player: $player,
                    buyerTeam: $buyerTeam,
                    listing: $listing,
                    negociation: $negociation,
                    offer: $offer,
                    agreement: $agreement,
                    dealDate: $dealDate,
                );
                $manager->flush();
                $this->publishLoanHistory($offer, $negociation, $dealDate);
                $manager->flush();

                continue;
            }

            $this->finalizePermanentTransfer(
                manager: $manager,
                player: $player,
                buyerTeam: $buyerTeam,
                buyerUser: $buyerUser,
                agent: $agent,
                listing: $listing,
                negociation: $negociation,
                offer: $offer,
                agreement: $agreement,
                dealDate: $dealDate,
                index: $index,
            );
        }

        $manager->flush();
    }

    /**
     * @return array{Listing, TransferNegociation, TransferOffer, TransferAgreement}
     */
    private function createClubAgreement(
        ObjectManager $manager,
        Player $player,
        Team $sellerTeam,
        Team $buyerTeam,
        User $buyerUser,
        TransferTypeEnum $transferType,
        int $amount,
        \DateTimeImmutable $dealDate,
    ): array {
        $listingDate = $dealDate->modify('-3 days');
        $offerDate = $dealDate->modify('-2 days');
        $agreementDate = $dealDate->modify('-1 day');

        $listing = (new Listing())
            ->setPlayer($player)
            ->setSellerTeam($sellerTeam)
            ->setTransferType($transferType)
            ->setStatus(ListingStatusEnum::ACTIVE)
            ->setAskingPrice(null)
            ->setCreatedBy($buyerUser)
            ->setCreatedAt($listingDate)
            ->setUpdatedAt($listingDate);
        $player->setListing($listing);

        $negociation = (new TransferNegociation())
            ->setListing($listing)
            ->setBuyerTeam($buyerTeam)
            ->setStatus(TransferNegociationStatusEnum::AGREED_CLUBS)
            ->setPermissionToSpeakAt($agreementDate)
            ->setAgreedAt($agreementDate)
            ->setPublicFeedEnabled(true)
            ->setCreatedBy($buyerUser)
            ->setCreatedAt($listingDate)
            ->setUpdatedAt($agreementDate);
        $listing->addTransferNegociation($negociation);

        $offer = (new TransferOffer())
            ->setTransferNegociation($negociation)
            ->setAuthor($buyerUser)
            ->setKind(TransferTypeEnum::LOAN === $transferType ? TransferOfferKindEnum::LOAN : TransferOfferKindEnum::INITIAL)
            ->setAmount($amount)
            ->setDurationMonths(TransferTypeEnum::LOAN === $transferType ? 12 : null)
            ->setPaymentInstallments($amount > 0 ? 2 : 1)
            ->setMessage('Proposition de transfert validée pour la présentation KickDeal 2026.')
            ->setValidUntil($dealDate->modify('+7 days'))
            ->setStatus(OfferStatusEnum::ACCEPTED)
            ->setCreatedAt($offerDate)
            ->setUpdatedAt($agreementDate);
        $negociation->addTransferOffer($offer);

        $agreement = (new TransferAgreement())
            ->setTransferNegociation($negociation)
            ->setAcceptedOffer($offer)
            ->setCreatedAt($agreementDate)
            ->setUpdatedAt($agreementDate);
        $negociation->addTransferAgreement($agreement);

        $manager->persist($listing);
        $manager->persist($negociation);
        $manager->persist($offer);
        $manager->persist($agreement);
        $manager->flush();

        return [$listing, $negociation, $offer, $agreement];
    }

    private function finalizePermanentTransfer(
        ObjectManager $manager,
        Player $player,
        Team $buyerTeam,
        User $buyerUser,
        Agent $agent,
        Listing $listing,
        TransferNegociation $negociation,
        TransferOffer $offer,
        TransferAgreement $agreement,
        \DateTimeImmutable $dealDate,
        int $index,
    ): void {
        $durationMonths = 36 + (($index % 3) * 12);
        $weeklySalary = max($player->getWeeklySalary() ?? 0, $this->eurosToCents(35_000 + (($index % 8) * 7_500)));
        $annualSalary = $weeklySalary * 52;

        $contractNegociation = (new ContractNegociation())
            ->setPlayer($player)
            ->setBuyerTeam($buyerTeam)
            ->setAgent($agent)
            ->setTransferNegociation($negociation)
            ->setType(ContractNegotiationTypeEnum::TRANSFER)
            ->setStatus(PlayerContractNegociationStatusEnum::SENT_TO_PLAYER)
            ->setPublicFeedEnabled(true)
            ->setCreatedBy($buyerUser)
            ->setCreatedAt($dealDate->modify('-1 day'))
            ->setUpdatedAt($dealDate->modify('-12 hours'));
        $negociation->addContractNegociation($contractNegociation);

        $contractOffer = (new ContractOffer())
            ->setContractNegociation($contractNegociation)
            ->setAuthor($buyerUser)
            ->setAnnualSalary($annualSalary)
            ->setDurationMonths($durationMonths)
            ->setSigningBonus(max($this->eurosToCents(250_000), (int) round(($offer->getAmount() ?? 0) * 0.02)))
            ->setReleaseClause(max($this->eurosToCents(20_000_000), ($offer->getAmount() ?? 0) * 2))
            ->setEffectiveDate($dealDate)
            ->setValidUntil($dealDate->modify('+7 days'))
            ->setNotes('Conditions contractuelles acceptées pour la présentation KickDeal 2026.')
            ->setStatus(OfferStatusEnum::PENDING)
            ->setCreatedAt($dealDate->modify('-12 hours'))
            ->setUpdatedAt($dealDate->modify('-2 hours'));
        $contractNegociation->addContractOffer($contractOffer);

        $manager->persist($contractNegociation);
        $manager->persist($contractOffer);
        $manager->flush();

        $this->workflow->finalize($contractNegociation, $contractOffer);
        $manager->flush();

        $listing
            ->setStatus(ListingStatusEnum::CLOSED)
            ->setUpdatedAt($dealDate);
        $negociation
            ->setStatus(TransferNegociationStatusEnum::COMPLETED)
            ->setAgreedAt($dealDate)
            ->setUpdatedAt($dealDate);
        $offer->setUpdatedAt($dealDate->modify('-1 day'));
        $agreement
            ->setCreatedAt($dealDate->modify('-1 day'))
            ->setUpdatedAt($dealDate->modify('-1 day'));
        $contractNegociation
            ->setCreatedAt($dealDate->modify('-1 day'))
            ->setUpdatedAt($dealDate);
        $contractOffer
            ->setStatus(OfferStatusEnum::ACCEPTED)
            ->setUpdatedAt($dealDate);
        foreach ($contractNegociation->getContractPackages() as $package) {
            $package
                ->setCreatedAt($dealDate)
                ->setUpdatedAt($dealDate);
        }
        $player
            ->setJoinedAt($dealDate)
            ->setContractEndDate($dealDate->modify(sprintf('+%d months', $durationMonths)))
            ->setUpdatedAt($dealDate);
        $manager->flush();

        $this->applyPostDate($this->publicFeedPublisher->publishTransferOffer($offer), $dealDate->modify('-2 days'));
        $this->applyPostDate($this->publicFeedPublisher->publishTransferAgreement($offer), $dealDate->modify('-1 day'));
        $this->applyPostDate($this->publicFeedPublisher->publishContractFinalized($contractNegociation), $dealDate);
        $manager->flush();
    }

    private function finalizeLoan(
        Player $player,
        Team $buyerTeam,
        Listing $listing,
        TransferNegociation $negociation,
        TransferOffer $offer,
        TransferAgreement $agreement,
        \DateTimeImmutable $dealDate,
    ): void {
        $weeklySalary = max($player->getWeeklySalary() ?? 0, $this->eurosToCents(30_000));
        $listing
            ->setStatus(ListingStatusEnum::CLOSED)
            ->setUpdatedAt($dealDate);
        $negociation
            ->setStatus(TransferNegociationStatusEnum::COMPLETED)
            ->setAgreedAt($dealDate)
            ->setExternalContractBuyerConfirmedAt($dealDate->modify('-3 hours'))
            ->setExternalContractSellerConfirmedAt($dealDate->modify('-2 hours'))
            ->setExternalContractWeeklySalary($weeklySalary)
            ->setExternalContractDurationMonths(12)
            ->setUpdatedAt($dealDate);
        $offer->setUpdatedAt($dealDate->modify('-1 day'));
        $agreement
            ->setCreatedAt($dealDate->modify('-1 day'))
            ->setUpdatedAt($dealDate->modify('-1 day'));
        $player
            ->setTemporaryClub($buyerTeam->getClub())
            ->setUpdatedAt($dealDate);
    }

    private function publishLoanHistory(
        TransferOffer $offer,
        TransferNegociation $negociation,
        \DateTimeImmutable $dealDate,
    ): void {
        $this->applyPostDate($this->publicFeedPublisher->publishTransferOffer($offer), $dealDate->modify('-2 days'));
        $this->applyPostDate($this->publicFeedPublisher->publishTransferAgreement($offer), $dealDate->modify('-1 day'));
        $this->applyPostDate($this->publicFeedPublisher->publishExternalTransferFinalized($negociation), $dealDate);
    }

    private function applyPostDate(?PublicFeedPost $post, \DateTimeImmutable $publishedAt): void
    {
        $post?->setPublishedAt($publishedAt)
            ->setCreatedAt($publishedAt)
            ->setUpdatedAt($publishedAt);
    }

    /**
     * @return array<string, Team>
     */
    private function loadTeams(ObjectManager $manager): array
    {
        $teams = [];
        foreach (PresentationFixtureData::teams() as $key => $data) {
            $team = $manager->getRepository(Team::class)->findOneBy(['name' => $data['name']]);
            if (!$team instanceof Team) {
                throw new \RuntimeException(sprintf('Le club de présentation "%s" est introuvable.', $data['name']));
            }
            $teams[$key] = $team;
        }

        return $teams;
    }

    /**
     * @return list<Agent>
     */
    private function loadAgents(ObjectManager $manager): array
    {
        $agents = [];
        foreach (PresentationFixtureData::agents() as $agentData) {
            $user = $manager->getRepository(User::class)->findOneBy(['email' => $agentData['email']]);
            $agent = $user?->getAgentProfile();
            if (!$agent instanceof Agent) {
                throw new \RuntimeException(sprintf('Le compte agent de présentation "%s" est introuvable.', $agentData['email']));
            }
            $agents[] = $agent;
        }

        return $agents;
    }

    private function buyerUser(ObjectManager $manager, string $teamKey): User
    {
        $email = PresentationFixtureData::clubEmail($teamKey);
        $user = $manager->getRepository(User::class)->findOneBy(['email' => $email]);
        if (!$user instanceof User) {
            throw new \RuntimeException(sprintf('Le compte club de présentation "%s" est introuvable.', $email));
        }

        return $user;
    }

    private function indexPlayers(ObjectManager $manager): void
    {
        foreach ($manager->getRepository(Player::class)->findAll() as $player) {
            if (!$player instanceof Player) {
                continue;
            }
            $this->playersByName[$this->normalizeName($this->playerName($player))] = $player;
        }
    }

    /**
     * @param array{player: string, aliases?: list<string>, from: string, to: string, amount: int, type: string} $transferData
     */
    private function findOrCreatePlayer(
        ObjectManager $manager,
        array $transferData,
        Team $sellerTeam,
        int $index,
    ): Player {
        foreach ([$transferData['player'], ...($transferData['aliases'] ?? [])] as $name) {
            $player = $this->playersByName[$this->normalizeName($name)] ?? null;
            if ($player instanceof Player) {
                return $player;
            }
        }

        [$firstName, $lastName] = array_pad(explode(' ', $transferData['player'], 2), 2, 'Présentation');
        $marketValue = $this->eurosToCents(max(5_000_000, $transferData['amount']));
        $birthYear = 1995 + ($index % 8);
        $player = (new Player())
            ->setFirstName($firstName)
            ->setLastName($lastName)
            ->setBirthDate(new \DateTimeImmutable(sprintf('%d-%02d-%02d', $birthYear, 1 + ($index % 12), 1 + ($index % 27))))
            ->setNationality($sellerTeam->getCountry())
            ->setPosition('Midfield')
            ->setHeightCm(178 + ($index % 12))
            ->setWeightKg(70 + ($index % 10))
            ->setPreferredFoot(0 === $index % 4 ? 'Gaucher' : 'Droitier')
            ->setMarketValue($marketValue)
            ->setWeeklySalary($this->eurosToCents(40_000 + (($index % 8) * 5_000)))
            ->setReleaseClause(max($this->eurosToCents(20_000_000), $marketValue * 2))
            ->setContractStatus(PlayerContractStatusEnum::UNDER_CONTRACT)
            ->setContractEndDate(new \DateTimeImmutable('2029-06-30'))
            ->setJoinedAt(new \DateTimeImmutable('2024-07-01'))
            ->setMarketStatus(PlayerMarketStatusEnum::NOT_LISTED)
            ->setAvailabilityStatus(PlayerAvailabilityStatusEnum::NORMAL)
            ->setTeam($sellerTeam)
            ->setClub($sellerTeam->getClub())
            ->setCreatedAt(new \DateTimeImmutable('2024-07-01'))
            ->setUpdatedAt(new \DateTimeImmutable('2026-06-01'));
        $manager->persist($player);
        $manager->flush();
        $this->playersByName[$this->normalizeName($transferData['player'])] = $player;

        return $player;
    }

    private function transferAlreadyExists(
        ObjectManager $manager,
        Player $player,
        Team $sellerTeam,
        Team $buyerTeam,
    ): bool {
        foreach ($manager->getRepository(TransferNegociation::class)->findBy(['buyerTeam' => $buyerTeam]) as $negociation) {
            if (!$negociation instanceof TransferNegociation) {
                continue;
            }
            $listing = $negociation->getListing();
            if (
                $listing?->getPlayer()?->getId()?->equals($player->getId())
                && $listing->getSellerTeam()?->getId()?->equals($sellerTeam->getId())
            ) {
                return true;
            }
        }

        return false;
    }

    private function playerName(Player $player): string
    {
        return trim(sprintf('%s %s', $player->getFirstName(), $player->getLastName()));
    }

    private function normalizeName(string $value): string
    {
        $normalized = class_exists(Normalizer::class) ? Normalizer::normalize($value, Normalizer::FORM_D) : $value;
        $normalized = false === $normalized ? $value : $normalized;
        $normalized = preg_replace('/[\x{0300}-\x{036f}]/u', '', $normalized) ?? $normalized;
        $normalized = mb_strtolower($normalized);

        return preg_replace('/[^a-z0-9]+/', '', $normalized) ?? $normalized;
    }

    private function eurosToCents(int $amount): int
    {
        return $amount * 100;
    }
}
