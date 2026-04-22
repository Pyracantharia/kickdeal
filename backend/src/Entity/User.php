<?php

namespace App\Entity;

use App\Entity\Contract\ContractMessage;
use App\Entity\Contract\ContractOffer;
use App\Entity\Traits\TimestampableTrait;
use App\Entity\Transfer\TransferMessage;
use App\Entity\Transfer\TransferOffer;
use App\Repository\UserRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: '`user`')]
#[UniqueEntity('email', message: 'Utilisateur existant.')]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    use TimestampableTrait;

    public const string ROLE_ADMIN = 'ROLE_ADMIN';
    public const string ROLE_AGENT = 'ROLE_AGENT';
    public const string ROLE_CLUB = 'ROLE_CLUB';
    public const string ROLE_SUPER_ADMIN = 'ROLE_SUPER_ADMIN';

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    #[Groups('user:read')] // ✅ Exposer cette propriété dans les réponses json
    private ?Uuid $id = null;

    #[ORM\Column(length: 255)]
    #[Groups('user:read')]
    #[Assert\NotBlank(message: 'Le prénom est requis')]
    private ?string $firstName = null;

    #[ORM\Column(length: 255)]
    #[Groups('user:read')]
    #[Assert\NotBlank(message: 'Le nom est requis')]
    private ?string $lastName = null;

    #[ORM\Column(type: 'string', length: 320, unique: true)]
    #[Groups('user:read')]
    #[Assert\NotBlank(message: "L'email est requis")]
    #[Assert\Email(message: "L'adresse '{{ value }}' n'est pas un email valide.")]
    private ?string $email = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank(message: 'Le mot de passe es requis')]
    private ?string $password = null;

    #[ORM\Column(type: 'json')]
    private array $roles = [];

    #[ORM\Column(length: 20, nullable: true)]
    private ?string $phone = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $twoFASecret = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $resetPasswordToken = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTime $resetPasswordTokenExpiry = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $resetTokenSelector = null;

    #[ORM\OneToOne(targetEntity: Agent::class, mappedBy: 'user')]
    private Agent $agentProfile;

    /**
     * @var Collection<int, TeamMembership>
     */
    #[ORM\OneToMany(targetEntity: TeamMembership::class, mappedBy: 'user')]
    private Collection $teamMemberships;

    /**
     * @var Collection<int, ClubProfile>
     */
    #[ORM\OneToMany(targetEntity: ClubProfile::class, mappedBy: 'user')]
    private Collection $clubProfiles;

    /**
     * @var Collection<int, TransferOffer>
     */
    #[ORM\OneToMany(targetEntity: TransferOffer::class, mappedBy: 'author')]
    private Collection $transferOffers;

    /**
     * @var Collection<int, TransferMessage>
     */
    #[ORM\OneToMany(targetEntity: TransferMessage::class, mappedBy: 'author')]
    private Collection $transferMessages;

    /**
     * @var Collection<int, ContractOffer>
     */
    #[ORM\OneToMany(targetEntity: ContractOffer::class, mappedBy: 'author')]
    private Collection $contractOffers;

    /**
     * @var Collection<int, ContractMessage>
     */
    #[ORM\OneToMany(targetEntity: ContractMessage::class, mappedBy: 'author')]
    private Collection $contractMessages;

    public function __construct()
    {
        $this->teamMemberships = new ArrayCollection();
        $this->clubProfiles = new ArrayCollection();
        $this->transferOffers = new ArrayCollection();
        $this->transferMessages = new ArrayCollection();
        $this->contractOffers = new ArrayCollection();
        $this->contractMessages = new ArrayCollection();
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

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = $email;

        return $this;
    }

    public function getPassword(): ?string
    {
        return $this->password;
    }

    public function setPassword(string $password): static
    {
        $this->password = $password;

        return $this;
    }

    public function getUserIdentifier(): string
    {
        return (string) $this->email;
    }

    #[Groups('user:read')]
    public function getRoles(): array
    {
        $roles = $this->roles;
        // guarantee every user at least has ROLE_USER
        $roles[] = 'ROLE_USER';

        return array_unique($roles);
    }

    #[Groups('user:read')]
    public function getHasClubAccess(): bool
    {
        return !$this->teamMemberships->isEmpty();
    }

    #[Groups('user:read')]
    public function getClubName(): ?string
    {
        foreach ($this->teamMemberships as $teamMembership) {
            if ($teamMembership->isPrimary()) {
                return $teamMembership->getTeam()?->getName();
            }
        }

        $teamMembership = $this->teamMemberships->first();

        if (false === $teamMembership) {
            return null;
        }

        return $teamMembership->getTeam()?->getName();
    }

    public function setRoles(array $roles): self
    {
        $this->roles = $roles;

        return $this;
    }

    public function getPhone(): ?string
    {
        return $this->phone;
    }

    public function setPhone(?string $phone): static
    {
        $this->phone = $phone;

        return $this;
    }

    public function getTwoFASecret(): ?string
    {
        return $this->twoFASecret;
    }

    public function setTwoFASecret(?string $twoFASecret): static
    {
        $this->twoFASecret = $twoFASecret;

        return $this;
    }

    public function getResetPasswordToken(): ?string
    {
        return $this->resetPasswordToken;
    }

    public function setResetPasswordToken(?string $resetPasswordToken): static
    {
        $this->resetPasswordToken = $resetPasswordToken;

        return $this;
    }

    public function getResetPasswordTokenExpiry(): ?\DateTime
    {
        return $this->resetPasswordTokenExpiry;
    }

    public function setResetPasswordTokenExpiry(?\DateTime $resetPasswordTokenExpiry): static
    {
        $this->resetPasswordTokenExpiry = $resetPasswordTokenExpiry;

        return $this;
    }

    public function getResetTokenSelector(): ?string
    {
        return $this->resetTokenSelector;
    }

    public function setResetTokenSelector(?string $resetTokenSelector): static
    {
        $this->resetTokenSelector = $resetTokenSelector;

        return $this;
    }

    public function getAgentProfile(): ?Agent
    {
        return $this->agentProfile;
    }

    public function setAgentProfile(?Agent $agentProfile): static
    {
        $this->agentProfile = $agentProfile;

        return $this;
    }

    public function eraseCredentials(): void
    {
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
            $teamMembership->setUser($this);
        }

        return $this;
    }

    public function removeTeamMembership(TeamMembership $teamMembership): static
    {
        if ($this->teamMemberships->removeElement($teamMembership)) {
            // set the owning side to null (unless already changed)
            if ($teamMembership->getUser() === $this) {
                $teamMembership->setUser(null);
            }
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
            $clubProfile->setUser($this);
        }

        return $this;
    }

    public function removeClubProfile(ClubProfile $clubProfile): static
    {
        if ($this->clubProfiles->removeElement($clubProfile)) {
            // set the owning side to null (unless already changed)
            if ($clubProfile->getUser() === $this) {
                $clubProfile->setUser(null);
            }
        }

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
            $transferOffer->setAuthor($this);
        }

        return $this;
    }

    public function removeTransferOffer(TransferOffer $transferOffer): static
    {
        if ($this->transferOffers->removeElement($transferOffer)) {
            // set the owning side to null (unless already changed)
            if ($transferOffer->getAuthor() === $this) {
                $transferOffer->setAuthor(null);
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
            $transferMessage->setAuthor($this);
        }

        return $this;
    }

    public function removeTransferMessage(TransferMessage $transferMessage): static
    {
        if ($this->transferMessages->removeElement($transferMessage)) {
            // set the owning side to null (unless already changed)
            if ($transferMessage->getAuthor() === $this) {
                $transferMessage->setAuthor(null);
            }
        }

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
            $contractOffer->setAuthor($this);
        }

        return $this;
    }

    public function removeContractOffer(ContractOffer $contractOffer): static
    {
        if ($this->contractOffers->removeElement($contractOffer)) {
            // set the owning side to null (unless already changed)
            if ($contractOffer->getAuthor() === $this) {
                $contractOffer->setAuthor(null);
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
            $contractMessage->setAuthor($this);
        }

        return $this;
    }

    public function removeContractMessage(ContractMessage $contractMessage): static
    {
        if ($this->contractMessages->removeElement($contractMessage)) {
            // set the owning side to null (unless already changed)
            if ($contractMessage->getAuthor() === $this) {
                $contractMessage->setAuthor(null);
            }
        }

        return $this;
    }
}
