<?php

namespace App\Controller;

use App\Entity\Agent;
use App\Entity\Contract\ContractNegociation;
use App\Entity\Player;
use App\Entity\Listing;
use App\Entity\Payment;
use App\Entity\PublicFeedPost;
use App\Entity\ReferenceDataItem;
use App\Entity\Team;
use App\Entity\TeamMembership;
use App\Entity\Transfer\TransferNegociation;
use App\Entity\Transfer\TransferOffer;
use App\Entity\User;
use App\Enum\AgentLicenseStatusEnum;
use App\Enum\MembershipRoleEnum;
use App\Enum\ListingStatusEnum;
use App\Enum\OfferStatusEnum;
use App\Enum\PaymentProviderEnum;
use App\Enum\PlayerAvailabilityStatusEnum;
use App\Enum\PlayerContractStatusEnum;
use App\Enum\PlayerContractNegociationStatusEnum;
use App\Enum\PlayerMarketStatusEnum;
use App\Enum\TeamVerificationStatusEnum;
use App\Enum\SubscriptionPlanEnum;
use App\Enum\TransferNegociationStatusEnum;
use App\Repository\AgentRepository;
use App\Repository\AdminAuditLogRepository;
use App\Repository\Contract\ContractNegociationRepository;
use App\Repository\ListingRepository;
use App\Repository\PlayerRepository;
use App\Repository\PaymentRepository;
use App\Repository\PublicFeedPostRepository;
use App\Repository\ReferenceDataItemRepository;
use App\Repository\TeamMembershipRepository;
use App\Repository\TeamRepository;
use App\Repository\Transfer\TransferNegociationRepository;
use App\Repository\Transfer\TransferOfferRepository;
use App\Repository\UserRepository;
use App\Service\Payment\StripeSubscriptionService;
use App\Service\AdminAuditLogger;
use App\Service\ReferenceDataSettings;
use App\Service\TransferWindowSettings;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\DBAL\Connection;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Uid\Uuid;

#[Route('/api/admin')]
final class AdminManagementController extends AbstractController
{
    private const array REFERENCE_TYPES=['league','country','position','plan','business_parameter'];

