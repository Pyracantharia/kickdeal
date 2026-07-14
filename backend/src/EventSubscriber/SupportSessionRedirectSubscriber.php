<?php

namespace App\EventSubscriber;

use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

#[AsEventListener(event: KernelEvents::RESPONSE)]
final class SupportSessionRedirectSubscriber
{
    private const string SUPPORT_SESSION_PATH = '/api/auth/support-session';

    public function __invoke(ResponseEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        $response = $event->getResponse();

        if (self::SUPPORT_SESSION_PATH !== $request->getPathInfo() || !$response instanceof RedirectResponse) {
            return;
        }

        $target = $request->getBaseUrl().$request->getPathInfo();
        if ($query = $request->getQueryString()) {
            $target .= '?'.$query;
        }

        $response->setTargetUrl($target);
    }
}
