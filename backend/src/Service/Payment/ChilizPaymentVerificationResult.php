<?php

namespace App\Service\Payment;

readonly class ChilizPaymentVerificationResult
{
    public function __construct(
        public string $txHash,
        public string $planType,
        public string $amountWei,
        public string $amountChz,
        public string $receiverAddress,
        public int $chainId,
    ) {
    }
}