<?php

namespace App\Tests\Functional\Controller;

use App\Entity\User;
use App\Tests\Functional\Support\FunctionalTestCase;

final class AuthControllerTest extends FunctionalTestCase
{
    public function testCsrfTokenSucceeds(): void
    {
        $this->request('GET', '/api/auth/csrf-token');

        $this->assertJsonResponseStatus(200);
        self::assertArrayHasKey('csrfToken', $this->responseJson());
    }

    public function testCsrfTokenRejectsUnsupportedMethod(): void
    {
        $this->request('POST', '/api/auth/csrf-token');

        self::assertSame(405, $this->client->getResponse()->getStatusCode());
    }

    public function testRegisterSucceeds(): void
    {
        $this->jsonRequest('POST', '/api/auth/register', [
            'firstName' => 'Ada',
            'lastName' => 'Lovelace',
            'email' => 'ada@example.test',
            'password' => 'Password123!',
            'confirmation' => 'Password123!',
            'roles' => [User::ROLE_CLUB],
        ]);

        $this->assertJsonResponseStatus(201);
        self::assertSame('ada@example.test', $this->responseJson()['user']['email']);
    }

    public function testRegisterRejectsInvalidPayload(): void
    {
        $this->jsonRequest('POST', '/api/auth/register', ['email' => 'bad@example.test']);

        $this->assertJsonResponseStatus(422);
    }

    public function testLoginSucceeds(): void
    {
        $user = $this->createUser(email: 'login@example.test', plainPassword: 'Password123!');

        $this->jsonRequest('POST', '/api/auth/login', [
            'email' => $user->getEmail(),
            'password' => 'Password123!',
        ]);

        $this->assertJsonResponseStatus(200);
        self::assertArrayHasKey('user', $this->responseJson());
    }

    public function testLoginRejectsInvalidCredentials(): void
    {
        $this->jsonRequest('POST', '/api/auth/login', [
            'email' => 'missing@example.test',
            'password' => 'wrong',
        ]);

        $this->assertJsonResponseStatus(401);
    }

    public function testMeSucceeds(): void
    {
        $user = $this->createUser();

        $this->request('GET', '/api/auth/me', $user);

        $this->assertJsonResponseStatus(200);
        self::assertSame($user->getEmail(), $this->responseJson()['email']);
    }

    public function testMeRequiresAuthentication(): void
    {
        $this->request('GET', '/api/auth/me');

        self::assertSame(401, $this->client->getResponse()->getStatusCode());
    }

    public function testSupportSessionUsesRelativeRedirects(): void
    {
        $admin = $this->createAdmin();
        $user = $this->createUser(email: 'assisted@example.test');

        $this->request('GET', '/api/auth/support-session?_switch_user='.rawurlencode((string) $user->getEmail()), $admin);

        self::assertSame(302, $this->client->getResponse()->getStatusCode());
        self::assertSame('/api/auth/support-session', $this->client->getResponse()->headers->get('location'));

        $this->client->followRedirect();
        $this->assertJsonResponseStatus(200);
        self::assertTrue($this->responseJson()['active']);

        $this->request('GET', '/api/auth/support-session?_switch_user=_exit');

        self::assertSame(302, $this->client->getResponse()->getStatusCode());
        self::assertSame('/api/auth/support-session', $this->client->getResponse()->headers->get('location'));
    }

    public function testLogoutSucceeds(): void
    {
        $user = $this->createUser();

        $this->jsonRequest('DELETE', '/api/auth/logout', [], $user);

        $this->assertJsonResponseStatus(200);
    }

    public function testLogoutRequiresAuthentication(): void
    {
        $this->jsonRequest('DELETE', '/api/auth/logout');

        self::assertSame(401, $this->client->getResponse()->getStatusCode());
    }

    public function testForgotPasswordSucceeds(): void
    {
        $user = $this->createUser(email: 'forgot@example.test');

        $this->jsonRequest('POST', '/api/auth/forgot-password', ['email' => $user->getEmail()]);

        $this->assertJsonResponseStatus(200);
        self::assertArrayHasKey('resetTokenString', $this->responseJson());
    }

    public function testForgotPasswordRejectsMissingEmail(): void
    {
        $this->jsonRequest('POST', '/api/auth/forgot-password', []);

        $this->assertJsonResponseStatus(400);
    }

    public function testResetPasswordSucceeds(): void
    {
        $user = $this->createUser(plainPassword: 'Password123!');
        $selector = str_repeat('a', 32);
        $verifier = password_hash('token', PASSWORD_DEFAULT);
        $user
            ->setResetTokenSelector($selector)
            ->setResetPasswordToken($verifier)
            ->setResetPasswordTokenExpiry(new \DateTime('+1 hour'));
        $this->entityManager->flush();

        $this->jsonRequest('PATCH', '/api/auth/reset-password?token='.rawurlencode($selector.$verifier), [
            'newPassword' => 'Password456!',
            'newPasswordConfirm' => 'Password456!',
        ]);

        $this->assertJsonResponseStatus(200);
    }

    public function testResetPasswordRejectsMissingToken(): void
    {
        $this->jsonRequest('PATCH', '/api/auth/reset-password', [
            'newPassword' => 'Password456!',
            'newPasswordConfirm' => 'Password456!',
        ]);

        $this->assertJsonResponseStatus(400);
    }
}
