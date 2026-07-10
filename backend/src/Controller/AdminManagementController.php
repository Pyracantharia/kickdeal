<?php

namespace App\Controller;

use App\Entity\Agent;
use App\Entity\Player;
use App\Entity\Team;
use App\Entity\TeamMembership;
use App\Entity\User;
use App\Enum\AgentLicenseStatusEnum;
use App\Enum\MembershipRoleEnum;
use App\Enum\PlayerAvailabilityStatusEnum;
use App\Enum\PlayerContractStatusEnum;
use App\Enum\PlayerMarketStatusEnum;
use App\Enum\TeamVerificationStatusEnum;
use App\Repository\AgentRepository;
use App\Repository\PlayerRepository;
use App\Repository\TeamMembershipRepository;
use App\Repository\TeamRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/admin')]
final class AdminManagementController extends AbstractController
{
    #[Route('/clubs', methods: ['GET'])]
    public function clubs(#[CurrentUser] ?User $admin, TeamRepository $teams): JsonResponse
    {
        if (!$this->isAdmin($admin)) return $this->json(['error' => 'Unauthorized'], 401);

        return $this->json(['clubs' => array_map($this->serializeClub(...), $teams->findBy([], ['name' => 'ASC']))]);
    }

    #[Route('/clubs/{id}', methods: ['PUT'])]
    public function updateClub(Request $request, #[CurrentUser] ?User $admin, Team $team, EntityManagerInterface $em): JsonResponse
    {
        if (!$this->isAdmin($admin)) return $this->json(['error' => 'Unauthorized'], 401);
        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) return $this->json(['message' => 'Payload invalide.'], 400);

        $name = trim((string) ($data['name'] ?? ''));
        $budget = $data['transferBudget'] ?? null;
        $status = TeamVerificationStatusEnum::tryFrom((string) ($data['verificationStatus'] ?? ''));
        if ('' === $name || !is_numeric($budget) || (int) $budget < 0 || null === $status) {
            return $this->json(['message' => 'Nom, budget ou statut invalide.'], 422);
        }

        $team->setName($name)
            ->setCountry(trim((string) ($data['country'] ?? '')))
            ->setLeague(trim((string) ($data['league'] ?? '')))
            ->setLogoUrl(trim((string) ($data['logoUrl'] ?? '')))
            ->setTransferBudget((int) $budget)
            ->setVerificationStatus($status);
        $em->flush();

        return $this->json(['message' => 'Club mis à jour.', 'club' => $this->serializeClub($team)]);
    }

    #[Route('/clubs/{teamId}/members/{id}', methods: ['PATCH'])]
    public function updateMember(Request $request, #[CurrentUser] ?User $admin, TeamMembership $membership, string $teamId, EntityManagerInterface $em): JsonResponse
    {
        if (!$this->isAdmin($admin)) return $this->json(['error' => 'Unauthorized'], 401);
        if ($membership->getTeam()?->getId()?->toRfc4122() !== $teamId) return $this->json(['message' => 'Membre introuvable dans ce club.'], 404);
        $data = json_decode($request->getContent(), true);
        $role = MembershipRoleEnum::tryFrom((string) ($data['role'] ?? ''));
        $user = $membership->getUser();
        if (null === $role || !$user) return $this->json(['message' => 'Informations du membre invalides.'], 422);
        $firstName = trim((string) ($data['firstName'] ?? $user->getFirstName()));
        $lastName = trim((string) ($data['lastName'] ?? $user->getLastName()));
        $email = strtolower(trim((string) ($data['email'] ?? $user->getEmail())));
        if ('' === $firstName || '' === $lastName || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->json(['message' => 'Nom ou adresse e-mail invalide.'], 422);
        }
        $user->setFirstName($firstName)->setLastName($lastName)->setEmail($email)->setPhone(array_key_exists('phone', $data) ? $this->nullableString($data['phone']) : $user->getPhone());
        $membership->setRole($role);
        $em->flush();
        return $this->json(['message' => 'Membre mis à jour.']);
    }

    #[Route('/clubs/{id}/members', methods: ['GET'])]
    public function clubMembers(#[CurrentUser] ?User $admin, Team $team): JsonResponse
    {
        if (!$this->isAdmin($admin)) return $this->json(['error' => 'Unauthorized'], 401);
        return $this->json(['club' => ['id' => $team->getId()?->toRfc4122(), 'name' => $team->getName(), 'logoUrl' => $team->getLogoUrl()], 'members' => array_map($this->serializeMember(...), $team->getTeamMemberships()->toArray())]);
    }

    #[Route('/clubs/{id}/players', methods: ['GET'])]
    public function clubPlayers(#[CurrentUser] ?User $admin, Team $team, PlayerRepository $players): JsonResponse
    {
        if (!$this->isAdmin($admin)) return $this->json(['error' => 'Unauthorized'], 401);
        return $this->json(['club' => ['id' => $team->getId()?->toRfc4122(), 'name' => $team->getName(), 'logoUrl' => $team->getLogoUrl()], 'players' => array_map($this->serializePlayer(...), $players->findRosterForTeam($team))]);
    }

    #[Route('/players/{id}', methods: ['PUT'])]
    public function updatePlayer(Request $request, #[CurrentUser] ?User $admin, Player $player, TeamRepository $teams, AgentRepository $agents, EntityManagerInterface $em): JsonResponse
    {
        if (!$this->isAdmin($admin)) return $this->json(['error' => 'Unauthorized'], 401);
        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) return $this->json(['message' => 'Payload invalide.'], 400);
        $firstName = trim((string) ($data['firstName'] ?? '')); $lastName = trim((string) ($data['lastName'] ?? '')); $position = trim((string) ($data['position'] ?? ''));
        $contractStatus = PlayerContractStatusEnum::tryFrom((string) ($data['contractStatus'] ?? ''));
        $marketStatus = PlayerMarketStatusEnum::tryFrom((string) ($data['marketStatus'] ?? ''));
        $availabilityStatus = PlayerAvailabilityStatusEnum::tryFrom((string) ($data['availabilityStatus'] ?? ''));
        if ('' === $firstName || '' === $lastName || '' === $position || !$contractStatus || !$marketStatus || !$availabilityStatus) return $this->json(['message' => 'Informations du joueur invalides.'], 422);
        $team = $this->nullableString($data['teamId'] ?? null); $agent = $this->nullableString($data['agentId'] ?? null);
        $player->setFirstName($firstName)->setLastName($lastName)->setPhotoUrl($this->nullableString($data['photoUrl'] ?? null))->setNationality($this->nullableString($data['nationality'] ?? null))->setPosition($position)
            ->setHeightCm($this->nullableInt($data['heightCm'] ?? null))->setWeightKg($this->nullableInt($data['weightKg'] ?? null))->setPreferredFoot($this->nullableString($data['preferredFoot'] ?? null))
            ->setMarketValue($this->nullableMoney($data['marketValue'] ?? null))->setWeeklySalary($this->nullableMoney($data['weeklySalary'] ?? null))->setReleaseClause($this->nullableMoney($data['releaseClause'] ?? null))
            ->setContractStatus($contractStatus)->setContractEndDate($this->nullableDate($data['contractEndDate'] ?? null))->setJoinedAt($this->nullableDate($data['joinedAt'] ?? null))
            ->setMarketStatus($marketStatus)->setAvailabilityStatus($availabilityStatus)->setTeam($team ? $teams->find($team) : null)->setAgent($agent ? $agents->find($agent) : null);
        if ($this->nullableString($data['birthDate'] ?? null)) $player->setBirthDate(new \DateTimeImmutable((string) $data['birthDate']));
        $em->flush();
        return $this->json(['message' => 'Joueur mis à jour.', 'player' => $this->serializePlayer($player)]);
    }

    #[Route('/clubs/{teamId}/members/{id}', methods: ['DELETE'])]
    public function removeMember(#[CurrentUser] ?User $admin, TeamMembership $membership, string $teamId, TeamMembershipRepository $memberships, EntityManagerInterface $em): JsonResponse
    {
        if (!$this->isAdmin($admin)) return $this->json(['error' => 'Unauthorized'], 401);
        $team = $membership->getTeam();
        if (!$team || $team->getId()?->toRfc4122() !== $teamId) return $this->json(['message' => 'Membre introuvable dans ce club.'], 404);
        $managers = array_filter($memberships->findByTeamOrdered($team), static fn (TeamMembership $item): bool => MembershipRoleEnum::CLUB_MANAGER === $item->getRole());
        if (MembershipRoleEnum::CLUB_MANAGER === $membership->getRole() && count($managers) <= 1) {
            return $this->json(['message' => 'Impossible de retirer le dernier responsable du club.'], 409);
        }
        $em->remove($membership);
        $em->flush();
        return $this->json(['message' => 'Membre retiré du club.']);
    }

    #[Route('/agents', methods: ['GET'])]
    public function agents(#[CurrentUser] ?User $admin, AgentRepository $agents, PlayerRepository $players): JsonResponse
    {
        if (!$this->isAdmin($admin)) return $this->json(['error' => 'Unauthorized'], 401);
        return $this->json(['agents' => array_map(fn (Agent $agent): array => $this->serializeAgent($agent, $players), $agents->findBy([], ['createdAt' => 'DESC']))]);
    }

    #[Route('/agents/{id}/license', methods: ['PATCH'])]
    public function updateLicense(Request $request, #[CurrentUser] ?User $admin, Agent $agent, EntityManagerInterface $em): JsonResponse
    {
        if (!$this->isAdmin($admin)) return $this->json(['error' => 'Unauthorized'], 401);
        if (!$agent->getAgentLicense()) return $this->json(['message' => 'Cet agent ne possède aucune licence.'], 422);
        $data = json_decode($request->getContent(), true);
        $status = AgentLicenseStatusEnum::tryFrom((string) ($data['status'] ?? ''));
        if (null === $status) return $this->json(['message' => 'Statut invalide.'], 422);
        $agent->getAgentLicense()?->setStatus($status);
        $em->flush();
        return $this->json(['message' => 'Statut de la licence mis à jour.']);
    }

    #[Route('/agents/{agentId}/players/{id}', methods: ['DELETE'])]
    public function removeRepresentedPlayer(#[CurrentUser] ?User $admin, Player $player, string $agentId, EntityManagerInterface $em): JsonResponse
    {
        if (!$this->isAdmin($admin)) return $this->json(['error' => 'Unauthorized'], 401);
        if ($player->getAgent()?->getId()?->toRfc4122() !== $agentId) return $this->json(['message' => 'Ce joueur n’est pas représenté par cet agent.'], 409);
        $player->setAgent(null);
        $em->flush();
        return $this->json(['message' => 'Joueur retiré du portefeuille de l’agent.']);
    }

    private function isAdmin(?User $user): bool { return $user instanceof User && in_array(User::ROLE_ADMIN, $user->getRoles(), true); }

    private function serializeClub(Team $team): array
    {
        return [
            'id' => $team->getId()?->toRfc4122(), 'name' => $team->getName(), 'country' => $team->getCountry(),
            'league' => $team->getLeague(), 'logoUrl' => $team->getLogoUrl(), 'transferBudget' => $team->getTransferBudget() ?? 0,
            'verificationStatus' => $team->getVerificationStatus()?->value,
            'members' => array_map($this->serializeMember(...), $team->getTeamMemberships()->toArray()),
            'playersCount' => $team->getPlayers()->count(),
        ];
    }

    private function serializeMember(TeamMembership $membership): array
    {
        return ['id' => $membership->getId()?->toRfc4122(), 'firstName' => $membership->getUser()?->getFirstName(), 'lastName' => $membership->getUser()?->getLastName(), 'email' => $membership->getUser()?->getEmail(), 'phone' => $membership->getUser()?->getPhone(), 'role' => $membership->getRole()?->value, 'primary' => $membership->isPrimary()];
    }

    private function serializePlayer(Player $player): array
    {
        return ['id' => $player->getId()?->toRfc4122(), 'firstName' => $player->getFirstName(), 'lastName' => $player->getLastName(), 'photoUrl' => $player->getPhotoUrl(), 'birthDate' => $player->getBirthDate()?->format('Y-m-d'), 'nationality' => $player->getNationality(), 'position' => $player->getPosition(), 'heightCm' => $player->getHeightCm(), 'weightKg' => $player->getWeightKg(), 'preferredFoot' => $player->getPreferredFoot(), 'marketValue' => $player->getMarketValue(), 'weeklySalary' => $player->getWeeklySalary(), 'releaseClause' => $player->getReleaseClause(), 'contractStatus' => $player->getContractStatus()?->value, 'contractEndDate' => $player->getContractEndDate()?->format('Y-m-d'), 'joinedAt' => $player->getJoinedAt()?->format('Y-m-d'), 'marketStatus' => $player->getMarketStatus()?->value, 'availabilityStatus' => $player->getAvailabilityStatus()?->value, 'team' => $player->getTeam() ? ['id' => $player->getTeam()?->getId()?->toRfc4122(), 'name' => $player->getTeam()?->getName()] : null, 'agent' => $player->getAgent() ? ['id' => $player->getAgent()?->getId()?->toRfc4122(), 'name' => $player->getAgent()?->getAgencyName() ?: $player->getAgent()?->getUser()?->getEmail()] : null];
    }

    private function nullableString(mixed $value): ?string { $value = trim((string) $value); return '' === $value ? null : $value; }
    private function nullableInt(mixed $value): ?int { return null === $value || '' === $value ? null : (int) $value; }
    private function nullableMoney(mixed $value): ?int { return null === $value || '' === $value ? null : max(0, (int) $value); }
    private function nullableDate(mixed $value): ?\DateTimeImmutable { $value = $this->nullableString($value); return $value ? new \DateTimeImmutable($value) : null; }

    private function serializeAgent(Agent $agent, PlayerRepository $players): array
    {
        $license = $agent->getAgentLicense();
        return [
            'id' => $agent->getId()?->toRfc4122(), 'agencyName' => $agent->getAgencyName(), 'country' => $agent->getCountry(),
            'user' => ['firstName' => $agent->getUser()?->getFirstName(), 'lastName' => $agent->getUser()?->getLastName(), 'email' => $agent->getUser()?->getEmail()],
            'license' => $license ? ['number' => $license->getLicenseNumber(), 'issuedBy' => $license->getIssuedBy(), 'validUntil' => $license->getValidUntil()?->format('Y-m-d'), 'documentUrl' => $license->getDocumentUrl(), 'status' => $license->getStatus()?->value] : null,
            'players' => array_map(static fn (Player $p): array => ['id' => $p->getId()?->toRfc4122(), 'firstName' => $p->getFirstName(), 'lastName' => $p->getLastName(), 'position' => $p->getPosition(), 'team' => $p->getTeam()?->getName()], $players->findRepresentedByAgent($agent)),
        ];
    }
}
