<?php

namespace App\Service\Mail;

use App\Entity\Payment;
use App\Entity\Player;
use App\Entity\PlayerAgentRequest;
use App\Entity\Team;
use App\Entity\User;
use App\Enum\PaymentProviderEnum;
use App\Enum\PlayerAgentRequestTypeEnum;
use App\Enum\PlayerMarketAuthorizationStatusEnum;
use App\Enum\SubscriptionPlanEnum;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;

final class TransactionalMailer
{
    public function __construct(
        private readonly MailerInterface $mailer,
        private readonly LoggerInterface $logger,
        #[Autowire('%mailer_from%')]
        private readonly string $from,
        #[Autowire('%frontend_url%')]
        private readonly string $frontendUrl,
    ) {
    }

    /**
     * @return array{success: bool, message?: string}
     */
    public function sendResetPasswordEmail(string $email, string $resetLink): array
    {
        return $this->send(
            to: $email,
            subject: 'Réinitialisation de votre mot de passe KickDeal',
            title: 'Réinitialisez votre mot de passe',
            intro: [
                'Nous avons reçu une demande de changement de mot de passe pour votre compte KickDeal.',
                'Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe fort. Ce lien expire dans 1 heure.',
            ],
            ctaLabel: 'Changer mon mot de passe',
            ctaUrl: $resetLink,
            fallbackLabel: 'Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :',
            outro: "Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.",
            throwOnFailure: true,
        );
    }

    public function sendTransferAgentInvitation(
        string $email,
        string $invitationUrl,
        string $playerName,
        string $buyerTeamName,
        string $sellerTeamName,
    ): void {
        $this->sendBestEffort(
            to: $email,
            subject: sprintf('KickDeal - transfert en attente pour %s', $playerName),
            title: 'Transfert en attente de votre validation',
            intro: [
                sprintf('%s et %s ont trouvé un accord de transfert pour %s.', $buyerTeamName, $sellerTeamName, $playerName),
                'Rejoignez KickDeal pour confirmer que vous représentez le joueur et négocier son contrat directement sur la plateforme.',
            ],
            ctaLabel: 'Consulter l’invitation',
            ctaUrl: $invitationUrl,
            fallbackLabel: 'Lien direct vers l’invitation :',
            tag: 'Invitation agent',
        );
    }

    public function sendTransferClubInvitation(
        string $email,
        string $invitationUrl,
        string $playerName,
        string $buyerTeamName,
        string $sellerTeamName,
    ): void {
        $this->sendBestEffort(
            to: $email,
            subject: sprintf('KickDeal - %s souhaite recruter %s', $buyerTeamName, $playerName),
            title: 'Votre club est invité sur KickDeal',
            intro: [
                sprintf('%s souhaite recruter %s, joueur de %s.', $buyerTeamName, $playerName, $sellerTeamName),
                'Votre club n’est pas encore représenté sur KickDeal. En rejoignant la plateforme, vous pourrez consulter l’offre, négocier, accepter ou refuser.',
            ],
            ctaLabel: 'Rejoindre KickDeal',
            ctaUrl: $invitationUrl,
            fallbackLabel: 'Lien direct vers l’invitation :',
            tag: 'Invitation club',
        );
    }

    public function sendClubRequestDecision(User $recipient, Team $team, bool $approved): void
    {
        $teamName = $team->getName() ?? 'votre club';
        $this->sendBestEffort(
            to: (string) $recipient->getEmail(),
            subject: $approved ? 'Votre demande de club KickDeal est acceptée' : 'Votre demande de club KickDeal est refusée',
            title: $approved ? 'Demande de club acceptée' : 'Demande de club refusée',
            intro: [
                $approved
                    ? sprintf('Votre demande pour gérer %s sur KickDeal a été acceptée.', $teamName)
                    : sprintf('Votre demande pour gérer %s sur KickDeal a été refusée.', $teamName),
                $approved
                    ? 'Vous pouvez maintenant accéder à votre espace club et commencer à gérer vos joueurs.'
                    : 'Vous pouvez vérifier les informations transmises puis soumettre une nouvelle demande si nécessaire.',
            ],
            ctaLabel: $approved ? 'Accéder au dashboard' : 'Retourner à mon club',
            ctaUrl: $approved ? '/dashboard' : '/club',
            tag: 'Demande club',
        );
    }

