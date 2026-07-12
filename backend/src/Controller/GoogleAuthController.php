<?php

namespace App\Controller;

use App\Entity\Agent;
use App\Entity\User;
use App\Enum\SubscriptionPlanEnum;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpClient\HttpClient;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;
use Symfony\Component\Security\Core\Authentication\Token\UsernamePasswordToken;

#[Route('/api/auth/google')]
final class GoogleAuthController extends AbstractController
{
    public function __construct(private readonly string $clientId, private readonly string $clientSecret, private readonly string $frontendUrl) {}

    #[Route('/start', methods: ['GET'])]
    public function start(Request $request): RedirectResponse
    {
        if ('' === $this->clientId || '' === $this->clientSecret) return new RedirectResponse($this->frontendUrl.'/auth/login?google_error=not_configured');
        $mode = 'register' === $request->query->get('mode') ? 'register' : 'login'; $accountType = 'agent' === $request->query->get('accountType') ? 'agent' : 'club';
        $state = bin2hex(random_bytes(24)); $request->getSession()->set('google_oauth', ['state'=>$state,'mode'=>$mode,'accountType'=>$accountType]);
        $callback = $request->getSchemeAndHttpHost().'/api/auth/google/callback';
        $query = http_build_query(['client_id'=>$this->clientId,'redirect_uri'=>$callback,'response_type'=>'code','scope'=>'openid email profile','state'=>$state,'prompt'=>'select_account']);
        return new RedirectResponse('https://accounts.google.com/o/oauth2/v2/auth?'.$query);
    }

    #[Route('/callback', methods: ['GET'])]
    public function callback(Request $request, UserRepository $users, EntityManagerInterface $em, TokenStorageInterface $tokens): RedirectResponse
    {
        $flow=$request->getSession()->remove('google_oauth');
        if (!is_array($flow)||!hash_equals((string)($flow['state']??''),(string)$request->query->get('state'))||!is_string($request->query->get('code'))) return $this->failure('invalid_state');
        try {
            $http=HttpClient::create();$callback=$request->getSchemeAndHttpHost().'/api/auth/google/callback';
            $token=$http->request('POST','https://oauth2.googleapis.com/token',['body'=>['code'=>$request->query->get('code'),'client_id'=>$this->clientId,'client_secret'=>$this->clientSecret,'redirect_uri'=>$callback,'grant_type'=>'authorization_code']])->toArray();
            $profile=$http->request('GET','https://openidconnect.googleapis.com/v1/userinfo',['auth_bearer'=>$token['access_token']??''])->toArray();
        } catch (\Throwable) { return $this->failure('provider_error'); }
        if (($profile['email_verified']??false)!==true||!is_string($profile['email']??null)||!is_string($profile['sub']??null)) return $this->failure('unverified_email');
        $user=$users->findOneBy(['googleId'=>$profile['sub']])??$users->findOneBy(['email'=>strtolower($profile['email'])]);
        if (!$user instanceof User && 'register'!==($flow['mode']??null)) return $this->failure('account_not_found');
        if (!$user instanceof User) {
            $agent='agent'===($flow['accountType']??null);$names=preg_split('/\s+/',trim((string)($profile['name']??'')),2);
            $user=(new User())->setFirstName((string)($profile['given_name']??$names[0]??'Utilisateur'))->setLastName((string)($profile['family_name']??$names[1]??'Google'))->setEmail(strtolower($profile['email']))->setRoles([$agent?User::ROLE_AGENT:User::ROLE_CLUB])->setSubscriptionPlan($agent?SubscriptionPlanEnum::AGENT_FREE:SubscriptionPlanEnum::CLUB_FREE)->setPassword(password_hash(bin2hex(random_bytes(32)), PASSWORD_DEFAULT));$user->markPasswordChanged();
            $em->persist($user);if($agent){$agentProfile=(new Agent())->setUser($user)->setAgencyName(trim($user->getFirstName().' '.$user->getLastName()));$user->setAgentProfile($agentProfile);$em->persist($agentProfile);}
        }
        $user->setGoogleId($profile['sub']);$em->flush();$tokens->setToken(new UsernamePasswordToken($user,'main',$user->getRoles()));
        return new RedirectResponse($this->frontendUrl.'/dashboard?google=success');
    }

    private function failure(string $reason): RedirectResponse { return new RedirectResponse($this->frontendUrl.'/auth/login?google_error='.rawurlencode($reason)); }
}
