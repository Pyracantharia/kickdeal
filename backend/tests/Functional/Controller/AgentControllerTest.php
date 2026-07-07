<?php

namespace App\Tests\Functional\Controller;

use App\Tests\Functional\Support\FunctionalTestCase;

final class AgentControllerTest extends FunctionalTestCase
{
    public function testIndexSucceeds(): void
    {
        $this->request('GET', '/agent');

        $this->assertJsonResponseStatus(200);
        self::assertArrayHasKey('message', $this->responseJson());
    }

    public function testIndexRejectsUnknownRouteVariant(): void
    {
        $this->request('GET', '/agent/missing');

        self::assertSame(404, $this->client->getResponse()->getStatusCode());
    }
}
