<?php

namespace App\Tests\Controller;

use App\Kernel;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Routing\Exception\MethodNotAllowedException;
use Symfony\Component\Routing\Matcher\UrlMatcher;
use Symfony\Component\Routing\RequestContext;
use Symfony\Component\Routing\Route;
use Symfony\Component\Routing\RouteCollection;

final class RouteTest extends TestCase
{
    private static ?RouteCollection $routes = null;

    /** @param list<string> $methods */
    #[DataProvider('routesProvider')]
    public function testRouteIsRegistered(string $name, string $path, array $methods, string $controller): void
    {
        $route = self::routes()->get($name);

        self::assertInstanceOf(Route::class, $route);
        self::assertSame($path, $route->getPath());
        self::assertSame($methods, $route->getMethods());
        self::assertSame($controller, $route->getDefault('_controller'));
    }

    /** @param list<string> $methods */
    #[DataProvider('routesProvider')]
    public function testRouteMatchesExpectedHttpMethods(string $name, string $path, array $methods, string $controller): void
    {
        unset($controller);

        $samplePath = self::samplePath($path);
        $methodsToAssert = [] === $methods ? ['GET'] : $methods;

        foreach ($methodsToAssert as $method) {
            $matcher = new UrlMatcher(self::routes(), new RequestContext(method: $method));
            $parameters = $matcher->match($samplePath);

            self::assertSame($name, $parameters['_route']);
        }
    }

    public function testRouteRejectsUnsupportedHttpMethod(): void
    {
        $matcher = new UrlMatcher(self::routes(), new RequestContext(method: 'POST'));

        $this->expectException(MethodNotAllowedException::class);
        $matcher->match('/api/auth/csrf-token');
    }

