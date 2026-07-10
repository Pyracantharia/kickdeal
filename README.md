![Logo](https://kickdeal.space/_next/image?url=%2Fimages%2Flogo.png&w=96&q=75)


# KickDeal

KickDeal est composé de plusieurs applications :

- `backend/` : API Symfony 7 exposée via Docker/Nginx sur `http://localhost:8000/api`.
- `frontend-app/` : application web Next.js TypeScript pour les clubs et agents.
- `frontend-landing/` : landing page Next.js TypeScript.
- `mobile-feed/` : application mobile Expo React Native TypeScript publique, en lecture seule, pour le futur feed KickDeal.

## Prise en main du projet

### Étape 1: Configuration

- Renommer les .env.example en .env et remplir les variables
- les variables serotn donnée au correcteur dans le livrable

```
mv .env.example .env

mv frontend-app/.env.example frontend-app/.env

mv frontend-landing/.env.example frontend-landing/.env
```


### Étape 2: Build et lancement du projet

- lancer la commande `docker compose up --build -d`

#### Les fixtures avec Alice
```
php -d memory_limit=-1 bin/console doctrine:fixtures:load
```
#### Stripe CLI
```
stripe listen --forward-to http://localhost:8000/api/webhooks/stripe
```
Recuperer le token whsec_a114b et le mettre dans le .env et remplir la valeur de STRIPE_WEBHOOK_SECRET

#### Ajouter le compte admin
```
php bin/console app:create-admin
```
#### CHILIZ

pensez aussi à ajouter metamask qui permet de configurer un portefeuille de test pour payer en chiliz
la doc :
https://docs.chiliz.com/fr/developper/notions-de-base/faucet-du-testnet/obtenir-des-testchzs-avec-spicy-faucet


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

<p style="color : red">
> Pour les lancer en mode headless, utilisez `npx cypress run`.
</p>
