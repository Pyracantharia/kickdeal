<?php

namespace App\Tests\Functional\Controller;

use App\Enum\PlayerMarketAuthorizationStatusEnum;
use App\Enum\PlayerMarketStatusEnum;
use App\Enum\SubscriptionPlanEnum;
use App\Tests\Functional\Support\FunctionalTestCase;

final class ClubControllerTest extends FunctionalTestCase
{
    public function testMineSucceeds(): void
    {
        [$user] = $this->createClubUser();

        $this->request('GET', '/api/clubs/mine', $user);

        $this->assertJsonResponseStatus(200);
        self::assertArrayHasKey('club', $this->responseJson());
    }

    public function testMineRequiresClubMembership(): void
    {
        $this->request('GET', '/api/clubs/mine', $this->createUser());

        $this->assertJsonResponseStatus(403);
    }

    public function testCreatePlayerSucceeds(): void
    {
        [$user] = $this->createClubUser();

        $this->jsonRequest('POST', '/api/clubs/mine/players', [
            'firstName' => 'Route',
            'lastName' => 'Player',
            'position' => 'Forward',
        ], $user);

        $this->assertJsonResponseStatus(201);
    }

    public function testCreatePlayerRejectsMissingRequiredFields(): void
    {
        [$user] = $this->createClubUser();

        $this->jsonRequest('POST', '/api/clubs/mine/players', [], $user);

        $this->assertJsonResponseStatus(422);
    }

    public function testUpdateBudgetSucceeds(): void
    {
        [$user] = $this->createClubUser();

        $this->jsonRequest('PUT', '/api/clubs/mine/budget', ['totalBudget' => 42], $user);

        $this->assertJsonResponseStatus(200);
    }

    public function testUpdateBudgetRejectsInvalidBudget(): void
    {
        [$user] = $this->createClubUser();

        $this->jsonRequest('PUT', '/api/clubs/mine/budget', ['totalBudget' => -1], $user);

        $this->assertJsonResponseStatus(422);
    }

    public function testUpdatePlayerMarketStatusSucceeds(): void
    {
        [$user, $team] = $this->createClubUser();
        $player = $this->createPlayer($team);

        $this->jsonRequest('PUT', '/api/clubs/mine/players/'.$player->getId().'/market-status', [
            'status' => PlayerMarketStatusEnum::ON_MARKET->value,
        ], $user);

        $this->assertJsonResponseStatus(200);
    }

    public function testUpdatePlayerMarketStatusRejectsInvalidStatus(): void
    {
        [$user, $team] = $this->createClubUser();
        $player = $this->createPlayer($team);

        $this->jsonRequest('PUT', '/api/clubs/mine/players/'.$player->getId().'/market-status', ['status' => 'bad'], $user);

        $this->assertJsonResponseStatus(400);
    }

    public function testDecidePlayerMarketAuthorizationSucceeds(): void
    {
        [$user, $team] = $this->createClubUser();
        $player = $this->createPlayer($team);
        $player
            ->setMarketAuthorizationStatus(PlayerMarketAuthorizationStatusEnum::PENDING)
            ->setMarketAuthorizationRequestedAt(new \DateTimeImmutable());
        $this->entityManager->flush();

        $this->jsonRequest('PUT', '/api/clubs/mine/players/'.$player->getId().'/market-authorization', [
            'decision' => 'approved',
        ], $user);

        $this->assertJsonResponseStatus(200);
    }

    public function testDecidePlayerMarketAuthorizationRejectsInvalidDecision(): void
    {
        [$user, $team] = $this->createClubUser();
        $player = $this->createPlayer($team);

        $this->jsonRequest('PUT', '/api/clubs/mine/players/'.$player->getId().'/market-authorization', [
            'decision' => 'bad',
        ], $user);

        $this->assertJsonResponseStatus(400);
    }

    public function testJoinSucceeds(): void
    {
        [$manager, $team] = $this->createClubUser();
        $manager->setSubscriptionPlan(SubscriptionPlanEnum::CLUB_PRO);
        $this->entityManager->flush();
        $newUser = $this->createUser();

        $this->jsonRequest('POST', '/api/clubs/join', [
            'invitationCode' => $this->invitationCode((string) $team->getId()),
        ], $newUser);

        $this->assertJsonResponseStatus(201);
    }

    public function testJoinRejectsInvalidInvitationCode(): void
    {
        $this->jsonRequest('POST', '/api/clubs/join', ['invitationCode' => 'bad-code'], $this->createUser());

        $this->assertJsonResponseStatus(404);
    }

    public function testSearchSucceeds(): void
    {
        $this->createTeam();

        $this->request('GET', '/api/clubs/search?query=Functional');

        $this->assertJsonResponseStatus(200);
        self::assertArrayHasKey('clubs', $this->responseJson());
    }

    public function testSearchRejectsUnsupportedMethod(): void
    {
        $this->request('POST', '/api/clubs/search');

        self::assertSame(405, $this->client->getResponse()->getStatusCode());
    }

    public function testLeaguesSucceeds(): void
    {
        $this->createTeam();

        $this->request('GET', '/api/clubs/leagues');

        $this->assertJsonResponseStatus(200);
        self::assertArrayHasKey('leagues', $this->responseJson());
    }

    public function testLeaguesRejectsUnsupportedMethod(): void
    {
        $this->request('POST', '/api/clubs/leagues');

        self::assertSame(405, $this->client->getResponse()->getStatusCode());
    }

    public function testMyRequestSucceeds(): void
    {
        $this->request('GET', '/api/clubs/requests/mine', $this->createUser());

        $this->assertJsonResponseStatus(200);
        self::assertArrayHasKey('hasClubAccess', $this->responseJson());
    }

    public function testMyRequestRequiresAuthentication(): void
    {
        $this->request('GET', '/api/clubs/requests/mine');

        self::assertSame(401, $this->client->getResponse()->getStatusCode());
    }

    public function testCreateRequestSucceeds(): void
    {
        $user = $this->createUser();
        $team = $this->createTeam();
        $this->client->loginUser($user);

        $this->client->request('POST', '/api/clubs/requests', [
            'teamId' => (string) $team->getId(),
            'verificationEmail' => 'club@example.test',
        ], [], ['HTTP_ACCEPT' => 'application/json']);

        $this->assertJsonResponseStatus(201);
    }

    public function testCreateRequestRejectsMissingVerification(): void
    {
        $user = $this->createUser();
        $team = $this->createTeam();
        $this->client->loginUser($user);

        $this->client->request('POST', '/api/clubs/requests', [
            'teamId' => (string) $team->getId(),
        ], [], ['HTTP_ACCEPT' => 'application/json']);

        $this->assertJsonResponseStatus(422);
    }

    private function invitationCode(string $uuid): string
    {
        return 'KD-'.strtoupper(str_replace('-', '', $uuid));
    }
}
