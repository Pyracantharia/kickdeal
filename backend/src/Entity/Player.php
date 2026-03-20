<?php

namespace App\Entity;

use App\Entity\Contract\ContractNegociation;
use App\Entity\Traits\TimestampableTrait;
use App\Enum\PlayerContractStatusEnum;
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

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $birthDate = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank(message: 'Le poste est requis')]
    private ?string $position = null;

    // Value in cents
    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    private ?int $marketValue = null;

    #[ORM\Column(length: 20, enumType: PlayerContractStatusEnum::class)]
    #[Assert\NotBlank(message: 'Le statut du contrat est requis')]
    private ?PlayerContractStatusEnum $contractStatus = PlayerContractStatusEnum::UNDER_CONTRACT;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $contractEndDate = null;

    #[ORM\Column(length: 20, enumType: PlayerMarketStatusEnum::class)]
    #[Assert\NotBlank(message: 'Le statut du contrat est requis')]
    private ?PlayerMarketStatusEnum $marketStatus = PlayerMarketStatusEnum::NOT_LISTED;

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

    public function getBirthDate(): ?\DateTimeInterface
    {
        return $this->birthDate;
    }

    public function setBirthDate(\DateTimeInterface $birthDate): static
    {
        $this->birthDate = $birthDate;

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

    public function getMarketValue(): ?int
    {
        return $this->marketValue;
    }

    public function setMarketValue(int $marketValue): static
    {
        $this->marketValue = $marketValue;

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

    public function getMarketStatus(): ?PlayerMarketStatusEnum
    {
        return $this->marketStatus;
    }

    public function setMarketStatus(?PlayerMarketStatusEnum $marketStatus): static
    {
        $this->marketStatus = $marketStatus;

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