    /**
     * @return iterable<string, array{string, string, list<string>, string}>
     */
    public static function routesProvider(): iterable
    {
        yield 'app_account_security' => ['app_account_security', '/api/account/security', ['GET'], 'App\Controller\AccountController::security'];
        yield 'app_account_password' => ['app_account_password', '/api/account/password', ['PATCH'], 'App\Controller\AccountController::changePassword'];
        yield 'app_account_2fa_setup' => ['app_account_2fa_setup', '/api/account/2fa/setup', ['POST'], 'App\Controller\AccountController::setupTwoFactor'];
        yield 'app_account_2fa_confirm' => ['app_account_2fa_confirm', '/api/account/2fa/confirm', ['POST'], 'App\Controller\AccountController::confirmTwoFactor'];
        yield 'app_account_2fa_disable' => ['app_account_2fa_disable', '/api/account/2fa', ['DELETE'], 'App\Controller\AccountController::disableTwoFactor'];
        yield 'admin_pending_club_requests' => ['admin_pending_club_requests', '/api/admin/club-requests/pending', ['GET'], 'App\Controller\AdminController::getPendingClubRequests'];
        yield 'admin_approve_club_request' => ['admin_approve_club_request', '/api/admin/club-requests/approve/{id}', ['PUT'], 'App\Controller\AdminController::approveClubRequest'];
        yield 'admin_pending_player_agent_requests' => ['admin_pending_player_agent_requests', '/api/admin/player-agent-requests/pending', ['GET'], 'App\Controller\AdminController::getPendingPlayerAgentRequests'];
        yield 'admin_approve_player_agent_request' => ['admin_approve_player_agent_request', '/api/admin/player-agent-requests/approve/{id}', ['PUT'], 'App\Controller\AdminController::approvePlayerAgentRequest'];
        yield 'admin_reject_player_agent_request' => ['admin_reject_player_agent_request', '/api/admin/player-agent-requests/reject/{id}', ['PUT'], 'App\Controller\AdminController::rejectPlayerAgentRequest'];
        yield 'admin_reject_club_request' => ['admin_reject_club_request', '/api/admin/club-requests/reject/{id}', ['PUT'], 'App\Controller\AdminController::rejectClubRequest'];
        yield 'app_agent' => ['app_agent', '/agent', [], 'App\Controller\AgentController::index'];
        yield 'api_agent_player_candidates' => ['api_agent_player_candidates', '/api/agents/players/candidates', ['GET'], 'App\Controller\AgentPlayerController::candidates'];
        yield 'api_agent_player_requests_mine' => ['api_agent_player_requests_mine', '/api/agents/player-requests/mine', ['GET'], 'App\Controller\AgentPlayerController::requests'];
        yield 'api_agent_player_request_create' => ['api_agent_player_request_create', '/api/agents/player-requests', ['POST'], 'App\Controller\AgentPlayerController::createRequest'];
        yield 'api_agent_player_request_approve_handover' => ['api_agent_player_request_approve_handover', '/api/agents/player-requests/{id}/approve', ['POST'], 'App\Controller\AgentPlayerController::approveHandover'];
        yield 'api_agent_player_request_reject_handover' => ['api_agent_player_request_reject_handover', '/api/agents/player-requests/{id}/reject', ['POST'], 'App\Controller\AgentPlayerController::rejectHandover'];
        yield 'api_agent_player_market_authorization_request' => ['api_agent_player_market_authorization_request', '/api/agents/players/{id}/market-authorization-request', ['POST'], 'App\Controller\AgentPlayerController::requestMarketAuthorization'];
        yield 'api_agent_player_club_prospects' => ['api_agent_player_club_prospects', '/api/agents/players/{id}/club-prospects', ['GET'], 'App\Controller\AgentPlayerController::clubProspects'];
        yield 'api_agent_player_club_prospect_create' => ['api_agent_player_club_prospect_create', '/api/agents/players/{id}/club-prospects', ['POST'], 'App\Controller\AgentPlayerController::createClubProspect'];
        yield 'api_agent_player_market_status' => ['api_agent_player_market_status', '/api/agents/players/{id}/market-status', ['PUT'], 'App\Controller\AgentPlayerController::updateMarketStatus'];
        yield 'app_csrf_token' => ['app_csrf_token', '/api/auth/csrf-token', ['GET'], 'App\Controller\AuthController::csrfToken'];
        yield 'app_register' => ['app_register', '/api/auth/register', ['POST'], 'App\Controller\AuthController::store'];
        yield 'app_login' => ['app_login', '/api/auth/login', ['POST'], 'App\Controller\AuthController::login'];
        yield 'app_me' => ['app_me', '/api/auth/me', ['GET'], 'App\Controller\AuthController::me'];
        yield 'app_logout' => ['app_logout', '/api/auth/logout', ['DELETE'], 'App\Controller\AuthController::logout'];
        yield 'app_forgot_password' => ['app_forgot_password', '/api/auth/forgot-password', ['POST'], 'App\Controller\AuthController::forgetPassword'];
        yield 'app_reset_password' => ['app_reset_password', '/api/auth/reset-password', ['PATCH'], 'App\Controller\AuthController::resetPassword'];
        yield 'app_club_mine' => ['app_club_mine', '/api/clubs/mine', ['GET'], 'App\Controller\ClubController::mine'];
        yield 'app_club_player_create' => ['app_club_player_create', '/api/clubs/mine/players', ['POST'], 'App\Controller\ClubController::createPlayer'];
        yield 'app_club_budget_update' => ['app_club_budget_update', '/api/clubs/mine/budget', ['PUT', 'PATCH'], 'App\Controller\ClubController::updateBudget'];
        yield 'app_club_player_market_status' => ['app_club_player_market_status', '/api/clubs/mine/players/{id}/market-status', ['PUT'], 'App\Controller\ClubController::updatePlayerMarketStatus'];
        yield 'app_club_player_market_authorization' => ['app_club_player_market_authorization', '/api/clubs/mine/players/{id}/market-authorization', ['PUT'], 'App\Controller\ClubController::decidePlayerMarketAuthorization'];
        yield 'app_club_join' => ['app_club_join', '/api/clubs/join', ['POST'], 'App\Controller\ClubController::join'];
        yield 'app_club_search' => ['app_club_search', '/api/clubs/search', ['GET'], 'App\Controller\ClubController::search'];
        yield 'app_club_leagues' => ['app_club_leagues', '/api/clubs/leagues', ['GET'], 'App\Controller\ClubController::leagues'];
        yield 'app_club_request_mine' => ['app_club_request_mine', '/api/clubs/requests/mine', ['GET'], 'App\Controller\ClubController::myRequest'];
        yield 'app_club_request_create' => ['app_club_request_create', '/api/clubs/requests', ['POST'], 'App\Controller\ClubController::createRequest'];
        yield 'api_contract_negotiation_start_for_player' => ['api_contract_negotiation_start_for_player', '/api/contracts/negotiations/players/{id}', ['POST'], 'App\Controller\ContractNegotiationController::startForPlayer'];
        yield 'api_contract_negotiations_mine' => ['api_contract_negotiations_mine', '/api/contracts/negotiations/mine', ['GET'], 'App\Controller\ContractNegotiationController::mine'];
        yield 'api_contract_negotiation_show' => ['api_contract_negotiation_show', '/api/contracts/negotiations/{id}', ['GET'], 'App\Controller\ContractNegotiationController::show'];
        yield 'api_contract_negotiation_public_feed' => ['api_contract_negotiation_public_feed', '/api/contracts/negotiations/{id}/public-feed', ['PUT', 'PATCH'], 'App\Controller\ContractNegotiationController::updatePublicFeed'];
        yield 'api_contract_negotiation_offer_create' => ['api_contract_negotiation_offer_create', '/api/contracts/negotiations/{id}/offers', ['POST'], 'App\Controller\ContractNegotiationController::createOffer'];
        yield 'api_contract_negotiation_cancel' => ['api_contract_negotiation_cancel', '/api/contracts/negotiations/{id}', ['DELETE'], 'App\Controller\ContractNegotiationController::cancel'];
        yield 'api_contract_negotiation_offer_accept' => ['api_contract_negotiation_offer_accept', '/api/contracts/negotiations/offers/{id}/accept', ['PUT'], 'App\Controller\ContractNegotiationController::acceptOffer'];
        yield 'api_contract_negotiation_offer_reject' => ['api_contract_negotiation_offer_reject', '/api/contracts/negotiations/offers/{id}/reject', ['PUT'], 'App\Controller\ContractNegotiationController::rejectOffer'];
        yield 'app_dashboard_home' => ['app_dashboard_home', '/api/dashboard/home', ['GET'], 'App\Controller\DashboardController::home'];
        yield 'app_dashboard_agent' => ['app_dashboard_agent', '/api/dashboard/agent', ['GET'], 'App\Controller\DashboardController::agentHome'];
        yield 'app_listing_mine' => ['app_listing_mine', '/api/listings/mine', ['GET'], 'App\Controller\ListingController::mine'];
        yield 'app_listing_create' => ['app_listing_create', '/api/listings', ['POST'], 'App\Controller\ListingController::create'];
        yield 'api_messages_mercure_token' => ['api_messages_mercure_token', '/api/messages/mercure-token', ['GET'], 'App\Controller\MessageController::mercureToken'];
        yield 'api_messages_conversations' => ['api_messages_conversations', '/api/messages/conversations', ['GET'], 'App\Controller\MessageController::conversations'];
        yield 'api_messages_start_conversation' => ['api_messages_start_conversation', '/api/messages/conversations', ['POST'], 'App\Controller\MessageController::startConversation'];
        yield 'api_messages_conversation' => ['api_messages_conversation', '/api/messages/conversations/{id}', ['GET'], 'App\Controller\MessageController::conversation'];
        yield 'api_messages_conversation_read' => ['api_messages_conversation_read', '/api/messages/conversations/{id}/read', ['POST'], 'App\Controller\MessageController::markConversationRead'];
        yield 'api_messages_send' => ['api_messages_send', '/api/messages/conversations/{id}/messages', ['POST'], 'App\Controller\MessageController::sendMessage'];
        yield 'api_notifications_list' => ['api_notifications_list', '/api/notifications', ['GET'], 'App\Controller\NotificationController::list'];
        yield 'api_notifications_summary' => ['api_notifications_summary', '/api/notifications/summary', ['GET'], 'App\Controller\NotificationController::summary'];
        yield 'api_notifications_mercure_token' => ['api_notifications_mercure_token', '/api/notifications/mercure-token', ['GET'], 'App\Controller\NotificationController::mercureToken'];
        yield 'api_notifications_mark_read' => ['api_notifications_mark_read', '/api/notifications/{id}/read', ['PUT', 'PATCH'], 'App\Controller\NotificationController::markRead'];
        yield 'api_notifications_mark_all_read' => ['api_notifications_mark_all_read', '/api/notifications/read-all', ['POST'], 'App\Controller\NotificationController::markAllRead'];
        yield 'app_player_agent_roster' => ['app_player_agent_roster', '/api/players/agent-roster', ['GET'], 'App\Controller\PlayerController::agentRoster'];
        yield 'app_player_club_roster' => ['app_player_club_roster', '/api/players/club-roster', ['GET'], 'App\Controller\PlayerController::clubRoster'];
        yield 'app_player_team_roster' => ['app_player_team_roster', '/api/players/team/{teamId}/roster', ['GET'], 'App\Controller\PlayerController::teamRoster'];
        yield 'app_player_list' => ['app_player_list', '/api/players', ['GET'], 'App\Controller\PlayerController::list'];
        yield 'app_player_show' => ['app_player_show', '/api/players/{id}', ['GET'], 'App\Controller\PlayerController::show'];
        yield 'api_public_feed_index' => ['api_public_feed_index', '/api/public-feed', ['GET'], 'App\Controller\PublicFeedController::index'];
        yield 'api_public_feed_filter_options' => ['api_public_feed_filter_options', '/api/public-feed/filters/options', ['GET'], 'App\Controller\PublicFeedController::filterOptions'];
        yield 'api_public_feed_show' => ['api_public_feed_show', '/api/public-feed/{id}', ['GET'], 'App\Controller\PublicFeedController::show'];
        yield 'app_stripe_webhook' => ['app_stripe_webhook', '/api/webhooks/stripe', ['POST'], 'App\Controller\StripeWebhookController'];
        yield 'app_subscription_me' => ['app_subscription_me', '/api/subscription/me', ['GET'], 'App\Controller\SubscriptionController::me'];
        yield 'app_subscription_simulate_upgrade' => ['app_subscription_simulate_upgrade', '/api/subscription/simulate-upgrade', ['POST'], 'App\Controller\SubscriptionController::simulateUpgrade'];
        yield 'app_subscription_payment_chiliz_verify' => ['app_subscription_payment_chiliz_verify', '/api/subscription/payments/chiliz/verify', ['POST'], 'App\Controller\SubscriptionController::verifyChilizPayment'];
        yield 'app_subscription_payment_stripe_start' => ['app_subscription_payment_stripe_start', '/api/subscription/payments/stripe/start', ['POST'], 'App\Controller\SubscriptionController::startStripePayment'];
        yield 'app_subscription_payment_stripe_complete' => ['app_subscription_payment_stripe_complete', '/api/subscription/payments/stripe/complete', ['POST'], 'App\Controller\SubscriptionController::completeStripePayment'];
        yield 'app_test' => ['app_test', '/api', ['GET'], 'App\Controller\TestController::index'];
        yield 'app_test_testparam' => ['app_test_testparam', '/api/param/{id}', ['GET'], 'App\Controller\TestController::testParam'];
        yield 'app_transfer_offers_mine' => ['app_transfer_offers_mine', '/api/transfers/offers/mine', ['GET'], 'App\Controller\TransferController::mine'];
        yield 'app_transfer_history' => ['app_transfer_history', '/api/transfers/history', ['GET'], 'App\Controller\TransferController::history'];
        yield 'app_transfer_negotiate_context' => ['app_transfer_negotiate_context', '/api/transfers/negotiate-context', ['GET'], 'App\Controller\TransferController::negotiateContext'];
        yield 'app_transfer_negotiation_public_feed' => ['app_transfer_negotiation_public_feed', '/api/transfers/negotiations/{id}/public-feed', ['PUT', 'PATCH'], 'App\Controller\TransferController::updateNegotiationPublicFeed'];
        yield 'app_transfer_offer_create' => ['app_transfer_offer_create', '/api/transfers/offers', ['POST'], 'App\Controller\TransferController::createOffer'];
        yield 'app_transfer_offer_accept' => ['app_transfer_offer_accept', '/api/transfers/offers/{id}/accept', ['PUT', 'PATCH'], 'App\Controller\TransferController::accept'];
        yield 'app_transfer_agent_invitation_create' => ['app_transfer_agent_invitation_create', '/api/transfers/negotiations/{id}/agent-invitations', ['POST'], 'App\Controller\TransferController::inviteAgent'];
        yield 'app_transfer_agent_invitation_show' => ['app_transfer_agent_invitation_show', '/api/transfers/agent-invitations/{token}', ['GET'], 'App\Controller\TransferController::invitation'];
        yield 'app_transfer_agent_invitation_claim' => ['app_transfer_agent_invitation_claim', '/api/transfers/agent-invitations/{token}/claim', ['POST'], 'App\Controller\TransferController::claimInvitation'];
        yield 'app_transfer_external_contract_agreement' => ['app_transfer_external_contract_agreement', '/api/transfers/negotiations/{id}/external-contract-agreement', ['POST'], 'App\Controller\TransferController::confirmExternalContractAgreement'];
        yield 'app_transfer_offer_reject' => ['app_transfer_offer_reject', '/api/transfers/offers/{id}/reject', ['PUT', 'PATCH'], 'App\Controller\TransferController::reject'];
        yield 'app_transfer_offer_counter' => ['app_transfer_offer_counter', '/api/transfers/offers/{id}/counter', ['POST'], 'App\Controller\TransferController::counter'];
        yield 'getUsers' => ['getUsers', '/api/users/', ['GET'], 'App\Controller\UserController::index'];
        yield 'getAgentsAndClubs' => ['getAgentsAndClubs', '/api/users/agents-and-clubs', ['GET'], 'App\Controller\UserController::getAgentsAndClubs'];
        yield 'app_user_show' => ['app_user_show', '/api/users/{id}', ['GET'], 'App\Controller\UserController::show'];
    }

    private static function routes(): RouteCollection
    {
        if (null !== self::$routes) {
            return self::$routes;
        }

        $kernel = new Kernel('test', true);
        $kernel->boot();

        return self::$routes = $kernel->getContainer()->get('router')->getRouteCollection();
    }

    private static function samplePath(string $path): string
    {
        return preg_replace_callback('/\{[^}]+}/', static function (array $matches): string {
            return str_contains($matches[0], 'token') ? 'sample-token' : '1';
        }, $path);
    }
}
