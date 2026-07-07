<?php

namespace App\Tests\Functional\Controller;

use App\Tests\Functional\Support\FunctionalTestCase;

final class NotificationControllerTest extends FunctionalTestCase
{
    public function testListSucceeds(): void
    {
        $user = $this->createUser();
        $this->createNotification($user);

        $this->request('GET', '/api/notifications', $user);

        $this->assertJsonResponseStatus(200);
        self::assertArrayHasKey('notifications', $this->responseJson());
    }

    public function testListRequiresAuthentication(): void
    {
        $this->request('GET', '/api/notifications');

        self::assertSame(401, $this->client->getResponse()->getStatusCode());
    }

    public function testSummarySucceeds(): void
    {
        $this->request('GET', '/api/notifications/summary', $this->createUser());

        $this->assertJsonResponseStatus(200);
        self::assertArrayHasKey('summary', $this->responseJson());
    }

    public function testSummaryRequiresAuthentication(): void
    {
        $this->request('GET', '/api/notifications/summary');

        self::assertSame(401, $this->client->getResponse()->getStatusCode());
    }

    public function testMercureTokenSucceeds(): void
    {
        $this->request('GET', '/api/notifications/mercure-token', $this->createUser());

        $this->assertJsonResponseStatus(200);
        self::assertArrayHasKey('topic', $this->responseJson());
    }

    public function testMercureTokenRequiresAuthentication(): void
    {
        $this->request('GET', '/api/notifications/mercure-token');

        self::assertSame(401, $this->client->getResponse()->getStatusCode());
    }

    public function testMarkReadSucceeds(): void
    {
        $user = $this->createUser();
        $notification = $this->createNotification($user);

        $this->jsonRequest('PUT', '/api/notifications/'.$notification->getId().'/read', [], $user);

        $this->assertJsonResponseStatus(200);
        self::assertArrayHasKey('notification', $this->responseJson());
    }

    public function testMarkReadRejectsNotificationOwnedByAnotherUser(): void
    {
        $notification = $this->createNotification($this->createUser());

        $this->jsonRequest('PUT', '/api/notifications/'.$notification->getId().'/read', [], $this->createUser());

        $this->assertJsonResponseStatus(404);
    }

    public function testMarkAllReadSucceeds(): void
    {
        $user = $this->createUser();
        $this->createNotification($user);

        $this->jsonRequest('POST', '/api/notifications/read-all', [], $user);

        $this->assertJsonResponseStatus(200);
        self::assertArrayHasKey('summary', $this->responseJson());
    }

    public function testMarkAllReadRequiresAuthentication(): void
    {
        $this->jsonRequest('POST', '/api/notifications/read-all');

        self::assertSame(401, $this->client->getResponse()->getStatusCode());
    }
}
