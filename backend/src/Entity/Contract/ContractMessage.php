<?php

namespace App\Entity\Contract;

use App\Entity\Traits\TimestampableTrait;
use App\Entity\User;
use App\Enum\MessageTypeEnum;
use App\Repository\Contract\ContractMessageRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: ContractMessageRepository::class)]
#[ORM\Table(name: '`contract_message`')]
class ContractMessage
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?Uuid $id = null;

    #[ORM\Column(length: 20, enumType: MessageTypeEnum::class)]
    #[Assert\NotBlank(message: 'Le type de message est requis')]
    private ?MessageTypeEnum $type = MessageTypeEnum::TEXT;

    #[ORM\Column(type: Types::TEXT)]
    #[Assert\NotBlank(message: 'Le contenu du message est requis')]
    private ?string $content = null;

    #[ORM\ManyToOne(inversedBy: 'contractMessages')]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull(message: 'La négociation concernée est requise')]
    private ?ContractNegociation $contractNegociation = null;

    #[ORM\ManyToOne(inversedBy: 'contractMessages')]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull(message: 'L\'auteur de l\'offre est requis')]
    private ?User $author = null;

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getType(): ?MessageTypeEnum
    {
        return $this->type;
    }

    public function setType(?MessageTypeEnum $type): static
    {
        $this->type = $type;

        return $this;
    }

    public function getContent(): ?string
    {
        return $this->content;
    }

    public function setContent(?string $content): static
    {
        $this->content = $content;

        return $this;
    }

    public function getContractNegociation(): ?ContractNegociation
    {
        return $this->contractNegociation;
    }

    public function setContractNegociation(?ContractNegociation $contractNegociation): static
    {
        $this->contractNegociation = $contractNegociation;

        return $this;
    }

    public function getAuthor(): ?User
    {
        return $this->author;
    }

    public function setAuthor(?User $author): static
    {
        $this->author = $author;

        return $this;
    }
}
