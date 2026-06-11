<?php

namespace App\Controller;

use App\Entity\ClubProfile;
use App\Entity\User;
use App\Repository\UserRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/users')]
final class UserController extends AbstractController
{
    #[Route('/', name: 'getUsers', methods: ['GET'])]
    public function index(UserRepository $userRepository): JsonResponse
    {
        $users = $userRepository->findAll();

        return $this->json($users, 200);
    }

    #[Route('/agents-and-clubs', name: 'getAgentsAndClubs', methods: ['GET'])]
    public function getAgentsAndClubs(UserRepository $userRepository, #[CurrentUser] ?User $user): JsonResponse
    {
        if(!$user || !$selfUserId = $user->getId()) {
            return $this->json([
                'message' => 'Utilisateur non authentifié',
            ], 401);
        }

        
        $agentsAndClubs = $userRepository->findAgentsAndClubsExceptMe($selfUserId);
        $agentsAndClubs = array_map(function(User $user) {
            return [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'firstname' => $user->getFirstname(),
                'lastname' => $user->getLastname(),
                'agentProfile' => $user->getAgentProfile() ? [
                    'id' => $user->getAgentProfile()->getId(),
                    'companyName' => $user->getAgentProfile()->getAgencyName(),
                ] : null,
                'clubProfiles' => array_map(function(ClubProfile $clubProfile) {
                    return [
                        'id' => $clubProfile->getId(),
                        'jobTitle' => $clubProfile->getJobTitle(),
                    ];
                }, $user->getClubProfiles()->toArray()),
            ];
        }, $agentsAndClubs);

        return $this->json($agentsAndClubs, 200);
    }

    #[Route('/{id}', methods: ['GET'])]
    public function show(UserRepository $userRepository, int $id): JsonResponse
    {
        $user = $userRepository->find($id);
        if (!$user) {
            return $this->json([
                'message' => 'Utilisateur introuvable',
            ]);
        }

        return $this->json($user);
    }
}
