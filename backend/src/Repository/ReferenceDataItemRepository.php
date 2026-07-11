<?php
namespace App\Repository;
use App\Entity\ReferenceDataItem;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
final class ReferenceDataItemRepository extends ServiceEntityRepository
{
 public function __construct(ManagerRegistry $registry){parent::__construct($registry,ReferenceDataItem::class);}
 public function findByType(string $type):array{return $this->findBy(['type'=>$type],['label'=>'ASC']);}
}
