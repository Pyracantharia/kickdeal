<?php

namespace App\Entity;

use App\Entity\Traits\TimestampableTrait;
use App\Enum\AgentLicenseStatusEnum;
use App\Repository\AgentLicenseRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: AgentLicenseRepository::class)]
#[ORM\Table(name: '`agent_license`')]
#[UniqueEntity('user', message: 'Une licence d\'agent existe déjà pour cet utilisateur.')]
class AgentLicense
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?Uuid $id = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank(message: 'Le numéro de licence est requis')]
    private ?string $licenseNumber = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $issuedBy = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $validUntil = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $documentUrl = null;

    #[ORM\Column(length: 20, enumType: AgentLicenseStatusEnum::class)]
    #[Assert\NotBlank(message: 'Le statut de la licence est requis')]
    private ?AgentLicenseStatusEnum $status = null;

    #[ORM\OneToOne(inversedBy: 'agentLicense')]
    #[ORM\JoinColumn(nullable: false, unique: true)]
    #[Assert\NotNull(message: 'L\'utilisateur est requis.')]
    private ?Agent $agent = null;

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getLicenseNumber(): ?string
    {
        return $this->licenseNumber;
    }

    public function setLicenseNumber(string $licenseNumber): static
    {
        $this->licenseNumber = $licenseNumber;

        return $this;
    }

    public function getIssuedBy(): ?string
    {
        return $this->issuedBy;
    }

    public function setIssuedBy(?string $issuedBy): static
    {
        $this->issuedBy = $issuedBy;

        return $this;
    }

    public function getValidUntil(): ?\DateTimeInterface
    {
        return $this->validUntil;
    }

    public function setValidUntil(?\DateTimeInterface $validUntil): static
    {
        $this->validUntil = $validUntil;

        return $this;
    }

    public function getDocumentUrl(): ?string
    {
        return $this->documentUrl;
    }

    public function setDocumentUrl(?string $documentUrl): static
    {
        $this->documentUrl = $documentUrl;

        return $this;
    }

    public function getStatus(): ?AgentLicenseStatusEnum
    {
        return $this->status;
    }

    public function setStatus(AgentLicenseStatusEnum $status): static
    {
        $this->status = $status;

        return $this;
    }

    public function getAgent(): ?Agent
    {
        return $this->agent;
    }

    public function setAgent(?Agent $agent): static
    {
        $this->agent = $agent;

        return $this;
    }
}
