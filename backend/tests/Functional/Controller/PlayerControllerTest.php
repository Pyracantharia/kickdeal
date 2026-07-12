<?php

namespace App\Tests\Functional\Controller;

use App\Tests\Functional\Support\FunctionalTestCase;

final class PlayerControllerTest extends FunctionalTestCase
{
    public function testAgentRosterSucceeds(): void
    {
        [$user, $agent] = $this->createAgentUser();
        $this->createPlayer(agent: $agent);

        $this->request('GET', '/api/players/agent-roster', $user);

        $this->assertJsonResponseStatus(200);
        self::assertArrayHasKey('players', $this->responseJson());
    }

    public function testAgentRosterRequiresAuthentication(): void
    {
        $this->request('GET', '/api/players/agent-roster');

        $this->assertJsonResponseStatus(401);
    }

    public function testClubRosterSucceeds(): void
    {
        [$user, $team] = $this->createClubUser();
        $this->createPlayer($team);

        $this->request('GET', '/api/players/club-roster', $user);

        $this->assertJsonResponseStatus(200);
        self::assertArrayHasKey('players', $this->responseJson());
    }

    public function testClubRosterRequiresAuthentication(): void
    {
        $this->request('GET', '/api/players/club-roster');

        $this->assertJsonResponseStatus(401);
    }

    public function testTeamRosterSucceeds(): void
    {
        $team = $this->createTeam();
        $this->createPlayer($team);

        $this->request('GET', '/api/players/team/'.$team->getId().'/roster');

        $this->assertJsonResponseStatus(200);
        self::assertArrayHasKey('players', $this->responseJson());
    }

    public function testTeamRosterRejectsUnknownTeam(): void
    {
        $this->request('GET', '/api/players/team/'.self::uuid().'/roster');

        $this->assertJsonResponseStatus(404);
    }

    public function testListSucceeds(): void
    {
        $this->createPlayer();

        $this->request('GET', '/api/players');

        $this->assertJsonResponseStatus(200);
        self::assertArrayHasKey('players', $this->responseJson());
    }

    public function testListRejectsUnsupportedMethod(): void
    {
        $this->request('POST', '/api/players');

        self::assertSame(405, $this->client->getResponse()->getStatusCode());
    }

    public function testShowSucceeds(): void
    {
        $player = $this->createPlayer();

        $this->request('GET', '/api/players/'.$player->getId());

        $this->assertJsonResponseStatus(200);
        self::assertSame((string) $player->getId(), $this->responseJson()['id']);
    }

    public function testShowRejectsUnknownPlayer(): void
    {
        $this->request('GET', '/api/players/'.self::uuid());

        self::assertSame(404, $this->client->getResponse()->getStatusCode());
    }

    private static function uuid(): string
    {
        return '00000000-0000-4000-8000-000000000000';
    }
}
