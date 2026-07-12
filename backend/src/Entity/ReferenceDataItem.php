<?php
namespace App\Entity;
use App\Repository\ReferenceDataItemRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: ReferenceDataItemRepository::class)]
#[ORM\Table(name:'reference_data_item')]
#[ORM\UniqueConstraint(name:'uniq_reference_type_code',columns:['type','code'])]
class ReferenceDataItem
{
 #[ORM\Id,ORM\Column(type:UuidType::NAME,unique:true),ORM\GeneratedValue(strategy:'CUSTOM'),ORM\CustomIdGenerator(class:UuidGenerator::class)] private ?Uuid $id=null;
 #[ORM\Column(length:40)] private string $type='';
 #[ORM\Column(length:120)] private string $code='';
 #[ORM\Column(length:180)] private string $label='';
 #[ORM\Column(type:Types::JSON)] private array $value=[];
 #[ORM\Column(options:['default'=>true])] private bool $active=true;
 #[ORM\Column(type:Types::DATETIME_IMMUTABLE)] private \DateTimeImmutable $createdAt;
 #[ORM\Column(type:Types::DATETIME_IMMUTABLE)] private \DateTimeImmutable $updatedAt;
 public function __construct(){ $this->createdAt=$this->updatedAt=new \DateTimeImmutable(); }
 public function getId():?Uuid{return $this->id;} public function getType():string{return $this->type;} public function setType(string $v):static{$this->type=$v;return $this;} public function getCode():string{return $this->code;} public function setCode(string $v):static{$this->code=$v;return $this;} public function getLabel():string{return $this->label;} public function setLabel(string $v):static{$this->label=$v;return $this;} public function getValue():array{return $this->value;} public function setValue(array $v):static{$this->value=$v;return $this;} public function isActive():bool{return $this->active;} public function setActive(bool $v):static{$this->active=$v;return $this;} public function touch():static{$this->updatedAt=new \DateTimeImmutable();return $this;}
}
