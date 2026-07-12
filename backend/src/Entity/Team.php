<?php

namespace App\Entity;

use App\Entity\Contract\ContractNegociation;
use App\Entity\Traits\TimestampableTrait;
use App\Entity\Transfer\TransferNegociation;
use App\Enum\TeamVerificationStatusEnum;
use App\Repository\TeamRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: TeamRepository::class)]
#[ORM\Table(name: '`team`')]
#[UniqueEntity('name', message: 'Nom de l\'équipe déjà utilisé.')]
class Team
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    #[Groups(['admin:club_request:read'])]
    private ?Uuid $id = null;

    #[ORM\Column(length: 255, unique: true)]
    #[Assert\NotBlank(message: 'Le nom est requis')]
    #[Groups(['admin:club_request:read'])]
    private ?string $name = null;

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['admin:club_request:read'])]
    private ?string $country = null;

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['admin:club_request:read'])]
    private ?string $league = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['admin:club_request:read'])]
    private ?string $logoUrl = null;

    // Value in cents
    #[ORM\Column(type: Types::BIGINT, nullable: true)]
    private ?string $transferBudget = null;

    #[ORM\Column(length: 20, enumType: TeamVerificationStatusEnum::class)]
    #[Assert\NotBlank(message: 'Le statut de vérification est requis')]
    private ?TeamVerificationStatusEnum $verificationStatus = null;

    /**
     * @var Collection<int, TeamMembership>
     */
    #[ORM\OneToMany(targetEntity: TeamMembership::class, mappedBy: 'team')]
    private Collection $teamMemberships;

    /**
     * @var Collection<int, Player>
     */
    #[ORM\OneToMany(targetEntity: Player::class, mappedBy: 'team')]
    private Collection $players;

    /**
     * @var Collection<int, Listing>
     */
    #[ORM\OneToMany(targetEntity: Listing::class, mappedBy: 'sellerTeam')]
    private Collection $listings;

    /**
     * @var Collection<int, TransferNegociation>
     */
    #[ORM\OneToMany(targetEntity: TransferNegociation::class, mappedBy: 'buyerTeam')]
    private Collection $transferNegociations;

    /**
     * @var Collection<int, ContractNegociation>
     */
    #[ORM\OneToMany(targetEntity: ContractNegociation::class, mappedBy: 'buyerTeam')]
    private Collection $contractNegociations;

    #[ORM\OneToOne(mappedBy: 'team', cascade: ['persist', 'remove'])]
    private ?Club $club = null;

    public function __construct()
    {
        $this->teamMemberships = new ArrayCollection();
        $this->players = new ArrayCollection();
        $this->listings = new ArrayCollection();
        $this->transferNegociations = new ArrayCollection();
        $this->contractNegociations = new ArrayCollection();
    }

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;

        return $this;
    }

    public function getCountry(): ?string
    {
        return $this->country;
    }

    public function setCountry(string $country): static
    {
        $this->country = $country;

        return $this;
    }

    public function getLeague(): ?string
    {
        return $this->league;
    }

    public function setLeague(string $league): static
    {
        $this->league = $league;

        return $this;
    }

    public function getLogoUrl(): ?string
    {
        return $this->logoUrl;
    }

    public function setLogoUrl(string $logoUrl): static
    {
        $this->logoUrl = $logoUrl;

        return $this;
    }

    public function getTransferBudget(): ?int
    {
        return null === $this->transferBudget ? null : (int) $this->transferBudget;
    }

    public function setTransferBudget(?int $transferBudget): static
    {
        $this->transferBudget = null === $transferBudget ? null : (string) $transferBudget;

        return $this;
    }

    public function getVerificationStatus(): ?TeamVerificationStatusEnum
    {
        return $this->verificationStatus;
    }

    public function setVerificationStatus(TeamVerificationStatusEnum $verificationStatus): static
    {
        $this->verificationStatus = $verificationStatus;

        return $this;
    }

    /**
     * @return Collection<int, TeamMembership>
     */
    public function getTeamMemberships(): Collection
    {
        return $this->teamMemberships;
    }

    public function addTeamMembership(TeamMembership $teamMembership): static
    {
        if (!$this->teamMemberships->contains($teamMembership)) {
            $this->teamMemberships->add($teamMembership);
            $teamMembership->setTeam($this);
        }

        return $this;
    }

    public function removeTeamMembership(TeamMembership $teamMembership): static
    {
        if ($this->teamMemberships->removeElement($teamMembership)) {
            // set the owning side to null (unless already changed)
            if ($teamMembership->getTeam() === $this) {
                $teamMembership->setTeam(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Player>
     */
    public function getPlayers(): Collection
    {
        return $this->players;
    }

    public function addPlayer(Player $player): static
    {
        if (!$this->players->contains($player)) {
            $this->players->add($player);
            $player->setTeam($this);
        }

        return $this;
    }

    public function removePlayer(Player $player): static
    {
        if ($this->players->removeElement($player)) {
            // set the owning side to null (unless already changed)
            if ($player->getTeam() === $this) {
                $player->setTeam(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Listing>
     */
    public function getListings(): Collection
    {
        return $this->listings;
    }

    public function addListing(Listing $listing): static
    {
        if (!$this->listings->contains($listing)) {
            $this->listings->add($listing);
            $listing->setSellerTeam($this);
        }

        return $this;
    }

    public function removeListing(Listing $listing): static
    {
        if ($this->listings->removeElement($listing)) {
            // set the owning side to null (unless already changed)
            if ($listing->getSellerTeam() === $this) {
                $listing->setSellerTeam(null);
            }
        }

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
            $transferNegociation->setBuyerTeam($this);
        }

        return $this;
    }

    public function removeTransferNegociation(TransferNegociation $transferNegociation): static
    {
        if ($this->transferNegociations->removeElement($transferNegociation)) {
            $transferNegociation->setBuyerTeam(null);
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
            $contractNegociation->setBuyerTeam($this);
        }

        return $this;
    }

    public function removeContractNegociation(ContractNegociation $contractNegociation): static
    {
        if ($this->contractNegociations->removeElement($contractNegociation)) {
            // set the owning side to null (unless already changed)
            if ($contractNegociation->getBuyerTeam() === $this) {
                $contractNegociation->setBuyerTeam(null);
            }
        }

        return $this;
    }

    public function getClub(): ?Club
    {
        return $this->club;
    }

    public function setClub(?Club $club): static
    {
        // unset the owning side of the relation if necessary
        if ($club === null && $this->club !== null) {
            $this->club->setTeam(null);
        }

        // set the owning side of the relation if necessary
        if ($club !== null && $club->getTeam() !== $this) {
            $club->setTeam($this);
        }

        $this->club = $club;

        return $this;
    }
}
