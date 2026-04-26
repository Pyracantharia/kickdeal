<?php

namespace App\Controller;

use App\Entity\ClubRequest;
use App\Entity\Team;
use App\Entity\TeamMembership;
use App\Entity\User;
use App\Enum\MembershipRoleEnum;
use App\Enum\TeamVerificationStatusEnum;
use App\Repository\ClubRequestRepository;
use App\Repository\TeamMembershipRepository;
use App\Repository\TeamRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Csrf\CsrfToken;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Uid\Uuid;

#[Route('/api/clubs')]
final class ClubController extends AbstractController
{
    private const string CSRF_TOKEN_ID = 'api_auth';

    #[Route('/search', name: 'app_club_search', methods: ['GET'])]
    public function search(Request $request, TeamRepository $teamRepository): JsonResponse
    {
        $query = $request->query->getString('query', '');

        $teams = $teamRepository->searchByQuery($query, 30);

        $clubs = array_map(static fn (Team $team): array => [
            'id' => $team->getId()?->toRfc4122(),
            'name' => $team->getName(),
            'league' => $team->getLeague() ?? '',
            'country' => $team->getCountry() ?? '',
            'logoUrl' => $team->getLogoUrl(),
        ], $teams);

        return $this->json([
            'clubs' => $clubs,
        ]);
    }

    #[Route('/requests', name: 'app_club_request_create', methods: ['POST'])]
    public function createRequest(
        Request $request,
        #[CurrentUser] ?User $user,
        TeamRepository $teamRepository,
        TeamMembershipRepository $teamMembershipRepository,
        ClubRequestRepository $clubRequestRepository,
        EntityManagerInterface $entityManager,
        CsrfTokenManagerInterface $csrfTokenManager,
    ): JsonResponse {
        if ($csrfError = $this->validateCsrfToken($request, $csrfTokenManager)) {
            return $csrfError;
        }

        if (!$user) {
            return $this->json([
                'errorMessage' => 'Utilisateur non authentifié.',
            ], 401);
        }

        $teamId = trim((string) $request->request->get('teamId', ''));
        $clubName = trim((string) $request->request->get('clubName', ''));
        $league = trim((string) $request->request->get('league', ''));
        $country = trim((string) $request->request->get('country', ''));

        $verificationEmail = trim((string) $request->request->get('verificationEmail', ''));
        $verificationMessage = trim((string) $request->request->get('verificationMessage', ''));
        $verificationDocument = $request->files->get('verificationDocument');

        if ('' === $teamId && '' === $clubName) {
            return $this->json([
                'errorMessage' => 'Le club sélectionné est requis.',
            ], 422);
        }

        if ('' === $verificationEmail && '' === $verificationMessage && !$verificationDocument instanceof UploadedFile) {
            return $this->json([
                'errorMessage' => 'Au moins une méthode de vérification est requise.',
            ], 422);
        }

        if ('' !== $verificationEmail && !filter_var($verificationEmail, FILTER_VALIDATE_EMAIL)) {
            return $this->json([
                'errorMessage' => 'Email professionnel invalide.',
            ], 422);
        }

        $team = $this->resolveTeam($teamRepository, $entityManager, $teamId, $clubName, $league, $country);

        if (!$team) {
            return $this->json([
                'errorMessage' => 'Club introuvable.',
            ], 404);
        }

        if ($clubRequestRepository->hasPendingRequest($user, $team)) {
            return $this->json([
                'errorMessage' => 'Une demande de création est déjà en attente pour ce club.',
            ], 409);
        }

        if (!$teamMembershipRepository->findOneBy(['user' => $user, 'team' => $team])) {
            $hasPrimaryMembership = $teamMembershipRepository->findOneBy(['user' => $user, 'primary' => true]);

            $teamMembership = (new TeamMembership())
                ->setUser($user)
                ->setTeam($team)
                ->setRole(MembershipRoleEnum::CLUB_MANAGER)
                ->setPrimary(null === $hasPrimaryMembership);

            $entityManager->persist($teamMembership);
        }

        $clubRequest = (new ClubRequest())
            ->setRequester($user)
            ->setTeam($team)
            ->setVerificationEmail('' === $verificationEmail ? null : $verificationEmail)
            ->setVerificationMessage('' === $verificationMessage ? null : $verificationMessage);

        if ($verificationDocument instanceof UploadedFile) {
            $uploadResult = $this->storeVerificationDocument($verificationDocument);

            if (null === $uploadResult) {
                return $this->json([
                    'errorMessage' => 'Impossible de sauvegarder le document de vérification.',
                ], 500);
            }

            $clubRequest
                ->setVerificationDocumentPath($uploadResult['path'])
                ->setVerificationDocumentOriginalName($uploadResult['originalName']);
        }

        if (null === $team->getVerificationStatus()) {
            $team->setVerificationStatus(TeamVerificationStatusEnum::PENDING);
        }

        $entityManager->persist($clubRequest);
        $entityManager->flush();

        return $this->json([
            'message' => 'Demande club soumise avec succès.',
            'clubRequestId' => $clubRequest->getId()?->toRfc4122(),
            'teamId' => $team->getId()?->toRfc4122(),
        ], 201);
    }

    private function validateCsrfToken(Request $request, CsrfTokenManagerInterface $csrfTokenManager): ?JsonResponse
    {
        $token = $request->headers->get('X-CSRF-TOKEN');

        if (!$token || !$csrfTokenManager->isTokenValid(new CsrfToken(self::CSRF_TOKEN_ID, $token))) {
            return $this->json([
                'errorMessage' => 'Token CSRF invalide.',
            ], 403);
        }

        return null;
    }

    private function resolveTeam(
        TeamRepository $teamRepository,
        EntityManagerInterface $entityManager,
        string $teamId,
        string $clubName,
        string $league,
        string $country,
    ): ?Team {
        if ('' !== $teamId && Uuid::isValid($teamId)) {
            $team = $teamRepository->find(Uuid::fromString($teamId));
            if ($team instanceof Team) {
                return $team;
            }
        }

        if ('' === $clubName) {
            return null;
        }

        $existingTeam = $teamRepository->findOneBy(['name' => $clubName]);
        if ($existingTeam instanceof Team) {
            return $existingTeam;
        }

        $team = (new Team())
            ->setName($clubName)
            ->setCountry('' === $country ? 'Inconnu' : $country)
            ->setLeague('' === $league ? 'Inconnue' : $league)
            ->setVerificationStatus(TeamVerificationStatusEnum::PENDING);

        $entityManager->persist($team);

        return $team;
    }

    /**
     * @return array{path: string, originalName: string}|null
     */
    private function storeVerificationDocument(UploadedFile $file): ?array
    {
        $uploadDirectory = $this->getParameter('kernel.project_dir').'/public/uploads/club-verifications';

        if (!is_dir($uploadDirectory) && !mkdir($uploadDirectory, 0775, true) && !is_dir($uploadDirectory)) {
            return null;
        }

        $safeName = preg_replace('/[^a-zA-Z0-9\-_]/', '-', pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) ?: 'document';
        $extension = $file->guessExtension() ?? $file->getClientOriginalExtension() ?? 'bin';
        $fileName = sprintf('%s-%s.%s', $safeName, Uuid::v4()->toRfc4122(), $extension);

        try {
            $file->move($uploadDirectory, $fileName);
        } catch (\Throwable) {
            return null;
        }

        return [
            'path' => '/uploads/club-verifications/'.$fileName,
            'originalName' => $file->getClientOriginalName(),
        ];
    }
}
