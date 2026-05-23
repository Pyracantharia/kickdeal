<?php

namespace App\Entity;

use App\Entity\Traits\TimestampableTrait;
use App\Enum\PaymentProviderEnum;
use App\Enum\PaymentStatusEnum;
use App\Repository\PaymentRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: PaymentRepository::class)]
#[ORM\Table(name: '`payment`')]
#[ORM\UniqueConstraint(name: 'uniq_payment_tx_hash', columns: ['tx_hash'])]
class Payment
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?Uuid $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    #[ORM\Column(length: 20, enumType: PaymentProviderEnum::class)]
    private PaymentProviderEnum $provider = PaymentProviderEnum::CHILIZ;

    #[ORM\Column(name: 'tx_hash', length: 100)]
    private ?string $txHash = null;

    #[ORM\Column(length: 30)]
    private ?string $planType = null;

    #[ORM\Column(type: Types::STRING, length: 80)]
    private ?string $amountWei = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 18, scale: 8)]
    private ?string $amountChz = null;

    #[ORM\Column(length: 100)]
    private ?string $receiverAddress = null;

    #[ORM\Column]
    private ?int $chainId = null;

    #[ORM\Column(length: 20, enumType: PaymentStatusEnum::class)]
    private PaymentStatusEnum $status = PaymentStatusEnum::CONFIRMED;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $confirmedAt = null;

    public function getId(): ?Uuid
    {
        return $this->id;
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

    public function getProvider(): PaymentProviderEnum
    {
        return $this->provider;
    }

    public function setProvider(PaymentProviderEnum $provider): static
    {
        $this->provider = $provider;

        return $this;
    }

    public function getTxHash(): ?string
    {
        return $this->txHash;
    }

    public function setTxHash(string $txHash): static
    {
        $this->txHash = $txHash;

        return $this;
    }

    public function getPlanType(): ?string
    {
        return $this->planType;
    }

    public function setPlanType(string $planType): static
    {
        $this->planType = $planType;

        return $this;
    }

    public function getAmountWei(): ?string
    {
        return $this->amountWei;
    }

    public function setAmountWei(string $amountWei): static
    {
        $this->amountWei = $amountWei;

        return $this;
    }

    public function getAmountChz(): ?string
    {
        return $this->amountChz;
    }

    public function setAmountChz(string $amountChz): static
    {
        $this->amountChz = $amountChz;

        return $this;
    }

    public function getReceiverAddress(): ?string
    {
        return $this->receiverAddress;
    }

    public function setReceiverAddress(string $receiverAddress): static
    {
        $this->receiverAddress = $receiverAddress;

        return $this;
    }

    public function getChainId(): ?int
    {
        return $this->chainId;
    }

    public function setChainId(int $chainId): static
    {
        $this->chainId = $chainId;

        return $this;
    }

    public function getStatus(): PaymentStatusEnum
    {
        return $this->status;
    }

    public function setStatus(PaymentStatusEnum $status): static
    {
        $this->status = $status;

        return $this;
    }

    public function getConfirmedAt(): ?\DateTimeImmutable
    {
        return $this->confirmedAt;
    }

    public function setConfirmedAt(?\DateTimeImmutable $confirmedAt): static
    {
        $this->confirmedAt = $confirmedAt;

        return $this;
    }
}