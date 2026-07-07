<?php

namespace App\Tests\Functional\Controller;

use App\Tests\Functional\Support\FunctionalTestCase;

final class StripeWebhookControllerTest extends FunctionalTestCase
{
    public function testWebhookRejectsInvalidOrUnconfiguredRequest(): void
    {
        $this->jsonRequest('POST', '/api/webhooks/stripe', ['type' => 'ping']);

        self::assertContains($this->client->getResponse()->getStatusCode(), [400, 503]);
    }

    public function testWebhookRejectsUnsupportedMethod(): void
    {
        $this->request('GET', '/api/webhooks/stripe');

        self::assertSame(405, $this->client->getResponse()->getStatusCode());
    }
}
