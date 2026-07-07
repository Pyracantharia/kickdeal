<?php

namespace App\Tests\Functional\Controller;

use App\Tests\Functional\Support\FunctionalTestCase;

final class UserControllerTest extends FunctionalTestCase
{
    public function testIndexSucceeds(): void
    {
        $user = $this->createUser(email: 'index-user@example.test');

        $this->request('GET', '/api/users/');

        $this->assertJsonResponseStatus(200);
        self::assertContains($user->getEmail(), array_column($this->responseJson(), 'email'));
    }

    public function testIndexRejectsUnsupportedMethod(): void
    {
        $this->request('POST', '/api/users/');

        self::assertSame(405, $this->client->getResponse()->getStatusCode());
    }

    public function testAgentsAndClubsSucceeds(): void
    {
        $user = $this->createUser();
        $this->createAgentUser();
        $this->createClubUser();

        $this->request('GET', '/api/users/agents-and-clubs', $user);

        $this->assertJsonResponseStatus(200);
    }

    public function testAgentsAndClubsRequiresAuthentication(): void
    {
        $this->request('GET', '/api/users/agents-and-clubs');

        $this->assertJsonResponseStatus(401);
    }

    public function testShowReturnsPayloadForKnownRouteShape(): void
    {
        $user = $this->createUser(email: 'show-user@example.test');

        $this->request('GET', '/api/users/'.rawurlencode($user->getEmail()));

        $this->assertJsonResponseStatus(200);
        $json = $this->responseJson();
        self::assertSame((string) $user->getId(), $json['id']);
        self::assertSame($user->getEmail(), $json['email']);
    }

    public function testShowRejectsInvalidEmail(): void
    {
        $this->request('GET', '/api/users/not-an-email');

        $this->assertJsonResponseStatus(404);
    }
}
