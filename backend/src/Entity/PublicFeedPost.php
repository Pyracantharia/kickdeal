<?php

namespace App\Entity;

use App\Entity\Traits\TimestampableTrait;
use App\Repository\PublicFeedPostRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: PublicFeedPostRepository::class)]
#[ORM\Table(name: '`public_feed_post`')]
#[ORM\UniqueConstraint(name: 'uniq_public_feed_source_event', columns: ['source_type', 'source_id', 'event_type'])]
#[ORM\Index(name: 'idx_public_feed_bucket_published', columns: ['bucket', 'published_at'])]
#[ORM\Index(name: 'idx_public_feed_type_published', columns: ['event_type', 'published_at'])]
class PublicFeedPost
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?Uuid $id = null;

    #[ORM\Column(length: 40)]
    private string $eventType = '';

    #[ORM\Column(length: 20)]
    private string $bucket = 'live';

    #[ORM\Column(length: 60)]
    private string $sourceType = '';

    #[ORM\Column(length: 120)]
    private string $sourceId = '';

    #[ORM\Column(options: ['default' => false])]
    private bool $isFeatured = false;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $publishedAt;

    #[ORM\Column(length: 180)]
    private string $headline = '';

    #[ORM\Column(type: Types::TEXT)]
    private string $body = '';

    #[ORM\Column(length: 120, nullable: true)]
    private ?string $playerName = null;

    #[ORM\ManyToOne]
    private ?Player $player = null;

    #[ORM\ManyToOne]
    private ?Team $sellerTeam = null;

    #[ORM\ManyToOne]
    private ?Team $buyerTeam = null;

    #[ORM\Column(type: Types::BIGINT, nullable: true)]
    private ?string $amount = null;

    #[ORM\Column(length: 3)]
    private string $currency = 'EUR';

    /**
     * @var array<string, mixed>
     */
    #[ORM\Column(type: Types::JSON)]
    private array $detailsJson = [];

    #[ORM\Column(length: 120, nullable: true)]
    private ?string $league = null;

    #[ORM\Column(length: 120, nullable: true)]
    private ?string $country = null;

    public function __construct()
    {
        $this->publishedAt = new \DateTimeImmutable();
    }

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getEventType(): string
    {
        return $this->eventType;
    }

    public function setEventType(string $eventType): static
    {
        $this->eventType = $eventType;

        return $this;
    }

    public function getBucket(): string
    {
        return $this->bucket;
    }

    public function setBucket(string $bucket): static
    {
        $this->bucket = $bucket;

        return $this;
    }

    public function getSourceType(): string
    {
        return $this->sourceType;
    }

    public function setSourceType(string $sourceType): static
    {
        $this->sourceType = $sourceType;

        return $this;
    }

    public function getSourceId(): string
    {
        return $this->sourceId;
    }

    public function setSourceId(string $sourceId): static
    {
        $this->sourceId = $sourceId;

        return $this;
    }

    public function isFeatured(): bool
    {
        return $this->isFeatured;
    }

    public function setIsFeatured(bool $isFeatured): static
    {
        $this->isFeatured = $isFeatured;

        return $this;
    }

    public function getPublishedAt(): \DateTimeImmutable
    {
        return $this->publishedAt;
    }

    public function setPublishedAt(\DateTimeImmutable $publishedAt): static
    {
        $this->publishedAt = $publishedAt;

        return $this;
    }

    public function getHeadline(): string
    {
        return $this->headline;
    }

    public function setHeadline(string $headline): static
    {
        $this->headline = $headline;

        return $this;
    }

    public function getBody(): string
    {
        return $this->body;
    }

    public function setBody(string $body): static
    {
        $this->body = $body;

        return $this;
    }

    public function getPlayerName(): ?string
    {
        return $this->playerName;
    }

    public function setPlayerName(?string $playerName): static
    {
        $this->playerName = $playerName;

        return $this;
    }

    public function getPlayer(): ?Player
    {
        return $this->player;
    }

    public function setPlayer(?Player $player): static
    {
        $this->player = $player;

        return $this;
    }

    public function getSellerTeam(): ?Team
    {
        return $this->sellerTeam;
    }

    public function setSellerTeam(?Team $sellerTeam): static
    {
        $this->sellerTeam = $sellerTeam;

        return $this;
    }

    public function getBuyerTeam(): ?Team
    {
        return $this->buyerTeam;
    }

    public function setBuyerTeam(?Team $buyerTeam): static
    {
        $this->buyerTeam = $buyerTeam;

        return $this;
    }

    public function getAmount(): ?int
    {
        return null === $this->amount ? null : (int) $this->amount;
    }

    public function setAmount(?int $amount): static
    {
        $this->amount = null === $amount ? null : (string) $amount;

        return $this;
    }

    public function getCurrency(): string
    {
        return $this->currency;
    }

    public function setCurrency(string $currency): static
    {
        $this->currency = $currency;

        return $this;
    }

    /**
     * @return array<string, mixed>
     */
    public function getDetailsJson(): array
    {
        return $this->detailsJson;
    }

    /**
     * @param array<string, mixed> $detailsJson
     */
    public function setDetailsJson(array $detailsJson): static
    {
        $this->detailsJson = $detailsJson;

        return $this;
    }

    public function getLeague(): ?string
    {
        return $this->league;
    }

    public function setLeague(?string $league): static
    {
        $this->league = $league;

        return $this;
    }

    public function getCountry(): ?string
    {
        return $this->country;
    }

    public function setCountry(?string $country): static
    {
        $this->country = $country;

        return $this;
    }
}
