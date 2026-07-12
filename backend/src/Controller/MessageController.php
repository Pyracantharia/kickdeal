<?php

namespace App\Controller;

use App\Entity\DirectConversation;
use App\Entity\DirectMessage;
use App\Entity\MessageReport;
use App\Entity\User;
use App\Repository\DirectConversationRepository;
use App\Repository\DirectMessageRepository;
use App\Repository\UserRepository;
use App\Service\MercurePublisher;
use App\Service\MercureSubscriberTokenFactory;
use App\Service\Notification\NotificationService;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Csrf\CsrfToken;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Uid\Uuid;

#[Route('/api/messages')]
final class MessageController extends AbstractController
{
    private const string CSRF_TOKEN_ID = 'api_auth';

    #[Route('/mercure-token', name: 'api_messages_mercure_token', methods: ['GET'])]
    public function mercureToken(
        #[CurrentUser] ?User $user,
        MercureSubscriberTokenFactory $tokenFactory,
    ): JsonResponse {
        if (!$user instanceof User) {
            return $this->json(['errorMessage' => 'Utilisateur non authentifié.'], 401);
        }

        $topic = $this->userTopic($user);
        $token = $tokenFactory->create([$topic]);
        $response = $this->json([
            'hubUrl' => $this->getParameter('mercure_public_url'),
            'topic' => $topic,
        ]);

        $response->headers->setCookie(Cookie::create('mercureAuthorization')
            ->withValue($token)
            ->withPath('/.well-known/mercure')
            ->withSecure(false)
            ->withHttpOnly(true)
            ->withSameSite(Cookie::SAMESITE_LAX));

        return $response;
    }

    #[Route('/conversations', name: 'api_messages_conversations', methods: ['GET'])]
    public function conversations(
        #[CurrentUser] ?User $user,
        DirectConversationRepository $conversationRepository,
    ): JsonResponse {
        if (!$user instanceof User) {
            return $this->json(['errorMessage' => 'Utilisateur non authentifié.'], 401);
        }

        return $this->json([
            'conversations' => array_map(
                fn (DirectConversation $conversation) => $this->serializeConversation($conversation, $user),
                $conversationRepository->findForUser($user),
            ),
        ]);
    }

    #[Route('/support/conversation', name: 'api_messages_support_conversation', methods: ['POST'])]
    public function startSupportConversation(
        Request $request,
        #[CurrentUser] ?User $user,
        UserRepository $userRepository,
        DirectConversationRepository $conversationRepository,
        EntityManagerInterface $entityManager,
        CsrfTokenManagerInterface $csrfTokenManager,
    ): JsonResponse {
        if (!$user instanceof User) {
            return $this->json(['errorMessage' => 'Utilisateur non authentifié.'], 401);
        }

        if (in_array(User::ROLE_ADMIN, $user->getRoles(), true)) {
            return $this->json(['errorMessage' => 'Le support utilisateur est réservé aux comptes club et agent.'], 422);
        }

        if ($user->isBanned()) {
            return $this->json([
                'errorMessage' => sprintf('Votre compte est suspendu jusqu’au %s.', $user->getBannedUntil()?->format('d/m/Y H:i')),
            ], 403);
        }

        if ($csrfError = $this->validateCsrfToken($request, $csrfTokenManager)) {
            return $csrfError;
        }

        $conversation = $conversationRepository->findSupportForUser($user);

        if (!$conversation instanceof DirectConversation) {
            $admin = $userRepository->findAdminUsers()[0] ?? null;

            if (!$admin instanceof User) {
                return $this->json(['errorMessage' => 'Aucun administrateur support disponible.'], 503);
            }

            $conversation = $conversationRepository->findBetweenUsers($user, $admin);

            if (!$conversation instanceof DirectConversation) {
                [$lowId, $highId] = DirectConversationRepository::orderedParticipantIds($user, $admin);
                $conversation = (new DirectConversation())
                    ->setParticipantOne($user)
                    ->setParticipantTwo($admin)
                    ->setParticipantLowId(Uuid::fromString($lowId))
                    ->setParticipantHighId(Uuid::fromString($highId))
                    ->setCreatedAt(new \DateTimeImmutable());

                $entityManager->persist($conversation);
            }

            $conversation
                ->setType('support')
                ->setUpdatedAt(new \DateTimeImmutable());
            $entityManager->flush();
        }

        return $this->json([
            'conversation' => $this->serializeConversation($conversation, $user),
        ], 201);
    }

