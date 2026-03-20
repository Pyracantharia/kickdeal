<?php

namespace App\Entity;

use App\Entity\Traits\TimestampableTrait;
use App\Repository\ClubProfileRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: ClubProfileRepository::class)]
#[ORM\Table(name: '`club_profile`')]
#[UniqueEntity('user', message: 'Un profil de club existe déjà pour cet utilisateur.')]
class ClubProfile
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?Uuid $id = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank(message: 'Le titre du poste est requis')]
    private ?string $jobTitle = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $professionalContact = null;

    // TODO : Maybe OneToOne
    #[ORM\ManyToOne(inversedBy: 'clubProfiles')]
    #[ORM\JoinColumn(nullable: false, unique: true)]
    #[Assert\NotNull(message: 'L\'utilisateur est requis.')]
    private ?User $user = null;

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getJobTitle(): ?string
    {
        return $this->jobTitle;
    }

    public function setJobTitle(string $jobTitle): static
    {
        $this->jobTitle = $jobTitle;

        return $this;
    }

    public function getProfessionalContact(): ?string
    {
        return $this->professionalContact;
    }

    public function setProfessionalContact(?string $professionalContact): static
    {
        $this->professionalContact = $professionalContact;

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
}
