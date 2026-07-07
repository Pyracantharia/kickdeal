<?php

namespace App\Entity;

use App\Enum\PlayerAgentRequestStatusEnum;
use App\Enum\PlayerAgentRequestTypeEnum;
use App\Repository\PlayerAgentRequestRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: PlayerAgentRequestRepository::class)]
#[ORM\HasLifecycleCallbacks]
class PlayerAgentRequest
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    private ?Uuid $id = null;

    #[ORM\ManyToOne(targetEntity: Agent::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Agent $agent = null;

    #[ORM\ManyToOne(targetEntity: Player::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Player $player = null;

    #[ORM\Column(enumType: PlayerAgentRequestStatusEnum::class)]
    private PlayerAgentRequestStatusEnum $status = PlayerAgentRequestStatusEnum::PENDING;

    #[ORM\Column(length: 30, enumType: PlayerAgentRequestTypeEnum::class, options: ['default' => 'representation'])]
    private PlayerAgentRequestTypeEnum $type = PlayerAgentRequestTypeEnum::REPRESENTATION;

    #[ORM\ManyToOne(targetEntity: Agent::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'CASCADE')]
    private ?Agent $currentAgent = null;

    #[ORM\Column(length: 255)]
    private ?string $verificationDocumentPath = null;

    #[ORM\Column(length: 255)]
    private ?string $verificationDocumentOriginalName = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $message = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $decidedAt = null;

    public function __construct()
    {
        $this->id = Uuid::v6();
    }

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $now = new \DateTimeImmutable();
        $this->createdAt ??= $now;
        $this->updatedAt ??= $now;
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getAgent(): ?Agent
    {
        return $this->agent;
    }

    public function setAgent(Agent $agent): static
    {
        $this->agent = $agent;

        return $this;
    }

    public function getPlayer(): ?Player
    {
        return $this->player;
    }

    public function setPlayer(Player $player): static
    {
        $this->player = $player;

        return $this;
    }

    public function getStatus(): PlayerAgentRequestStatusEnum
    {
        return $this->status;
    }

    public function setStatus(PlayerAgentRequestStatusEnum $status): static
    {
        $this->status = $status;

        return $this;
    }

    public function getType(): PlayerAgentRequestTypeEnum
    {
        return $this->type;
    }

    public function setType(PlayerAgentRequestTypeEnum $type): static
    {
        $this->type = $type;

        return $this;
    }

    public function getCurrentAgent(): ?Agent
    {
        return $this->currentAgent;
    }

    public function setCurrentAgent(?Agent $currentAgent): static
    {
        $this->currentAgent = $currentAgent;

        return $this;
    }

    public function getVerificationDocumentPath(): ?string
    {
        return $this->verificationDocumentPath;
    }

    public function setVerificationDocumentPath(string $path): static
    {
        $this->verificationDocumentPath = $path;

        return $this;
    }

    public function getVerificationDocumentOriginalName(): ?string
    {
        return $this->verificationDocumentOriginalName;
    }

    public function setVerificationDocumentOriginalName(string $name): static
    {
        $this->verificationDocumentOriginalName = $name;

        return $this;
    }

    public function getMessage(): ?string
    {
        return $this->message;
    }

    public function setMessage(?string $message): static
    {
        $this->message = $message;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function getDecidedAt(): ?\DateTimeImmutable
    {
        return $this->decidedAt;
    }

    public function setDecidedAt(?\DateTimeImmutable $decidedAt): static
    {
        $this->decidedAt = $decidedAt;

        return $this;
    }
}