    #[Route('/support/conversations', name: 'api_messages_admin_support_conversations', methods: ['GET'])]
    public function supportConversations(
        #[CurrentUser] ?User $user,
        DirectConversationRepository $conversationRepository,
    ): JsonResponse {
        if (!$user instanceof User || !in_array(User::ROLE_ADMIN, $user->getRoles(), true)) {
            return $this->json(['errorMessage' => 'Accès refusé.'], 403);
        }

        return $this->json([
            'conversations' => array_map(
                fn (DirectConversation $conversation) => $this->serializeConversation($conversation, $user),
                $conversationRepository->findSupportConversations(),
            ),
        ]);
    }

    #[Route('/conversations', name: 'api_messages_start_conversation', methods: ['POST'])]
    public function startConversation(
        Request $request,
        #[CurrentUser] ?User $user,
        UserRepository $userRepository,
        DirectConversationRepository $conversationRepository,
        EntityManagerInterface $entityManager,
        CsrfTokenManagerInterface $csrfTokenManager,
    ): JsonResponse {
        if (!$user instanceof User) {
            return $this->json(['errorMessage' => 'Utilisateur non authentifié.'], 401);
        }

        if ($user->isBanned()) {
            return $this->json([
                'errorMessage' => sprintf('Votre compte est suspendu jusqu’au %s.', $user->getBannedUntil()?->format('d/m/Y H:i')),
            ], 403);
        }

        if ($csrfError = $this->validateCsrfToken($request, $csrfTokenManager)) {
            return $csrfError;
        }

        $payload = json_decode($request->getContent(), true);
        $recipientId = is_array($payload) && isset($payload['recipientId']) ? (string) $payload['recipientId'] : null;

        if (!$recipientId) {
            return $this->json(['errorMessage' => 'Destinataire requis.'], 422);
        }

        $recipient = $userRepository->find($recipientId);

        if (!$recipient instanceof User) {
            return $this->json(['errorMessage' => 'Destinataire introuvable.'], 404);
        }

        if ((string) $recipient->getId() === (string) $user->getId()) {
            return $this->json(['errorMessage' => 'Vous ne pouvez pas créer une discussion avec vous-même.'], 422);
        }

        $conversation = $conversationRepository->findBetweenUsers($user, $recipient);

        if (!$conversation instanceof DirectConversation) {
            [$lowId, $highId] = DirectConversationRepository::orderedParticipantIds($user, $recipient);
            $conversation = (new DirectConversation())
                ->setParticipantOne($user)
                ->setParticipantTwo($recipient)
                ->setParticipantLowId(Uuid::fromString($lowId))
                ->setParticipantHighId(Uuid::fromString($highId))
                ->setCreatedAt(new \DateTimeImmutable())
                ->setUpdatedAt(new \DateTimeImmutable());

            $entityManager->persist($conversation);
            $entityManager->flush();
        }

        return $this->json([
            'conversation' => $this->serializeConversation($conversation, $user),
        ], 201);
    }

    #[Route('/conversations/{id}', name: 'api_messages_conversation', methods: ['GET'])]
    public function conversation(
        string $id,
        #[CurrentUser] ?User $user,
        DirectConversationRepository $conversationRepository,
        DirectMessageRepository $messageRepository,
    ): JsonResponse {
        if (!$user instanceof User) {
            return $this->json(['errorMessage' => 'Utilisateur non authentifié.'], 401);
        }

        $conversation = $conversationRepository->find($id);

        if (!$conversation instanceof DirectConversation || !$this->canAccessConversation($conversation, $user)) {
            return $this->json(['errorMessage' => 'Discussion introuvable.'], 404);
        }

        return $this->json([
            'conversation' => $this->serializeConversation($conversation, $user),
            'messages' => array_map(
                fn (DirectMessage $message) => $this->serializeMessage($message),
                $messageRepository->findForConversation($conversation),
            ),
        ]);
    }

    #[Route('/conversations/{id}/read', name: 'api_messages_conversation_read', methods: ['POST'])]
    public function markConversationRead(
        string $id,
        #[CurrentUser] ?User $user,
        DirectConversationRepository $conversationRepository,
        NotificationService $notificationService,
        CsrfTokenManagerInterface $csrfTokenManager,
        Request $request,
    ): JsonResponse {
        if (!$user instanceof User) {
            return $this->json(['errorMessage' => 'Utilisateur non authentifié.'], 401);
        }

        if ($csrfError = $this->validateCsrfToken($request, $csrfTokenManager)) {
            return $csrfError;
        }

        $conversation = $conversationRepository->find($id);

        if (!$conversation instanceof DirectConversation || !$this->canAccessConversation($conversation, $user)) {
            return $this->json(['errorMessage' => 'Discussion introuvable.'], 404);
        }

        $notificationService->markSourceRead($user, 'direct_conversation', (string) $conversation->getId());

        return $this->json([
            'summary' => $notificationService->summary($user),
        ]);
    }