    /**
     * @param iterable<User> $admins
     */
    public function sendPlayerAgentRequestCreated(iterable $admins, PlayerAgentRequest $request): void
    {
        $agentName = $this->agentName($request);
        $playerName = $this->playerName($request->getPlayer());
        $isHandover = PlayerAgentRequestTypeEnum::AGENT_HANDOVER === $request->getType();

        foreach ($admins as $admin) {
            $this->sendBestEffort(
                to: (string) $admin->getEmail(),
                subject: $isHandover ? 'Passation agent à valider sur KickDeal' : 'Demande joueur à valider sur KickDeal',
                title: $isHandover ? 'Passation agent à valider' : 'Demande joueur à valider',
                intro: [
                    sprintf('%s souhaite %s %s.', $agentName, $isHandover ? 'récupérer' : 'représenter', $playerName),
                    'La demande attend une décision dans votre espace administrateur.',
                ],
                ctaLabel: 'Ouvrir l’administration',
                ctaUrl: '/admin',
                tag: 'Validation admin',
            );
        }
    }

    public function sendPlayerAgentRequestDecision(PlayerAgentRequest $request, bool $approved): void
    {
        $recipient = $request->getAgent()?->getUser();
        if (!$recipient instanceof User) {
            return;
        }

        $playerName = $this->playerName($request->getPlayer());
        $isHandover = PlayerAgentRequestTypeEnum::AGENT_HANDOVER === $request->getType();

        $this->sendBestEffort(
            to: (string) $recipient->getEmail(),
            subject: $approved ? 'Votre demande agent KickDeal est validée' : 'Votre demande agent KickDeal est refusée',
            title: $approved ? 'Demande validée' : 'Demande refusée',
            intro: [
                $approved
                    ? ($isHandover
                        ? sprintf('Votre demande de passation pour %s a été validée par l’administration.', $playerName)
                        : sprintf('%s a été ajouté à votre portefeuille.', $playerName))
                    : sprintf('Votre demande pour %s a été refusée par l’administration.', $playerName),
                $approved && $isHandover
                    ? 'Elle doit maintenant être acceptée par l’agent actuel du joueur.'
                    : 'Vous pouvez suivre vos demandes depuis votre espace agent.',
            ],
            ctaLabel: 'Voir mes joueurs',
            ctaUrl: '/mes-joueurs',
            tag: 'Demande agent',
        );
    }

    public function sendAgentHandoverDecision(PlayerAgentRequest $request, bool $approved): void
    {
        $recipient = $request->getAgent()?->getUser();
        if (!$recipient instanceof User) {
            return;
        }

        $playerName = $this->playerName($request->getPlayer());
        $this->sendBestEffort(
            to: (string) $recipient->getEmail(),
            subject: $approved ? 'Passation agent acceptée sur KickDeal' : 'Passation agent refusée sur KickDeal',
            title: $approved ? 'Passation acceptée' : 'Passation refusée',
            intro: [
                $approved
                    ? sprintf('%s fait maintenant partie de votre portefeuille.', $playerName)
                    : sprintf('La demande de passation pour %s a été refusée.', $playerName),
                'Vous pouvez consulter le détail depuis votre espace agent.',
            ],
            ctaLabel: 'Voir mes joueurs',
            ctaUrl: '/mes-joueurs',
            tag: 'Passation agent',
        );
    }

    /**
     * @param iterable<User> $clubUsers
     */
    public function sendMarketAuthorizationRequested(iterable $clubUsers, Player $player, string $agentName): void
    {
        $playerName = $this->playerName($player);
        foreach ($clubUsers as $clubUser) {
            $this->sendBestEffort(
                to: (string) $clubUser->getEmail(),
                subject: sprintf('Autorisation marché demandée pour %s', $playerName),
                title: 'Autorisation marché demandée',
                intro: [
                    sprintf('%s souhaite proposer %s à d’autres clubs.', $agentName, $playerName),
                    'Votre décision est attendue dans l’espace club.',
                ],
                ctaLabel: 'Traiter la demande',
                ctaUrl: sprintf('/players?playerId=%s&manage=1', $player->getId()?->toRfc4122()),
                tag: 'Autorisation marché',
            );
        }
    }

