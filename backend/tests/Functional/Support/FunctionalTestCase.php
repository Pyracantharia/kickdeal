<?php

namespace App\Tests\Functional\Support;

use App\Entity\Agent;
use App\Entity\AppNotification;
use App\Entity\Club;
use App\Entity\ClubRequest;
use App\Entity\DirectConversation;
use App\Entity\Listing;
use App\Entity\Player;
use App\Entity\PlayerAgentRequest;
use App\Entity\PublicFeedPost;
use App\Entity\Team;
use App\Entity\TeamMembership;
use App\Entity\User;
use App\Enum\ClubRequestStatusEnum;
use App\Enum\ListingStatusEnum;
use App\Enum\MembershipRoleEnum;
use App\Enum\PlayerAvailabilityStatusEnum;
use App\Enum\PlayerContractStatusEnum;
use App\Enum\PlayerMarketStatusEnum;
use App\Enum\PlayerAgentRequestStatusEnum;
use App\Enum\PlayerAgentRequestTypeEnum;
use App\Enum\SubscriptionPlanEnum;
use App\Enum\TeamVerificationStatusEnum;
use App\Enum\TransferTypeEnum;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Uid\Uuid;

abstract class FunctionalTestCase extends WebTestCase
{
    protected KernelBrowser $client;
    protected EntityManagerInterface $entityManager;

    protected function setUp(): void
    {
        parent::setUp();

        $this->client = static::createClient();
        $this->entityManager = static::getContainer()->get(EntityManagerInterface::class);
    }

    protected function tearDown(): void
    {
        parent::tearDown();

        unset($this->client, $this->entityManager);
    }

    protected function jsonRequest(string $method, string $uri, array $payload = [], ?User $user = null): void
    {
        if ($user instanceof User) {
            $this->client->loginUser($user);
        }

        $this->client->request(
            $method,
            $uri,
            [],
            [],
            ['CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json'],
            json_encode($payload, JSON_THROW_ON_ERROR),
        );
    }

    protected function request(string $method, string $uri, ?User $user = null): void
    {
        if ($user instanceof User) {
            $this->client->loginUser($user);
        }

        $this->client->request($method, $uri, [], [], ['HTTP_ACCEPT' => 'application/json']);
    }

    protected function assertJsonResponseStatus(int $expectedStatusCode): void
    {
        self::assertSame($expectedStatusCode, $this->client->getResponse()->getStatusCode(), $this->client->getResponse()->getContent());
        self::assertStringContainsString('application/json', (string) $this->client->getResponse()->headers->get('content-type'));
    }

    protected function responseJson(): array
    {
        $content = $this->client->getResponse()->getContent();
        self::assertIsString($content);

        $json = json_decode($content, true);
        self::assertIsArray($json, $content);

        return $json;
    }

    protected function createUser(array $roles = [], ?string $email = null, string $plainPassword = 'Password123!'): User
    {
        $user = (new User())
            ->setFirstName('Functional')
            ->setLastName('Tester')
            ->setEmail($email ?? sprintf('user-%s@example.test', Uuid::v6()->toRfc4122()))
            ->setRoles($roles)
            ->setSubscriptionPlan(in_array(User::ROLE_AGENT, $roles, true) ? SubscriptionPlanEnum::AGENT_FREE : SubscriptionPlanEnum::CLUB_FREE)
            ->setCreatedAt(new \DateTime())
            ->setUpdatedAt(new \DateTime());

        $hasher = static::getContainer()->get(UserPasswordHasherInterface::class);
        $user->setPassword($hasher->hashPassword($user, $plainPassword));
        $user->markPasswordChanged();

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $user;
    }

    protected function createAdmin(): User
    {
        return $this->createUser([User::ROLE_ADMIN], 'admin-'.Uuid::v6()->toRfc4122().'@example.test');
    }

    protected function createAgentUser(): array
    {
        $user = $this->createUser([User::ROLE_AGENT]);
        $agent = (new Agent())
            ->setUser($user)
            ->setAgencyName('KickDeal Agency')
            ->setCountry('France')
            ->setCreatedAt(new \DateTime())
            ->setUpdatedAt(new \DateTime());

        $user->setAgentProfile($agent);
        $this->entityManager->persist($agent);
        $this->entityManager->flush();

        return [$user, $agent];
    }

    protected function createClubUser(): array
    {
        $user = $this->createUser([User::ROLE_CLUB]);
        $team = $this->createTeam();
        $membership = (new TeamMembership())
            ->setUser($user)
            ->setTeam($team)
            ->setRole(MembershipRoleEnum::CLUB_MANAGER)
            ->setPrimary(true)
            ->setCreatedAt(new \DateTime())
            ->setUpdatedAt(new \DateTime());

        $this->entityManager->persist($membership);
        $this->entityManager->flush();

        return [$user, $team, $membership];
    }

    protected function createTeam(?string $name = null, string $country = 'France', string $league = 'Ligue Test'): Team
    {
        $name ??= 'FC Functional '.Uuid::v6()->toRfc4122();

        $team = (new Team())
            ->setName($name)
            ->setCountry($country)
            ->setLeague($league)
            ->setLogoUrl('https://example.test/logo.png')
            ->setTransferBudget(5000000)
            ->setVerificationStatus(TeamVerificationStatusEnum::VERIFIED)
            ->setCreatedAt(new \DateTime())
            ->setUpdatedAt(new \DateTime());

        $club = (new Club())->setTeam($team);
        $team->setClub($club);

        $this->entityManager->persist($club);
        $this->entityManager->persist($team);
        $this->entityManager->flush();

        return $team;
    }

