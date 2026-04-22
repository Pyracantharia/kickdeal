<?php

namespace App\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Security\Csrf\CsrfToken;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;

final class ApiCsrfTokenSubscriber implements EventSubscriberInterface
{
    private const string CSRF_TOKEN_ID = 'api_auth';

    public function __construct(private readonly CsrfTokenManagerInterface $csrfTokenManager)
    {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => ['validateApiAuthCsrfToken', 16],
        ];
    }

    public function validateApiAuthCsrfToken(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();

        if (!$this->requiresCsrfToken($request->attributes->getString('_route'), $request->getMethod())) {
            return;
        }

        $token = $request->headers->get('X-CSRF-TOKEN');

        if (!$token || !$this->csrfTokenManager->isTokenValid(new CsrfToken(self::CSRF_TOKEN_ID, $token))) {
            $event->setResponse(new JsonResponse([
                'errorMessage' => 'Token CSRF invalide.',
            ], 403));
        }
    }

    private function requiresCsrfToken(string $route, string $method): bool
    {
        return match ([$route, $method]) {
            ['app_register', 'POST'],
            ['app_login', 'POST'],
            ['app_logout', 'DELETE'],
            ['app_forgot_password', 'POST'],
            ['app_reset_password', 'PATCH'] => true,
            default => false,
        };
    }
}