    public function sendMarketAuthorizationDecision(User $recipient, Player $player, PlayerMarketAuthorizationStatusEnum|string $decision): void
    {
        $approved = PlayerMarketAuthorizationStatusEnum::APPROVED === $decision || 'approved' === $decision;
        $revoked = 'revoked' === $decision;
        $playerName = $this->playerName($player);

        $this->sendBestEffort(
            to: (string) $recipient->getEmail(),
            subject: $revoked
                ? sprintf('Autorisation marché retirée pour %s', $playerName)
                : ($approved ? sprintf('Autorisation marché accordée pour %s', $playerName) : sprintf('Autorisation marché refusée pour %s', $playerName)),
            title: $revoked
                ? 'Autorisation retirée'
                : ($approved ? 'Autorisation accordée' : 'Autorisation refusée'),
            intro: [
                $revoked
                    ? sprintf('Le club a retiré l’autorisation de proposer %s.', $playerName)
                    : ($approved
                        ? sprintf('Vous pouvez maintenant proposer %s aux clubs.', $playerName)
                        : sprintf('Le club a refusé votre demande pour %s.', $playerName)),
                'Vous pouvez retrouver le suivi depuis votre espace agent.',
            ],
            ctaLabel: 'Voir mes joueurs',
            ctaUrl: '/mes-joueurs',
            tag: 'Autorisation marché',
        );
    }

    public function sendPaymentConfirmed(User $recipient, SubscriptionPlanEnum $plan, ?Payment $payment = null): void
    {
        $details = ['Plan activé' => $plan->label()];
        if ($payment instanceof Payment) {
            $details['Moyen de paiement'] = PaymentProviderEnum::CHILIZ === $payment->getProvider() ? 'Chiliz' : $payment->getProvider()->value;
            $details['Montant'] = sprintf('%s CHZ', $payment->getAmountChz());
            $details['Transaction'] = (string) $payment->getTxHash();
        } else {
            $details['Moyen de paiement'] = 'Stripe';
        }

        $this->sendBestEffort(
            to: (string) $recipient->getEmail(),
            subject: sprintf('Votre abonnement %s est activé', $plan->label()),
            title: 'Abonnement confirmé',
            intro: [
                sprintf('Votre abonnement %s est maintenant actif sur KickDeal.', $plan->label()),
                'Merci pour votre confiance. Vos nouvelles limites sont disponibles dans votre espace abonnement.',
            ],
            ctaLabel: 'Voir mon abonnement',
            ctaUrl: '/subscription',
            details: $details,
            tag: 'Paiement confirmé',
        );
    }

    /**
     * @return array{success: bool, message?: string}
     */
    private function send(
        string $to,
        string $subject,
        string $title,
        array $intro,
        string $ctaLabel,
        string $ctaUrl,
        ?string $fallbackLabel = null,
        ?string $outro = null,
        array $details = [],
        ?string $tag = null,
        bool $throwOnFailure = false,
    ): array {
        $absoluteCtaUrl = $this->absoluteUrl($ctaUrl);
        $message = (new Email())
            ->from($this->from)
            ->to($to)
            ->subject($subject)
            ->text($this->buildText($title, $intro, $ctaLabel, $absoluteCtaUrl, $fallbackLabel, $outro, $details))
            ->html($this->buildHtml($title, $intro, $ctaLabel, $absoluteCtaUrl, $fallbackLabel, $outro, $details, $tag));

        try {
            $this->mailer->send($message);

            return ['success' => true];
        } catch (\Throwable $exception) {
            if ($throwOnFailure) {
                return [
                    'success' => false,
                    'message' => $exception->getMessage(),
                ];
            }

            $this->logger->warning('Transactional email could not be sent.', [
                'to' => $to,
                'subject' => $subject,
                'exception' => $exception,
            ]);

            return [
                'success' => false,
                'message' => $exception->getMessage(),
            ];
        }
    }

    private function sendBestEffort(
        string $to,
        string $subject,
        string $title,
        array $intro,
        string $ctaLabel,
        string $ctaUrl,
        ?string $fallbackLabel = null,
        ?string $outro = null,
        array $details = [],
        ?string $tag = null,
    ): void {
        if ('' === trim($to)) {
            return;
        }

        $this->send($to, $subject, $title, $intro, $ctaLabel, $ctaUrl, $fallbackLabel, $outro, $details, $tag);
    }

    private function buildText(string $title, array $intro, string $ctaLabel, string $ctaUrl, ?string $fallbackLabel, ?string $outro, array $details): string
    {
        $lines = ['Bonjour,', '', $title, ''];
        foreach ($intro as $paragraph) {
            $lines[] = $paragraph;
            $lines[] = '';
        }

        foreach ($details as $label => $value) {
            $lines[] = sprintf('%s : %s', $label, $value);
        }
        if ([] !== $details) {
            $lines[] = '';
        }

        $lines[] = sprintf('%s : %s', $ctaLabel, $ctaUrl);
        if ($fallbackLabel) {
            $lines[] = '';
            $lines[] = $fallbackLabel;
            $lines[] = $ctaUrl;
        }
        if ($outro) {
            $lines[] = '';
            $lines[] = $outro;
        }

        $lines[] = '';
        $lines[] = "L'équipe KickDeal";

        return implode("\n", $lines);
    }

