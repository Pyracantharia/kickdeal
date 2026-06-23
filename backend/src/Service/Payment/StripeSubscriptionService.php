<?php

namespace App\Service\Payment;

use App\Entity\User;
use App\Enum\SubscriptionPlanEnum;
use Stripe\StripeClient;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

final class StripeSubscriptionService
{
    private StripeClient $stripe;

    /** @var array<string, string> */
    private array $priceIds;

    public function __construct(
        #[Autowire('%env(STRIPE_SECRET_KEY)%')] string $secretKey,
        #[Autowire('%env(STRIPE_PRICE_AGENT_PRO)%')] string $agentProPriceId,
        #[Autowire('%env(STRIPE_PRICE_CLUB_PRO)%')] string $clubProPriceId,
        #[Autowire('%env(STRIPE_PRICE_CLUB_ENTERPRISE)%')] string $clubEnterprisePriceId,
    ) {
        if ('' === trim($secretKey)) {
            throw new \LogicException('Stripe n’est pas configuré côté serveur.');
        }

        $this->stripe = new StripeClient($secretKey);
        $this->priceIds = [
            SubscriptionPlanEnum::AGENT_PRO->value => $agentProPriceId,
            SubscriptionPlanEnum::CLUB_PRO->value => $clubProPriceId,
            SubscriptionPlanEnum::CLUB_ENTERPRISE->value => $clubEnterprisePriceId,
        ];
    }

    /** @return array{clientSecret: string, subscriptionId: string} */
    public function start(User $user, SubscriptionPlanEnum $plan): array
    {
        $priceId = $this->priceIds[$plan->value] ?? '';
        if (!str_starts_with($priceId, 'price_')) {
            throw new BadRequestHttpException('Ce plan Stripe doit contenir un identifiant de tarif récurrent (price_...), et non un produit (prod_...).');
        }

        $customerId = $user->getStripeCustomerId();
        if (!$customerId) {
            $customer = $this->stripe->customers->create([
                'email' => $user->getEmail(),
                'name' => trim(sprintf('%s %s', $user->getFirstName(), $user->getLastName())),
                'metadata' => ['kickdeal_user_id' => $user->getId()?->toRfc4122() ?? ''],
            ]);
            $customerId = $customer->id;
            $user->setStripeCustomerId($customerId);
        }

        $metadata = ['kickdeal_plan' => $plan->value, 'kickdeal_user_id' => $user->getId()?->toRfc4122() ?? ''];
        $subscription = null;

        if ($user->getStripeSubscriptionId()) {
            $existingSubscription = $this->stripe->subscriptions->retrieve($user->getStripeSubscriptionId(), []);
            if (!in_array($existingSubscription->status, ['canceled', 'incomplete_expired'], true) && isset($existingSubscription->items->data[0])) {
                $subscription = $this->stripe->subscriptions->update($existingSubscription->id, [
                    'items' => [['id' => $existingSubscription->items->data[0]->id, 'price' => $priceId]],
                    'payment_behavior' => 'default_incomplete',
                    'proration_behavior' => 'always_invoice',
                    'metadata' => $metadata,
                    'expand' => ['latest_invoice.confirmation_secret'],
                ]);
            }
        }

        $subscription ??= $this->stripe->subscriptions->create([
            'customer' => $customerId,
            'items' => [['price' => $priceId]],
            'payment_behavior' => 'default_incomplete',
            'payment_settings' => ['save_default_payment_method' => 'on_subscription'],
            'metadata' => $metadata,
            'expand' => ['latest_invoice.confirmation_secret'],
        ]);

        $invoice = $subscription->latest_invoice;
        if (is_string($invoice)) {
            $invoice = $this->stripe->invoices->retrieve($invoice, ['expand' => ['confirmation_secret', 'payment_intent']]);
        }

        $confirmationSecret = is_object($invoice) ? $invoice->confirmation_secret : null;
        if (is_object($confirmationSecret) && is_string($confirmationSecret->client_secret)) {
            $user->setStripeSubscriptionId($subscription->id);

            return ['clientSecret' => $confirmationSecret->client_secret, 'subscriptionId' => $subscription->id];
        }

        // Compatibilité avec les anciennes versions de l’API Stripe qui exposent directement le PaymentIntent.
        $paymentIntent = is_object($invoice) ? $invoice->payment_intent : null;
        if (is_string($paymentIntent)) {
            $paymentIntent = $this->stripe->paymentIntents->retrieve($paymentIntent, []);
        }
        if (!is_object($paymentIntent) || !is_string($paymentIntent->client_secret)) {
            throw new \RuntimeException('Stripe n’a pas créé de moyen de paiement pour cet abonnement.');
        }

        $user->setStripeSubscriptionId($subscription->id);

        return ['clientSecret' => $paymentIntent->client_secret, 'subscriptionId' => $subscription->id];
    }

    public function retrieveSubscription(string $subscriptionId): \Stripe\Subscription
    {
        return $this->stripe->subscriptions->retrieve($subscriptionId, []);
    }
}
