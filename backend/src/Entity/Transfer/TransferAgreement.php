<?php

namespace App\Entity\Transfer;

use App\Entity\Traits\TimestampableTrait;
use App\Repository\Transfer\TransferAgreementRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: TransferAgreementRepository::class)]
#[ORM\Table(name: '`transfer_agreement`')]
#[UniqueEntity(fields: ['transferNegociation', 'acceptedOffer'], message: 'Cet accord de transfert existe déjà.')]
class TransferAgreement
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?Uuid $id = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $pdfUrl = null;

    #[ORM\ManyToOne(inversedBy: 'transferAgreements')]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull(message: 'La négociation concernée est requise')]
    private ?TransferNegociation $transferNegociation = null;

    #[ORM\OneToOne(inversedBy: 'transferAgreement')]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull(message: 'L\'offre acceptée est requise')]
    private ?TransferOffer $acceptedOffer = null;

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getPdfUrl(): ?string
    {
        return $this->pdfUrl;
    }

    public function setPdfUrl(?string $pdfUrl): static
    {
        $this->pdfUrl = $pdfUrl;

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

    public function getAcceptedOffer(): ?TransferOffer
    {
        return $this->acceptedOffer;
    }

    public function setAcceptedOffer(?TransferOffer $acceptedOffer): static
    {
        $this->acceptedOffer = $acceptedOffer;

        return $this;
    }
}
