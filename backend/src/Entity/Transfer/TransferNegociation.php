<?php

namespace App\Entity\Transfer;

use App\Entity\Contract\ContractNegociation;
use App\Entity\Listing;
use App\Entity\Team;
use App\Entity\Traits\BlameableTrait;
use App\Entity\Traits\TimestampableTrait;
use App\Enum\TransferNegociationStatusEnum;
use App\Repository\Transfer\TransferNegociationRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: TransferNegociationRepository::class)]
#[ORM\Table(name: '`transfer_negociation`')]
#[UniqueEntity(fields: ['listing', 'buyerTeam'], message: 'Une négociation existe déjà pour ce listing et cette équipe acheteuse.')]
class TransferNegociation
{
    use BlameableTrait;
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?Uuid $id = null;

    #[ORM\Column(length: 20, enumType: TransferNegociationStatusEnum::class)]
    #[Assert\NotBlank(message: 'Le statut de la négociation est requis')]
    private ?TransferNegociationStatusEnum $status = TransferNegociationStatusEnum::OPEN;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $permissionToSpeakAt = null;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $agreedAt = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $externalContractBuyerConfirmedAt = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $externalContractSellerConfirmedAt = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $sellerClubExternalContactedAt = null;

    #[ORM\Column(type: Types::BIGINT, nullable: true)]
    private ?string $externalContractWeeklySalary = null;

    #[ORM\Column(nullable: true)]
    private ?int $externalContractDurationMonths = null;

    #[ORM\Column(options: ['default' => false])]
    private bool $publicFeedEnabled = false;

    #[ORM\ManyToOne(inversedBy: 'transferNegociations')]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull(message: 'Le listing est requis')]
    private ?Listing $listing = null;

    #[ORM\ManyToOne(inversedBy: 'transferNegociations')]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull(message: 'L\'équipe acheteuse est requise')]
    private ?Team $buyerTeam = null;

    /**
     * @var Collection<int, TransferOffer>
     */
    #[ORM\OneToMany(targetEntity: TransferOffer::class, mappedBy: 'transferNegociation')]
    private Collection $transferOffers;

    /**
     * @var Collection<int, TransferMessage>
     */
    #[ORM\OneToMany(targetEntity: TransferMessage::class, mappedBy: 'transferNegociation')]
    private Collection $transferMessages;

    /**
     * @var Collection<int, TransferAgreement>
     */
    #[ORM\OneToMany(targetEntity: TransferAgreement::class, mappedBy: 'transferNegociation')]
    private Collection $transferAgreements;

    /**
     * @return Collection<int, ContractNegociation>
     */
    #[ORM\OneToMany(targetEntity: ContractNegociation::class, mappedBy: 'transferNegociation')]
    private Collection $contractNegociations;

    /**
     * @var Collection<int, TransferAgentInvitation>
     */
    #[ORM\OneToMany(targetEntity: TransferAgentInvitation::class, mappedBy: 'transferNegociation')]
    private Collection $agentInvitations;

    /**
     * @var Collection<int, TransferClubInvitation>
     */
    #[ORM\OneToMany(targetEntity: TransferClubInvitation::class, mappedBy: 'transferNegociation')]
    private Collection $clubInvitations;

    public function __construct()
    {
        $this->transferOffers = new ArrayCollection();
        $this->transferMessages = new ArrayCollection();
        $this->transferAgreements = new ArrayCollection();
        $this->contractNegociations = new ArrayCollection();
        $this->agentInvitations = new ArrayCollection();
        $this->clubInvitations = new ArrayCollection();
    }

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getStatus(): ?TransferNegociationStatusEnum
    {
        return $this->status;
    }

    public function setStatus(?TransferNegociationStatusEnum $status): static
    {
        $this->status = $status;

        return $this;
    }

    public function getPermissionToSpeakAt(): ?\DateTimeInterface
    {
        return $this->permissionToSpeakAt;
    }

    public function setPermissionToSpeakAt(?\DateTimeInterface $permissionToSpeakAt): static
    {
        $this->permissionToSpeakAt = $permissionToSpeakAt;

        return $this;
    }

    public function getAgreedAt(): ?\DateTimeInterface
    {
        return $this->agreedAt;
    }

    public function setAgreedAt(?\DateTimeInterface $agreedAt): static
    {
        $this->agreedAt = $agreedAt;

        return $this;
    }

    public function getExternalContractBuyerConfirmedAt(): ?\DateTimeImmutable
    {
        return $this->externalContractBuyerConfirmedAt;
    }

    public function setExternalContractBuyerConfirmedAt(?\DateTimeImmutable $externalContractBuyerConfirmedAt): static
    {
        $this->externalContractBuyerConfirmedAt = $externalContractBuyerConfirmedAt;

        return $this;
    }

    public function getExternalContractSellerConfirmedAt(): ?\DateTimeImmutable
    {
        return $this->externalContractSellerConfirmedAt;
    }

    public function setExternalContractSellerConfirmedAt(?\DateTimeImmutable $externalContractSellerConfirmedAt): static
    {
        $this->externalContractSellerConfirmedAt = $externalContractSellerConfirmedAt;

        return $this;
    }

    public function getSellerClubExternalContactedAt(): ?\DateTimeImmutable
    {
        return $this->sellerClubExternalContactedAt;
    }

