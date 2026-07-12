<?php

namespace App\Entity;

use App\Entity\Traits\TimestampableTrait;
use App\Enum\ClubRequestStatusEnum;
use App\Repository\ClubRequestRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: ClubRequestRepository::class)]
#[ORM\Table(name: '`club_request`')]
class ClubRequest
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    #[Groups(['admin:club_request:read'])]
    private ?Uuid $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['admin:club_request:read'])]
    private ?User $requester = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['admin:club_request:read'])]
    private ?Team $team = null;

    #[ORM\Column(length: 20, enumType: ClubRequestStatusEnum::class)]
    #[Groups(['admin:club_request:read'])]
    private ClubRequestStatusEnum $status = ClubRequestStatusEnum::PENDING;

    #[ORM\Column(length: 320, nullable: true)]
    #[Groups(['admin:club_request:read'])]
    private ?string $verificationEmail = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['admin:club_request:read'])]
    private ?string $verificationMessage = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['admin:club_request:read'])]
    private ?string $verificationDocumentPath = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['admin:club_request:read'])]
    private ?string $verificationDocumentOriginalName = null;

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getRequester(): ?User
    {
        return $this->requester;
    }

    public function setRequester(?User $requester): static
    {
        $this->requester = $requester;

        return $this;
    }

    public function getTeam(): ?Team
    {
        return $this->team;
    }

    public function setTeam(?Team $team): static
    {
        $this->team = $team;

        return $this;
    }

    public function getStatus(): ClubRequestStatusEnum
    {
        return $this->status;
    }

    public function setStatus(ClubRequestStatusEnum $status): static
    {
        $this->status = $status;

        return $this;
    }

    public function getVerificationEmail(): ?string
    {
        return $this->verificationEmail;
    }

    public function setVerificationEmail(?string $verificationEmail): static
    {
        $this->verificationEmail = $verificationEmail;

        return $this;
    }

    public function getVerificationMessage(): ?string
    {
        return $this->verificationMessage;
    }

    public function setVerificationMessage(?string $verificationMessage): static
    {
        $this->verificationMessage = $verificationMessage;

        return $this;
    }

    public function getVerificationDocumentPath(): ?string
    {
        return $this->verificationDocumentPath;
    }

    public function setVerificationDocumentPath(?string $verificationDocumentPath): static
    {
        $this->verificationDocumentPath = $verificationDocumentPath;

        return $this;
    }

    public function getVerificationDocumentOriginalName(): ?string
    {
        return $this->verificationDocumentOriginalName;
    }

    public function setVerificationDocumentOriginalName(?string $verificationDocumentOriginalName): static
    {
        $this->verificationDocumentOriginalName = $verificationDocumentOriginalName;

        return $this;
    }
}