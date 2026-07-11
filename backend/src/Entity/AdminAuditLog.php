<?php

namespace App\Entity;

use App\Repository\AdminAuditLogRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: AdminAuditLogRepository::class)]
#[ORM\Table(name: 'admin_audit_log')]
#[ORM\Index(name: 'idx_admin_audit_created', columns: ['created_at'])]
#[ORM\Index(name: 'idx_admin_audit_action', columns: ['action'])]
final class AdminAuditLog
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?Uuid $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?User $admin = null;

    #[ORM\Column(length: 320)] private string $adminEmail = '';
    #[ORM\Column(length: 255)] private string $adminName = '';
    #[ORM\Column(length: 80)] private string $action = '';
    #[ORM\Column(length: 50)] private string $category = '';
    #[ORM\Column(length: 80)] private string $targetType = '';
    #[ORM\Column(length: 120, nullable: true)] private ?string $targetId = null;
    #[ORM\Column(length: 255)] private string $targetLabel = '';
    #[ORM\Column(type: Types::JSON)] private array $changes = [];
    #[ORM\Column(type: Types::JSON)] private array $context = [];
    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)] private \DateTimeImmutable $createdAt;

    public function __construct() { $this->createdAt = new \DateTimeImmutable(); }
    public function getId(): ?Uuid { return $this->id; }
    public function setAdmin(?User $v): static { $this->admin=$v; return $this; }
    public function getAdminEmail(): string { return $this->adminEmail; }
    public function setAdminEmail(string $v): static { $this->adminEmail=$v; return $this; }
    public function getAdminName(): string { return $this->adminName; }
    public function setAdminName(string $v): static { $this->adminName=$v; return $this; }
    public function getAction(): string { return $this->action; }
    public function setAction(string $v): static { $this->action=$v; return $this; }
    public function getCategory(): string { return $this->category; }
    public function setCategory(string $v): static { $this->category=$v; return $this; }
    public function getTargetType(): string { return $this->targetType; }
    public function setTargetType(string $v): static { $this->targetType=$v; return $this; }
    public function getTargetId(): ?string { return $this->targetId; }
    public function setTargetId(?string $v): static { $this->targetId=$v; return $this; }
    public function getTargetLabel(): string { return $this->targetLabel; }
    public function setTargetLabel(string $v): static { $this->targetLabel=$v; return $this; }
    public function getChanges(): array { return $this->changes; }
    public function setChanges(array $v): static { $this->changes=$v; return $this; }
    public function getContext(): array { return $this->context; }
    public function setContext(array $v): static { $this->context=$v; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
}