    protected function createPlayer(?Team $team = null, ?Agent $agent = null): Player
    {
        $player = (new Player())
            ->setFirstName('Ada')
            ->setLastName('Route')
            ->setPosition('Midfielder')
            ->setBirthDate(new \DateTimeImmutable('-23 years'))
            ->setNationality('French')
            ->setContractStatus($team instanceof Team ? PlayerContractStatusEnum::UNDER_CONTRACT : PlayerContractStatusEnum::FREE_AGENT)
            ->setContractEndDate(new \DateTimeImmutable('+2 years'))
            ->setJoinedAt(new \DateTimeImmutable('-1 year'))
            ->setMarketStatus(PlayerMarketStatusEnum::NOT_LISTED)
            ->setAvailabilityStatus(PlayerAvailabilityStatusEnum::NORMAL)
            ->setMarketValue(1000000)
            ->setWeeklySalary(10000)
            ->setTeam($team)
            ->setAgent($agent)
            ->setCreatedAt(new \DateTime())
            ->setUpdatedAt(new \DateTime());

        $this->entityManager->persist($player);
        $this->entityManager->flush();

        return $player;
    }

    protected function createListing(?Player $player = null, ?Team $sellerTeam = null): Listing
    {
        $sellerTeam ??= $this->createTeam();
        $player ??= $this->createPlayer($sellerTeam);

        $listing = (new Listing())
            ->setPlayer($player)
            ->setSellerTeam($sellerTeam)
            ->setAskingPrice(2500000)
            ->setTransferType(TransferTypeEnum::PERMANENT)
            ->setStatus(ListingStatusEnum::ACTIVE)
            ->setCreatedAt(new \DateTime())
            ->setUpdatedAt(new \DateTime());

        $player->setListing($listing);
        $this->entityManager->persist($listing);
        $this->entityManager->flush();

        return $listing;
    }

    protected function createConversation(User $one, User $two): DirectConversation
    {
        $ids = [(string) $one->getId(), (string) $two->getId()];
        sort($ids);

        $conversation = (new DirectConversation())
            ->setParticipantOne($one)
            ->setParticipantTwo($two)
            ->setParticipantLowId(Uuid::fromString($ids[0]))
            ->setParticipantHighId(Uuid::fromString($ids[1]))
            ->setCreatedAt(new \DateTimeImmutable())
            ->setUpdatedAt(new \DateTimeImmutable());

        $this->entityManager->persist($conversation);
        $this->entityManager->flush();

        return $conversation;
    }

    protected function createNotification(User $recipient): AppNotification
    {
        $notification = (new AppNotification())
            ->setRecipient($recipient)
            ->setType('functional.test')
            ->setCategory('tests')
            ->setSeverity('info')
            ->setTitle('Functional route')
            ->setBody('Route notification')
            ->setCreatedAt(new \DateTime())
            ->setUpdatedAt(new \DateTime());

        $this->entityManager->persist($notification);
        $this->entityManager->flush();

        return $notification;
    }

    protected function createPublicFeedPost(?Player $player = null, ?Team $sellerTeam = null, ?Team $buyerTeam = null): PublicFeedPost
    {
        $sellerTeam ??= $this->createTeam();
        $player ??= $this->createPlayer($sellerTeam);
        $buyerTeam ??= $this->createTeam();

        $post = (new PublicFeedPost())
            ->setEventType('market_listing')
            ->setBucket('featured')
            ->setSourceType('functional')
            ->setSourceId(Uuid::v6()->toRfc4122())
            ->setIsFeatured(true)
            ->setPublishedAt(new \DateTimeImmutable())
            ->setHeadline('Functional feed post')
            ->setBody('A route-level public feed post.')
            ->setPlayerName('Ada Route')
            ->setPlayer($player)
            ->setSellerTeam($sellerTeam)
            ->setBuyerTeam($buyerTeam)
            ->setLeague($sellerTeam->getLeague())
            ->setCountry($sellerTeam->getCountry())
            ->setCreatedAt(new \DateTime())
            ->setUpdatedAt(new \DateTime());

        $this->entityManager->persist($post);
        $this->entityManager->flush();

        return $post;
    }

    protected function createPendingClubRequest(User $requester, Team $team): ClubRequest
    {
        $clubRequest = (new ClubRequest())
            ->setRequester($requester)
            ->setTeam($team)
            ->setStatus(ClubRequestStatusEnum::PENDING)
            ->setVerificationEmail($requester->getEmail())
            ->setCreatedAt(new \DateTime())
            ->setUpdatedAt(new \DateTime());

        $this->entityManager->persist($clubRequest);
        $this->entityManager->flush();

        return $clubRequest;
    }

    protected function createPlayerAgentRequest(Agent $agent, Player $player): PlayerAgentRequest
    {
        $request = (new PlayerAgentRequest())
            ->setAgent($agent)
            ->setPlayer($player)
            ->setStatus(PlayerAgentRequestStatusEnum::PENDING)
            ->setType(PlayerAgentRequestTypeEnum::REPRESENTATION)
            ->setVerificationDocumentPath('/tmp/proof.pdf')
            ->setVerificationDocumentOriginalName('proof.pdf')
            ->setMessage('Functional request');

        $this->entityManager->persist($request);
        $this->entityManager->flush();

        return $request;
    }
}
