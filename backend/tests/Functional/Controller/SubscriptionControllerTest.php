<?php

namespace App\Tests\Functional\Controller;

use App\Enum\SubscriptionPlanEnum;
use App\Entity\User;
use App\Tests\Functional\Support\FunctionalTestCase;

final class SubscriptionControllerTest extends FunctionalTestCase
{
    public function testMeSucceeds(): void
    {
        $this->request('GET', '/api/subscription/me', $this->createUser([User::ROLE_CLUB]));

        $this->assertJsonResponseStatus(200);
        self::assertArrayHasKey('subscription', $this->responseJson());
    }

    public function testMeRequiresAuthentication(): void
    {
        $this->request('GET', '/api/subscription/me');

        self::assertSame(401, $this->client->getResponse()->getStatusCode());
    }

    public function testSimulateUpgradeSucceeds(): void
    {
        $this->jsonRequest('POST', '/api/subscription/simulate-upgrade', [
            'targetPlan' => SubscriptionPlanEnum::CLUB_PRO->value,
        ], $this->createUser([User::ROLE_CLUB]));

        $this->assertJsonResponseStatus(200);
        self::assertArrayHasKey('subscription', $this->responseJson());
    }

    public function testSimulateUpgradeRejectsMismatchedPlan(): void
    {
        $this->jsonRequest('POST', '/api/subscription/simulate-upgrade', [
            'targetPlan' => SubscriptionPlanEnum::AGENT_PRO->value,
        ], $this->createUser([User::ROLE_CLUB]));

        $this->assertJsonResponseStatus(422);
    }

    public function testVerifyChilizPaymentRejectsInvalidPlan(): void
    {
        $this->jsonRequest('POST', '/api/subscription/payments/chiliz/verify', [
            'txHash' => '0xabc',
            'planType' => 'BAD',
        ], $this->createUser([User::ROLE_CLUB]));

        $this->assertJsonResponseStatus(422);
    }

    public function testVerifyChilizPaymentRequiresAuthentication(): void
    {
        $this->jsonRequest('POST', '/api/subscription/payments/chiliz/verify', []);

        self::assertSame(401, $this->client->getResponse()->getStatusCode());
    }

    public function testStartStripePaymentRejectsInvalidPlan(): void
    {
        $this->jsonRequest('POST', '/api/subscription/payments/stripe/start', [
            'targetPlan' => SubscriptionPlanEnum::CLUB_FREE->value,
        ], $this->createUser([User::ROLE_CLUB]));

        $this->assertJsonResponseStatus(422);
    }

    public function testStartStripePaymentRequiresAuthentication(): void
    {
        $this->jsonRequest('POST', '/api/subscription/payments/stripe/start', []);

        self::assertSame(401, $this->client->getResponse()->getStatusCode());
    }

    public function testCompleteStripePaymentRejectsInvalidSubscription(): void
    {
        $this->jsonRequest('POST', '/api/subscription/payments/stripe/complete', [
            'subscriptionId' => 'sub_missing',
        ], $this->createUser([User::ROLE_CLUB]));

        $this->assertJsonResponseStatus(422);
    }

    public function testCompleteStripePaymentRequiresAuthentication(): void
    {
        $this->jsonRequest('POST', '/api/subscription/payments/stripe/complete', []);

        self::assertSame(401, $this->client->getResponse()->getStatusCode());
    }
}
