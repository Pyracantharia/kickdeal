# KickDeal

KickDeal est une plateforme de mercato destinée aux clubs de football et aux agents.
Elle permet de gérer les joueurs, les mises sur le marché, les négociations, les échanges, les notifications et les paiements.

## Architecture

| Répertoire | Rôle | Technologies |
| --- | --- | --- |
| `backend/` | API | Symfony 6.4, PHP 8.4, Doctrine |
| `frontend-app/` | Frontend de la partie applicative | Next.js 16, React 19, TypeScript |
| `frontend-landing/` | Landing page | Next.js 16, React 19, TypeScript |
| `e2e/` | Tests de parcours utilisateur | Cypress 15 |

## Fonctionnalités principales

- Inscription/connextion pour les clubs et les agents
- Gestion des clubs, effectifs, joueurs et mandats d'agents
- Recherche sur le marché et publication d'annonces
- Négociations de transferts et de contrats
- Messagerie, notifications et mises à jour en temps réel avec Mercure
- Abonnements Stripe et paiements de test avec Chiliz
- Administration des utilisateurs, demandes de clubs, signalements et rattachements joueur-agent

## Prérequis

### Application

- Docker + Docker Compose
- Make

### Tests end-to-end

- Node.js et npm
- les dépendances système requises par Cypress sur Linux.

Pour plus de détails, voir [la documentation associée](#tests-e2e).

## Installation

### 1. Configurer l'environnement

Créer les fichiers locaux à partir des exemples :

```bash
cp .env.example .env
cp frontend-app/.env.example frontend-app/.env.local
```

Variables nécessaires dans le `.env` :

- les identifiants PostgreSQL et `DATABASE_URL`
- `MERCURE_JWT_SECRET`, qui peut être généré avec `openssl rand -hex 32`
- `ADMIN_EMAIL` et `ADMIN_PASSWORD`
- `FRONTEND_URL`, `CORS_ALLOW_ORIGIN` et `MAILER_FROM`
- les clés et identifiants Stripe
- les paramètres Chiliz.

### 2. Démarrer les services

Build et démarrer les conteneurs Docker : `docker compose up --build -d`

Créer la base et appliquer les migrations : `make db`

Pour charger les données de démonstration : `make fixtures`

> *Astuce : pour démarrer le projet rapidement, utiliser la commande `make start`*

### 3. Créer le compte administrateur

La commande utilise `ADMIN_EMAIL` et `ADMIN_PASSWORD` définis dans le `.env` :

```bash
docker compose exec backend bin/console app:create-admin
```

## Adresses

- Application web : [localhost:3000](http://localhost:3000)
- Landing page : [localhost:3001](http://localhost:3001)
- API : [localhost:8000/api](http://localhost:8000/api)
- Mercure : [localhost:3002/.well-known/mercure](http://localhost:3002/.well-known/mercure)
- Mailpit : [localhost:8081](http://localhost:8081)
- PostgreSQL : [localhost:5432](http://localhost:5432)

Pour stopper les services, utiliser `make stop`.

## Services externes

### Stripe

Créer les tarifs récurrents nécessaires, puis reporter les identifiants `price_...` et les clés de test dans `.env`. Pour recevoir les webhooks en local :

```bash
stripe listen --forward-to http://localhost:8000/api/webhooks/stripe
```

Reporter le secret `whsec_...` fourni par Stripe CLI dans `STRIPE_WEBHOOK_SECRET`, puis redémarrer le service backend.

### Chiliz

Les paiements en CHZ utilisent le réseau de test Chiliz Spicy. Ils nécessitent un portefeuille compatible, par exemple MetaMask, une adresse de réception et des CHZ de test. Les paramètres du backend et les variables publiques `NEXT_PUBLIC_CHILIZ_*` doivent désigner le même réseau.

## Application mobile

TODO

## Tests et qualité

### Backend

PHPStan : `make phpstan`
PHPUnit : `make phpunit`

> `make phpunit` recrée entièrement la base configurée pour l'environnement de test avant d'exécuter PHPUnit.

### Tests E2E

La plateforme doit être démarrée et la base doit être dans un état connu. Si nécessaire lancer la commande `make reset-db`.

Afin de lancer les tests il faut se déplacer dans le dossier e2e `cd e2e`
Pour installer les dépendances : `npm install`.

Pour lancer les tests E2E dans le navigateur intégré : `npx cypress open`

Pour une exécution sans interface graphique : `npx cypress run`

## Commandes utiles

```bash
make help          # Afficher les commandes disponibles
make start         # Démarrer le projet de zéro
make up            # Construire et démarrer les conteneurs
make stop          # Arrêter les conteneurs
make drop-db       # Supprimer la base de données
make db            # Créer la base et appliquer les migrations
make fixtures      # Recharger les données de démonstration
make reset-db      # Recréer entièrement la base locale
make phpunit       # Lancer les tests PHPUnit
make phpstan       # Lancer PHPStan
make tests         # Lancer PHPStan et PHPUnit
```
