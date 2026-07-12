<?php

namespace App\Tests\Functional\Controller;

use App\Tests\Functional\Support\FunctionalTestCase;
use OTPHP\TOTP;

final class AccountControllerTest extends FunctionalTestCase
{
    public function testSecuritySucceeds(): void
    {
        $user = $this->createUser();

        $this->request('GET', '/api/account/security', $user);

        $this->assertJsonResponseStatus(200);
        self::assertArrayHasKey('twoFactorEnabled', $this->responseJson());
    }

    public function testSecurityRequiresAuthentication(): void
    {
        $this->request('GET', '/api/account/security');

        self::assertSame(401, $this->client->getResponse()->getStatusCode());
    }

    public function testPasswordSucceeds(): void
    {
        $user = $this->createUser(plainPassword: 'Password123!');

        $this->jsonRequest('PATCH', '/api/account/password', [
            'currentPassword' => 'Password123!',
            'newPassword' => 'Password456!',
            'newPasswordConfirm' => 'Password456!',
        ], $user);

        $this->assertJsonResponseStatus(200);
    }

    public function testPasswordRejectsInvalidCurrentPassword(): void
    {
        $user = $this->createUser(plainPassword: 'Password123!');

        $this->jsonRequest('PATCH', '/api/account/password', [
            'currentPassword' => 'wrong',
            'newPassword' => 'Password456!',
            'newPasswordConfirm' => 'Password456!',
        ], $user);

        $this->assertJsonResponseStatus(422);
    }

    public function testTwoFactorSetupSucceeds(): void
    {
        $user = $this->createUser();

        $this->jsonRequest('POST', '/api/account/2fa/setup', [], $user);

        $this->assertJsonResponseStatus(200);
        self::assertArrayHasKey('otpAuthUri', $this->responseJson());
    }

    public function testTwoFactorSetupRequiresAuthentication(): void
    {
        $this->jsonRequest('POST', '/api/account/2fa/setup');

        self::assertSame(401, $this->client->getResponse()->getStatusCode());
    }

    public function testTwoFactorConfirmSucceeds(): void
    {
        $user = $this->createUser();
        $secret = TOTP::generate()->getSecret();
        $user->setTwoFAPendingSecret($secret);
        $this->entityManager->flush();

        $this->jsonRequest('POST', '/api/account/2fa/confirm', [
            'code' => TOTP::createFromSecret($secret)->now(),
        ], $user);

        $this->assertJsonResponseStatus(200);
        self::assertTrue($this->responseJson()['twoFactorEnabled']);
    }

    public function testTwoFactorConfirmRejectsMissingSetup(): void
    {
        $user = $this->createUser();

        $this->jsonRequest('POST', '/api/account/2fa/confirm', ['code' => '000000'], $user);

        $this->assertJsonResponseStatus(400);
    }

    public function testTwoFactorDisableSucceeds(): void
    {
        $user = $this->createUser(plainPassword: 'Password123!');
        $user->setTwoFASecret(TOTP::generate()->getSecret());
        $user->setTwoFAEnabledAt(new \DateTimeImmutable());
        $this->entityManager->flush();

        $this->jsonRequest('DELETE', '/api/account/2fa', ['currentPassword' => 'Password123!'], $user);

        $this->assertJsonResponseStatus(200);
        self::assertFalse($this->responseJson()['twoFactorEnabled']);
    }

    public function testTwoFactorDisableRejectsInvalidPassword(): void
    {
        $user = $this->createUser(plainPassword: 'Password123!');

        $this->jsonRequest('DELETE', '/api/account/2fa', ['currentPassword' => 'wrong'], $user);

        $this->assertJsonResponseStatus(422);
    }
}
