<?php

namespace App\Entity;

use App\Entity\Contract\ContractNegociation;
use App\Entity\Traits\TimestampableTrait;
use App\Enum\PlayerAvailabilityStatusEnum;
use App\Enum\PlayerContractStatusEnum;
use App\Enum\PlayerMarketAuthorizationStatusEnum;
use App\Enum\PlayerMarketListingSourceEnum;
use App\Enum\PlayerMarketStatusEnum;
use App\Repository\PlayerRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: PlayerRepository::class)]
#[ORM\Table(name: '`player`')]
class Player
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?Uuid $id = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank(message: 'Le prénom est requis')]
    private ?string $firstName = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank(message: 'Le nom est requis')]
    private ?string $lastName = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $photoUrl = null;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $birthDate = null;

    #[ORM\Column(length: 120, nullable: true)]
    private ?string $nationality = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank(message: 'Le poste est requis')]
    private ?string $position = null;

    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    private ?int $heightCm = null;

    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    private ?int $weightKg = null;

    #[ORM\Column(length: 20, nullable: true)]
    private ?string $preferredFoot = null;

    #[ORM\Column(type: Types::BIGINT, nullable: true)]
    private ?string $marketValue = null;

    #[ORM\Column(type: Types::BIGINT, nullable: true)]
    private ?string $weeklySalary = null;

    #[ORM\Column(type: Types::BIGINT, nullable: true)]
    private ?string $releaseClause = null;

    #[ORM\Column(length: 20, enumType: PlayerContractStatusEnum::class)]
    #[Assert\NotBlank(message: 'Le statut du contrat est requis')]
    private ?PlayerContractStatusEnum $contractStatus = PlayerContractStatusEnum::UNDER_CONTRACT;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $contractEndDate = null;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $joinedAt = null;

    #[ORM\Column(length: 20, enumType: PlayerMarketStatusEnum::class)]
    #[Assert\NotBlank(message: 'Le statut du contrat est requis')]
    private ?PlayerMarketStatusEnum $marketStatus = PlayerMarketStatusEnum::NOT_LISTED;

    #[ORM\Column(length: 20, enumType: PlayerMarketAuthorizationStatusEnum::class, nullable: true)]
    private ?PlayerMarketAuthorizationStatusEnum $marketAuthorizationStatus = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $marketAuthorizationRequestedAt = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $marketAuthorizationDecidedAt = null;

    #[ORM\Column(length: 20, enumType: PlayerMarketListingSourceEnum::class, nullable: true)]
    private ?PlayerMarketListingSourceEnum $marketListingSource = null;

    #[ORM\Column(length: 20, enumType: PlayerAvailabilityStatusEnum::class)]
    #[Assert\NotBlank(message: 'Le statut de disponibilite du joueur est requis')]
    private ?PlayerAvailabilityStatusEnum $availabilityStatus = PlayerAvailabilityStatusEnum::NORMAL;

    #[ORM\ManyToOne(inversedBy: 'players')]
    private ?Team $team = null;

    #[ORM\ManyToOne(inversedBy: 'players')]
    private ?Club $club = null;

    #[ORM\ManyToOne(inversedBy: 'temporaryPlayers')]
    private ?Club $temporaryClub = null;

    #[ORM\ManyToOne(inversedBy: 'players')]
    private ?Agent $agent = null;

    #[ORM\OneToOne(mappedBy: 'player')]
    private ?Listing $listing = null;

    /**
     * @var Collection<int, ContractNegociation>
     */
    #[ORM\OneToMany(targetEntity: ContractNegociation::class, mappedBy: 'player')]
    private Collection $contractNegociations;

    public function __construct()
    {
        $this->contractNegociations = new ArrayCollection();
    }

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getFirstName(): ?string
    {
        return $this->firstName;
    }

    public function setFirstName(string $firstName): static
    {
        $this->firstName = $firstName;

        return $this;
    }

    public function getLastName(): ?string
    {
        return $this->lastName;
    }

    public function setLastName(string $lastName): static
    {
        $this->lastName = $lastName;

        return $this;
    }

    public function getPhotoUrl(): ?string
    {
        return $this->photoUrl;
    }

    public function setPhotoUrl(?string $photoUrl): static
    {
        $this->photoUrl = $photoUrl;

        return $this;
    }

    public function getBirthDate(): ?\DateTimeInterface
    {
        return $this->birthDate;
    }

    public function setBirthDate(\DateTimeInterface $birthDate): static
    {
        $this->birthDate = $birthDate;

        return $this;
    }

    public function getNationality(): ?string
    {
        return $this->nationality;
    }

    public function setNationality(?string $nationality): static
    {
        $this->nationality = $nationality;

        return $this;
    }

    public function getPosition(): ?string
    {
        return $this->position;
    }

    public function setPosition(string $position): static
    {
        $this->position = $position;

        return $this;
    }

    public function getHeightCm(): ?int
    {
        return $this->heightCm;
    }

    public function setHeightCm(?int $heightCm): static
    {
        $this->heightCm = $heightCm;

        return $this;
    }

    public function getWeightKg(): ?int
    {
        return $this->weightKg;
    }

    public function setWeightKg(?int $weightKg): static
    {
        $this->weightKg = $weightKg;

        return $this;
    }

    public function getPreferredFoot(): ?string
    {
        return $this->preferredFoot;
    }

    public function setPreferredFoot(?string $preferredFoot): static
    {
        $this->preferredFoot = $preferredFoot;

        return $this;
    }

    public function getMarketValue(): ?int
    {
        return null === $this->marketValue ? null : (int) $this->marketValue;
    }

    public function setMarketValue(?int $marketValue): static
    {
        $this->marketValue = null === $marketValue ? null : (string) $marketValue;

        return $this;
    }

    public function getWeeklySalary(): ?int
    {
        return null === $this->weeklySalary ? null : (int) $this->weeklySalary;
    }

    public function setWeeklySalary(?int $weeklySalary): static
    {
        $this->weeklySalary = null === $weeklySalary ? null : (string) $weeklySalary;

        return $this;
    }

    public function getReleaseClause(): ?int
    {
        return null === $this->releaseClause ? null : (int) $this->releaseClause;
    }

    public function setReleaseClause(?int $releaseClause): static
    {
        $this->releaseClause = null === $releaseClause ? null : (string) $releaseClause;

        return $this;
    }

    public function getContractStatus(): ?PlayerContractStatusEnum
    {
        return $this->contractStatus;
    }

    public function setContractStatus(?PlayerContractStatusEnum $contractStatus): static
    {
        $this->contractStatus = $contractStatus;

        return $this;
    }

    public function getContractEndDate(): ?\DateTimeInterface
    {
        return $this->contractEndDate;
    }

    public function setContractEndDate(?\DateTimeInterface $contractEndDate): static
    {
        $this->contractEndDate = $contractEndDate;

        return $this;
    }

    public function getJoinedAt(): ?\DateTimeInterface
    {
        return $this->joinedAt;
    }

    public function setJoinedAt(?\DateTimeInterface $joinedAt): static
    {
        $this->joinedAt = $joinedAt;

        return $this;
    }

    public function getMarketStatus(): ?PlayerMarketStatusEnum
    {
        return $this->marketStatus;
    }

    public function setMarketStatus(?PlayerMarketStatusEnum $marketStatus): static
    {
        $this->marketStatus = $marketStatus;

        return $this;
    }

    public function getMarketAuthorizationStatus(): ?PlayerMarketAuthorizationStatusEnum
    {
        return $this->marketAuthorizationStatus;
    }

    public function setMarketAuthorizationStatus(?PlayerMarketAuthorizationStatusEnum $marketAuthorizationStatus): static
    {
        $this->marketAuthorizationStatus = $marketAuthorizationStatus;

        return $this;
    }

    public function getMarketAuthorizationRequestedAt(): ?\DateTimeImmutable
    {
        return $this->marketAuthorizationRequestedAt;
    }

    public function setMarketAuthorizationRequestedAt(?\DateTimeImmutable $marketAuthorizationRequestedAt): static
    {
        $this->marketAuthorizationRequestedAt = $marketAuthorizationRequestedAt;

        return $this;
    }

    public function getMarketAuthorizationDecidedAt(): ?\DateTimeImmutable
    {
        return $this->marketAuthorizationDecidedAt;
    }

    public function setMarketAuthorizationDecidedAt(?\DateTimeImmutable $marketAuthorizationDecidedAt): static
    {
        $this->marketAuthorizationDecidedAt = $marketAuthorizationDecidedAt;

        return $this;
    }

    public function getMarketListingSource(): ?PlayerMarketListingSourceEnum
    {
        return $this->marketListingSource;
    }

    public function setMarketListingSource(?PlayerMarketListingSourceEnum $marketListingSource): static
    {
        $this->marketListingSource = $marketListingSource;

        return $this;
    }

    public function getAvailabilityStatus(): ?PlayerAvailabilityStatusEnum
    {
        return $this->availabilityStatus;
    }

    public function setAvailabilityStatus(?PlayerAvailabilityStatusEnum $availabilityStatus): static
    {
        $this->availabilityStatus = $availabilityStatus;

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

    public function getClub(): ?Club
    {
        return $this->club;
    }

    public function setClub(?Club $club): static
    {
        $this->club = $club;

        return $this;
    }

    public function getTemporaryClub(): ?Club
    {
        return $this->temporaryClub;
    }

    public function setTemporaryClub(?Club $temporaryClub): static
    {
        $this->temporaryClub = $temporaryClub;

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

    public function getListing(): ?Listing
    {
        return $this->listing;
    }

    public function setListing(?Listing $listing): static
    {
        $this->listing = $listing;

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
            $contractNegociation->setPlayer($this);
        }

        return $this;
    }

    public function removeContractNegociation(ContractNegociation $contractNegociation): static
    {
        if ($this->contractNegociations->removeElement($contractNegociation)) {
            // set the owning side to null (unless already changed)
            if ($contractNegociation->getPlayer() === $this) {
                $contractNegociation->setPlayer(null);
            }
        }

        return $this;
    }
}
