<?php

namespace App\Entity\Contract;

use App\Entity\Agent;
use App\Entity\Player;
use App\Entity\Team;
use App\Entity\Traits\BlameableTrait;
use App\Entity\Traits\TimestampableTrait;
use App\Entity\Transfer\TransferNegociation;
use App\Enum\ContractNegotiationTypeEnum;
use App\Enum\PlayerContractNegociationStatusEnum;
use App\Repository\Contract\ContractNegociationRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: ContractNegociationRepository::class)]
#[ORM\Table(name: '`contract_negociation`')]
class ContractNegociation
{
    use BlameableTrait;
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?Uuid $id = null;

    #[ORM\Column(length: 20, enumType: PlayerContractNegociationStatusEnum::class)]
    #[Assert\NotBlank(message: 'Le statut de la négociation est requis')]
    private ?PlayerContractNegociationStatusEnum $status = PlayerContractNegociationStatusEnum::OPEN;

    #[ORM\Column(length: 20, enumType: ContractNegotiationTypeEnum::class)]
    private ContractNegotiationTypeEnum $type = ContractNegotiationTypeEnum::TRANSFER;

    #[ORM\Column(options: ['default' => false])]
    private bool $publicFeedEnabled = false;

    #[ORM\ManyToOne(inversedBy: 'contractNegociations')]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull(message: 'Le joueur est requis')]
    private ?Player $player = null;

    #[ORM\ManyToOne(inversedBy: 'contractNegociations')]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull(message: 'L\'équipe acheteuse est requise')]
    private ?Team $buyerTeam = null;

    #[ORM\ManyToOne(inversedBy: 'contractNegociations')]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull(message: 'L\'agent est requis')]
    private ?Agent $agent = null;

    #[ORM\ManyToOne(inversedBy: 'contractNegociations')]
    #[ORM\JoinColumn(nullable: true)]
    private ?TransferNegociation $transferNegociation = null;

    /**
     * @return Collection<int, ContractOffer>
     */
    #[ORM\OneToMany(targetEntity: ContractOffer::class, mappedBy: 'contractNegociation')]
    private Collection $contractOffers;

    #[ORM\OneToMany(targetEntity: ContractMessage::class, mappedBy: 'contractNegociation')]
    private Collection $contractMessages;

    #[ORM\OneToMany(targetEntity: ContractPackage::class, mappedBy: 'contractNegociation')]
    private Collection $contractPackages;

    public function __construct()
    {
        $this->contractOffers = new ArrayCollection();
        $this->contractMessages = new ArrayCollection();
        $this->contractPackages = new ArrayCollection();
    }

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getStatus(): ?PlayerContractNegociationStatusEnum
    {
        return $this->status;
    }

    public function setStatus(?PlayerContractNegociationStatusEnum $status): static
    {
        $this->status = $status;

        return $this;
    }

    public function getType(): ContractNegotiationTypeEnum
    {
        return $this->type;
    }

    public function setType(ContractNegotiationTypeEnum $type): static
    {
        $this->type = $type;

        return $this;
    }

    public function isPublicFeedEnabled(): bool
    {
        return $this->publicFeedEnabled;
    }

    public function setPublicFeedEnabled(bool $publicFeedEnabled): static
    {
        $this->publicFeedEnabled = $publicFeedEnabled;

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

    public function getBuyerTeam(): ?Team
    {
        return $this->buyerTeam;
    }

    public function setBuyerTeam(?Team $buyerTeam): static
    {
        $this->buyerTeam = $buyerTeam;

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

    public function getTransferNegociation(): ?TransferNegociation
    {
        return $this->transferNegociation;
    }

    public function setTransferNegociation(?TransferNegociation $transferNegociation): static
    {
        $this->transferNegociation = $transferNegociation;

        return $this;
    }

    /**
     * @return Collection<int, ContractOffer>
     */
    public function getContractOffers(): Collection
    {
        return $this->contractOffers;
    }

    public function addContractOffer(ContractOffer $contractOffer): static
    {
        if (!$this->contractOffers->contains($contractOffer)) {
            $this->contractOffers->add($contractOffer);
            $contractOffer->setContractNegociation($this);
        }

        return $this;
    }

    public function removeContractOffer(ContractOffer $contractOffer): static
    {
        if ($this->contractOffers->removeElement($contractOffer)) {
            // set the owning side to null (unless already changed)
            if ($contractOffer->getContractNegociation() === $this) {
                $contractOffer->setContractNegociation(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, ContractMessage>
     */
    public function getContractMessages(): Collection
    {
        return $this->contractMessages;
    }

    public function addContractMessage(ContractMessage $contractMessage): static
    {
        if (!$this->contractMessages->contains($contractMessage)) {
            $this->contractMessages->add($contractMessage);
            $contractMessage->setContractNegociation($this);
        }

        return $this;
    }

    public function removeContractMessage(ContractMessage $contractMessage): static
    {
        if ($this->contractMessages->removeElement($contractMessage)) {
            // set the owning side to null (unless already changed)
            if ($contractMessage->getContractNegociation() === $this) {
                $contractMessage->setContractNegociation(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, ContractPackage>
     */
    public function getContractPackages(): Collection
    {
        return $this->contractPackages;
    }

    public function addContractPackage(ContractPackage $contractPackage): static
    {
        if (!$this->contractPackages->contains($contractPackage)) {
            $this->contractPackages->add($contractPackage);
            $contractPackage->setContractNegociation($this);
        }

        return $this;
    }

    public function removeContractPackage(ContractPackage $contractPackage): static
    {
        if ($this->contractPackages->removeElement($contractPackage)) {
            // set the owning side to null (unless already changed)
            if ($contractPackage->getContractNegociation() === $this) {
                $contractPackage->setContractNegociation(null);
            }
        }

        return $this;
    }
}
