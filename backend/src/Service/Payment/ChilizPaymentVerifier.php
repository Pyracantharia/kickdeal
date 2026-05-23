<?php

namespace App\Service\Payment;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\Exception\BadRequestException;
use Symfony\Contracts\HttpClient\HttpClientInterface;

class ChilizPaymentVerifier
{
    private const string PLAN_PRO = 'PRO';
    private const string PLAN_ENTERPRISE = 'ENTERPRISE';
    private const array REQUIRED_AMOUNTS_WEI = [
        self::PLAN_PRO => '1000000000000000000',
        self::PLAN_ENTERPRISE => '2000000000000000000',
    ];

    public function __construct(
        private readonly HttpClientInterface $httpClient,
        #[Autowire('%env(CHILIZ_RPC_URL)%')]
        private readonly string $rpcUrl,
        #[Autowire('%env(int:CHILIZ_CHAIN_ID)%')]
        private readonly int $chainId,
        #[Autowire('%env(CHILIZ_RECEIVER_ADDRESS)%')]
        private readonly string $receiverAddress,
    ) {
    }

    public function verify(string $txHash, string $planType): ChilizPaymentVerificationResult
    {
        $normalizedHash = strtolower(trim($txHash));
        $normalizedPlan = strtoupper(trim($planType));
        $receiverAddress = strtolower(trim($this->receiverAddress));

        if (!preg_match('/^0x[a-f0-9]{64}$/', $normalizedHash)) {
            throw new BadRequestException('Hash de transaction invalide.');
        }

        if (!isset(self::REQUIRED_AMOUNTS_WEI[$normalizedPlan])) {
            throw new BadRequestException('Plan de paiement invalide.');
        }

        if (!preg_match('/^0x[a-f0-9]{40}$/', $receiverAddress)) {
            throw new BadRequestException('Adresse receveur Chiliz invalide côté serveur.');
        }

        $remoteChainId = $this->hexToInt($this->rpc('eth_chainId'));

        if ($remoteChainId !== $this->chainId) {
            throw new BadRequestException('Le RPC Chiliz ne correspond pas au réseau configuré.');
        }

        $transaction = $this->rpc('eth_getTransactionByHash', [$normalizedHash]);

        if (!is_array($transaction)) {
            throw new BadRequestException('Transaction introuvable sur Chiliz Spicy Testnet.');
        }

        $receipt = $this->rpc('eth_getTransactionReceipt', [$normalizedHash]);

        if (!is_array($receipt) || empty($receipt['blockNumber'])) {
            throw new BadRequestException('Transaction non confirmée.');
        }

        if (strtolower((string) ($receipt['status'] ?? '')) !== '0x1') {
            throw new BadRequestException('Transaction échouée sur la blockchain.');
        }

        $to = strtolower((string) ($transaction['to'] ?? ''));

        if ($to !== $receiverAddress) {
            throw new BadRequestException('Le destinataire de la transaction ne correspond pas au wallet KickDeal.');
        }

        $amountWei = $this->hexToDecimalString((string) ($transaction['value'] ?? '0x0'));
        $requiredAmountWei = self::REQUIRED_AMOUNTS_WEI[$normalizedPlan];

        if ($amountWei !== $requiredAmountWei) {
            throw new BadRequestException('Le montant CHZ ne correspond pas au plan choisi.');
        }

        return new ChilizPaymentVerificationResult(
            $normalizedHash,
            $normalizedPlan,
            $amountWei,
            $this->weiToChzString($amountWei),
            $receiverAddress,
            $remoteChainId,
        );
    }

    private function rpc(string $method, array $params = []): mixed
    {
        $response = $this->httpClient->request('POST', $this->rpcUrl, [
            'json' => [
                'jsonrpc' => '2.0',
                'id' => 1,
                'method' => $method,
                'params' => $params,
            ],
        ]);

        $data = $response->toArray(false);

        if (isset($data['error'])) {
            throw new BadRequestException((string) ($data['error']['message'] ?? 'Erreur RPC Chiliz.'));
        }

        return $data['result'] ?? null;
    }

    private function hexToInt(mixed $value): int
    {
        if (!is_string($value) || !str_starts_with($value, '0x')) {
            throw new BadRequestException('Réponse RPC invalide.');
        }

        return (int) hexdec($value);
    }

    private function hexToDecimalString(string $hex): string
    {
        $hex = strtolower($hex);

        if (!str_starts_with($hex, '0x')) {
            throw new BadRequestException('Montant RPC invalide.');
        }

        $digits = substr($hex, 2);
        $decimal = '0';

        foreach (str_split($digits) as $digit) {
            $decimal = $this->decimalMultiply($decimal, 16);
            $decimal = $this->decimalAdd($decimal, hexdec($digit));
        }

        return ltrim($decimal, '0') ?: '0';
    }

    private function decimalMultiply(string $value, int $multiplier): string
    {
        $carry = 0;
        $result = '';

        for ($i = strlen($value) - 1; $i >= 0; --$i) {
            $product = ((int) $value[$i] * $multiplier) + $carry;
            $result = (string) ($product % 10).$result;
            $carry = intdiv($product, 10);
        }

        while ($carry > 0) {
            $result = (string) ($carry % 10).$result;
            $carry = intdiv($carry, 10);
        }

        return ltrim($result, '0') ?: '0';
    }

    private function decimalAdd(string $value, int $addend): string
    {
        $carry = $addend;
        $result = '';

        for ($i = strlen($value) - 1; $i >= 0; --$i) {
            $sum = ((int) $value[$i]) + ($carry % 10);
            $result = (string) ($sum % 10).$result;
            $carry = intdiv($carry, 10) + intdiv($sum, 10);
        }

        while ($carry > 0) {
            $result = (string) ($carry % 10).$result;
            $carry = intdiv($carry, 10);
        }

        return ltrim($result, '0') ?: '0';
    }

    private function weiToChzString(string $wei): string
    {
        if ($wei === '1000000000000000000') {
            return '1.00000000';
        }

        if ($wei === '2000000000000000000') {
            return '2.00000000';
        }

        return '0.00000000';
    }
}