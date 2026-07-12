<?php

namespace App\Controller;

use App\Entity\Agent;
use App\Entity\ClubRequest;
use App\Entity\Player;
use App\Entity\Transfer\TransferAgentInvitation;
use App\Entity\Transfer\TransferClubInvitation;
use App\Entity\User;
use App\Enum\SubscriptionPlanEnum;
use App\Repository\ClubRequestRepository;
use App\Repository\Transfer\TransferAgentInvitationRepository;
use App\Repository\Transfer\TransferClubInvitationRepository;
use App\Repository\UserRepository;
use App\Service\Contract\ContractNegotiationWorkflow;
use App\Service\Mail\TransactionalMailer;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use App\Service\Security\PasswordPolicy;
use App\Service\Security\TwoFactorAuthenticator;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Security\Csrf\CsrfToken;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;
use Symfony\Component\Security\Core\Authentication\Token\SwitchUserToken;
use Symfony\Component\Security\Core\Authentication\Token\UsernamePasswordToken;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/auth')]
final class AuthController extends AbstractController
{
    private const string CSRF_TOKEN_ID = 'api_auth';

    #[Route('/support-session', name: 'app_support_session', methods: ['GET'])]
    public function supportSession(Security $security, #[CurrentUser] ?User $user): JsonResponse
    {
        $token = $security->getToken();
        if (!$token instanceof SwitchUserToken || !$user instanceof User) {
            return $this->json(['active' => false, 'message' => 'Aucune session support active.']);
        }

        $original = $token->getOriginalToken()->getUser();
        return $this->json([
            'active' => true,
            'user' => ['id' => $user->getId()?->toRfc4122(), 'name' => trim((string) $user->getFirstName().' '.(string) $user->getLastName()), 'email' => $user->getEmail()],
            'admin' => $original instanceof User ? ['id' => $original->getId()?->toRfc4122(), 'name' => trim((string) $original->getFirstName().' '.(string) $original->getLastName()), 'email' => $original->getEmail()] : null,
        ]);
    }

    #[Route('/csrf-token', name: 'app_csrf_token', methods: ['GET'])]
    public function csrfToken(CsrfTokenManagerInterface $csrfTokenManager): JsonResponse
    {
        $response = $this->json([
            'csrfToken' => $csrfTokenManager->getToken(self::CSRF_TOKEN_ID)->getValue(),
        ]);

        $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        $response->headers->set('Pragma', 'no-cache');

        return $response;
    }

    #[Route('/register', name: 'app_register', methods: ['POST'])]
    public function store(
        Request $request,
        SerializerInterface $serializer,
        UserPasswordHasherInterface $passwordHasher,
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator,
        CsrfTokenManagerInterface $csrfTokenManager,
        PasswordPolicy $passwordPolicy,
        TransferAgentInvitationRepository $transferAgentInvitationRepository,
        TransferClubInvitationRepository $transferClubInvitationRepository,
        ClubRequestRepository $clubRequestRepository,
        ContractNegotiationWorkflow $contractNegotiationWorkflow,
        TokenStorageInterface $tokens,
    ): JsonResponse {
        if ($csrfError = $this->validateCsrfToken($request, $csrfTokenManager)) {
            return $csrfError;
        }

        $payload = json_decode($request->getContent(), true);

        if (!is_array($payload)) {
            return $this->json([
                'errorMessage' => 'Payload invalide.',
            ], 400);
        }

        $isGoogleSignup = true === ($payload['googleSignup'] ?? false);
        $googleProfile = null;

        if ($isGoogleSignup) {
            $storedGoogleProfile = $request->getSession()->get('google_register_profile');

            if (!is_array($storedGoogleProfile) || !is_string($storedGoogleProfile['sub'] ?? null) || !is_string($storedGoogleProfile['email'] ?? null)) {
                return $this->json([
                    'errorMessage' => 'Session Google expirée. Veuillez relancer l’inscription avec Google.',
                ], 422);
            }

            $googleProfile = $storedGoogleProfile;
            $payload['email'] = strtolower($googleProfile['email']);
            $payload['firstName'] = $this->requiredString($payload['firstName'] ?? null) ?? (string) ($googleProfile['firstName'] ?? '');
            $payload['lastName'] = $this->requiredString($payload['lastName'] ?? null) ?? (string) ($googleProfile['lastName'] ?? '');
            $payload['password'] = bin2hex(random_bytes(32));
        }

        $password = $payload['password'] ?? null;
        $passwordConfirmation = $payload['confirmation'] ?? null;

        if (!$isGoogleSignup && (!is_string($passwordConfirmation) || '' === $passwordConfirmation)) {
            return $this->json([
                'errors' => [
                    'confirmation' => 'La confirmation du mot de passe est requise.',
                ],
            ], 422);
        }

        if (!$isGoogleSignup && (!is_string($password) || $password !== $passwordConfirmation)) {
            return $this->json([
                'errors' => [
                    'confirmation' => 'Les mots de passe ne correspondent pas.',
                ],
            ], 422);
        }

        $userPayload = array_intersect_key($payload, array_flip([
            'firstName',
            'lastName',
            'email',
            'password',
            'roles',
            'subscriptionPlan',
        ]));
        $newUser = $serializer->deserialize(
            json_encode($userPayload, JSON_THROW_ON_ERROR),
            User::class,
            'json',
        );

        $isAgentAccount = in_array(User::ROLE_AGENT, $newUser->getRoles(), true);

        if ($isGoogleSignup && is_array($googleProfile)) {
            $expectedAgentAccount = 'agent' === ($googleProfile['accountType'] ?? null);

            if ($isAgentAccount !== $expectedAgentAccount) {
                return $this->json([
                    'errorMessage' => 'Le type de compte ne correspond pas à l’inscription Google démarrée.',
                ], 422);
            }

            $newUser->setGoogleId((string) $googleProfile['sub']);
        }

        if (isset($payload['subscriptionPlan'])) {
            $subscriptionPlan = is_string($payload['subscriptionPlan']) ? SubscriptionPlanEnum::tryFrom($payload['subscriptionPlan']) : null;

            if (!$subscriptionPlan instanceof SubscriptionPlanEnum) {
                return $this->json([
                    'errors' => [
                        'subscriptionPlan' => 'Plan invalide.',
                    ],
                ], 422);
            }

            if ($isAgentAccount !== $subscriptionPlan->isAgentPlan()) {
                return $this->json([
                    'errors' => [
                        'subscriptionPlan' => 'Ce plan ne correspond pas au type de compte.',
                    ],
                ], 422);
            }

            // Un plan payant ne peut être activé qu'après confirmation du paiement
            // côté Stripe ou Chiliz. L'inscription crée donc toujours un compte Free.
            $newUser->setSubscriptionPlan($subscriptionPlan->isAgentPlan()
                ? SubscriptionPlanEnum::AGENT_FREE
                : SubscriptionPlanEnum::CLUB_FREE);
        }

        $errors = $validator->validate($newUser);

        if (0 !== count($errors)) {
            $errorsArr = [];
            foreach ($errors as $error) {
                $errorsArr[$error->getPropertyPath()] = $error->getMessage();
            }

            return $this->json(['errors' => $errorsArr], 422);
        }

        if (!$isGoogleSignup && !$passwordPolicy->isValid($newUser->getPassword())) {
            return $this->json([
                'errors' => [
                    'password' => PasswordPolicy::MESSAGE,
                ],
            ], 422);
        }

        $hashedPassword = $passwordHasher->hashPassword($newUser, $newUser->getPassword());
        $newUser->setPassword($hashedPassword);
        $newUser->markPasswordChanged();

        try {
            $entityManager->persist($newUser);

            $agent = null;
            if (in_array(User::ROLE_AGENT, $newUser->getRoles(), true)) {
                $agent = (new Agent())
                    ->setUser($newUser)
                    ->setAgencyName($this->optionalString($payload['agencyName'] ?? null))
                    ->setCountry($this->optionalString($payload['country'] ?? null));

                $newUser->setAgentProfile($agent);
                $entityManager->persist($agent);
            }

            $invitationToken = $this->optionalString($payload['invitationToken'] ?? null);
            if ($agent instanceof Agent && null !== $invitationToken) {
                $invitation = $transferAgentInvitationRepository->findActiveByToken($invitationToken);
                $player = $invitation?->getTransferNegociation()?->getListing()?->getPlayer();

                if ($invitation instanceof TransferAgentInvitation && $player instanceof Player && null === $player->getAgent()) {
                    $player->setAgent($agent);
                    $invitation
                        ->setAcceptedBy($agent)
                        ->setAcceptedAt(new \DateTimeImmutable())
                        ->setUpdatedAt(new \DateTimeImmutable());
                    $contractNegotiationWorkflow->ensurePendingAgentNegotiationsForPlayer($player, $newUser);
                }
            }

            $clubInvitationToken = $this->optionalString($payload['clubInvitationToken'] ?? null);
            if (!$isAgentAccount && null !== $clubInvitationToken && in_array(User::ROLE_CLUB, $newUser->getRoles(), true)) {
                $invitation = $transferClubInvitationRepository->findActiveByToken($clubInvitationToken);
                $team = $invitation?->getSellerTeam();

                if ($invitation instanceof TransferClubInvitation && null !== $team && !$clubRequestRepository->hasPendingRequest($newUser, $team)) {
                    $clubRequest = (new ClubRequest())
                        ->setRequester($newUser)
                        ->setTeam($team)
                        ->setVerificationEmail($newUser->getEmail())
                        ->setVerificationMessage('Demande créée depuis une invitation liée à une offre de transfert KickDeal.');
                    $entityManager->persist($clubRequest);

                    $invitation
                        ->setAcceptedBy($newUser)
                        ->setAcceptedAt(new \DateTimeImmutable())
                        ->setUpdatedAt(new \DateTimeImmutable());
                }
            }

            $entityManager->flush();
            if ($isGoogleSignup) {
                $request->getSession()->remove('google_register_profile');
                $tokens->setToken(new UsernamePasswordToken($newUser, 'main', $newUser->getRoles()));
            }
        } catch (UniqueConstraintViolationException $exception) {
            return $this->json([
                'errors' => [
                    'email' => 'Utilisateur existant.',
                ],
            ], 409);
        }

        return $this->json([
            'message' => 'utilisateur créé avec succès.',
            'user' => $newUser,
        ], 201, [], ['groups' => 'user:read']);
    }

    private function optionalString(mixed $value): ?string
    {
        if (!is_string($value)) {
            return null;
        }

        $trimmedValue = trim($value);

        return '' === $trimmedValue ? null : $trimmedValue;
    }

    private function requiredString(mixed $value): ?string
    {
        if (!is_string($value)) {
            return null;
        }

        $trimmedValue = trim($value);

        return '' === $trimmedValue ? null : $trimmedValue;
    }

    #[Route('/login', name: 'app_login', methods: ['POST'])]
    public function login(
        Request $request,
        #[CurrentUser] ?User $user,
        CsrfTokenManagerInterface $csrfTokenManager,
        TwoFactorAuthenticator $twoFactorAuthenticator,
        TokenStorageInterface $tokenStorage,
    ): JsonResponse {
        if ($csrfError = $this->validateCsrfToken($request, $csrfTokenManager)) {
            return $csrfError;
        }

        if (null === $user) {
            return $this->json([
                'errorMessage' => 'Identifiants invalides.',
            ], 401);
        }

        if ($user->isBanned()) {
            $tokenStorage->setToken(null);

            if ($request->hasSession() && $request->getSession()->isStarted()) {
                $request->getSession()->invalidate();
            }

            return $this->json([
                'errorMessage' => sprintf(
                    'Votre compte est suspendu jusqu’au %s.',
                    $user->getBannedUntil()?->format('d/m/Y H:i'),
                ),
                'bannedUntil' => $user->getBannedUntil()?->format(DATE_ATOM),
            ], 403);
        }

        if ($user->isTwoFactorEnabled()) {
            $payload = json_decode($request->getContent(), true);
            $payload = is_array($payload) ? $payload : [];
            $twoFactorCode = $payload['twoFactorCode'] ?? null;
            $twoFactorSecret = $user->getTwoFASecret();

            if (null === $twoFactorSecret || !$twoFactorAuthenticator->verify($twoFactorSecret, $twoFactorCode)) {
                $tokenStorage->setToken(null);

                if ($request->hasSession() && $request->getSession()->isStarted()) {
                    $request->getSession()->invalidate();
                }

                if (!is_string($twoFactorCode) || '' === trim($twoFactorCode)) {
                    return $this->json([
                        'requiresTwoFactor' => true,
                        'message' => 'Code 2FA requis.',
                    ], 202);
                }

                return $this->json([
                    'requiresTwoFactor' => true,
                    'errors' => [
                        'twoFactorCode' => 'Code 2FA invalide.',
                    ],
                ], 401);
            }
        }

        return $this->json([
            'message' => 'Connexion réussie',
            'user' => $user,
        ], 200, [], ['groups' => 'user:read']);
    }

    #[Route('/me', name: 'app_me', methods: ['GET'])]
    public function me(#[CurrentUser] ?User $user): JsonResponse
    {
        return $this->json($user, 200, [], ['groups' => 'user:read']);
    }

    #[Route('/logout', name: 'app_logout', methods: ['DELETE'])]
    public function logout(
        Request $request,
        Security $security,
        #[CurrentUser] ?User $user,
        CsrfTokenManagerInterface $csrfTokenManager,
    ): JsonResponse
    {
        if ($csrfError = $this->validateCsrfToken($request, $csrfTokenManager)) {
            return $csrfError;
        }

        $security->logout(false);

        if ($request->hasSession() && $request->getSession()->isStarted()) {
            $request->getSession()->invalidate();
        }

        return $this->json([
            'message' => 'Déconnexion réussie.',
        ]);
    }

    #[Route('/forgot-password', name: 'app_forgot_password', methods: ['POST'])]
    public function forgetPassword(
        Request $request,
        UserRepository $userRepository,
        EntityManagerInterface $entityManager,
        TransactionalMailer $transactionalMailer,
        CsrfTokenManagerInterface $csrfTokenManager,
    ): JsonResponse {
        if ($csrfError = $this->validateCsrfToken($request, $csrfTokenManager)) {
            return $csrfError;
        }

        $data = json_decode($request->getContent(), true);
        $data = is_array($data) ? $data : [];
        $email = $data['email'] ?? null;

        if (!$email) {
            return $this->json([
                'errorMessage' => 'Email requis.',
            ], 400);
        }

        $user = $userRepository->findOneBy(['email' => $email]);

        if (!$user) {
            return $this->json([
                'errorMessage' => 'Aucun utilisateur trouvé avec cet email.',
            ], 404);
        }

        $tokenSelector = bin2hex(random_bytes(16));
        $token = bin2hex(random_bytes(32));
        $hashedToken = password_hash($token, \PASSWORD_DEFAULT);

        $user->setResetTokenSelector($tokenSelector);
        $user->setResetPasswordToken($hashedToken);
        $user->setResetPasswordTokenExpiry(new \DateTime('+1 hour'));
        $entityManager->persist($user);
        $entityManager->flush();

        $frontendUrl = $this->getParameter('frontend_url');
        $resetTokenString = $tokenSelector.$hashedToken;
        $resetLink = "{$frontendUrl}/auth/reset-password?token=".rawurlencode($resetTokenString);

        $mailResult = $transactionalMailer->sendResetPasswordEmail($email, $resetLink);

        if (!$mailResult['success']) {
            return $this->json([
                'message' => "Une erreur est survenue lors de l'envoie de mail",
                'error' => $mailResult['message'],
            ], 500);
        }

        return $this->json([
            'message' => 'Si un compte avec cet email existe, un lien de réinitialisation du mot de passe a été envoyé.',
            'resetTokenString' => $resetTokenString,
        ], 200);
    }

    #[Route('/reset-password', name: 'app_reset_password', methods: ['PATCH'])]
    public function resetPassword(
        Request $request,
        UserRepository $userRepository,
        UserPasswordHasherInterface $passwordHasher,
        EntityManagerInterface $entityManager,
        CsrfTokenManagerInterface $csrfTokenManager,
        PasswordPolicy $passwordPolicy,
    ): JsonResponse
    {
        if ($csrfError = $this->validateCsrfToken($request, $csrfTokenManager)) {
            return $csrfError;
        }

        $data = json_decode($request->getContent(), true);
        $resetTokenString = $request->query->get('token');
        $newPassword = $data['newPassword'] ?? null;
        $newPasswordConfirm = $data['newPasswordConfirm'] ?? null;

        if (!$resetTokenString || !$newPassword || !$newPasswordConfirm) {
            return $this->json([
                'errorMessage' => 'Token et nouveau mot de passe requis.',
            ], 400);
        }

        $selector = substr($resetTokenString, 0, 32); // 16 octets * 2 (hex)
        $verifier = substr($resetTokenString, 32);

        if ($newPassword !== $newPasswordConfirm) {
            return $this->json([
                'errorMessage' => 'Les mots de passe ne correspondent pas.',
            ], 400);
        }

        if (!$passwordPolicy->isValid($newPassword)) {
            return $this->json([
                'errors' => [
                    'newPassword' => PasswordPolicy::MESSAGE,
                ],
            ], 422);
        }

        $user = $userRepository->findOneBy(['resetTokenSelector' => $selector]);

        if (!$user || $user->getResetPasswordTokenExpiry() < new \DateTime()) {
            return $this->json([
                'errorMessage' => 'Token invalide ou expiré.',
            ], 400);
        }

        if ($passwordHasher->isPasswordValid($user, $newPassword)) {
            return $this->json([
                'errors' => [
                    'newPassword' => 'Le nouveau mot de passe doit etre different de l ancien.',
                ],
            ], 422);
        }

        if (!hash_equals($verifier, $user->getResetPasswordToken())) {
            return $this->json([
                'errorMessage' => 'Token invalide.',
                'verifer' => $verifier,
            ], 400);
        }

        $hashedPassword = $passwordHasher->hashPassword($user, $newPassword);
        $user->setPassword($hashedPassword);
        $user->markPasswordChanged();
        $user->setResetPasswordToken(null);
        $user->setResetPasswordTokenExpiry(null);
        $entityManager->persist($user);
        $entityManager->flush();

        return $this->json([
            'message' => 'Mot de passe réinitialisé avec succès.',
        ]);
    }

    private function validateCsrfToken(Request $request, CsrfTokenManagerInterface $csrfTokenManager): ?JsonResponse
    {
        if ('test' === $this->getParameter('kernel.environment')) {
            return null;
        }

        $token = $request->headers->get('X-CSRF-TOKEN');

        if (!$token || !$csrfTokenManager->isTokenValid(new CsrfToken(self::CSRF_TOKEN_ID, $token))) {
            return $this->json([
                'errorMessage' => 'Token CSRF invalide.',
            ], 403);
        }

        return null;
    }

}
