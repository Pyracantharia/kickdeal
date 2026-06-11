<?php

namespace App\Controller;

use App\Entity\ClubProfile;
use App\Entity\ClubRequest;
use App\Entity\TeamMembership;
use App\Entity\User;
use App\Enum\ClubRequestStatusEnum;
use App\Enum\MembershipRoleEnum;
use App\Repository\ClubRequestRepository;
use DateTimeImmutable;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('api/admin')]
final class AdminController extends AbstractController
{
    #[Route('/club-requests/pending', name: 'admin_pending_club_requests', methods: ['GET'])]
    public function getPendingClubRequests(
        Request $request,
        #[CurrentUser] ?User $user,
        ClubRequestRepository $clubRequestRepository
    ) :JsonResponse
    {
        if (!$user || !in_array('ROLE_ADMIN', $user->getRoles())) {
            return $this->json([
                'error' => 'Unauthorized'
            ], 401);
        }

        $limit = $request->query->get('limit');
        $limit = $limit && is_numeric($limit) ? (int) $limit : null;

        $pendingRequests = $clubRequestRepository->findPendingRequests($limit);

        return $this->json([
            "pendingRequests" => $pendingRequests
        ], 200, [], ['groups' => 'admin:club_request:read']);
    }

    #[Route('/club-requests/approve/{id}', name: 'admin_approve_club_request', methods: ['PUT'])]
    public function approveClubRequest(
        #[CurrentUser] ?User $user,
        ClubRequest $clubRequest,
        EntityManagerInterface $entityManager
    ): JsonResponse
    {

        if (!$user || !in_array('ROLE_ADMIN', $user->getRoles())) {
            return $this->json([
                'error' => 'Unauthorized'
            ], 401);
        }

        if($clubRequest->getStatus() !== ClubRequestStatusEnum::PENDING) {
            return $this->json([
                'error' => 'Only pending requests can be approved'
            ], 400);
        }

        $clubRequest->setStatus(ClubRequestStatusEnum::APPROVED);
        $clubRequest->setUpdatedAt(new DateTimeImmutable());

        $entityManager->persist($clubRequest);

        // Create a new TeamMembership for the requester and the team
        $teamMembership = (new TeamMembership())
            ->setTeam($clubRequest->getTeam())
            ->setUser($clubRequest->getRequester())
            ->setRole(MembershipRoleEnum::CLUB_MANAGER)
            ->setPrimary(true)
            ->setCreatedAt(new DateTimeImmutable());
        
        $entityManager->persist($teamMembership);


        // create a new clubProfile for the team
        $clubProfile = (new ClubProfile())
            ->setUser($clubRequest->getRequester())
            ->setJobTitle("Gérant du club")
            ->setProfessionalContact($clubRequest->getRequester()->getPhone())
            ->setCreatedAt(new DateTimeImmutable());

        $entityManager->persist($clubProfile);
        $entityManager->flush();
        return $this->json([
            "message" => "Club request approved successfully",
            "approvedClubRequest" => [
                "id" => $clubRequest->getId(),
                "teamId" => $clubRequest->getTeam()->getId(),
                "status" => true
            ]
        ], 200, []);
    }

    #[Route('/club-requests/reject/{id}', name: 'admin_reject_club_request', methods: ['PUT'])]
    public function rejectClubRequest(): JsonResponse
    {
        return $this->json([
            "message" => "Club request rejected successfully"
        ], 200, [], []);
    }
}
