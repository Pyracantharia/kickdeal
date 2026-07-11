<?php

namespace App\EventSubscriber;

use App\Entity\User;
use App\Service\AdminAuditLogger;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;
use Symfony\Component\Security\Core\Authentication\Token\SwitchUserToken;

#[AsEventListener(event: KernelEvents::RESPONSE)]
final class SupportSessionAuditSubscriber
{
    public function __construct(private readonly TokenStorageInterface $tokens, private readonly AdminAuditLogger $audit) {}

    public function __invoke(ResponseEvent $event): void
    {
        if (!$event->isMainRequest() || !in_array($event->getRequest()->getMethod(), ['POST', 'PUT', 'PATCH', 'DELETE'], true)) return;
        $token = $this->tokens->getToken();
        if (!$token instanceof SwitchUserToken) return;
        $admin = $token->getOriginalToken()->getUser(); $user = $token->getUser();
        if (!$admin instanceof User || !$user instanceof User) return;
        $request = $event->getRequest();
        $this->audit->record($admin, 'support.action_performed', 'support', 'user', $user->getId()?->toRfc4122(), (string) $user->getEmail(), [], [], [
            'method' => $request->getMethod(), 'route' => $request->attributes->get('_route'), 'path' => $request->getPathInfo(), 'status' => $event->getResponse()->getStatusCode(), 'actingAs' => $user->getEmail(),
        ]);
    }
}
