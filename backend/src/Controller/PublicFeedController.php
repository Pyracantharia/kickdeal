<?php

namespace App\Controller;

use App\Entity\PublicFeedPost;
use App\Repository\PublicFeedPostRepository;
use App\Repository\TeamRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/public-feed')]
final class PublicFeedController extends AbstractController
{
    private const array ALLOWED_TABS = ['featured', 'official', 'live'];
    private const array ALLOWED_TYPES = [
        'agreement',
        'contract_signed',
        'contract_renewal',
        'loan',
        'market_listing',
        'market_removal',
        'negotiation',
        'offer_accepted',
        'offer_refused',
        'offer_sent',
        'transfer_official',
    ];

    #[Route('', name: 'api_public_feed_index', methods: ['GET'])]
    public function index(Request $request, PublicFeedPostRepository $publicFeedPostRepository): JsonResponse
    {
        $tab = $request->query->getString('tab', 'featured');
        if (!in_array($tab, self::ALLOWED_TABS, true)) {
            $tab = 'featured';
        }

        $type = $request->query->getString('type', '');
        if ('' !== $type && !in_array($type, self::ALLOWED_TYPES, true)) {
            $type = '';
        }

        $limit = max(1, min(50, $request->query->getInt('limit', 30)));
        $posts = $publicFeedPostRepository->findForPublicFeed([
            'tab' => $tab,
            'type' => $type,
            'league' => $this->optionalQuery($request, 'league'),
            'country' => $this->optionalQuery($request, 'country'),
            'club' => $this->optionalQuery($request, 'club'),
            'player' => $this->optionalQuery($request, 'player'),
            'cursor' => $this->optionalQuery($request, 'cursor'),
            'limit' => $limit,
        ]);

        $lastPost = end($posts) ?: null;

        return $this->json([
            'posts' => array_map(
                fn (PublicFeedPost $post): array => $this->serializePost($post),
                $posts,
            ),
            'nextCursor' => $lastPost instanceof PublicFeedPost && count($posts) === $limit
                ? $lastPost->getPublishedAt()->format(DATE_ATOM)
                : null,
        ]);
    }

    #[Route('/filters/options', name: 'api_public_feed_filter_options', methods: ['GET'])]
    public function filterOptions(TeamRepository $teamRepository): JsonResponse
    {
        $teams = $teamRepository->searchByQuery(null, 500);
        $leagues = [];
        $countries = [];
        $clubs = [];

        foreach ($teams as $team) {
            $league = trim((string) $team->getLeague());
            $country = trim((string) $team->getCountry());

            if ('' !== $league) {
                $leagues[$league] = [
                    'name' => $league,
                    'country' => '' !== $country ? $country : null,
                    'clubCount' => ($leagues[$league]['clubCount'] ?? 0) + 1,
                ];
            }

            if ('' !== $country) {
                $countries[$country] = $country;
            }

            $clubs[] = [
                'id' => $team->getId()?->toRfc4122(),
                'name' => $team->getName(),
                'logoUrl' => $team->getLogoUrl(),
                'league' => $team->getLeague(),
                'country' => $team->getCountry(),
            ];
        }

        usort($clubs, static fn (array $a, array $b): int => strcmp((string) $a['name'], (string) $b['name']));
        ksort($leagues);
        sort($countries);

        return $this->json([
            'leagues' => array_values($leagues),
            'countries' => array_values(array_map(
                static fn (string $country): array => ['name' => $country],
                $countries,
            )),
            'clubs' => $clubs,
            'eventTypes' => array_map(
                static fn (string $type): array => ['value' => $type],
                self::ALLOWED_TYPES,
            ),
        ]);
    }

    #[Route('/{id}', name: 'api_public_feed_show', methods: ['GET'])]
    public function show(PublicFeedPost $post): JsonResponse
    {
        return $this->json([
            'post' => $this->serializePost($post, true),
        ]);
    }

    private function optionalQuery(Request $request, string $key): string
    {
        return trim($request->query->getString($key, ''));
    }

    /**
     * @return array<string, mixed>
     */
    private function serializePost(PublicFeedPost $post, bool $withDetails = false): array
    {
        $player = $post->getPlayer();
        $sellerTeam = $post->getSellerTeam();
        $buyerTeam = $post->getBuyerTeam();
        $details = $post->getDetailsJson();

        return [
            'id' => $post->getId()?->toRfc4122(),
            'eventType' => $post->getEventType(),
            'type' => $post->getEventType(),
            'bucket' => $post->getBucket(),
            'isFeatured' => $post->isFeatured(),
            'headline' => $post->getHeadline(),
            'title' => $post->getHeadline(),
            'body' => $post->getBody(),
            'subtitle' => $post->getBody(),
            'playerName' => $post->getPlayerName(),
            'publishedAt' => $post->getPublishedAt()->format(DATE_ATOM),
            'amount' => null !== $post->getAmount() ? $post->getAmount() / 100 : null,
            'amountLabel' => $details['amountLabel'] ?? $this->formatMoney($post->getAmount()),
            'currency' => $post->getCurrency(),
            'league' => $post->getLeague(),
            'country' => $post->getCountry(),
            'isOfficial' => 'official' === $post->getBucket(),
            'player' => [
                'id' => $player?->getId()?->toRfc4122(),
                'name' => $post->getPlayerName(),
                'position' => $player?->getPosition(),
                'nationality' => $player?->getNationality(),
                'photoUrl' => $player?->getPhotoUrl(),
                'contractEndDate' => $player?->getContractEndDate()?->format('Y-m-d'),
            ],
            'sellerTeam' => $this->serializeTeam($sellerTeam),
            'buyerTeam' => $this->serializeTeam($buyerTeam),
            'clubLogos' => array_values(array_filter([
                $sellerTeam?->getLogoUrl(),
                $buyerTeam?->getLogoUrl(),
            ])),
            'fromClubName' => $sellerTeam?->getName(),
            'toClubName' => $buyerTeam?->getName(),
            'details' => $withDetails ? $details : null,
            'history' => $withDetails ? ($details['history'] ?? []) : null,
        ];
    }

    /**
     * @return array{id: string|null, name: string|null, logoUrl: string|null, league: string|null, country: string|null}
     */
    private function serializeTeam(?\App\Entity\Team $team): array
    {
        return [
            'id' => $team?->getId()?->toRfc4122(),
            'name' => $team?->getName(),
            'logoUrl' => $team?->getLogoUrl(),
            'league' => $team?->getLeague(),
            'country' => $team?->getCountry(),
        ];
    }

    private function formatMoney(int|string|null $amount): ?string
    {
        if (null === $amount) {
            return null;
        }

        $value = ((int) $amount) / 100;
        if ($value >= 1_000_000) {
            return number_format($value / 1_000_000, 1, ',', ' ').' M EUR';
        }
        if ($value >= 1_000) {
            return number_format($value / 1_000, 0, ',', ' ').' K EUR';
        }

        return number_format($value, 0, ',', ' ').' EUR';
    }
}
