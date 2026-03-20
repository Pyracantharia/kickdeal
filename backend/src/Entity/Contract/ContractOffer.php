<?php

namespace App\Entity\Contract;

use App\Entity\Traits\TimestampableTrait;
use App\Entity\User;
use App\Enum\OfferStatusEnum;
use App\Repository\Contract\ContractOfferRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: ContractOfferRepository::class)]
#[ORM\Table(name: '`contract_offer`')]
class ContractOffer
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?Uuid $id = null;

    // Value in cents
    #[ORM\Column(type: Types::INTEGER)]
    #[Assert\NotBlank(message: 'Le montant de l\'offre est requis')]
    private ?int $annualSalary = null;

    #[ORM\Column(type: Types::INTEGER)]
    #[Assert\NotBlank(message: 'La durée en mois du contrat est requise')]
    private ?int $durationMonths = null;

    // Value in cents
    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    private ?int $signingBonus = null;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $validUntil = null;

    #[ORM\Column(length: 20, enumType: OfferStatusEnum::class)]
    #[Assert\NotBlank(message: 'Le statut de l\'offre est requis')]
    private ?OfferStatusEnum $status = OfferStatusEnum::PENDING;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $notes = null;

    #[ORM\ManyToOne(inversedBy: 'contractOffers')]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull(message: 'La négociation concernée est requise')]
    private ?ContractNegociation $contractNegociation = null;

    #[ORM\ManyToOne(inversedBy: 'contractOffers')]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull(message: 'L\'auteur de l\'offre est requis')]
    private ?User $author = null;

    #[ORM\OneToOne(mappedBy: 'acceptedOffer')]
    private ?ContractPackage $contractPackage = null;

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getAnnualSalary(): ?int
    {
        return $this->annualSalary;
    }

    public function setAnnualSalary(?int $annualSalary): static
    {
        $this->annualSalary = $annualSalary;

        return $this;
    }

    public function getDurationMonths(): ?int
    {
        return $this->durationMonths;
    }

    public function setDurationMonths(?int $durationMonths): static
    {
        $this->durationMonths = $durationMonths;

        return $this;
    }

    public function getSigningBonus(): ?int
    {
        return $this->signingBonus;
    }

    public function setSigningBonus(?int $signingBonus): static
    {
        $this->signingBonus = $signingBonus;

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

    public function getStatus(): ?OfferStatusEnum
    {
        return $this->status;
    }

    public function setStatus(?OfferStatusEnum $status): static
    {
        $this->status = $status;

        return $this;
    }

    public function getNotes(): ?string
    {
        return $this->notes;
    }

    public function setNotes(?string $notes): static
    {
        $this->notes = $notes;

        return $this;
    }

    public function getContractNegociation(): ?ContractNegociation
    {
        return $this->contractNegociation;
    }

    public function setContractNegociation(?ContractNegociation $contractNegociation): static
    {
        $this->contractNegociation = $contractNegociation;

        return $this;
    }

    public function getAuthor(): ?User
    {
        return $this->author;
    }

    public function setAuthor(?User $author): static
    {
        $this->author = $author;

        return $this;
    }

    public function getContractPackage(): ?ContractPackage
    {
        return $this->contractPackage;
    }

    public function setContractPackage(?ContractPackage $contractPackage): static
    {
        $this->contractPackage = $contractPackage;

        return $this;
    }
}