    #[Route('/reference-data', methods: ['GET'])]
    public function referenceData(#[CurrentUser] ?User $admin, ReferenceDataItemRepository $items, Connection $db):JsonResponse
    {
        if(!$this->isAdmin($admin))return $this->json(['error'=>'Unauthorized'],401);$groups=[];
        foreach(self::REFERENCE_TYPES as $type){$groups[$type]=array_map(fn(ReferenceDataItem $item):array=>$this->serializeReferenceItem($item,$this->referenceUsage($db,$item->getType(),$item->getCode())),$items->findByType($type));}
        return $this->json(['references'=>$groups,'clubsUrl'=>'/admin/clubs']);
    }

    #[Route('/reference-data', methods: ['POST'])]
    public function createReferenceData(Request $request,#[CurrentUser]?User $admin,EntityManagerInterface $em,AdminAuditLogger $audit):JsonResponse
    {
        if(!$this->isAdmin($admin))return $this->json(['error'=>'Unauthorized'],401);$data=json_decode($request->getContent(),true);$type=(string)($data['type']??'');$code=trim((string)($data['code']??''));$label=trim((string)($data['label']??''));
        if(!in_array($type,['league','country','position'],true)||''===$code||''===$label)return $this->json(['message'=>'Référence invalide.'],422);
        $item=(new ReferenceDataItem())->setType($type)->setCode($code)->setLabel($label)->setValue(is_array($data['value']??null)?$data['value']:[]);$em->persist($item);
        try{$em->flush();}catch(\Throwable){return $this->json(['message'=>'Cette référence existe déjà.'],409);}
        $audit->record($admin,'reference.created','reference_data','reference_data_item',$item->getId()?->toRfc4122(),$label,[],['type'=>$type,'code'=>$code,'label'=>$label]);return $this->json(['message'=>'Référence créée.'],201);
    }

    #[Route('/reference-data/{id}', methods: ['PUT'])]
    public function updateReferenceData(Request $request,#[CurrentUser]?User $admin,ReferenceDataItem $item,Connection $db,EntityManagerInterface $em,AdminAuditLogger $audit,TransferWindowSettings $transferWindowSettings):JsonResponse
    {
        if(!$this->isAdmin($admin))return $this->json(['error'=>'Unauthorized'],401);$data=json_decode($request->getContent(),true);$label=trim((string)($data['label']??''));$code=trim((string)($data['code']??$item->getCode()));$value=is_array($data['value']??null)?$data['value']:$item->getValue();if(''===$label||''===$code)return $this->json(['message'=>'Référence invalide.'],422);
        if(in_array($item->getType(),['plan','business_parameter'],true))$code=$item->getCode();if('plan'===$item->getType()){if(!is_numeric($value['priceCents']??null)||(int)$value['priceCents']<0||!is_string($value['description']??null)||!is_array($value['features']??null)||array_filter($value['features'],static fn($feature):bool=>!is_string($feature))!==[])return $this->json(['message'=>'Prix, description ou avantages du plan invalides.'],422);}if('business_parameter'===$item->getType()&&'transfer_windows'===$item->getCode()){if($error=$transferWindowSettings->validateValue($value))return $this->json(['message'=>$error],422);}$before=['code'=>$item->getCode(),'label'=>$item->getLabel(),'value'=>$item->getValue(),'active'=>$item->isActive()];
        if($code!==$item->getCode()&&(int)$db->fetchOne('SELECT COUNT(*) FROM reference_data_item WHERE type = ? AND code = ?',[$item->getType(),$code])>0)return $this->json(['message'=>'Une référence avec ce code existe déjà.'],409);if($code!==$item->getCode())$this->renameReferenceUsage($db,$item->getType(),$item->getCode(),$code);$item->setCode($code)->setLabel($label)->setValue($value)->setActive((bool)($data['active']??true))->touch();
        try{$em->flush();}catch(\Throwable){return $this->json(['message'=>'Une référence avec ce code existe déjà.'],409);}$after=['code'=>$item->getCode(),'label'=>$item->getLabel(),'value'=>$item->getValue(),'active'=>$item->isActive()];$audit->record($admin,'reference.updated','reference_data','reference_data_item',$item->getId()?->toRfc4122(),$label,$before,$after);return $this->json(['message'=>'Référence mise à jour.']);
    }

    #[Route('/reference-data/{id}', methods: ['DELETE'])]
    public function deleteReferenceData(#[CurrentUser]?User $admin,ReferenceDataItem $item,Connection $db,EntityManagerInterface $em,AdminAuditLogger $audit):JsonResponse
    {
        if(!$this->isAdmin($admin))return $this->json(['error'=>'Unauthorized'],401);if(in_array($item->getType(),['plan','business_parameter'],true))return $this->json(['message'=>'Les plans et paramètres métier ne peuvent pas être supprimés.'],409);$usage=$this->referenceUsage($db,$item->getType(),$item->getCode());if($usage>0)return $this->json(['message'=>sprintf('Cette valeur est encore utilisée %d fois. Renommez-la ou réaffectez les données avant suppression.',$usage)],409);$id=$item->getId()?->toRfc4122();$label=$item->getLabel();$before=['type'=>$item->getType(),'code'=>$item->getCode(),'label'=>$label];$em->remove($item);$em->flush();$audit->record($admin,'reference.deleted','reference_data','reference_data_item',$id,$label,$before,[]);return $this->json(['message'=>'Référence supprimée.']);
    }
    #[Route('/audit', methods: ['GET'])]
    public function audit(Request $request, #[CurrentUser] ?User $admin, AdminAuditLogRepository $logs): JsonResponse
    {
        if (!$this->isAdmin($admin)) return $this->json(['error' => 'Unauthorized'], 401);
        $category=$this->nullableString($request->query->get('category'));$search=$this->nullableString($request->query->get('search'));
        return $this->json(['logs'=>array_map(static fn (\App\Entity\AdminAuditLog $log):array=>['id'=>$log->getId()?->toRfc4122(),'admin'=>['name'=>$log->getAdminName(),'email'=>$log->getAdminEmail()],'action'=>$log->getAction(),'category'=>$log->getCategory(),'target'=>['type'=>$log->getTargetType(),'id'=>$log->getTargetId(),'label'=>$log->getTargetLabel()],'changes'=>$log->getChanges(),'context'=>$log->getContext(),'createdAt'=>$log->getCreatedAt()->format(DATE_ATOM)],$logs->findRecent($category,$search))]);
    }
    #[Route('/subscriptions', methods: ['GET'])]
    public function subscriptions(#[CurrentUser] ?User $admin, UserRepository $users, PaymentRepository $payments): JsonResponse
    {
        if (!$this->isAdmin($admin)) return $this->json(['error' => 'Unauthorized'], 401);
        return $this->json([
            'users' => array_map($this->serializeSubscriptionUser(...), $users->findBy([], ['createdAt' => 'DESC'], 500)),
            'chilizPayments' => array_map($this->serializePayment(...), $payments->findBy(['provider' => PaymentProviderEnum::CHILIZ], ['createdAt' => 'DESC'], 300)),
            'plans' => array_map(static fn (SubscriptionPlanEnum $plan): array => ['value' => $plan->value, 'label' => $plan->label(), 'accountType' => $plan->isAgentPlan() ? 'agent' : 'club'], SubscriptionPlanEnum::cases()),
        ]);
    }

    #[Route('/subscriptions/users/{id}/plan', methods: ['PATCH'])]
    public function changeSubscriptionPlan(Request $request, #[CurrentUser] ?User $admin, User $managedUser, EntityManagerInterface $em, AdminAuditLogger $audit): JsonResponse
    {
        if (!$this->isAdmin($admin)) return $this->json(['error' => 'Unauthorized'], 401);
        $data = json_decode($request->getContent(), true); $plan = SubscriptionPlanEnum::tryFrom((string) ($data['plan'] ?? ''));
        if (!$plan) return $this->json(['message' => 'Plan invalide.'], 422);
        $isAgent = in_array(User::ROLE_AGENT, $managedUser->getRoles(), true);
        if ($isAgent !== $plan->isAgentPlan()) return $this->json(['message' => 'Ce plan ne correspond pas au type de compte.'], 422);
        $beforePlan=$managedUser->getSubscriptionPlan()->value;
        $managedUser->setSubscriptionPlan($plan);
        $em->flush();
        $audit->record($admin, 'subscription.plan_changed', 'subscriptions', 'user', $managedUser->getId()?->toRfc4122(), (string)$managedUser->getEmail(), ['plan'=>$beforePlan], ['plan'=>$plan->value], ['direction'=>$plan->tier()==='free'?'downgrade':'upgrade','grantedByAdmin'=>true,'paymentRequired'=>false,'stripeSynchronized'=>false]);
        return $this->json(['message' => 'Plan accordé par l’administration, sans paiement.', 'user' => $this->serializeSubscriptionUser($managedUser)]);
    }

    #[Route('/subscriptions/users/{id}/stripe-invoices', methods: ['GET'])]
    public function stripeInvoices(#[CurrentUser] ?User $admin, User $managedUser, StripeSubscriptionService $stripe): JsonResponse
    {
        if (!$this->isAdmin($admin)) return $this->json(['error' => 'Unauthorized'], 401);
        if (!$managedUser->getStripeCustomerId()) return $this->json(['invoices' => []]);
        try { return $this->json(['invoices' => $stripe->listRecentInvoices($managedUser->getStripeCustomerId())]); } catch (\Throwable $exception) { return $this->json(['message' => 'Impossible de récupérer les factures Stripe.', 'detail' => $exception->getMessage()], 502); }
    }
    private const array FEED_EVENT_TYPES = ['agreement', 'contract_signed', 'contract_renewal', 'loan', 'market_listing', 'market_removal', 'negotiation', 'offer_accepted', 'offer_refused', 'offer_sent', 'transfer_official'];
    private const array FEED_BUCKETS = ['live', 'official'];

    #[Route('/public-feed', methods: ['GET'])]
    public function publicFeed(#[CurrentUser] ?User $admin, PublicFeedPostRepository $posts): JsonResponse
    {
        if (!$this->isAdmin($admin)) return $this->json(['error' => 'Unauthorized'], 401);
        return $this->json(['posts' => array_map($this->serializeAdminFeedPost(...), $posts->findBy([], ['publishedAt' => 'DESC'], 300)), 'eventTypes' => self::FEED_EVENT_TYPES]);
    }

    #[Route('/public-feed', methods: ['POST'])]
    public function createPublicFeedPost(Request $request, #[CurrentUser] ?User $admin, EntityManagerInterface $em, AdminAuditLogger $audit): JsonResponse
    {
        if (!$this->isAdmin($admin)) return $this->json(['error' => 'Unauthorized'], 401);
        $post = (new PublicFeedPost())->setSourceType('admin_manual')->setSourceId(Uuid::v4()->toRfc4122());
        $error = $this->applyFeedPayload($post, json_decode($request->getContent(), true));
        if ($error) return $error;
        $em->persist($post); $em->flush();
        $audit->record($admin, 'public_feed.created', 'public_feed', 'public_feed_post', $post->getId()?->toRfc4122(), $post->getHeadline(), [], $this->feedAuditData($post));
        return $this->json(['message' => 'Publication créée.', 'post' => $this->serializeAdminFeedPost($post)], 201);
    }

    #[Route('/public-feed/{id}', methods: ['PUT'])]
    public function updatePublicFeedPost(Request $request, #[CurrentUser] ?User $admin, PublicFeedPost $post, EntityManagerInterface $em, AdminAuditLogger $audit): JsonResponse
    {
        if (!$this->isAdmin($admin)) return $this->json(['error' => 'Unauthorized'], 401);
        $before=$this->feedAuditData($post);$error = $this->applyFeedPayload($post, json_decode($request->getContent(), true));
        if ($error) return $error;
        $em->flush();$audit->record($admin, 'public_feed.updated', 'public_feed', 'public_feed_post', $post->getId()?->toRfc4122(), $post->getHeadline(), $before, $this->feedAuditData($post));
        return $this->json(['message' => 'Publication mise à jour.', 'post' => $this->serializeAdminFeedPost($post)]);
    }

    #[Route('/public-feed/{id}/visibility', methods: ['PATCH'])]
    public function updatePublicFeedVisibility(Request $request, #[CurrentUser] ?User $admin, PublicFeedPost $post, EntityManagerInterface $em, AdminAuditLogger $audit): JsonResponse
    {
        if (!$this->isAdmin($admin)) return $this->json(['error' => 'Unauthorized'], 401);
        $data = json_decode($request->getContent(), true);
        if (!is_array($data) || !is_bool($data['isVisible'] ?? null)) return $this->json(['message' => 'Visibilité invalide.'], 422);
        $before=$post->isVisible();$post->setIsVisible($data['isVisible']); $em->flush();
        $audit->record($admin, $post->isVisible()?'public_feed.published':'public_feed.hidden', 'public_feed', 'public_feed_post', $post->getId()?->toRfc4122(), $post->getHeadline(), ['isVisible'=>$before], ['isVisible'=>$post->isVisible()]);
        return $this->json(['message' => $post->isVisible() ? 'Publication visible sur le feed.' : 'Publication masquée du feed.']);
    }
    #[Route('/negotiations', methods: ['GET'])]
    public function negotiations(
        #[CurrentUser] ?User $admin,
        TransferNegociationRepository $transferNegociations,
        ContractNegociationRepository $contractNegociations,
        ReferenceDataSettings $settings,
    ): JsonResponse {
        if (!$this->isAdmin($admin)) return $this->json(['error' => 'Unauthorized'], 401);
        return $this->json([
            'transfers' => array_map($this->serializeMarketTransfer(...), $transferNegociations->findBy([], ['updatedAt' => 'DESC'], 300)),
            'contracts' => array_map($this->serializeContractNegotiation(...), $contractNegociations->findBy([], ['updatedAt' => 'DESC'], 300)),
            'generatedAt' => (new \DateTimeImmutable())->format(DATE_ATOM),
            'staleAfterDays' => $settings->int('stale_negotiation_days', 7),
        ]);
    }

    #[Route('/negotiations/transfers/{id}', methods: ['PATCH'])]
    public function unlockTransferNegotiation(Request $request, #[CurrentUser] ?User $admin, TransferNegociation $negociation, EntityManagerInterface $em): JsonResponse
    {
        if (!$this->isAdmin($admin)) return $this->json(['error' => 'Unauthorized'], 401);
        $data = json_decode($request->getContent(), true); $status = TransferNegociationStatusEnum::tryFrom((string) ($data['status'] ?? ''));
        if (!$status || !in_array($status, [TransferNegociationStatusEnum::OPEN, TransferNegociationStatusEnum::REJECTED, TransferNegociationStatusEnum::EXPIRED], true)) return $this->json(['message' => 'Action de déblocage invalide.'], 422);
        if (TransferNegociationStatusEnum::COMPLETED === $negociation->getStatus()) return $this->json(['message' => 'Un transfert terminé ne peut pas être modifié.'], 409);
        if (TransferNegociationStatusEnum::OPEN === $status && !in_array($negociation->getStatus(), [TransferNegociationStatusEnum::REJECTED, TransferNegociationStatusEnum::EXPIRED], true)) return $this->json(['message' => 'Seule une négociation clôturée peut être rouverte.'], 409);
        $negociation->setStatus($status); $em->flush();
        return $this->json(['message' => TransferNegociationStatusEnum::OPEN === $status ? 'Négociation de transfert rouverte.' : 'Négociation de transfert clôturée.']);
    }

    #[Route('/negotiations/contracts/{id}', methods: ['PATCH'])]
    public function unlockContractNegotiation(Request $request, #[CurrentUser] ?User $admin, ContractNegociation $negociation, EntityManagerInterface $em): JsonResponse
    {
        if (!$this->isAdmin($admin)) return $this->json(['error' => 'Unauthorized'], 401);
        $data = json_decode($request->getContent(), true); $status = PlayerContractNegociationStatusEnum::tryFrom((string) ($data['status'] ?? ''));
        if (!$status || !in_array($status, [PlayerContractNegociationStatusEnum::OPEN, PlayerContractNegociationStatusEnum::REJECTED, PlayerContractNegociationStatusEnum::EXPIRED], true)) return $this->json(['message' => 'Action de déblocage invalide.'], 422);
        if (PlayerContractNegociationStatusEnum::COMPLETED === $negociation->getStatus()) return $this->json(['message' => 'Un contrat terminé ne peut pas être modifié.'], 409);
        if (PlayerContractNegociationStatusEnum::OPEN === $status && !in_array($negociation->getStatus(), [PlayerContractNegociationStatusEnum::REJECTED, PlayerContractNegociationStatusEnum::EXPIRED], true)) return $this->json(['message' => 'Seule une négociation clôturée peut être rouverte.'], 409);
        $negociation->setStatus($status); $em->flush();
        return $this->json(['message' => PlayerContractNegociationStatusEnum::OPEN === $status ? 'Négociation contractuelle rouverte.' : 'Négociation contractuelle clôturée.']);
    }
    #[Route('/market', methods: ['GET'])]
    public function market(
        #[CurrentUser] ?User $admin,
        ListingRepository $listings,
        TransferOfferRepository $offers,
        TransferNegociationRepository $negociations,
    ): JsonResponse {
        if (!$this->isAdmin($admin)) return $this->json(['error' => 'Unauthorized'], 401);

        return $this->json([
            'listings' => array_map($this->serializeListing(...), $listings->findBy([], ['createdAt' => 'DESC'], 250)),
            'offers' => array_map($this->serializeMarketOffer(...), $offers->findBy([], ['createdAt' => 'DESC'], 250)),
            'transfers' => array_map($this->serializeMarketTransfer(...), $negociations->findBy([], ['updatedAt' => 'DESC'], 250)),
        ]);
    }

    #[Route('/market/listings/{id}', methods: ['PATCH'])]
    public function moderateListing(Request $request, #[CurrentUser] ?User $admin, Listing $listing, EntityManagerInterface $em): JsonResponse
    {
        if (!$this->isAdmin($admin)) return $this->json(['error' => 'Unauthorized'], 401);
        $data = json_decode($request->getContent(), true);
        $status = ListingStatusEnum::tryFrom((string) ($data['status'] ?? ''));
        if (!$status) return $this->json(['message' => 'Statut invalide.'], 422);
        $listing->setStatus($status); $em->flush();
        return $this->json(['message' => 'Annonce mise à jour.']);
    }

    #[Route('/market/offers/{id}', methods: ['PATCH'])]
    public function moderateOffer(Request $request, #[CurrentUser] ?User $admin, TransferOffer $offer, EntityManagerInterface $em): JsonResponse
    {
        if (!$this->isAdmin($admin)) return $this->json(['error' => 'Unauthorized'], 401);
        $data = json_decode($request->getContent(), true);
        $status = OfferStatusEnum::tryFrom((string) ($data['status'] ?? ''));
        if (!in_array($status, [OfferStatusEnum::REJECTED, OfferStatusEnum::EXPIRED], true)) return $this->json(['message' => 'Une modération ne peut que rejeter ou expirer une offre.'], 422);
        if (OfferStatusEnum::PENDING !== $offer->getStatus()) return $this->json(['message' => 'Cette offre a déjà été traitée.'], 409);
        $offer->setStatus($status); $em->flush();
        return $this->json(['message' => 'Offre modérée.']);
    }

    #[Route('/market/transfers/{id}', methods: ['PATCH'])]
    public function moderateTransfer(Request $request, #[CurrentUser] ?User $admin, TransferNegociation $negociation, EntityManagerInterface $em): JsonResponse
    {
        if (!$this->isAdmin($admin)) return $this->json(['error' => 'Unauthorized'], 401);
        $data = json_decode($request->getContent(), true);
        $status = TransferNegociationStatusEnum::tryFrom((string) ($data['status'] ?? ''));
        if (!in_array($status, [TransferNegociationStatusEnum::REJECTED, TransferNegociationStatusEnum::EXPIRED], true)) return $this->json(['message' => 'Une modération ne peut que rejeter ou expirer une négociation.'], 422);
        if (in_array($negociation->getStatus(), [TransferNegociationStatusEnum::COMPLETED, TransferNegociationStatusEnum::REJECTED, TransferNegociationStatusEnum::EXPIRED], true)) return $this->json(['message' => 'Ce transfert est déjà terminé.'], 409);
        $negociation->setStatus($status); $em->flush();
        return $this->json(['message' => 'Transfert modéré.']);
    }
    #[Route('/clubs', methods: ['GET'])]
    public function clubs(#[CurrentUser] ?User $admin, TeamRepository $teams): JsonResponse
    {
        if (!$this->isAdmin($admin)) return $this->json(['error' => 'Unauthorized'], 401);

        return $this->json(['clubs' => array_map($this->serializeClub(...), $teams->findBy([], ['name' => 'ASC']))]);
    }

    #[Route('/clubs/{id}', methods: ['PUT'])]
    public function updateClub(Request $request, #[CurrentUser] ?User $admin, Team $team, EntityManagerInterface $em, AdminAuditLogger $audit): JsonResponse
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

        $before=$this->clubAuditData($team);
        $team->setName($name)
            ->setCountry(trim((string) ($data['country'] ?? '')))
            ->setLeague(trim((string) ($data['league'] ?? '')))
            ->setLogoUrl(trim((string) ($data['logoUrl'] ?? '')))
            ->setTransferBudget((int) $budget)
            ->setVerificationStatus($status);
        $em->flush();
        $audit->record($admin, 'club.updated', 'clubs', 'team', $team->getId()?->toRfc4122(), (string)$team->getName(), $before, $this->clubAuditData($team));

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

    private function serializeListing(Listing $listing): array
    {
        return ['id' => $listing->getId()?->toRfc4122(), 'status' => $listing->getStatus()?->value, 'transferType' => $listing->getTransferType()?->value, 'askingPrice' => $listing->getAskingPrice(), 'createdAt' => $listing->getCreatedAt()?->format(DATE_ATOM), 'player' => ['id' => $listing->getPlayer()?->getId()?->toRfc4122(), 'name' => trim(($listing->getPlayer()?->getFirstName() ?? '').' '.($listing->getPlayer()?->getLastName() ?? '')), 'photoUrl' => $listing->getPlayer()?->getPhotoUrl(), 'marketStatus' => $listing->getPlayer()?->getMarketStatus()?->value], 'sellerTeam' => ['id' => $listing->getSellerTeam()?->getId()?->toRfc4122(), 'name' => $listing->getSellerTeam()?->getName(), 'logoUrl' => $listing->getSellerTeam()?->getLogoUrl()]];
    }

    private function serializeMarketOffer(TransferOffer $offer): array
    {
        $negociation = $offer->getTransferNegociation(); $listing = $negociation?->getListing(); $player = $listing?->getPlayer();
        return ['id' => $offer->getId()?->toRfc4122(), 'status' => $offer->getStatus()?->value, 'kind' => $offer->getKind()?->value, 'amount' => $offer->getAmount(), 'validUntil' => $offer->getValidUntil()?->format('Y-m-d'), 'createdAt' => $offer->getCreatedAt()?->format(DATE_ATOM), 'author' => $offer->getAuthor()?->getEmail(), 'player' => trim(($player?->getFirstName() ?? '').' '.($player?->getLastName() ?? '')), 'sellerTeam' => $listing?->getSellerTeam()?->getName(), 'buyerTeam' => $negociation?->getBuyerTeam()?->getName()];
    }

    private function serializeMarketTransfer(TransferNegociation $negociation): array
    {
        $listing = $negociation->getListing(); $player = $listing?->getPlayer();
        return ['id' => $negociation->getId()?->toRfc4122(), 'status' => $negociation->getStatus()?->value, 'createdAt' => $negociation->getCreatedAt()?->format(DATE_ATOM), 'updatedAt' => $negociation->getUpdatedAt()?->format(DATE_ATOM), 'publicFeedEnabled' => $negociation->isPublicFeedEnabled(), 'offersCount' => $negociation->getTransferOffers()->count(), 'player' => trim(($player?->getFirstName() ?? '').' '.($player?->getLastName() ?? '')), 'sellerTeam' => $listing?->getSellerTeam()?->getName(), 'buyerTeam' => $negociation->getBuyerTeam()?->getName()];
    }

    private function serializeContractNegotiation(ContractNegociation $negociation): array
    {
        $player = $negociation->getPlayer();
        $offers = $negociation->getContractOffers()->toArray();
        usort($offers, static fn ($left, $right): int => ($right->getUpdatedAt()?->getTimestamp() ?? 0) <=> ($left->getUpdatedAt()?->getTimestamp() ?? 0));
        $latestOffer = $offers[0] ?? null;
        return ['id' => $negociation->getId()?->toRfc4122(), 'type' => $negociation->getType()->value, 'status' => $negociation->getStatus()?->value, 'createdAt' => $negociation->getCreatedAt()?->format(DATE_ATOM), 'updatedAt' => $negociation->getUpdatedAt()?->format(DATE_ATOM), 'publicFeedEnabled' => $negociation->isPublicFeedEnabled(), 'player' => ['id' => $player?->getId()?->toRfc4122(), 'name' => trim(($player?->getFirstName() ?? '').' '.($player?->getLastName() ?? '')), 'team' => $player?->getTeam()?->getName()], 'club' => ['id' => $negociation->getBuyerTeam()?->getId()?->toRfc4122(), 'name' => $negociation->getBuyerTeam()?->getName()], 'agent' => ['id' => $negociation->getAgent()?->getId()?->toRfc4122(), 'name' => $negociation->getAgent()?->getAgencyName() ?: $negociation->getAgent()?->getUser()?->getEmail()], 'offersCount' => count($offers), 'packagesCount' => $negociation->getContractPackages()->count(), 'latestOffer' => $latestOffer ? ['status' => $latestOffer->getStatus()?->value, 'annualSalary' => $latestOffer->getAnnualSalary(), 'terminationCompensation' => $latestOffer->getTerminationCompensation(), 'durationMonths' => $latestOffer->getDurationMonths(), 'validUntil' => $latestOffer->getValidUntil()?->format('Y-m-d')] : null];
    }

    private function applyFeedPayload(PublicFeedPost $post, mixed $data): ?JsonResponse
    {
        if (!is_array($data)) return $this->json(['message' => 'Payload invalide.'], 400);
        $headline = trim((string) ($data['headline'] ?? '')); $body = trim((string) ($data['body'] ?? ''));
        $eventType = (string) ($data['eventType'] ?? ''); $bucket = (string) ($data['bucket'] ?? '');
        if ('' === $headline || mb_strlen($headline) > 180 || '' === $body || !in_array($eventType, self::FEED_EVENT_TYPES, true) || !in_array($bucket, self::FEED_BUCKETS, true)) return $this->json(['message' => 'Titre, contenu, type ou canal invalide.'], 422);
        try { $publishedAt = new \DateTimeImmutable((string) ($data['publishedAt'] ?? 'now')); } catch (\Throwable) { return $this->json(['message' => 'Date de publication invalide.'], 422); }
        $currency = strtoupper(trim((string) ($data['currency'] ?? 'EUR')));
        if (3 !== strlen($currency)) return $this->json(['message' => 'Devise invalide.'], 422);
        $post->setHeadline($headline)->setBody($body)->setEventType($eventType)->setBucket($bucket)->setIsFeatured((bool) ($data['isFeatured'] ?? false))->setIsVisible((bool) ($data['isVisible'] ?? true))->setPublishedAt($publishedAt)->setPlayerName($this->nullableString($data['playerName'] ?? null))->setAmount($this->nullableMoney($data['amount'] ?? null))->setCurrency($currency)->setLeague($this->nullableString($data['league'] ?? null))->setCountry($this->nullableString($data['country'] ?? null));
        return null;
    }

    private function serializeAdminFeedPost(PublicFeedPost $post): array
    {
        return ['id' => $post->getId()?->toRfc4122(), 'eventType' => $post->getEventType(), 'bucket' => $post->getBucket(), 'sourceType' => $post->getSourceType(), 'isFeatured' => $post->isFeatured(), 'isVisible' => $post->isVisible(), 'publishedAt' => $post->getPublishedAt()->format(DATE_ATOM), 'headline' => $post->getHeadline(), 'body' => $post->getBody(), 'playerName' => $post->getPlayerName(), 'amount' => $post->getAmount(), 'currency' => $post->getCurrency(), 'league' => $post->getLeague(), 'country' => $post->getCountry(), 'sellerTeam' => $post->getSellerTeam() ? ['name' => $post->getSellerTeam()?->getName(), 'logoUrl' => $post->getSellerTeam()?->getLogoUrl()] : null, 'buyerTeam' => $post->getBuyerTeam() ? ['name' => $post->getBuyerTeam()?->getName(), 'logoUrl' => $post->getBuyerTeam()?->getLogoUrl()] : null, 'createdAt' => $post->getCreatedAt()?->format(DATE_ATOM), 'updatedAt' => $post->getUpdatedAt()?->format(DATE_ATOM)];
    }

    private function serializeSubscriptionUser(User $user): array
    {
        $plan = $user->getSubscriptionPlan();
        return ['id' => $user->getId()?->toRfc4122(), 'firstName' => $user->getFirstName(), 'lastName' => $user->getLastName(), 'email' => $user->getEmail(), 'accountType' => $plan->isAgentPlan() ? 'agent' : 'club', 'plan' => $plan->value, 'planLabel' => $plan->label(), 'stripeCustomerId' => $user->getStripeCustomerId(), 'stripeSubscriptionId' => $user->getStripeSubscriptionId(), 'createdAt' => $user->getCreatedAt()?->format(DATE_ATOM)];
    }

    private function clubAuditData(Team $team): array
    {
        return ['name'=>$team->getName(),'country'=>$team->getCountry(),'league'=>$team->getLeague(),'logoUrl'=>$team->getLogoUrl(),'transferBudget'=>$team->getTransferBudget(),'verificationStatus'=>$team->getVerificationStatus()?->value];
    }

    private function feedAuditData(PublicFeedPost $post): array
    {
        return ['headline'=>$post->getHeadline(),'body'=>$post->getBody(),'eventType'=>$post->getEventType(),'bucket'=>$post->getBucket(),'isFeatured'=>$post->isFeatured(),'isVisible'=>$post->isVisible(),'publishedAt'=>$post->getPublishedAt()->format(DATE_ATOM),'playerName'=>$post->getPlayerName(),'amount'=>$post->getAmount(),'currency'=>$post->getCurrency(),'league'=>$post->getLeague(),'country'=>$post->getCountry()];
    }

    private function serializePayment(Payment $payment): array
    {
        return ['id' => $payment->getId()?->toRfc4122(), 'userId' => $payment->getUser()?->getId()?->toRfc4122(), 'userEmail' => $payment->getUser()?->getEmail(), 'provider' => $payment->getProvider()->value, 'txHash' => $payment->getTxHash(), 'planType' => $payment->getPlanType(), 'amountChz' => $payment->getAmountChz(), 'status' => $payment->getStatus()->value, 'chainId' => $payment->getChainId(), 'confirmedAt' => $payment->getConfirmedAt()?->format(DATE_ATOM), 'createdAt' => $payment->getCreatedAt()?->format(DATE_ATOM)];
    }

    private function serializeReferenceItem(ReferenceDataItem $item,int $usage):array{return['id'=>$item->getId()?->toRfc4122(),'type'=>$item->getType(),'code'=>$item->getCode(),'label'=>$item->getLabel(),'value'=>$item->getValue(),'active'=>$item->isActive(),'usageCount'=>$usage];}
    private function referenceUsage(Connection $db,string $type,string $code):int
    {
        return match($type){'league'=>(int)$db->fetchOne('SELECT COUNT(*) FROM team WHERE league = ?',[$code])+(int)$db->fetchOne('SELECT COUNT(*) FROM public_feed_post WHERE league = ?',[$code]),'country'=>(int)$db->fetchOne('SELECT COUNT(*) FROM team WHERE country = ?',[$code])+(int)$db->fetchOne('SELECT COUNT(*) FROM agent WHERE country = ?',[$code])+(int)$db->fetchOne('SELECT COUNT(*) FROM public_feed_post WHERE country = ?',[$code]),'position'=>(int)$db->fetchOne('SELECT COUNT(*) FROM player WHERE position = ?',[$code]),default=>0};
    }
    private function renameReferenceUsage(Connection $db,string $type,string $old,string $new):void
    {
        if('league'===$type){$db->executeStatement('UPDATE team SET league = ? WHERE league = ?',[$new,$old]);$db->executeStatement('UPDATE public_feed_post SET league = ? WHERE league = ?',[$new,$old]);}
        if('country'===$type){$db->executeStatement('UPDATE team SET country = ? WHERE country = ?',[$new,$old]);$db->executeStatement('UPDATE agent SET country = ? WHERE country = ?',[$new,$old]);$db->executeStatement('UPDATE public_feed_post SET country = ? WHERE country = ?',[$new,$old]);}
        if('position'===$type)$db->executeStatement('UPDATE player SET position = ? WHERE position = ?',[$new,$old]);
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
