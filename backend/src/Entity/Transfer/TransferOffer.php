<?php

namespace App\Entity\Transfer;

use App\Entity\Traits\TimestampableTrait;
use App\Entity\User;
use App\Enum\OfferStatusEnum;
use App\Enum\TransferOfferKindEnum;
use App\Repository\Transfer\TransferOfferRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: TransferOfferRepository::class)]
#[ORM\Table(name: '`transfer_offer`')]
class TransferOffer
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?Uuid $id = null;

    #[ORM\Column(length: 20, enumType: TransferOfferKindEnum::class)]
    #[Assert\NotBlank(message: 'Le statut de l\'offre est requis')]
    private ?TransferOfferKindEnum $kind = null; // TODO : Valeur par défaut ?

    // Value in cents
    #[ORM\Column(type: Types::INTEGER)]
    #[Assert\NotBlank(message: 'Le montant de l\'offre est requis')]
    private ?int $amount = null;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $validUntil = null;

    #[ORM\Column(length: 20, enumType: OfferStatusEnum::class)]
    #[Assert\NotBlank(message: 'Le statut de l\'offre est requis')]
    private ?OfferStatusEnum $status = OfferStatusEnum::PENDING;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $message = null;

    #[ORM\ManyToOne(inversedBy: 'transferOffers')]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull(message: 'La négociation concernée est requise')]
    private ?TransferNegociation $transferNegociation = null;

    #[ORM\ManyToOne(inversedBy: 'transferOffers')]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull(message: 'L\'auteur de l\'offre est requis')]
    private ?User $author = null;

    #[ORM\OneToOne(mappedBy: 'acceptedOffer')]
    private ?TransferAgreement $transferAgreement = null;

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getKind(): ?TransferOfferKindEnum
    {
        return $this->kind;
    }

    public function setKind(?TransferOfferKindEnum $kind): static
    {
        $this->kind = $kind;

        return $this;
    }

    public function getAmount(): ?int
    {
        return $this->amount;
    }

    public function setAmount(?int $amount): static
    {
        $this->amount = $amount;

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

    public function getMessage(): ?string
    {
        return $this->message;
    }

    public function setMessage(?string $message): static
    {
        $this->message = $message;

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

    public function getAuthor(): ?User
    {
        return $this->author;
    }

    public function setAuthor(?User $author): static
    {
        $this->author = $author;

        return $this;
    }

    public function getTransferAgreement(): ?TransferAgreement
    {
        return $this->transferAgreement;
    }

    public function setTransferAgreement(?TransferAgreement $transferAgreement): static
    {
        $this->transferAgreement = $transferAgreement;

        return $this;
    }
}