    #[Route('/conversations/{id}/messages', name: 'api_messages_send', methods: ['POST'])]
    public function sendMessage(
        string $id,
        Request $request,
        #[CurrentUser] ?User $user,
        DirectConversationRepository $conversationRepository,
        EntityManagerInterface $entityManager,
        MercurePublisher $mercurePublisher,
        NotificationService $notificationService,
        CsrfTokenManagerInterface $csrfTokenManager,
        UserRepository $userRepository,
    ): JsonResponse {
        if (!$user instanceof User) {
            return $this->json(['errorMessage' => 'Utilisateur non authentifié.'], 401);
        }

        if ($csrfError = $this->validateCsrfToken($request, $csrfTokenManager)) {
            return $csrfError;
        }

        $conversation = $conversationRepository->find($id);

        if (!$conversation instanceof DirectConversation || !$this->canAccessConversation($conversation, $user)) {
            return $this->json(['errorMessage' => 'Discussion introuvable.'], 404);
        }

        $payload = json_decode($request->getContent(), true);
        $content = is_array($payload) && isset($payload['content']) ? trim((string) $payload['content']) : '';

        if ('' === $content) {
            return $this->json(['errorMessage' => 'Message vide.'], 422);
        }

        $now = new \DateTimeImmutable();
        $message = (new DirectMessage())
            ->setConversation($conversation)
            ->setSender($user)
            ->setContent($content)
            ->setCreatedAt($now)
            ->setUpdatedAt($now);
        $conversation->setUpdatedAt($now);

        $entityManager->persist($message);
        $entityManager->flush();

        $participants = array_filter([$conversation->getParticipantOne(), $conversation->getParticipantTwo()]);
        $payload = [
            'conversation' => $this->serializeConversation($conversation, $user),
            'message' => $this->serializeMessage($message),
        ];

        $publishRecipients = $participants;
        if ($conversation->isSupport()) {
            $publishRecipients = array_merge($publishRecipients, $userRepository->findAdminUsers());
        }
        $publishTopics = array_values(array_unique(array_map(fn (User $participant) => $this->userTopic($participant), $publishRecipients)));

        $mercurePublisher->publish($publishTopics, $payload);

        foreach ($participants as $participant) {
            if ($participant->getId()?->toRfc4122() === $user->getId()?->toRfc4122()) {
                continue;
            }

            $notificationService->notifyMessageReceived(
                recipient: $participant,
                sender: $user,
                conversationId: (string) $conversation->getId(),
                senderName: $this->userDisplayName($user),
            );
        }

        return $this->json($payload, 201);
    }

    #[Route('/{id}/report', name: 'api_messages_report', methods: ['POST'])]
    public function reportMessage(
        string $id,
        Request $request,
        #[CurrentUser] ?User $user,
        DirectMessageRepository $messageRepository,
        EntityManagerInterface $entityManager,
        CsrfTokenManagerInterface $csrfTokenManager,
        NotificationService $notificationService,
        UserRepository $userRepository,
    ): JsonResponse {
        if (!$user instanceof User) {
            return $this->json(['errorMessage' => 'Utilisateur non authentifié.'], 401);
        }

        if ($csrfError = $this->validateCsrfToken($request, $csrfTokenManager)) {
            return $csrfError;
        }

        $message = $messageRepository->find($id);
        $conversation = $message instanceof DirectMessage ? $message->getConversation() : null;
        $sender = $message instanceof DirectMessage ? $message->getSender() : null;

        if (!$message instanceof DirectMessage || !$conversation instanceof DirectConversation || !$conversation->hasParticipant($user)) {
            return $this->json(['errorMessage' => 'Message introuvable.'], 404);
        }

        if (!$sender instanceof User) {
            return $this->json(['errorMessage' => 'Expéditeur introuvable.'], 422);
        }

        if ($sender->getId()?->toRfc4122() === $user->getId()?->toRfc4122()) {
            return $this->json(['errorMessage' => 'Vous ne pouvez pas signaler votre propre message.'], 422);
        }

        $payload = json_decode($request->getContent(), true);
        $reason = is_array($payload) && isset($payload['reason']) ? trim((string) $payload['reason']) : null;
        $reason = '' === $reason ? null : $reason;

        $now = new \DateTimeImmutable();
        $report = (new MessageReport())
            ->setMessage($message)
            ->setConversation($conversation)
            ->setReporter($user)
            ->setReportedUser($sender)
            ->setMessageContent($message->getContent() ?? '')
            ->setReason($reason)
            ->setStatus(MessageReport::STATUS_PENDING)
            ->setCreatedAt($now)
            ->setUpdatedAt($now);

        try {
            $entityManager->persist($report);
            $entityManager->flush();
        } catch (UniqueConstraintViolationException) {
            return $this->json(['errorMessage' => 'Vous avez déjà signalé ce message.'], 409);
        }

        foreach ($userRepository->findAdminUsers() as $admin) {
            $notificationService->notify(
                recipient: $admin,
                type: 'message_report.created',
                category: 'messages',
                title: 'Nouveau message signalé',
                body: sprintf('%s a signalé un message de %s.', $this->userDisplayName($user), $this->userDisplayName($sender)),
                actionUrl: '/admin/message-reports',
                targetRoute: '/admin/message-reports',
                requiresAction: true,
                severity: 'warning',
                actor: $user,
                sourceType: 'message_report',
                sourceId: $report->getId()?->toRfc4122(),
            );
        }

        return $this->json([
            'message' => 'Message signalé. Notre équipe va l’examiner.',
        ], 201);
    }