    public function setSellerClubExternalContactedAt(?\DateTimeImmutable $sellerClubExternalContactedAt): static
    {
        $this->sellerClubExternalContactedAt = $sellerClubExternalContactedAt;

        return $this;
    }

    public function getExternalContractWeeklySalary(): ?int
    {
        return null === $this->externalContractWeeklySalary ? null : (int) $this->externalContractWeeklySalary;
    }

    public function setExternalContractWeeklySalary(?int $externalContractWeeklySalary): static
    {
        $this->externalContractWeeklySalary = null === $externalContractWeeklySalary ? null : (string) $externalContractWeeklySalary;

        return $this;
    }

    public function getExternalContractDurationMonths(): ?int
    {
        return $this->externalContractDurationMonths;
    }

    public function setExternalContractDurationMonths(?int $externalContractDurationMonths): static
    {
        $this->externalContractDurationMonths = $externalContractDurationMonths;

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

    public function getListing(): ?Listing
    {
        return $this->listing;
    }

    public function setListing(?Listing $listing): static
    {
        $this->listing = $listing;

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

    /**
     * @return Collection<int, TransferOffer>
     */
    public function getTransferOffers(): Collection
    {
        return $this->transferOffers;
    }

    public function addTransferOffer(TransferOffer $transferOffer): static
    {
        if (!$this->transferOffers->contains($transferOffer)) {
            $this->transferOffers->add($transferOffer);
            $transferOffer->setTransferNegociation($this);
        }

        return $this;
    }

    public function removeTransferOffer(TransferOffer $transferOffer): static
    {
        if ($this->transferOffers->removeElement($transferOffer)) {
            // set the owning side to null (unless already changed)
            if ($transferOffer->getTransferNegociation() === $this) {
                $transferOffer->setTransferNegociation(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, TransferMessage>
     */
    public function getTransferMessages(): Collection
    {
        return $this->transferMessages;
    }

    public function addTransferMessage(TransferMessage $transferMessage): static
    {
        if (!$this->transferMessages->contains($transferMessage)) {
            $this->transferMessages->add($transferMessage);
            $transferMessage->setTransferNegociation($this);
        }

        return $this;
    }

    public function removeTransferMessage(TransferMessage $transferMessage): static
    {
        if ($this->transferMessages->removeElement($transferMessage)) {
            // set the owning side to null (unless already changed)
            if ($transferMessage->getTransferNegociation() === $this) {
                $transferMessage->setTransferNegociation(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, TransferAgreement>
     */
    public function getTransferAgreements(): Collection
    {
        return $this->transferAgreements;
    }

    public function addTransferAgreement(TransferAgreement $transferAgreement): static
    {
        if (!$this->transferAgreements->contains($transferAgreement)) {
            $this->transferAgreements->add($transferAgreement);
            $transferAgreement->setTransferNegociation($this);
        }

        return $this;
    }

    public function removeTransferAgreement(TransferAgreement $transferAgreement): static
    {
        if ($this->transferAgreements->removeElement($transferAgreement)) {
            // set the owning side to null (unless already changed)
            if ($transferAgreement->getTransferNegociation() === $this) {
                $transferAgreement->setTransferNegociation(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, ContractNegociation>
     */
    public function getContractNegociations(): Collection
    {
        return $this->contractNegociations;
    }

    public function addContractNegociation(ContractNegociation $contractNegociation): static
    {
        if (!$this->contractNegociations->contains($contractNegociation)) {
            $this->contractNegociations->add($contractNegociation);
            $contractNegociation->setTransferNegociation($this);
        }

        return $this;
    }

    public function removeContractNegociation(ContractNegociation $contractNegociation): static
    {
        if ($this->contractNegociations->removeElement($contractNegociation)) {
            // set the owning side to null (unless already changed)
            if ($contractNegociation->getTransferNegociation() === $this) {
                $contractNegociation->setTransferNegociation(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, TransferAgentInvitation>
     */
    public function getAgentInvitations(): Collection
    {
        return $this->agentInvitations;
    }

    public function addAgentInvitation(TransferAgentInvitation $agentInvitation): static
    {
        if (!$this->agentInvitations->contains($agentInvitation)) {
            $this->agentInvitations->add($agentInvitation);
            $agentInvitation->setTransferNegociation($this);
        }

        return $this;
    }

    public function removeAgentInvitation(TransferAgentInvitation $agentInvitation): static
    {
        if ($this->agentInvitations->removeElement($agentInvitation)) {
            if ($agentInvitation->getTransferNegociation() === $this) {
                $agentInvitation->setTransferNegociation(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, TransferClubInvitation>
     */
    public function getClubInvitations(): Collection
    {
        return $this->clubInvitations;
    }

    public function addClubInvitation(TransferClubInvitation $clubInvitation): static
    {
        if (!$this->clubInvitations->contains($clubInvitation)) {
            $this->clubInvitations->add($clubInvitation);
            $clubInvitation->setTransferNegociation($this);
        }

        return $this;
    }

    public function removeClubInvitation(TransferClubInvitation $clubInvitation): static
    {
        if ($this->clubInvitations->removeElement($clubInvitation)) {
            if ($clubInvitation->getTransferNegociation() === $this) {
                $clubInvitation->setTransferNegociation(null);
            }
        }

        return $this;
    }
}
