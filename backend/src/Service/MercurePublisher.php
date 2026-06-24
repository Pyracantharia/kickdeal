<?php

namespace App\Service;

use Symfony\Contracts\HttpClient\HttpClientInterface;

class MercurePublisher
{
    public function __construct(
        private readonly HttpClientInterface $httpClient,
        private readonly string $mercureInternalUrl,
        private readonly string $mercureJwtSecret,
    ) {
    }

    /**
     * @param string[] $topics
     * @param array<string, mixed> $payload
     */
    public function publish(array $topics, array $payload, string $eventType = 'message.created'): void
    {
        if ('' === $this->mercureInternalUrl || '' === $this->mercureJwtSecret) {
            return;
        }

        $bodyParts = [
            ['data', json_encode($payload, JSON_THROW_ON_ERROR)],
            ['type', $eventType],
        ];

        foreach ($topics as $topic) {
            $bodyParts[] = ['topic', $topic];
        }

        try {
            $response = $this->httpClient->request('POST', $this->mercureInternalUrl, [
                'headers' => [
                    'Authorization' => sprintf('Bearer %s', $this->createJwt($topics)),
                    'Content-Type' => 'application/x-www-form-urlencoded',
                ],
                'body' => $this->encodeFormBody($bodyParts),
            ]);

            $response->getStatusCode();
        } catch (\Throwable) {
            return;
        }
    }

    /**
     * @param string[] $topics
     */
    private function createJwt(array $topics): string
    {
        $header = $this->base64UrlEncode(json_encode([
            'alg' => 'HS256',
            'typ' => 'JWT',
        ], JSON_THROW_ON_ERROR));

        $payload = $this->base64UrlEncode(json_encode([
            'mercure' => [
                'publish' => $topics,
            ],
            'exp' => time() + 60,
        ], JSON_THROW_ON_ERROR));

        $signature = $this->base64UrlEncode(hash_hmac('sha256', "$header.$payload", $this->mercureJwtSecret, true));

        return "$header.$payload.$signature";
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    /**
     * Mercure expects repeated "topic" fields, not PHP-style "topic[0]" keys.
     *
     * @param array<int, array{0: string, 1: string}> $parts
     */
    private function encodeFormBody(array $parts): string
    {
        return implode('&', array_map(
            fn (array $part) => rawurlencode($part[0]).'='.rawurlencode($part[1]),
            $parts,
        ));
    }
}
