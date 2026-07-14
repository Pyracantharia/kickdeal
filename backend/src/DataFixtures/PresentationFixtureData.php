<?php

namespace App\DataFixtures;

final class PresentationFixtureData
{
    public const string PASSWORD = 'Demo2026!';

    /**
     * @return array<string, array{name: string, country: string, league: string}>
     */
    public static function teams(): array
    {
        return [
            'arsenal' => ['name' => 'Arsenal FC', 'country' => 'England', 'league' => 'Premier League'],
            'aston-villa' => ['name' => 'Aston Villa FC', 'country' => 'England', 'league' => 'Premier League'],
            'atalanta' => ['name' => 'Atalanta BC', 'country' => 'Italy', 'league' => 'Serie A'],
            'atletico-madrid' => ['name' => 'Club Atlético de Madrid', 'country' => 'Spain', 'league' => 'Primera Division'],
            'barcelona' => ['name' => 'FC Barcelona', 'country' => 'Spain', 'league' => 'Primera Division'],
            'bayer-leverkusen' => ['name' => 'Bayer 04 Leverkusen', 'country' => 'Germany', 'league' => 'Bundesliga'],
            'brentford' => ['name' => 'Brentford FC', 'country' => 'England', 'league' => 'Premier League'],
            'brighton' => ['name' => 'Brighton & Hove Albion FC', 'country' => 'England', 'league' => 'Premier League'],
            'cagliari' => ['name' => 'Cagliari Calcio', 'country' => 'Italy', 'league' => 'Serie A'],
            'chelsea' => ['name' => 'Chelsea FC', 'country' => 'England', 'league' => 'Premier League'],
            'coventry' => ['name' => 'Coventry City FC', 'country' => 'England', 'league' => 'Premier League'],
            'eintracht-frankfurt' => ['name' => 'Eintracht Frankfurt', 'country' => 'Germany', 'league' => 'Bundesliga'],
            'espanyol' => ['name' => 'RCD Espanyol de Barcelona', 'country' => 'Spain', 'league' => 'Primera Division'],
            'fiorentina' => ['name' => 'ACF Fiorentina', 'country' => 'Italy', 'league' => 'Serie A'],
            'fulham' => ['name' => 'Fulham FC', 'country' => 'England', 'league' => 'Premier League'],
            'hoffenheim' => ['name' => 'TSG 1899 Hoffenheim', 'country' => 'Germany', 'league' => 'Bundesliga'],
            'le-havre' => ['name' => 'Le Havre AC', 'country' => 'France', 'league' => 'Ligue 1'],
            'leeds' => ['name' => 'Leeds United FC', 'country' => 'England', 'league' => 'Premier League'],
            'lens' => ['name' => 'Racing Club de Lens', 'country' => 'France', 'league' => 'Ligue 1'],
            'liverpool' => ['name' => 'Liverpool FC', 'country' => 'England', 'league' => 'Premier League'],
            'lyon' => ['name' => 'Olympique Lyonnais', 'country' => 'France', 'league' => 'Ligue 1'],
            'manchester-city' => ['name' => 'Manchester City FC', 'country' => 'England', 'league' => 'Premier League'],
            'manchester-united' => ['name' => 'Manchester United FC', 'country' => 'England', 'league' => 'Premier League'],
            'marseille' => ['name' => 'Olympique de Marseille', 'country' => 'France', 'league' => 'Ligue 1'],
            'milan' => ['name' => 'AC Milan', 'country' => 'Italy', 'league' => 'Serie A'],
            'napoli' => ['name' => 'SSC Napoli', 'country' => 'Italy', 'league' => 'Serie A'],
            'newcastle' => ['name' => 'Newcastle United FC', 'country' => 'England', 'league' => 'Premier League'],
            'nottingham-forest' => ['name' => 'Nottingham Forest FC', 'country' => 'England', 'league' => 'Premier League'],
            'osasuna' => ['name' => 'CA Osasuna', 'country' => 'Spain', 'league' => 'Primera Division'],
            'porto' => ['name' => 'FC Porto', 'country' => 'Portugal', 'league' => 'Primeira Liga'],
            'psg' => ['name' => 'Paris Saint-Germain FC', 'country' => 'France', 'league' => 'Ligue 1'],
            'psv' => ['name' => 'PSV', 'country' => 'Netherlands', 'league' => 'Eredivisie'],
            'rb-leipzig' => ['name' => 'RB Leipzig', 'country' => 'Germany', 'league' => 'Bundesliga'],
            'rennes' => ['name' => 'Stade Rennais FC 1901', 'country' => 'France', 'league' => 'Ligue 1'],
            'roma' => ['name' => 'AS Roma', 'country' => 'Italy', 'league' => 'Serie A'],
            'sporting' => ['name' => 'Sporting Clube de Portugal', 'country' => 'Portugal', 'league' => 'Primeira Liga'],
            'sunderland' => ['name' => 'Sunderland AFC', 'country' => 'England', 'league' => 'Premier League'],
            'tottenham' => ['name' => 'Tottenham Hotspur FC', 'country' => 'England', 'league' => 'Premier League'],
            'werder-bremen' => ['name' => 'SV Werder Bremen', 'country' => 'Germany', 'league' => 'Bundesliga'],
            'juventus' => ['name' => 'Juventus FC', 'country' => 'Italy', 'league' => 'Serie A'],
        ];
    }

