# kickdeal

KickDeal est composé de plusieurs applications :

- `backend/` : API Symfony 7 exposée via Docker/Nginx sur `http://localhost:8000/api`.
- `frontend-app/` : application web Next.js TypeScript pour les clubs et agents.
- `frontend-landing/` : landing page Next.js TypeScript.
- `mobile-feed/` : application mobile Expo React Native TypeScript publique, en lecture seule, pour le futur feed KickDeal.

## Prise en main du projet

### Étape 1: Configuration

- Renommer le .env.example en .env et remplir les variables

### Étape 2: Backend

- Créer un fichier `.env.local` et suivre le modèle du `.env`
- générer un nouveau APP_SECRET avec `openssl rand -hex 32`
- Renseigner l'url du frontend dans `CORS_ALLOW_ORIGIN`. Faire attention à bien mentionner l'url sous forme de `http://localhost:{port}` et pas directement avec le nom du service

### Étape 3: Frontend

- Créer un fichier `.env.local` et suivre le modèle du `.env`
- mettre l'url du frontend `http://localhost:{port}` dans `NEXT_CLIENT_BACKEND_URL`
- mettre l'url du frontend `http://nginx:{port interne de nginx}` dans `NEXT_SERVER_BACKEND_URL`

### Étape 4: Build et lancement du projet

- lancer la commande `docker compose up --build -d`

### Étape 5: Création de user

- Créer un ou plusieurs users sur `/auth/register` ou avec postman et renseigner les propriété:

route: POST `http://localhost:{port}/api/users`

```json
  {
    "firstname": "string",
    "lastname": "string",
    "email": "string",
    "password": "string"
  }
```

## Build APK KickDeal

L'APK est généré avec Capacitor depuis la racine du dépôt. Il charge le domaine public KickDeal dans une WebView. En production, l'Ingress route `kickdeal.space` vers la landing par défaut, puis vers `frontend-app` pour les chemins applicatifs comme `/auth`, `/dashboard`, `/market`, `/messages`, etc.

```bash
docker build \
  -f Dockerfile.apk \
  --build-arg CAPACITOR_SERVER_URL=https://kickdeal.space \
  --target apk \
  --output type=local,dest=dist/apk \
  .
```

L'APK debug est écrit dans :

```text
dist/apk/kickdeal-debug.apk
```

Si les domaines changent, autorisez aussi les domaines navigables dans la WebView :

```bash
docker build \
  -f Dockerfile.apk \
  --build-arg CAPACITOR_SERVER_URL=https://kickdeal.space \
  --build-arg 'CAPACITOR_ALLOW_NAVIGATION=["kickdeal.space","api.kickdeal.space","analytics.kickdeal.space"]' \
  --target apk \
  --output type=local,dest=dist/apk \
  .
```

Les frontends doivent utiliser les URLs publiques du routage prod :

```env
# frontend-landing
NEXT_PUBLIC_APP_URL=https://kickdeal.space

# frontend-app
NEXT_PUBLIC_API_URL=https://api.kickdeal.space/api
NEXT_PUBLIC_LANDING_URL=https://kickdeal.space
```

## Tests

### Tests fonctionnels et unitaires

Le backend utilise PHPUnit pour les tests fonctionnels et unitaires.
Les tests peuvent être exécutés avec la commande `make phpunit`

### Tests E2E

Les tests E2E (end-to-end) utilisent Cypress pour simuler des interactions utilisateur et vérifier le bon fonctionnement de l'application dans son ensemble.

Prérequis:
Voir les [prérequis](https://docs.cypress.io/app/get-started/install-cypress#Linux-Prerequisites) pour pouvoir utiliser Cypress

Pour lancer les tests e2e, soyez sur d'avoir une base de données neuve. Les tests d'ajout peuvent entrer en conflit si répétés plusieurs fois sur des formulaires avec des contraintes d'unicité.
Si besoin, lancer `make reset-db`

Afin de les lancer :

1. Ouvrez un terminal et allez dans le dossier des tests e2e `cd e2e`.
2. Installez les dépendances avec `npm install` (tester avec nodev22 et npm v10).
  Il arrive que npm n'approuve pas cypress : alors pour l'approuver => npm install-scripts approve cypress
3. Exécutez `npx cypress open` pour ouvrir l'interface graphique de Cypress.

> Pour les lancer en mode headless, utilisez `npx cypress run`.
