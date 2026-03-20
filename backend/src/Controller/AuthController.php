<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/auth')]
final class AuthController extends AbstractController
{
    #[Route('/register', name: 'app_register', methods: ['POST'])]
    public function store(
        Request $request,
        SerializerInterface $serializer,
        UserPasswordHasherInterface $passwordHasher,
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator,
    ): JsonResponse {
        $newUser = $serializer->deserialize($request->getContent(), User::class, 'json');

        $errors = $validator->validate($newUser);

        if (0 !== \count($errors)) {
            $errorsArr = [];
            foreach ($errors as $error) {
                $errorsArr[$error->getPropertyPath()] = $error->getMessage();
            }

            return $this->json(['errors' => $errorsArr]);
        }

        $hashedPassword = $passwordHasher->hashPassword($newUser, $newUser->getPassword());
        $newUser->setPassword($hashedPassword);
        $entityManager->persist($newUser);
        $entityManager->flush();

        return $this->json([
            'message' => 'utilisateur créé avec succès.',
            'user' => $newUser,
        ]);
    }

    #[Route('/login', name: 'app_login', methods: ['POST'])]
    public function login(#[CurrentUser] ?User $user): JsonResponse
    {
        if (null === $user) {
            return $this->json([
                'errorMessage' => 'Identifiants invalides.',
            ], 401);
        }

        return $this->json([
            'message' => 'Connexion réussie',
            'user' => $user,
        ]);
    }

    #[Route('/me', name: 'app_me', methods: ['GET'])]
    public function me(#[CurrentUser] ?User $user): JsonResponse
    {
        return $this->json($user, 200, [], ['groups' => 'user:read']);
    }

    #[Route('/logout', name: 'app_logout', methods: ['DELETE'])]
    public function logout(Security $security): JsonResponse
    {
        $security->logout(false);

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
    ): JsonResponse {
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
    public function resetPassword(Request $request, UserRepository $userRepository, UserPasswordHasherInterface $passwordHasher, EntityManagerInterface $entityManager): JsonResponse
    {
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
