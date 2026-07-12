<?php

namespace App\Tests\Functional\Controller;

use App\Tests\Functional\Support\FunctionalTestCase;
use Symfony\Component\Uid\Uuid;

final class TestControllerTest extends FunctionalTestCase
{
    public function testIndexSucceeds(): void
    {
        $this->request('GET', '/api');

        $this->assertJsonResponseStatus(200);
        self::assertArrayHasKey('message', $this->responseJson());
    }

    public function testIndexRejectsUnsupportedMethod(): void
    {
        $this->request('POST', '/api');

        self::assertSame(405, $this->client->getResponse()->getStatusCode());
    }

    public function testShowSucceeds(): void
    {
        $id = Uuid::v6()->toRfc4122();

        $this->request('GET', '/api/param/'.$id);

        $this->assertJsonResponseStatus(200);
        self::assertSame($id, $this->responseJson()['id']);
    }
}
