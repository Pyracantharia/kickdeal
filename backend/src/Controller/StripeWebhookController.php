<?php

namespace App\Controller;

use App\Entity\User;
use App\Enum\SubscriptionPlanEnum;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Webhook;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

final class StripeWebhookController
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly LoggerInterface $logger,
        #[Autowire('%env(STRIPE_WEBHOOK_SECRET)%')]
        private readonly string $webhookSecret,
    ) {
    }

    #[Route('/api/webhooks/stripe', name: 'app_stripe_webhook', methods: ['POST'])]
    public function __invoke(Request $request): JsonResponse
    {
        if ('' === trim($this->webhookSecret)) {
            return new JsonResponse(['errorMessage' => 'Webhook Stripe non configuré.'], 503);
        }

        try {
            $event = Webhook::constructEvent(
                $request->getContent(),
                (string) $request->headers->get('Stripe-Signature'),
                $this->webhookSecret,
            );
        } catch (\UnexpectedValueException|SignatureVerificationException $exception) {
            $this->logger->warning('Webhook Stripe rejeté.', ['exception' => $exception]);

            return new JsonResponse(['errorMessage' => 'Signature Stripe invalide.'], 400);
        }

        if (!in_array($event->type, ['customer.subscription.updated', 'customer.subscription.deleted'], true)) {
            return new JsonResponse(['received' => true]);
        }

        $stripeSubscription = $event->data->object;
        $customerId = is_string($stripeSubscription->customer)
            ? $stripeSubscription->customer
            : $stripeSubscription->customer?->id;

        if (!$customerId) {
            return new JsonResponse(['received' => true]);
        }

        $user = $this->entityManager
            ->getRepository(User::class)
            ->findOneBy(['stripeCustomerId' => $customerId]);

        if (!$user instanceof User) {
            return new JsonResponse(['received' => true]);
        }

        $status = (string) $stripeSubscription->status;

        if (in_array($status, ['active', 'trialing'], true)) {
            $plan = SubscriptionPlanEnum::tryFrom((string) ($stripeSubscription->metadata->kickdeal_plan ?? ''));

            if ($plan && $plan->isAgentPlan() === $user->getSubscriptionPlan()->isAgentPlan()) {
                $user
                    ->setSubscriptionPlan($plan)
                    ->setStripeSubscriptionId($stripeSubscription->id);
            }
        }

        if (in_array($status, ['canceled', 'unpaid', 'incomplete_expired'], true)) {
            $user->setSubscriptionPlan(
                $user->getSubscriptionPlan()->isAgentPlan()
                    ? SubscriptionPlanEnum::AGENT_FREE
                    : SubscriptionPlanEnum::CLUB_FREE
            );

            $user->setStripeSubscriptionId(null);
        }

        $this->entityManager->flush();

        return new JsonResponse(['received' => true]);
    }
}
