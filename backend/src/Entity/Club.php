<?php

namespace App\Entity;

use App\Entity\Traits\TimestampableTrait;
use App\Repository\ClubRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: ClubRepository::class)]
#[ORM\Table(name: '`club`')]
class Club
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?Uuid $id = null;

    /**
     * @var Collection<int, Player>
     */
    #[ORM\OneToMany(targetEntity: Player::class, mappedBy: 'club')]
    private Collection $players;

    /**
     * @var Collection<int, Player>
     */
    #[ORM\OneToMany(targetEntity: Player::class, mappedBy: 'temporaryClub')]
    private Collection $temporaryPlayers;

    /**
     * @var Collection<int, ClubProfile>
     */
    #[ORM\OneToMany(targetEntity: ClubProfile::class, mappedBy: 'club')]
    private Collection $clubProfiles;

    #[ORM\OneToOne(inversedBy: 'club', cascade: ['persist', 'remove'])]
    private ?Team $team = null;

    public function __construct()
    {
        $this->players = new ArrayCollection();
        $this->temporaryPlayers = new ArrayCollection();
        $this->clubProfiles = new ArrayCollection();
    }

    public function getId(): ?Uuid
    {
        return $this->id;
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
            $player->setClub($this);
        }

        return $this;
    }

    public function removePlayer(Player $player): static
    {
        if ($this->players->removeElement($player)) {
            $player->setClub(null);
        }

        return $this;
    }

    /**
     * @return Collection<int, Player>
     */
    public function getTemporaryPlayers(): Collection
    {
        return $this->temporaryPlayers;
    }

    public function addTemporaryPlayer(Player $temporaryPlayer): static
    {
        if (!$this->temporaryPlayers->contains($temporaryPlayer)) {
            $this->temporaryPlayers->add($temporaryPlayer);
            $temporaryPlayer->setClub($this);
        }

        return $this;
    }

    public function removeTemporaryPlayer(Player $temporaryPlayer): static
    {
        if ($this->temporaryPlayers->removeElement($temporaryPlayer)) {
            $temporaryPlayer->setClub(null);
        }

        return $this;
    }

    /**
     * @return Collection<int, ClubProfile>
     */
    public function getClubProfiles(): Collection
    {
        return $this->clubProfiles;
    }

    public function addClubProfile(ClubProfile $clubProfile): static
    {
        if (!$this->clubProfiles->contains($clubProfile)) {
            $this->clubProfiles->add($clubProfile);
            $clubProfile->setClub($this);
        }

        return $this;
    }

    public function removeClubProfile(ClubProfile $clubProfile): static
    {
        if ($this->clubProfiles->removeElement($clubProfile)) {
            // set the owning side to null (unless already changed)
            if ($clubProfile->getClub() === $this) {
                $clubProfile->setClub(null);
            }
        }

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
}
