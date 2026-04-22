<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Security\Csrf\CsrfToken;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/auth')]
final class AuthController extends AbstractController
{
    private const string CSRF_TOKEN_ID = 'api_auth';

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
    ): JsonResponse {
        if ($csrfError = $this->validateCsrfToken($request, $csrfTokenManager)) {
            return $csrfError;
        }

        $newUser = $serializer->deserialize($request->getContent(), User::class, 'json');

        $errors = $validator->validate($newUser);

        if (0 !== \count($errors)) {
            $errorsArr = [];
            foreach ($errors as $error) {
                $errorsArr[$error->getPropertyPath()] = $error->getMessage();
            }

            return $this->json(['errors' => $errorsArr], 422);
        }

        $hashedPassword = $passwordHasher->hashPassword($newUser, $newUser->getPassword());
        $newUser->setPassword($hashedPassword);
        try {
            $entityManager->persist($newUser);
            $entityManager->flush();
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

    #[Route('/login', name: 'app_login', methods: ['POST'])]
    public function login(
        Request $request,
        #[CurrentUser] ?User $user,
        CsrfTokenManagerInterface $csrfTokenManager,
    ): JsonResponse
    {
        if ($csrfError = $this->validateCsrfToken($request, $csrfTokenManager)) {
            return $csrfError;
        }

        if (null === $user) {
            return $this->json([
                'errorMessage' => 'Identifiants invalides.',
            ], 401);
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
        MailerInterface $mailer,
        CsrfTokenManagerInterface $csrfTokenManager,
    ): JsonResponse {
        if ($csrfError = $this->validateCsrfToken($request, $csrfTokenManager)) {
            return $csrfError;
        }

        $data = json_decode($request->getContent(), true);
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
        $resetLink = "{$frontendUrl}/auth/reset-password?token={$resetTokenString}";

        $mailResult = $this->sendResetPasswordEmail($email, $resetLink, $mailer);

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

        $user = $userRepository->findOneBy(['resetTokenSelector' => $selector]);

        if (!$user || $user->getResetPasswordTokenExpiry() < new \DateTime()) {
            return $this->json([
                'errorMessage' => 'Token invalide ou expiré.',
            ], 400);
        }

        if (!hash_equals($verifier, $user->getResetPasswordToken())) {
            return $this->json([
                'errorMessage' => 'Token invalide.',
                'verifer' => $verifier,
            ], 400);
        }

        $hashedPassword = $passwordHasher->hashPassword($user, $newPassword);
        $user->setPassword($hashedPassword);
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
        $token = $request->headers->get('X-CSRF-TOKEN');

        if (!$token || !$csrfTokenManager->isTokenValid(new CsrfToken(self::CSRF_TOKEN_ID, $token))) {
            return $this->json([
                'errorMessage' => 'Token CSRF invalide.',
            ], 403);
        }

        return null;
    }

    public function sendResetPasswordEmail(string $email, string $resetLink, MailerInterface $mailer): array
    {
        $email = (new Email())
            ->from('kickdeal@no-reply.com')
            ->to($email)
            ->subject('Réinitialisation de mot de passe')
            ->html("<p>CLiquez <a href={$resetLink}>ici<a> pour réinitialiser votre mot de passe</p>");

        try {
            $mailer->send($email);

            return ['success' => true];
        } catch (\Exception $exception) {
            return [
                'success' => false,
                'message' => $exception->getMessage(),
            ];
        }
    }
}