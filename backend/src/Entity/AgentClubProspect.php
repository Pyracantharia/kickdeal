<?php

namespace App\Entity;

use App\Entity\Traits\TimestampableTrait;
use App\Enum\AgentClubProspectStatusEnum;
use App\Repository\AgentClubProspectRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: AgentClubProspectRepository::class)]
#[ORM\Table(name: '`agent_club_prospect`')]
#[ORM\UniqueConstraint(name: 'UNIQ_AGENT_PLAYER_TEAM_PROSPECT', columns: ['agent_id', 'player_id', 'team_id'])]
class AgentClubProspect
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?Uuid $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Agent $agent = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Player $player = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Team $team = null;

    #[ORM\Column(length: 30, enumType: AgentClubProspectStatusEnum::class)]
    private AgentClubProspectStatusEnum $status = AgentClubProspectStatusEnum::PROPOSAL_SENT;

    #[ORM\Column(type: Types::TEXT)]
    private ?string $message = null;

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getAgent(): ?Agent
    {
        return $this->agent;
    }

    public function setAgent(Agent $agent): static
    {
        $this->agent = $agent;

        return $this;
    }

    public function getPlayer(): ?Player
    {
        return $this->player;
    }

    public function setPlayer(Player $player): static
    {
        $this->player = $player;

        return $this;
    }

    public function getTeam(): ?Team
    {
        return $this->team;
    }

    public function setTeam(Team $team): static
    {
        $this->team = $team;

        return $this;
    }

    public function getStatus(): AgentClubProspectStatusEnum
    {
        return $this->status;
    }

    public function setStatus(AgentClubProspectStatusEnum $status): static
    {
        $this->status = $status;

        return $this;
    }

    public function getMessage(): ?string
    {
        return $this->message;
    }

    public function setMessage(string $message): static
    {
        $this->message = $message;

        return $this;
    }
}
