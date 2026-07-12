<?php

namespace App\Controller;

use App\Entity\User;
use App\Service\Security\PasswordPolicy;
use App\Service\Security\TwoFactorAuthenticator;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/account')]
final class AccountController extends AbstractController
{
    #[Route('/security', name: 'app_account_security', methods: ['GET'])]
    public function security(#[CurrentUser] User $user): JsonResponse
    {
        return $this->json([
            'twoFactorEnabled' => $user->isTwoFactorEnabled(),
        ]);
    }

    #[Route('/password', name: 'app_account_password', methods: ['PATCH'])]
    public function changePassword(
        Request $request,
        #[CurrentUser] User $user,
        UserPasswordHasherInterface $passwordHasher,
        PasswordPolicy $passwordPolicy,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        $payload = $this->decodePayload($request);
        $currentPassword = $payload['currentPassword'] ?? null;
        $newPassword = $payload['newPassword'] ?? null;
        $newPasswordConfirm = $payload['newPasswordConfirm'] ?? null;

        if (!is_string($currentPassword) || '' === $currentPassword) {
            return $this->json(['errors' => ['currentPassword' => 'Le mot de passe actuel est requis.']], 422);
        }

        if (!$passwordHasher->isPasswordValid($user, $currentPassword)) {
            return $this->json(['errors' => ['currentPassword' => 'Mot de passe actuel invalide.']], 422);
        }

        if (!is_string($newPassword) || $newPassword !== $newPasswordConfirm) {
            return $this->json(['errors' => ['newPasswordConfirm' => 'Les mots de passe ne correspondent pas.']], 422);
        }

        if ($passwordHasher->isPasswordValid($user, $newPassword)) {
            return $this->json(['errors' => ['newPassword' => 'Le nouveau mot de passe doit etre different de l ancien.']], 422);
        }

        if (!$passwordPolicy->isValid($newPassword)) {
            return $this->json(['errors' => ['newPassword' => PasswordPolicy::MESSAGE]], 422);
        }

        $user->setPassword($passwordHasher->hashPassword($user, $newPassword));
        $user->markPasswordChanged();
        $entityManager->flush();

        return $this->json(['message' => 'Mot de passe modifie avec succes.']);
    }

    #[Route('/2fa/setup', name: 'app_account_2fa_setup', methods: ['POST'])]
    public function setupTwoFactor(
        #[CurrentUser] User $user,
        TwoFactorAuthenticator $twoFactorAuthenticator,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        $secret = $twoFactorAuthenticator->createSecret();
        $user->setTwoFAPendingSecret($secret);
        $entityManager->flush();

        $provisioningUri = $twoFactorAuthenticator->getProvisioningUri($user, $secret);

        return $this->json([
            'otpAuthUri' => $provisioningUri,
            'qrCodeSvg' => $twoFactorAuthenticator->getQrCodeSvg($provisioningUri),
        ]);
    }

    #[Route('/2fa/confirm', name: 'app_account_2fa_confirm', methods: ['POST'])]
    public function confirmTwoFactor(
        Request $request,
        #[CurrentUser] User $user,
        TwoFactorAuthenticator $twoFactorAuthenticator,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        $secret = $user->getTwoFAPendingSecret();

        if (null === $secret) {
            return $this->json(['errorMessage' => 'Aucune activation 2FA en attente.'], 400);
        }

        $payload = $this->decodePayload($request);

        if (!$twoFactorAuthenticator->verify($secret, $payload['code'] ?? null)) {
            return $this->json(['errors' => ['code' => 'Code de verification invalide.']], 422);
        }

        $user->setTwoFASecret($secret);
        $user->setTwoFAPendingSecret(null);
        $user->setTwoFAEnabledAt(new \DateTimeImmutable());
        $entityManager->flush();

        return $this->json([
            'message' => 'Authentification a deux facteurs activee.',
            'twoFactorEnabled' => true,
        ]);
    }

    #[Route('/2fa', name: 'app_account_2fa_disable', methods: ['DELETE'])]
    public function disableTwoFactor(
        Request $request,
        #[CurrentUser] User $user,
        UserPasswordHasherInterface $passwordHasher,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        $payload = $this->decodePayload($request);
        $currentPassword = $payload['currentPassword'] ?? null;

        if (!is_string($currentPassword) || !$passwordHasher->isPasswordValid($user, $currentPassword)) {
            return $this->json(['errors' => ['currentPassword' => 'Mot de passe actuel invalide.']], 422);
        }

        $user->setTwoFASecret(null);
        $user->setTwoFAPendingSecret(null);
        $user->setTwoFAEnabledAt(null);
        $entityManager->flush();

        return $this->json([
            'message' => 'Authentification a deux facteurs desactivee.',
            'twoFactorEnabled' => false,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function decodePayload(Request $request): array
    {
        $payload = json_decode($request->getContent(), true);

        return is_array($payload) ? $payload : [];
    }
}
