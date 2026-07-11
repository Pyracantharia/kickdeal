<?php

namespace App\Service;

use App\Entity\AdminAuditLog;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;

final class AdminAuditLogger
{
    public function __construct(private readonly EntityManagerInterface $em) {}

    public function record(User $admin, string $action, string $category, string $targetType, ?string $targetId, string $targetLabel, array $before = [], array $after = [], array $context = []): void
    {
        $keys=array_unique([...array_keys($before),...array_keys($after)]);$changes=[];
        foreach($keys as $key){$old=$before[$key]??null;$new=$after[$key]??null;if($old!==$new)$changes[$key]=['before'=>$old,'after'=>$new];}
        $log=(new AdminAuditLog())->setAdmin($admin)->setAdminEmail((string)$admin->getEmail())->setAdminName(trim((string)$admin->getFirstName().' '.(string)$admin->getLastName()))->setAction($action)->setCategory($category)->setTargetType($targetType)->setTargetId($targetId)->setTargetLabel($targetLabel)->setChanges($changes)->setContext($context);
        $this->em->persist($log);$this->em->flush();
    }
}
