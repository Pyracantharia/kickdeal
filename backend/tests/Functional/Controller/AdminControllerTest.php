<?php

namespace App\Tests\Functional\Controller;

use App\Enum\ClubRequestStatusEnum;
use App\Tests\Functional\Support\FunctionalTestCase;

final class AdminControllerTest extends FunctionalTestCase
{
    public function testPendingClubRequestsSucceeds(): void
    {
        $this->request('GET', '/api/admin/club-requests/pending', $this->createAdmin());

        $this->assertJsonResponseStatus(200);
        self::assertArrayHasKey('pendingRequests', $this->responseJson());
    }

    public function testPendingClubRequestsRejectsNonAdmin(): void
    {
        $this->request('GET', '/api/admin/club-requests/pending', $this->createUser());

        $this->assertJsonResponseStatus(401);
    }

    public function testApproveClubRequestSucceeds(): void
    {
        $admin = $this->createAdmin();
        $requester = $this->createUser();
        $clubRequest = $this->createPendingClubRequest($requester, $this->createTeam());

        $this->jsonRequest('PUT', '/api/admin/club-requests/approve/'.$clubRequest->getId(), [], $admin);

        $this->assertJsonResponseStatus(200);
    }

    public function testApproveClubRequestRejectsAlreadyHandledRequest(): void
    {
        $admin = $this->createAdmin();
        $clubRequest = $this->createPendingClubRequest($this->createUser(), $this->createTeam());
        $clubRequest->setStatus(ClubRequestStatusEnum::APPROVED);
        $this->entityManager->flush();

        $this->jsonRequest('PUT', '/api/admin/club-requests/approve/'.$clubRequest->getId(), [], $admin);

        $this->assertJsonResponseStatus(400);
    }

    public function testPendingPlayerAgentRequestsSucceeds(): void
    {
        $this->request('GET', '/api/admin/player-agent-requests/pending', $this->createAdmin());

        $this->assertJsonResponseStatus(200);
        self::assertArrayHasKey('pendingRequests', $this->responseJson());
    }

    public function testPendingPlayerAgentRequestsRejectsNonAdmin(): void
    {
        $this->request('GET', '/api/admin/player-agent-requests/pending', $this->createUser());

        $this->assertJsonResponseStatus(401);
    }

    public function testApprovePlayerAgentRequestSucceeds(): void
    {
        $admin = $this->createAdmin();
        [, $agent] = $this->createAgentUser();
        $request = $this->createPlayerAgentRequest($agent, $this->createPlayer());

        $this->jsonRequest('PUT', '/api/admin/player-agent-requests/approve/'.$request->getId(), [], $admin);

        $this->assertJsonResponseStatus(200);
    }

    public function testApprovePlayerAgentRequestRejectsNonAdmin(): void
    {
        [, $agent] = $this->createAgentUser();
        $request = $this->createPlayerAgentRequest($agent, $this->createPlayer());

        $this->jsonRequest('PUT', '/api/admin/player-agent-requests/approve/'.$request->getId(), [], $this->createUser());

        $this->assertJsonResponseStatus(401);
    }

    public function testRejectPlayerAgentRequestSucceeds(): void
    {
        $admin = $this->createAdmin();
        [, $agent] = $this->createAgentUser();
        $request = $this->createPlayerAgentRequest($agent, $this->createPlayer());

        $this->jsonRequest('PUT', '/api/admin/player-agent-requests/reject/'.$request->getId(), [], $admin);

        $this->assertJsonResponseStatus(200);
    }

    public function testRejectPlayerAgentRequestRejectsNonAdmin(): void
    {
        [, $agent] = $this->createAgentUser();
        $request = $this->createPlayerAgentRequest($agent, $this->createPlayer());

        $this->jsonRequest('PUT', '/api/admin/player-agent-requests/reject/'.$request->getId(), [], $this->createUser());

        $this->assertJsonResponseStatus(401);
    }

    public function testRejectClubRequestSucceeds(): void
    {
        $admin = $this->createAdmin();
        $clubRequest = $this->createPendingClubRequest($this->createUser(), $this->createTeam());

        $this->jsonRequest('PUT', '/api/admin/club-requests/reject/'.$clubRequest->getId(), [], $admin);

        $this->assertJsonResponseStatus(200);
    }

    public function testRejectClubRequestRejectsUnknownRequest(): void
    {
        $this->jsonRequest('PUT', '/api/admin/club-requests/reject/00000000-0000-4000-8000-000000000000', [], $this->createAdmin());

        $this->assertJsonResponseStatus(404);
    }
}
