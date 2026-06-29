<?php

namespace App\Service\Security;

use App\Entity\User;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use OTPHP\TOTP;

final class TwoFactorAuthenticator
{
    private const string ISSUER = 'KickDeal';

    public function createSecret(): string
    {
        return TOTP::generate()->getSecret();
    }

    public function getProvisioningUri(User $user, string $secret): string
    {
        $totp = TOTP::createFromSecret($secret);
        $totp->setIssuer(self::ISSUER);
        $totp->setLabel($user->getEmail() ?? $user->getUserIdentifier());

        return $totp->getProvisioningUri();
    }

    public function getQrCodeSvg(string $provisioningUri): string
    {
        $renderer = new ImageRenderer(
            new RendererStyle(260),
            new SvgImageBackEnd(),
        );

        return (new Writer($renderer))->writeString($provisioningUri);
    }

    public function verify(string $secret, ?string $code): bool
    {
        if (!is_string($code)) {
            return false;
        }

        $normalizedCode = preg_replace('/\s+/', '', $code);

        if (!is_string($normalizedCode) || 1 !== preg_match('/^\d{6}$/', $normalizedCode)) {
            return false;
        }

        return TOTP::createFromSecret($secret)->verify($normalizedCode, null, 1);
    }
}