    /**
     * @return list<array{firstName: string, lastName: string, email: string, agency: string, country: string}>
     */
    public static function agents(): array
    {
        return [
            ['firstName' => 'Camille', 'lastName' => 'Laurent', 'email' => 'agent.camille@demo.kickdeal.space', 'agency' => 'Hexagone Sports', 'country' => 'France'],
            ['firstName' => 'Sofia', 'lastName' => 'Mendes', 'email' => 'agent.sofia@demo.kickdeal.space', 'agency' => 'Atlantic Football', 'country' => 'Portugal'],
            ['firstName' => 'Luca', 'lastName' => 'Bianchi', 'email' => 'agent.luca@demo.kickdeal.space', 'agency' => 'Calcio Management', 'country' => 'Italy'],
            ['firstName' => 'Marta', 'lastName' => 'Ruiz', 'email' => 'agent.marta@demo.kickdeal.space', 'agency' => 'Iberia Players', 'country' => 'Spain'],
            ['firstName' => 'Oliver', 'lastName' => 'Bennett', 'email' => 'agent.oliver@demo.kickdeal.space', 'agency' => 'Crown Sports', 'country' => 'England'],
            ['firstName' => 'Jonas', 'lastName' => 'Weber', 'email' => 'agent.jonas@demo.kickdeal.space', 'agency' => 'Rhein Athletes', 'country' => 'Germany'],
            ['firstName' => 'Noah', 'lastName' => 'de Vries', 'email' => 'agent.noah@demo.kickdeal.space', 'agency' => 'Oranje Talent', 'country' => 'Netherlands'],
            ['firstName' => 'Amine', 'lastName' => 'Diallo', 'email' => 'agent.amine@demo.kickdeal.space', 'agency' => 'Elite Foot Afrique', 'country' => 'France'],
        ];
    }

