<?php

namespace App\Service;

class MercureSubscriberTokenFactory
{
    public function __construct(
        private readonly string $mercureJwtSecret,
    ) {
    }

    /**
     * @param string[] $topics
     */
    public function create(array $topics): string
    {
        $header = $this->base64UrlEncode(json_encode([
            'alg' => 'HS256',
            'typ' => 'JWT',
        ], JSON_THROW_ON_ERROR));

        $payload = $this->base64UrlEncode(json_encode([
            'mercure' => [
                'subscribe' => $topics,
            ],
            'exp' => time() + 3600,
        ], JSON_THROW_ON_ERROR));

        $signature = $this->base64UrlEncode(hash_hmac('sha256', "$header.$payload", $this->mercureJwtSecret, true));

        return "$header.$payload.$signature";
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}
