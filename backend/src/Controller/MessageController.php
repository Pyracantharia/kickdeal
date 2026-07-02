<?php

namespace App\Controller;

use App\Entity\DirectConversation;
use App\Entity\DirectMessage;
use App\Entity\User;
use App\Repository\DirectConversationRepository;
use App\Repository\DirectMessageRepository;
use App\Repository\UserRepository;
use App\Service\MercurePublisher;
use App\Service\MercureSubscriberTokenFactory;
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

        if (!$conversation instanceof DirectConversation || !$conversation->hasParticipant($user)) {
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

    #[Route('/conversations/{id}/messages', name: 'api_messages_send', methods: ['POST'])]
    public function sendMessage(
        string $id,
        Request $request,
        #[CurrentUser] ?User $user,
        DirectConversationRepository $conversationRepository,
        EntityManagerInterface $entityManager,
        MercurePublisher $mercurePublisher,
        CsrfTokenManagerInterface $csrfTokenManager,
    ): JsonResponse {
        if (!$user instanceof User) {
            return $this->json(['errorMessage' => 'Utilisateur non authentifié.'], 401);
        }

        if ($csrfError = $this->validateCsrfToken($request, $csrfTokenManager)) {
            return $csrfError;
        }

        $conversation = $conversationRepository->find($id);

        if (!$conversation instanceof DirectConversation || !$conversation->hasParticipant($user)) {
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

        $mercurePublisher->publish(
            array_map(fn (User $participant) => $this->userTopic($participant), $participants),
            $payload,
        );

        return $this->json($payload, 201);
    }

    private function userTopic(User $user): string
    {
        return sprintf('https://kickdeal.local/users/%s/messages', $user->getId());
    }

    private function validateCsrfToken(Request $request, CsrfTokenManagerInterface $csrfTokenManager): ?JsonResponse
    {
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
            'participants' => array_map(
                fn (User $participant) => $this->serializeUser($participant),
                array_values(array_filter([$conversation->getParticipantOne(), $conversation->getParticipantTwo()])),
            ),
            'otherParticipant' => ($otherParticipant = $conversation->getOtherParticipant($viewer)) instanceof User
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
        ];
    }
}
