<?php

namespace App\Tests\Functional\Controller;

use App\Tests\Functional\Support\FunctionalTestCase;

final class DashboardControllerTest extends FunctionalTestCase
{
    public function testHomeSucceeds(): void
    {
        [$user] = $this->createClubUser();

        $this->request('GET', '/api/dashboard/home', $user);

        $this->assertJsonResponseStatus(200);
        self::assertArrayHasKey('pendingOffersCount', $this->responseJson());
    }

    public function testHomeRequiresAuthentication(): void
    {
        $this->request('GET', '/api/dashboard/home');

        $this->assertJsonResponseStatus(401);
    }

    public function testAgentSucceeds(): void
    {
        [$user, $agent] = $this->createAgentUser();
        $this->createPlayer(agent: $agent);

        $this->request('GET', '/api/dashboard/agent', $user);

        $this->assertJsonResponseStatus(200);
        self::assertArrayHasKey('stats', $this->responseJson());
    }

    public function testAgentRequiresAuthentication(): void
    {
        $this->request('GET', '/api/dashboard/agent');

        $this->assertJsonResponseStatus(401);
    }
}
