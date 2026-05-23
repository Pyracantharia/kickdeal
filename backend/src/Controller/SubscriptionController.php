<?php

namespace App\Controller;

use App\Entity\Payment;
use App\Entity\User;
use App\Enum\PaymentProviderEnum;
use App\Enum\PaymentStatusEnum;
use App\Enum\SubscriptionPlanEnum;
use App\Repository\PaymentRepository;
use App\Service\Payment\ChilizPaymentVerifier;
use App\Service\Subscription\SubscriptionLimits;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Exception\BadRequestException;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/subscription')]
final class SubscriptionController extends AbstractController
{
    #[Route('/me', name: 'app_subscription_me', methods: ['GET'])]
    public function me(
        #[CurrentUser] ?User $user,
        SubscriptionLimits $subscriptionLimits,
    ): JsonResponse {
        if (!$user) {
            return $this->json(['errorMessage' => 'Utilisateur non authentifié.'], 401);
        }

        return $this->json([
            'subscription' => $subscriptionLimits->getSummary($user),
        ]);
    }

    #[Route('/simulate-upgrade', name: 'app_subscription_simulate_upgrade', methods: ['POST'])]
    public function simulateUpgrade(
        Request $request,
        #[CurrentUser] ?User $user,
        SubscriptionLimits $subscriptionLimits,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        if (!$user) {
            return $this->json(['errorMessage' => 'Utilisateur non authentifié.'], 401);
        }

        $payload = json_decode($request->getContent(), true);
        $targetPlanValue = is_array($payload) ? ($payload['targetPlan'] ?? null) : null;
        $targetPlan = is_string($targetPlanValue) ? SubscriptionPlanEnum::tryFrom($targetPlanValue) : null;

        if (!$targetPlan instanceof SubscriptionPlanEnum) {
            $targetPlan = $user->getSubscriptionPlan()->proPlan();
        }

        if ($user->getSubscriptionPlan()->isAgentPlan() !== $targetPlan->isAgentPlan()) {
            return $this->json(['errorMessage' => 'Ce plan ne correspond pas au type de compte.'], 422);
        }

        $user->setSubscriptionPlan($targetPlan);
        $entityManager->flush();

        return $this->json([
            'message' => 'Upgrade simulé. Paiement bientôt disponible.',
            'subscription' => $subscriptionLimits->getSummary($user),
        ]);
    }

    #[Route('/payments/chiliz/verify', name: 'app_subscription_payment_chiliz_verify', methods: ['POST'])]
    public function verifyChilizPayment(
        Request $request,
        #[CurrentUser] ?User $user,
        ChilizPaymentVerifier $chilizPaymentVerifier,
        PaymentRepository $paymentRepository,
        SubscriptionLimits $subscriptionLimits,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        if (!$user) {
            return $this->json(['errorMessage' => 'Utilisateur non authentifié.'], 401);
        }

        $payload = json_decode($request->getContent(), true);

        if (!is_array($payload)) {
            return $this->json(['errorMessage' => 'Payload invalide.'], 400);
        }

        $txHash = is_string($payload['txHash'] ?? null) ? $payload['txHash'] : '';
        $planType = is_string($payload['planType'] ?? null) ? strtoupper($payload['planType']) : '';
        $targetPlan = match ($planType) {
            'PRO' => SubscriptionPlanEnum::CLUB_PRO,
            'ENTERPRISE' => SubscriptionPlanEnum::CLUB_ENTERPRISE,
            default => null,
        };

        if (!$targetPlan instanceof SubscriptionPlanEnum) {
            return $this->json(['errorMessage' => 'Plan de paiement invalide.'], 422);
        }

        if ($user->getSubscriptionPlan()->isAgentPlan()) {
            return $this->json(['errorMessage' => 'Le paiement CHZ est disponible uniquement pour les clubs.'], 422);
        }

        if ($paymentRepository->findOneByTxHash($txHash) instanceof Payment) {
            return $this->json(['errorMessage' => 'Cette transaction a déjà été utilisée.'], 409);
        }

        try {
            $verification = $chilizPaymentVerifier->verify($txHash, $planType);
        } catch (BadRequestException $exception) {
            return $this->json(['errorMessage' => $exception->getMessage()], 422);
        }

        $payment = (new Payment())
            ->setUser($user)
            ->setProvider(PaymentProviderEnum::CHILIZ)
            ->setTxHash($verification->txHash)
            ->setPlanType($verification->planType)
            ->setAmountWei($verification->amountWei)
            ->setAmountChz($verification->amountChz)
            ->setReceiverAddress($verification->receiverAddress)
            ->setChainId($verification->chainId)
            ->setStatus(PaymentStatusEnum::CONFIRMED)
            ->setConfirmedAt(new \DateTimeImmutable());

        $user->setSubscriptionPlan($targetPlan);

        try {
            $entityManager->persist($payment);
            $entityManager->flush();
        } catch (UniqueConstraintViolationException) {
            return $this->json(['errorMessage' => 'Cette transaction a déjà été utilisée.'], 409);
        }

        return $this->json([
            'payment' => [
                'id' => $payment->getId()?->toRfc4122(),
                'provider' => $payment->getProvider()->value,
                'txHash' => $payment->getTxHash(),
                'planType' => $payment->getPlanType(),
                'amountChz' => $payment->getAmountChz(),
                'status' => $payment->getStatus()->value,
                'confirmedAt' => $payment->getConfirmedAt()?->format(\DateTimeInterface::ATOM),
            ],
            'subscription' => $subscriptionLimits->getSummary($user),
        ]);
    }
}