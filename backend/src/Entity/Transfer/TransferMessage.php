<?php

namespace App\Entity\Transfer;

use App\Entity\Traits\TimestampableTrait;
use App\Entity\User;
use App\Enum\MessageTypeEnum;
use App\Repository\Transfer\TransferMessageRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: TransferMessageRepository::class)]
#[ORM\Table(name: '`transfer_message`')]
class TransferMessage
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

    #[ORM\ManyToOne(inversedBy: 'transferMessages')]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull(message: 'La négociation concernée est requise')]
    private ?TransferNegociation $transferNegociation = null;

    #[ORM\ManyToOne(inversedBy: 'transferMessages')]
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

    public function getTransferNegociation(): ?TransferNegociation
    {
        return $this->transferNegociation;
    }

    public function setTransferNegociation(?TransferNegociation $transferNegociation): static
    {
        $this->transferNegociation = $transferNegociation;

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