    private function buildHtml(string $title, array $intro, string $ctaLabel, string $ctaUrl, ?string $fallbackLabel, ?string $outro, array $details, ?string $tag): string
    {
        $escapedTitle = $this->escape($title);
        $escapedCtaLabel = $this->escape($ctaLabel);
        $escapedCtaUrl = $this->escape($ctaUrl);
        $tagHtml = $tag ? $this->escape($tag) : 'KickDeal';
        $paragraphs = implode('', array_map(
            fn (string $paragraph): string => sprintf(
                '<p style="margin:0 0 18px;color:#cbd5e1;font-size:15px;line-height:1.6;">%s</p>',
                $this->escape($paragraph),
            ),
            $intro,
        ));

        $detailsHtml = '';
        if ([] !== $details) {
            $detailRows = '';
            foreach ($details as $label => $value) {
                $detailRows .= sprintf(
                    '<tr><td style="padding:8px 0;color:#94a3b8;font-size:13px;">%s</td><td align="right" style="padding:8px 0;color:#ffffff;font-size:13px;font-weight:700;">%s</td></tr>',
                    $this->escape((string) $label),
                    $this->escape((string) $value),
                );
            }
            $detailsHtml = sprintf(
                '<table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;border-top:1px solid rgba(255,255,255,0.08);border-bottom:1px solid rgba(255,255,255,0.08);">%s</table>',
                $detailRows,
            );
        }

        $fallbackHtml = sprintf(
            '<p style="margin:0 0 8px;color:#94a3b8;font-size:13px;line-height:1.5;">%s</p><p style="margin:0 0 22px;word-break:break-all;color:#00f5d4;font-size:12px;line-height:1.5;"><a href="%s" style="color:#00f5d4;text-decoration:none;">%s</a></p>',
            $this->escape($fallbackLabel ?? 'Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :'),
            $escapedCtaUrl,
            $escapedCtaUrl,
        );

        $outroHtml = $outro ? sprintf(
            '<p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.5;">%s</p>',
            $this->escape($outro),
        ) : '';

        return <<<HTML
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{$escapedTitle}</title>
  </head>
  <body style="margin:0;padding:0;background:#07111d;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#07111d;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border:1px solid rgba(0,245,212,0.25);border-radius:14px;overflow:hidden;background:#0b1726;">
            <tr>
              <td style="padding:28px 28px 18px;border-top:4px solid #00f5d4;">
                <p style="margin:0 0 8px;color:#00f5d4;font-size:12px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;">{$tagHtml}</p>
                <h1 style="margin:0;color:#ffffff;font-size:26px;line-height:1.25;">{$escapedTitle}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px;">
                {$paragraphs}
                {$detailsHtml}
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
                  <tr>
                    <td>
                      <a href="{$escapedCtaUrl}" style="display:inline-block;border-radius:10px;background:linear-gradient(135deg,#00f5d4,#9b5de5);padding:14px 22px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">{$escapedCtaLabel}</a>
                    </td>
                  </tr>
                </table>
                {$fallbackHtml}
                {$outroHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;background:#08101c;border-top:1px solid rgba(255,255,255,0.08);">
                <p style="margin:0;color:#64748b;font-size:12px;line-height:1.5;">KickDeal · Plateforme de transferts footballistiques</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
HTML;
    }

    private function absoluteUrl(string $url): string
    {
        if (str_starts_with($url, 'http://') || str_starts_with($url, 'https://')) {
            return $url;
        }

        return rtrim($this->frontendUrl, '/').('/' === $url[0] ? $url : '/'.$url);
    }

    private function escape(?string $value): string
    {
        return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    private function playerName(?Player $player): string
    {
        return trim(sprintf('%s %s', $player?->getFirstName() ?? '', $player?->getLastName() ?? '')) ?: 'un joueur';
    }

    private function agentName(PlayerAgentRequest $request): string
    {
        $agent = $request->getAgent();

        return $agent?->getAgencyName()
            ?: trim(sprintf('%s %s', $agent?->getUser()?->getFirstName() ?? '', $agent?->getUser()?->getLastName() ?? ''))
            ?: 'Un agent';
    }
}
