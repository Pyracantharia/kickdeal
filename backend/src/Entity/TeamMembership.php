<?php

namespace App\Entity;

use App\Entity\Traits\TimestampableTrait;
use App\Enum\MembershipRoleEnum;
use App\Repository\TeamMembershipRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: TeamMembershipRepository::class)]
#[ORM\Table(name: '`team_membership`')]
#[UniqueEntity(fields: ['user', 'team'], message: 'Cet utilisateur est déjà membre de cette équipe.')]
class TeamMembership
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?Uuid $id = null;

    #[ORM\Column(length: 20, enumType: MembershipRoleEnum::class)]
    #[Assert\NotBlank(message: 'Le rôle est requis')]
    private ?MembershipRoleEnum $role = null;

    #[ORM\Column(type: Types::BOOLEAN, options: ['default' => false])]
    private bool $primary = false;

    #[ORM\ManyToOne(inversedBy: 'teamMemberships')]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull(message: 'L\'utilisateur est requis.')]
    private ?User $user = null;

    #[ORM\ManyToOne(inversedBy: 'teamMemberships')]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull(message: 'L\'équipe est requise.')]
    private ?Team $team = null;

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getRole(): ?MembershipRoleEnum
    {
        return $this->role;
    }

    public function setRole(MembershipRoleEnum $role): static
    {
        $this->role = $role;

        return $this;
    }

    public function isPrimary(): bool
    {
        return $this->primary;
    }

    public function setPrimary(bool $primary): static
    {
        $this->primary = $primary;

        return $this;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;

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
