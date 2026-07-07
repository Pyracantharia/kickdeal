<?php

namespace App\Tests\Functional\Controller;

use App\Tests\Functional\Support\FunctionalTestCase;

final class PublicFeedControllerTest extends FunctionalTestCase
{
    public function testIndexSucceeds(): void
    {
        $this->createPublicFeedPost();

        $this->request('GET', '/api/public-feed');

        $this->assertJsonResponseStatus(200);
        self::assertArrayHasKey('posts', $this->responseJson());
    }

    public function testIndexRejectsUnsupportedMethod(): void
    {
        $this->request('POST', '/api/public-feed');

        self::assertSame(405, $this->client->getResponse()->getStatusCode());
    }

    public function testFilterOptionsSucceeds(): void
    {
        $this->createTeam();

        $this->request('GET', '/api/public-feed/filters/options');

        $this->assertJsonResponseStatus(200);
        self::assertArrayHasKey('clubs', $this->responseJson());
    }

    public function testFilterOptionsRejectsUnsupportedMethod(): void
    {
        $this->request('POST', '/api/public-feed/filters/options');

        self::assertSame(405, $this->client->getResponse()->getStatusCode());
    }

    public function testShowSucceeds(): void
    {
        $post = $this->createPublicFeedPost();

        $this->request('GET', '/api/public-feed/'.$post->getId());

        $this->assertJsonResponseStatus(200);
        self::assertArrayHasKey('post', $this->responseJson());
    }

    public function testShowRejectsUnknownPost(): void
    {
        $this->request('GET', '/api/public-feed/00000000-0000-4000-8000-000000000000');

        self::assertSame(404, $this->client->getResponse()->getStatusCode());
    }
}
