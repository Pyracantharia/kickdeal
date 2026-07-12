<?php

namespace App\Tests\Functional\Controller;

use App\Tests\Functional\Support\FunctionalTestCase;

final class MessageControllerTest extends FunctionalTestCase
{
    public function testMercureTokenSucceeds(): void
    {
        $this->request('GET', '/api/messages/mercure-token', $this->createUser());

        $this->assertJsonResponseStatus(200);
        self::assertArrayHasKey('topic', $this->responseJson());
    }

    public function testMercureTokenRequiresAuthentication(): void
    {
        $this->request('GET', '/api/messages/mercure-token');

        self::assertSame(401, $this->client->getResponse()->getStatusCode());
    }

    public function testConversationsSucceeds(): void
    {
        $user = $this->createUser();

        $this->request('GET', '/api/messages/conversations', $user);

        $this->assertJsonResponseStatus(200);
        self::assertArrayHasKey('conversations', $this->responseJson());
    }

    public function testConversationsRequiresAuthentication(): void
    {
        $this->request('GET', '/api/messages/conversations');

        self::assertSame(401, $this->client->getResponse()->getStatusCode());
    }

    public function testStartConversationSucceeds(): void
    {
        $user = $this->createUser();
        $recipient = $this->createUser();

        $this->jsonRequest('POST', '/api/messages/conversations', [
            'recipientId' => (string) $recipient->getId(),
        ], $user);

        $this->assertJsonResponseStatus(201);
        self::assertArrayHasKey('conversation', $this->responseJson());
    }

    public function testStartConversationRejectsMissingRecipient(): void
    {
        $this->jsonRequest('POST', '/api/messages/conversations', [], $this->createUser());

        $this->assertJsonResponseStatus(422);
    }

    public function testConversationSucceeds(): void
    {
        $user = $this->createUser();
        $recipient = $this->createUser();
        $conversation = $this->createConversation($user, $recipient);

        $this->request('GET', '/api/messages/conversations/'.$conversation->getId(), $user);

        $this->assertJsonResponseStatus(200);
        self::assertArrayHasKey('messages', $this->responseJson());
    }

    public function testConversationRejectsUnknownConversation(): void
    {
        $this->request('GET', '/api/messages/conversations/00000000-0000-4000-8000-000000000000', $this->createUser());

        $this->assertJsonResponseStatus(404);
    }

    public function testMarkConversationReadSucceeds(): void
    {
        $user = $this->createUser();
        $recipient = $this->createUser();
        $conversation = $this->createConversation($user, $recipient);

        $this->jsonRequest('POST', '/api/messages/conversations/'.$conversation->getId().'/read', [], $user);

        $this->assertJsonResponseStatus(200);
        self::assertArrayHasKey('summary', $this->responseJson());
    }

    public function testMarkConversationReadRejectsUnknownConversation(): void
    {
        $this->jsonRequest('POST', '/api/messages/conversations/00000000-0000-4000-8000-000000000000/read', [], $this->createUser());

        $this->assertJsonResponseStatus(404);
    }

    public function testSendMessageSucceeds(): void
    {
        $user = $this->createUser();
        $recipient = $this->createUser();
        $conversation = $this->createConversation($user, $recipient);

        $this->jsonRequest('POST', '/api/messages/conversations/'.$conversation->getId().'/messages', [
            'content' => 'Hello route.',
        ], $user);

        $this->assertJsonResponseStatus(201);
        self::assertArrayHasKey('message', $this->responseJson());
    }

    public function testSendMessageRejectsEmptyContent(): void
    {
        $user = $this->createUser();
        $recipient = $this->createUser();
        $conversation = $this->createConversation($user, $recipient);

        $this->jsonRequest('POST', '/api/messages/conversations/'.$conversation->getId().'/messages', [
            'content' => '',
        ], $user);

        $this->assertJsonResponseStatus(422);
    }
}
