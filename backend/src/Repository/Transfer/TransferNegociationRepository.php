<?php

namespace App\Repository\Transfer;

use App\Entity\Transfer\TransferNegociation;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<TransferNegociation>
 */
class TransferNegociationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TransferNegociation::class);
    }
}
