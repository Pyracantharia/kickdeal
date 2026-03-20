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

    public function __construct()
    {
        $this->players = new ArrayCollection();
        $this->temporaryPlayers = new ArrayCollection();
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
}