    /**
     * @return list<array{player: string, aliases?: list<string>, from: string, to: string, amount: int, type: 'permanent'|'free'|'loan'}>
     */
    public static function transfers(): array
    {
        return [
            ['player' => 'Elliot Anderson', 'from' => 'nottingham-forest', 'to' => 'manchester-city', 'amount' => 135_000_000, 'type' => 'permanent'],
            ['player' => 'Sandro Tonali', 'from' => 'newcastle', 'to' => 'tottenham', 'amount' => 108_000_000, 'type' => 'permanent'],
            ['player' => 'Jérémy Jacquet', 'from' => 'rennes', 'to' => 'liverpool', 'amount' => 63_600_000, 'type' => 'permanent'],
            ['player' => 'Jan Paul van Hecke', 'from' => 'brighton', 'to' => 'tottenham', 'amount' => 60_000_000, 'type' => 'permanent'],
            ['player' => 'Marco Palestra', 'from' => 'atalanta', 'to' => 'chelsea', 'amount' => 57_000_000, 'type' => 'permanent'],
            ['player' => 'Andrey Santos', 'from' => 'chelsea', 'to' => 'manchester-united', 'amount' => 56_300_000, 'type' => 'permanent'],
            ['player' => 'Luka Vušković', 'from' => 'tottenham', 'to' => 'brighton', 'amount' => 54_000_000, 'type' => 'permanent'],
            ['player' => 'Geovany Quenda', 'from' => 'sporting', 'to' => 'chelsea', 'amount' => 50_000_000, 'type' => 'permanent'],
            ['player' => 'Bazoumana Touré', 'from' => 'hoffenheim', 'to' => 'newcastle', 'amount' => 50_000_000, 'type' => 'permanent'],
            ['player' => 'Piero Hincapié', 'from' => 'bayer-leverkusen', 'to' => 'arsenal', 'amount' => 40_000_000, 'type' => 'permanent'],
            ['player' => 'Víctor Muñoz', 'from' => 'osasuna', 'to' => 'liverpool', 'amount' => 40_000_000, 'type' => 'permanent'],
            ['player' => 'Pascal Struijk', 'from' => 'leeds', 'to' => 'brighton', 'amount' => 23_200_000, 'type' => 'permanent'],
            ['player' => 'Frank Onyeka', 'from' => 'brentford', 'to' => 'coventry', 'amount' => 7_000_000, 'type' => 'permanent'],
            ['player' => 'Karl Hein', 'from' => 'arsenal', 'to' => 'werder-bremen', 'amount' => 3_000_000, 'type' => 'permanent'],
            ['player' => 'Illan Meslier', 'from' => 'leeds', 'to' => 'arsenal', 'amount' => 0, 'type' => 'free'],
            ['player' => 'Harry Wilson', 'from' => 'fulham', 'to' => 'leeds', 'amount' => 0, 'type' => 'free'],
            ['player' => 'Andrew Robertson', 'from' => 'liverpool', 'to' => 'tottenham', 'amount' => 0, 'type' => 'free'],
            ['player' => 'Anthony Gordon', 'from' => 'newcastle', 'to' => 'barcelona', 'amount' => 80_000_000, 'type' => 'permanent'],
            ['player' => 'Morten Hjulmand', 'from' => 'sporting', 'to' => 'atletico-madrid', 'amount' => 40_000_000, 'type' => 'permanent'],
            ['player' => 'Gabriel Moscardo', 'aliases' => ['Moscardo'], 'from' => 'psg', 'to' => 'espanyol', 'amount' => 0, 'type' => 'loan'],
            ['player' => 'Gonçalo Ramos', 'from' => 'psg', 'to' => 'milan', 'amount' => 74_000_000, 'type' => 'permanent'],
            ['player' => 'Rasmus Højlund', 'from' => 'manchester-united', 'to' => 'napoli', 'amount' => 44_000_000, 'type' => 'permanent'],
            ['player' => 'Loïs Openda', 'from' => 'rb-leipzig', 'to' => 'juventus', 'amount' => 42_750_000, 'type' => 'permanent'],
            ['player' => 'Donyell Malen', 'from' => 'aston-villa', 'to' => 'roma', 'amount' => 25_000_000, 'type' => 'permanent'],
            ['player' => 'Jacopo Fazzini', 'from' => 'fiorentina', 'to' => 'cagliari', 'amount' => 0, 'type' => 'loan'],
            ['player' => 'Eliezer Mayenda', 'from' => 'sunderland', 'to' => 'rennes', 'amount' => 22_000_000, 'type' => 'permanent'],
            ['player' => 'Facundo Medina', 'from' => 'lens', 'to' => 'marseille', 'amount' => 18_000_000, 'type' => 'permanent'],
            ['player' => 'Noham Kamara', 'from' => 'psg', 'to' => 'lyon', 'amount' => 4_100_000, 'type' => 'permanent'],
            ['player' => 'Adrien Thomasson', 'from' => 'lens', 'to' => 'rennes', 'amount' => 0, 'type' => 'free'],
            ['player' => 'Issa Soumaré', 'from' => 'le-havre', 'to' => 'rennes', 'amount' => 0, 'type' => 'free'],
            ['player' => 'Jakub Kiwior', 'from' => 'arsenal', 'to' => 'porto', 'amount' => 17_000_000, 'type' => 'permanent'],
        ];
    }

    /**
     * @return list<string>
     */
    public static function representedTeamKeys(): array
    {
        return array_values(array_unique(array_column(self::transfers(), 'to')));
    }

    public static function clubEmail(string $teamKey): string
    {
        return sprintf('club.%s@demo.kickdeal.space', $teamKey);
    }
}
