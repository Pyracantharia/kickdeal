<?php

namespace App\Tests\Functional\Controller;

use App\Enum\TransferTypeEnum;
use App\Tests\Functional\Support\FunctionalTestCase;

final class ListingControllerTest extends FunctionalTestCase
{
    public function testMineSucceeds(): void
    {
        [$user] = $this->createClubUser();

        $this->request('GET', '/api/listings/mine', $user);

        $this->assertJsonResponseStatus(200);
        self::assertArrayHasKey('listings', $this->responseJson());
    }

    public function testMineRequiresAuthentication(): void
    {
        $this->request('GET', '/api/listings/mine');

        self::assertSame(401, $this->client->getResponse()->getStatusCode());
    }

    public function testCreateSucceeds(): void
    {
        [$user] = $this->createClubUser();
        $sellerTeam = $this->createTeam();
        $player = $this->createPlayer($sellerTeam);

        $this->jsonRequest('POST', '/api/listings', [
            'playerId' => (string) $player->getId(),
            'transferType' => TransferTypeEnum::PERMANENT->value,
            'askingPrice' => 1000000,
        ], $user);

        $this->assertJsonResponseStatus(201);
        self::assertArrayHasKey('listing', $this->responseJson());
    }

    public function testCreateRejectsMissingPlayer(): void
    {
        [$user] = $this->createClubUser();

        $this->jsonRequest('POST', '/api/listings', [], $user);

        $this->assertJsonResponseStatus(400);
    }
}
