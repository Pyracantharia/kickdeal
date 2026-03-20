<?php

namespace App\Entity;

use App\Entity\Traits\BlameableTrait;
use App\Entity\Traits\TimestampableTrait;
use App\Entity\Transfer\TransferNegociation;
use App\Enum\ListingStatusEnum;
use App\Enum\TransferTypeEnum;
use App\Repository\ListingRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: ListingRepository::class)]
#[ORM\Table(name: '`listing`')]
class Listing
{
    use BlameableTrait;
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?Uuid $id = null;

    // TODO : Nullable ?
    // Value in cents
    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    private ?int $askingPrice = null;

    #[ORM\Column(length: 20, enumType: TransferTypeEnum::class)]
    #[Assert\NotBlank(message: 'Le type de transfert est requis')]
    private ?TransferTypeEnum $transferType = null;

    #[ORM\Column(length: 20, enumType: ListingStatusEnum::class)]
    #[Assert\NotBlank(message: 'Le statut de l\'annonce est requis')]
    private ?ListingStatusEnum $status = null;

    #[ORM\OneToOne(inversedBy: 'listing')]
    #[Assert\NotNull(message: 'Le joueur est requis')]
    private ?Player $player = null;

    #[ORM\ManyToOne(inversedBy: 'listings')]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull(message: 'Le vendeur est requis')]
    private ?Team $sellerTeam = null;

    /**
     * @var Collection<int, TransferNegociation>
     */
    #[ORM\OneToMany(targetEntity: TransferNegociation::class, mappedBy: 'listing')]
    private Collection $transferNegociations;

    public function __construct()
    {
        $this->transferNegociations = new ArrayCollection();
    }

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getAskingPrice(): ?int
    {
        return $this->askingPrice;
    }

    public function setAskingPrice(?int $askingPrice): static
    {
        $this->askingPrice = $askingPrice;

        return $this;
    }

    public function getTransferType(): ?TransferTypeEnum
    {
        return $this->transferType;
    }

    public function setTransferType(?TransferTypeEnum $transferType): static
    {
        $this->transferType = $transferType;

        return $this;
    }

    public function getStatus(): ?ListingStatusEnum
    {
        return $this->status;
    }

    public function setStatus(?ListingStatusEnum $status): static
    {
        $this->status = $status;

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

    /**
     * @return Collection<int, TransferNegociation>
     */
    public function getTransferNegociations(): Collection
    {
        return $this->transferNegociations;
    }

    public function addTransferNegociation(TransferNegociation $transferNegociation): static
    {
        if (!$this->transferNegociations->contains($transferNegociation)) {
            $this->transferNegociations->add($transferNegociation);
            $transferNegociation->setListing($this);
        }

        return $this;
    }

    public function removeTransferNegociation(TransferNegociation $transferNegociation): static
    {
        if ($this->transferNegociations->removeElement($transferNegociation)) {
            $transferNegociation->setListing(null);
        }

        return $this;
    }
}