    private function userTopic(User $user): string
    {
        return sprintf('https://kickdeal.local/users/%s/messages', $user->getId());
    }

    private function validateCsrfToken(Request $request, CsrfTokenManagerInterface $csrfTokenManager): ?JsonResponse
    {
        if ('test' === $this->getParameter('kernel.environment')) {
            return null;
        }

        $token = $request->headers->get('X-CSRF-TOKEN');

        if (!$token || !$csrfTokenManager->isTokenValid(new CsrfToken(self::CSRF_TOKEN_ID, $token))) {
            return $this->json([
                'errorMessage' => 'Token CSRF invalide.',
            ], 403);
        }

        return null;
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeConversation(DirectConversation $conversation, User $viewer): array
    {
        $lastMessage = $conversation->getMessages()->last();

        if (false === $lastMessage) {
            $lastMessage = null;
        }

        return [
            'id' => (string) $conversation->getId(),
            'type' => $conversation->getType(),
            'participants' => array_map(
                fn (User $participant) => $this->serializeUser($participant),
                array_values(array_filter([$conversation->getParticipantOne(), $conversation->getParticipantTwo()])),
            ),
            'otherParticipant' => ($otherParticipant = $this->getConversationCounterpart($conversation, $viewer)) instanceof User
                ? $this->serializeUser($otherParticipant)
                : null,
            'lastMessage' => $lastMessage instanceof DirectMessage ? $this->serializeMessage($lastMessage) : null,
            'updatedAt' => $conversation->getUpdatedAt()?->format(\DateTimeInterface::ATOM),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeMessage(DirectMessage $message): array
    {
        return [
            'id' => (string) $message->getId(),
            'conversationId' => (string) $message->getConversation()?->getId(),
            'content' => $message->getContent(),
            'sender' => $message->getSender() instanceof User ? $this->serializeUser($message->getSender()) : null,
            'createdAt' => $message->getCreatedAt()?->format(\DateTimeInterface::ATOM),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeUser(User $user): array
    {
        return [
            'id' => (string) $user->getId(),
            'firstName' => $user->getFirstName(),
            'lastName' => $user->getLastName(),
            'email' => $user->getEmail(),
            'clubName' => $user->getClubName(),
            'clubLogoUrl' => $user->getClubLogoUrl(),
            'agencyName' => $user->getAgencyName(),
            'roles' => $user->getRoles(),
        ];
    }

    private function userDisplayName(User $user): string
    {
        $name = $user->getAgencyName()
            ?: $user->getClubName()
            ?: trim(sprintf('%s %s', $user->getFirstName(), $user->getLastName()));

        return '' !== $name ? $name : 'Un utilisateur';
    }

    private function canAccessConversation(DirectConversation $conversation, User $user): bool
    {
        return $conversation->hasParticipant($user)
            || ($conversation->isSupport() && in_array(User::ROLE_ADMIN, $user->getRoles(), true));
    }

    private function getConversationCounterpart(DirectConversation $conversation, User $viewer): ?User
    {
        $otherParticipant = $conversation->getOtherParticipant($viewer);

        if ($otherParticipant instanceof User) {
            return $otherParticipant;
        }

        if ($conversation->isSupport() && in_array(User::ROLE_ADMIN, $viewer->getRoles(), true)) {
            foreach ([$conversation->getParticipantOne(), $conversation->getParticipantTwo()] as $participant) {
                if ($participant instanceof User && !in_array(User::ROLE_ADMIN, $participant->getRoles(), true)) {
                    return $participant;
                }
            }
        }

        return null;
    }
}
