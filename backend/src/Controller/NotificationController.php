<?php

namespace App\Controller;

use App\Entity\AppNotification;
use App\Entity\User;
use App\Repository\AppNotificationRepository;
use App\Service\MercureSubscriberTokenFactory;
use App\Service\Notification\NotificationService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Csrf\CsrfToken;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/notifications')]
final class NotificationController extends AbstractController
{
    private const string CSRF_TOKEN_ID = 'api_auth';

    #[Route('', name: 'api_notifications_list', methods: ['GET'])]
    public function list(
        Request $request,
        #[CurrentUser] ?User $user,
        AppNotificationRepository $notificationRepository,
        NotificationService $notificationService,
    ): JsonResponse {
        if (!$user instanceof User) {
            return $this->json(['errorMessage' => 'Utilisateur non authentifié.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        $limit = min(50, max(1, (int) $request->query->get('limit', 10)));
        $page = max(1, (int) $request->query->get('page', 1));
        $filter = (string) $request->query->get('filter', 'all');
        $total = $notificationRepository->countForUser($user, $filter);
        $totalPages = max(1, (int) ceil($total / $limit));
        $page = min($page, $totalPages);

        return $this->json([
            'notifications' => array_map(
                $notificationService->serialize(...),
                $notificationRepository->findForUser($user, $filter, $limit, ($page - 1) * $limit),
            ),
            'summary' => $notificationService->summary($user),
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'totalPages' => $totalPages,
                'hasPreviousPage' => $page > 1,
                'hasNextPage' => $page < $totalPages,
            ],
        ]);
    }

    #[Route('/summary', name: 'api_notifications_summary', methods: ['GET'])]
    public function summary(
        #[CurrentUser] ?User $user,
        NotificationService $notificationService,
    ): JsonResponse {
        if (!$user instanceof User) {
            return $this->json(['errorMessage' => 'Utilisateur non authentifié.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        return $this->json([
            'summary' => $notificationService->summary($user),
        ]);
    }

    #[Route('/mercure-token', name: 'api_notifications_mercure_token', methods: ['GET'])]
    public function mercureToken(
        #[CurrentUser] ?User $user,
        MercureSubscriberTokenFactory $tokenFactory,
        NotificationService $notificationService,
    ): JsonResponse {
        if (!$user instanceof User) {
            return $this->json(['errorMessage' => 'Utilisateur non authentifié.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        $topic = $notificationService->topicForUser($user);
        $token = $tokenFactory->create([$topic]);
        $response = $this->json([
            'hubUrl' => $this->getParameter('mercure_public_url'),
            'topic' => $topic,
        ]);

        $response->headers->setCookie(Cookie::create('mercureAuthorization')
            ->withValue($token)
            ->withPath('/.well-known/mercure')
            ->withSecure(false)
            ->withHttpOnly(true)
            ->withSameSite(Cookie::SAMESITE_LAX));

        return $response;
    }

    #[Route('/{id}/read', name: 'api_notifications_mark_read', methods: ['PUT', 'PATCH'])]
    public function markRead(
        AppNotification $notification,
        Request $request,
        #[CurrentUser] ?User $user,
        NotificationService $notificationService,
        CsrfTokenManagerInterface $csrfTokenManager,
    ): JsonResponse {
        if (!$user instanceof User) {
            return $this->json(['errorMessage' => 'Utilisateur non authentifié.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        if ($csrfError = $this->validateCsrfToken($request, $csrfTokenManager)) {
            return $csrfError;
        }

        if ($notification->getRecipient()?->getId()?->toRfc4122() !== $user->getId()?->toRfc4122()) {
            return $this->json(['errorMessage' => 'Notification introuvable.'], JsonResponse::HTTP_NOT_FOUND);
        }

        $notificationService->markRead($notification, $user);

        return $this->json([
            'notification' => $notificationService->serialize($notification),
            'summary' => $notificationService->summary($user),
        ]);
    }

    #[Route('/read-all', name: 'api_notifications_mark_all_read', methods: ['POST'])]
    public function markAllRead(
        Request $request,
        #[CurrentUser] ?User $user,
        NotificationService $notificationService,
        CsrfTokenManagerInterface $csrfTokenManager,
    ): JsonResponse {
        if (!$user instanceof User) {
            return $this->json(['errorMessage' => 'Utilisateur non authentifié.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        if ($csrfError = $this->validateCsrfToken($request, $csrfTokenManager)) {
            return $csrfError;
        }

        $notificationService->markAllRead($user);

        return $this->json([
            'summary' => $notificationService->summary($user),
        ]);
    }

    private function validateCsrfToken(Request $request, CsrfTokenManagerInterface $csrfTokenManager): ?JsonResponse
    {
        $token = $request->headers->get('X-CSRF-TOKEN');

        if (!$token || !$csrfTokenManager->isTokenValid(new CsrfToken(self::CSRF_TOKEN_ID, $token))) {
            return $this->json([
                'errorMessage' => 'Token CSRF invalide.',
            ], JsonResponse::HTTP_FORBIDDEN);
        }

        return null;
    }
}
