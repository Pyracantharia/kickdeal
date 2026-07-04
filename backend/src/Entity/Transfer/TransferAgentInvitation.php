<?php

namespace App\Entity\Transfer;

use App\Entity\Agent;
use App\Entity\Traits\TimestampableTrait;
use App\Entity\User;
use App\Repository\Transfer\TransferAgentInvitationRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: TransferAgentInvitationRepository::class)]
#[ORM\Table(name: '`transfer_agent_invitation`')]
#[ORM\UniqueConstraint(name: 'UNIQ_TRANSFER_AGENT_INVITATION_TOKEN', columns: ['token'])]
class TransferAgentInvitation
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?Uuid $id = null;

    #[ORM\Column(length: 180)]
    #[Assert\Email]
    private ?string $email = null;

    #[ORM\Column(length: 80)]
    private ?string $token = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $acceptedAt = null;

    #[ORM\ManyToOne(inversedBy: 'agentInvitations')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?TransferNegociation $transferNegociation = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $invitedBy = null;

    #[ORM\ManyToOne]
    private ?Agent $acceptedBy = null;

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(?string $email): static
    {
        $this->email = null === $email ? null : mb_strtolower(trim($email));

        return $this;
    }

    public function getToken(): ?string
    {
        return $this->token;
    }

    public function setToken(?string $token): static
    {
        $this->token = $token;

        return $this;
    }

    public function getAcceptedAt(): ?\DateTimeImmutable
    {
        return $this->acceptedAt;
    }

    public function setAcceptedAt(?\DateTimeImmutable $acceptedAt): static
    {
        $this->acceptedAt = $acceptedAt;

        return $this;
    }

    public function getTransferNegociation(): ?TransferNegociation
    {
        return $this->transferNegociation;
    }

    public function setTransferNegociation(?TransferNegociation $transferNegociation): static
    {
        $this->transferNegociation = $transferNegociation;

        return $this;
    }

    public function getInvitedBy(): ?User
    {
        return $this->invitedBy;
    }

    public function setInvitedBy(?User $invitedBy): static
    {
        $this->invitedBy = $invitedBy;

        return $this;
    }

    public function getAcceptedBy(): ?Agent
    {
        return $this->acceptedBy;
    }

    public function setAcceptedBy(?Agent $acceptedBy): static
    {
        $this->acceptedBy = $acceptedBy;

        return $this;
    }
}
