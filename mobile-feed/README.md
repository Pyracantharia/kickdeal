# KickDeal Feed Mobile

Application Expo React Native publique, sans compte utilisateur, destinée à afficher un feed en lecture seule des actualités KickDeal.

## Objectif

Cette app mobile affichera à terme :

- les transferts officialisés ;
- les joueurs mis sur le marché ;
- les prêts ;
- les renouvellements de contrat ;
- les offres ou négociations publiées seulement si les clubs acceptent de les rendre publiques.

L'app propose désormais une expérience de timeline mercato avec onglets `À la une`, `Officiel` et `Live`, filtres mobiles, détail de post et connexion au backend Symfony.

## Installation

```bash
cd mobile-feed
npm install
```

## Configuration API

Créez un fichier `.env` à partir de `.env.example` :

```bash
cp .env.example .env
```

Pour un simulateur lancé sur la même machine que le backend Docker :

```env
EXPO_PUBLIC_API_URL=http://localhost:8000/api
```

Pour Expo Go sur un téléphone physique, `localhost` pointe vers le téléphone, pas vers votre Mac. Utilisez l'adresse IP locale de la machine qui lance Docker :

```env
EXPO_PUBLIC_API_URL=http://192.168.x.x:8000/api
```

Le backend doit être accessible depuis le téléphone sur le même réseau Wi-Fi.

## Lancement

```bash
npm run start
```

Puis choisissez :

- `i` pour le simulateur iOS ;
- `a` pour l'émulateur Android ;
- scanner le QR code avec Expo Go pour un téléphone physique.

Vous pouvez aussi lancer directement :

```bash
npm run ios
npm run android
```

## Endpoint public

Le service mobile appelle :

```http
GET /api/public-feed?tab=featured|official|live&type=&league=&country=&club=&player=
GET /api/public-feed/{id}
```

Si l'endpoint n'existe pas encore sur un environnement, l'écran affiche une petite liste mockée temporaire pour valider l'expérience mobile. Si l'endpoint existe mais retourne une liste vide, l'app affiche un état vide réel.

## Backend

Après avoir récupéré les changements backend :

```bash
docker compose exec backend php bin/console doctrine:migrations:migrate
docker compose exec backend php bin/console app:public-feed:backfill
```

Les négociations en cours restent privées par défaut. Les endpoints privés suivants permettent de rendre une négociation publiable dans le feed :

```http
PUT /api/transfers/negotiations/{id}/public-feed
PUT /api/contracts/negotiations/{id}/public-feed
```

Payload :

```json
{
  "enabled": true
}
```
