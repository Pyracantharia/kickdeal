<?php

namespace App\Entity;

use App\Entity\Traits\TimestampableTrait;
use App\Repository\DirectConversationRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: DirectConversationRepository::class)]
#[ORM\Table(name: '`direct_conversation`')]
#[ORM\UniqueConstraint(name: 'UNIQ_DIRECT_CONVERSATION_PARTICIPANTS', columns: ['participant_low_id', 'participant_high_id'])]
class DirectConversation
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?Uuid $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $participantOne = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $participantTwo = null;

    #[ORM\Column(type: UuidType::NAME)]
    private ?Uuid $participantLowId = null;

    #[ORM\Column(type: UuidType::NAME)]
    private ?Uuid $participantHighId = null;

    #[ORM\Column(length: 30, options: ['default' => 'direct'])]
    private string $type = 'direct';

    /**
     * @var Collection<int, DirectMessage>
     */
    #[ORM\OneToMany(targetEntity: DirectMessage::class, mappedBy: 'conversation', orphanRemoval: true)]
    #[ORM\OrderBy(['createdAt' => 'ASC'])]
    private Collection $messages;

    public function __construct()
    {
        $this->messages = new ArrayCollection();
    }

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getParticipantOne(): ?User
    {
        return $this->participantOne;
    }

    public function setParticipantOne(?User $participantOne): static
    {
        $this->participantOne = $participantOne;

        return $this;
    }

    public function getParticipantTwo(): ?User
    {
        return $this->participantTwo;
    }

    public function setParticipantTwo(?User $participantTwo): static
    {
        $this->participantTwo = $participantTwo;

        return $this;
    }

    public function getParticipantLowId(): ?Uuid
    {
        return $this->participantLowId;
    }

    public function setParticipantLowId(?Uuid $participantLowId): static
    {
        $this->participantLowId = $participantLowId;

        return $this;
    }

    public function getParticipantHighId(): ?Uuid
    {
        return $this->participantHighId;
    }

    public function setParticipantHighId(?Uuid $participantHighId): static
    {
        $this->participantHighId = $participantHighId;

        return $this;
    }

    public function getType(): string
    {
        return $this->type;
    }

    public function setType(string $type): static
    {
        $this->type = $type;

        return $this;
    }

    public function isSupport(): bool
    {
        return 'support' === $this->type;
    }

    /**
     * @return Collection<int, DirectMessage>
     */
    public function getMessages(): Collection
    {
        return $this->messages;
    }

    public function addMessage(DirectMessage $message): static
    {
        if (!$this->messages->contains($message)) {
            $this->messages->add($message);
            $message->setConversation($this);
        }

        return $this;
    }

    public function hasParticipant(User $user): bool
    {
        $userId = (string) $user->getId();

        return $userId === (string) $this->participantOne?->getId()
            || $userId === (string) $this->participantTwo?->getId();
    }

    public function getOtherParticipant(User $user): ?User
    {
        if ((string) $user->getId() === (string) $this->participantOne?->getId()) {
            return $this->participantTwo;
        }

        if ((string) $user->getId() === (string) $this->participantTwo?->getId()) {
            return $this->participantOne;
        }

        return null;
    }
}
