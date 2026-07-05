<?php

namespace App\Service\Notification;

use App\Entity\AppNotification;
use App\Entity\User;
use App\Repository\AppNotificationRepository;
use App\Service\MercurePublisher;
use Doctrine\ORM\EntityManagerInterface;

class NotificationService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly AppNotificationRepository $notificationRepository,
        private readonly MercurePublisher $mercurePublisher,
    ) {
    }

    /**
     * @param array<string, mixed>|null $metadata
     */
    public function notify(
        User $recipient,
        string $type,
        string $category,
        string $title,
        ?string $body = null,
        ?string $actionUrl = null,
        ?string $targetRoute = null,
        bool $requiresAction = false,
        string $severity = 'info',
        ?User $actor = null,
        ?string $sourceType = null,
        ?string $sourceId = null,
        ?array $metadata = null,
        bool $flush = true,
    ): AppNotification {
        $notification = (new AppNotification())
            ->setRecipient($recipient)
            ->setActor($actor)
            ->setType($type)
            ->setCategory($category)
            ->setSeverity($severity)
            ->setTitle($title)
            ->setBody($body)
            ->setActionUrl($actionUrl)
            ->setTargetRoute($targetRoute)
            ->setRequiresAction($requiresAction)
            ->setSourceType($sourceType)
            ->setSourceId($sourceId)
            ->setMetadata($metadata)
            ->setCreatedAt(new \DateTimeImmutable())
            ->setUpdatedAt(new \DateTimeImmutable());

        $this->entityManager->persist($notification);

        if ($flush) {
            $this->entityManager->flush();
            $this->publish($notification);
        }

        return $notification;
    }

    public function publish(AppNotification $notification): void
    {
        $recipient = $notification->getRecipient();
        if (!$recipient instanceof User) {
            return;
        }

        $this->mercurePublisher->publish(
            [$this->topicForUser($recipient)],
            [
                'notification' => $this->serialize($notification),
                'summary' => $this->summary($recipient),
            ],
            'notification.created',
        );
    }

    public function markRead(AppNotification $notification, User $viewer): void
    {
        if ($notification->getRecipient()?->getId()?->toRfc4122() !== $viewer->getId()?->toRfc4122()) {
            return;
        }

        if (null === $notification->getReadAt()) {
            $notification->setReadAt(new \DateTimeImmutable());
            $this->entityManager->flush();
        }
    }

    public function markAllRead(User $viewer): void
    {
        foreach ($this->notificationRepository->findForUser($viewer, 'unread', 200) as $notification) {
            $notification->setReadAt(new \DateTimeImmutable());
        }

        $this->entityManager->flush();
    }

    public function markSourceRead(User $viewer, string $sourceType, string $sourceId): void
    {
        foreach ($this->notificationRepository->findUnreadForUserAndSource($viewer, $sourceType, $sourceId) as $notification) {
            $notification->setReadAt(new \DateTimeImmutable());
        }

        $this->entityManager->flush();
    }

    public function notifyMessageReceived(
        User $recipient,
        User $sender,
        string $conversationId,
        string $senderName,
    ): AppNotification {
        $existingNotifications = $this->notificationRepository->findUnreadForUserAndSource(
            $recipient,
            'direct_conversation',
            $conversationId,
        );
        $existingNotification = $existingNotifications[0] ?? null;

        if ($existingNotification instanceof AppNotification) {
            $metadata = $existingNotification->getMetadata() ?? [];
            $messageCount = ((int) ($metadata['messageCount'] ?? 1)) + 1;

            $existingNotification
                ->setActor($sender)
                ->setTitle(sprintf('%d nouveaux messages', $messageCount))
                ->setBody(sprintf('%s vous a envoyé %d messages.', $senderName, $messageCount))
                ->setActionUrl(sprintf('/messages?conversation=%s', $conversationId))
                ->setUpdatedAt(new \DateTimeImmutable())
                ->setMetadata([
                    ...$metadata,
                    'messageCount' => $messageCount,
                    'lastSenderName' => $senderName,
                ]);

            $this->entityManager->flush();
            $this->publish($existingNotification);

            return $existingNotification;
        }

        return $this->notify(
            recipient: $recipient,
            type: 'message.created',
            category: 'messages',
            title: 'Nouveau message',
            body: sprintf('%s vous a envoyé un message.', $senderName),
            actionUrl: sprintf('/messages?conversation=%s', $conversationId),
            targetRoute: '/messages',
            requiresAction: false,
            severity: 'info',
            actor: $sender,
            sourceType: 'direct_conversation',
            sourceId: $conversationId,
            metadata: [
                'messageCount' => 1,
                'lastSenderName' => $senderName,
            ],
        );
    }

    public function resolveSource(string $sourceType, string $sourceId, bool $flush = true): void
    {
        foreach ($this->notificationRepository->findOpenActionsForSource($sourceType, $sourceId) as $notification) {
            $notification->setResolvedAt(new \DateTimeImmutable());
        }

        if ($flush) {
            $this->entityManager->flush();
        }
    }

    /**
     * @return array{unreadCount: int, actionCounts: array<string, int>, unreadCounts: array<string, int>, hasUnread: bool, hasActions: bool}
     */
    public function summary(User $user): array
    {
        $actionCounts = $this->notificationRepository->countOpenActionsByTargetRoute($user);
        $unreadCount = $this->notificationRepository->countUnreadForUser($user);

        return [
            'unreadCount' => $unreadCount,
            'actionCounts' => $actionCounts,
            'unreadCounts' => $this->notificationRepository->countUnreadByTargetRoute($user),
            'hasUnread' => $unreadCount > 0,
            'hasActions' => array_sum($actionCounts) > 0,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function serialize(AppNotification $notification): array
    {
        return [
            'id' => $notification->getId()?->toRfc4122(),
            'type' => $notification->getType(),
            'category' => $notification->getCategory(),
            'severity' => $notification->getSeverity(),
            'title' => $notification->getTitle(),
            'body' => $notification->getBody(),
            'actionUrl' => $notification->getActionUrl(),
            'targetRoute' => $notification->getTargetRoute(),
            'requiresAction' => $notification->requiresAction(),
            'isRead' => null !== $notification->getReadAt(),
            'readAt' => $notification->getReadAt()?->format(DATE_ATOM),
            'resolvedAt' => $notification->getResolvedAt()?->format(DATE_ATOM),
            'sourceType' => $notification->getSourceType(),
            'sourceId' => $notification->getSourceId(),
            'metadata' => $notification->getMetadata(),
            'createdAt' => $notification->getCreatedAt()?->format(DATE_ATOM),
            'actor' => $notification->getActor() instanceof User ? [
                'id' => $notification->getActor()?->getId()?->toRfc4122(),
                'name' => $this->userDisplayName($notification->getActor()),
            ] : null,
        ];
    }

    public function topicForUser(User $user): string
    {
        return sprintf('https://kickdeal.local/users/%s/notifications', $user->getId());
    }

    private function userDisplayName(?User $user): string
    {
        if (!$user instanceof User) {
            return 'KickDeal';
        }

        $name = $user->getAgencyName()
            ?: $user->getClubName()
            ?: trim(sprintf('%s %s', $user->getFirstName(), $user->getLastName()));

        return '' !== $name ? $name : 'KickDeal';
    }
}
