<?php

namespace App\Entity\Contract;

use App\Entity\Traits\TimestampableTrait;
use App\Enum\PlayerDecisionStatusEnum;
use App\Repository\Contract\ContractPackageRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: ContractPackageRepository::class)]
#[ORM\Table(name: '`contract_package`')]
#[UniqueEntity(fields: ['contractNegociation', 'acceptedOffer'], message: 'Cet accord de transfert existe déjà.')]
class ContractPackage
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?Uuid $id = null;

    #[ORM\Column(length: 20, enumType: PlayerDecisionStatusEnum::class)]
    #[Assert\NotBlank(message: 'Le statut de la décision du joueur est requis')]
    private ?PlayerDecisionStatusEnum $status = PlayerDecisionStatusEnum::PENDING;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $pdfUrl = null;

    #[ORM\ManyToOne(inversedBy: 'contractPackages')]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull(message: 'La négociation concernée est requise')]
    private ?ContractNegociation $contractNegociation = null;

    #[ORM\OneToOne(inversedBy: 'contractPackage')]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull(message: 'L\'offre acceptée est requise')]
    private ?ContractOffer $acceptedOffer = null;

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getStatus(): ?PlayerDecisionStatusEnum
    {
        return $this->status;
    }

    public function setStatus(?PlayerDecisionStatusEnum $status): static
    {
        $this->status = $status;

        return $this;
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

    public function getContractNegociation(): ?ContractNegociation
    {
        return $this->contractNegociation;
    }

    public function setContractNegociation(?ContractNegociation $contractNegociation): static
    {
        $this->contractNegociation = $contractNegociation;

        return $this;
    }

    public function getAcceptedOffer(): ?ContractOffer
    {
        return $this->acceptedOffer;
    }

    public function setAcceptedOffer(?ContractOffer $acceptedOffer): static
    {
        $this->acceptedOffer = $acceptedOffer;

        return $this;
    }
}
