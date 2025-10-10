# 🚀 Guide de Configuration de l'Environnement de Pré-production

Ce document explique comment configurer et lancer un environnement de pré-production personnel (par exemple, pour un développeur spécifique) en utilisant la stack Docker Swarm et Traefik.

## Pré-requis

- Docker et Docker Compose installés sur le serveur.
- Le serveur est initialisé en tant que manager Docker Swarm (`docker swarm init`).
- Le stack Traefik est déjà déployé.

## Étapes de Configuration

L'objectif est d'adapter cette configuration pour votre propre nom de domaine (ex: `mondomaine.site` au lieu de `levraidomaine.store`).

### 1. Création du fichier d'environnement (`.env`)

Chaque environnement possède son propre fichier `.env` qui contient toutes les variables de configuration.

Créez un fichier nommé `.env` à la racine de ce dossier (`monDossier/`) et copiez-y le contenu suivant.

```env
# ==================================
# VARIABLES POUR LA BASE DE DONNÉES
# (Utilisées par le service 'db' et 'backend')
# ==================================
# Adaptez ces valeurs pour votre environnement
POSTGRES_DB=nom_de_votre_db
POSTGRES_USER=user
POSTGRES_PASSWORD=un_mot_de_passe_solide

# Ne pas modifier cette ligne, elle se base sur les variables ci-dessus
DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}?serverVersion=15&charset=utf8"

REDIS_URL="redis://redis:6379"

# ==================================
# VARIABLES POUR TRAEFIK
# (Utilisées pour le routage)
# ==================================
# Adaptez ces valeurs pour votre environnement
TRAEFIK_ROUTER_NAME=nom-backend
TRAEFIK_DOMAIN=mondomaine.site
TRAEFIK_CERTRESOLVER=letsencrypt # Ne pas modifier cette ligne
```

**À faire :** Modifiez les valeurs de `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `TRAEFIK_ROUTER_NAME` et `TRAEFIK_DOMAIN` pour qu'elles correspondent à votre environnement.

### 2. Configuration de Nginx (Étape Manuelle)

Le fichier de configuration de Nginx doit être mis à jour pour correspondre au nom de domaine que vous avez défini dans le fichier `.env`.


1.  Ouvrez le fichier : `backend/docker/nginx/default.conf`
2.  Trouvez la ligne `server_name` et modifiez-la :

    ```nginx
    # backend/docker/nginx/default.conf

    server {
        listen 80;
        # Assurez-vous que ce domaine est le même que TRAEFIK_DOMAIN dans votre .env
        server_name mondomaine.site;

        # ... reste du fichier
    }
    ```


### 4. Déploiement du Stack

Une fois que toutes les configurations sont prêtes, vous pouvez déployer votre stack personnel.

1.  **Construisez l'image Docker** du backend (si des modifications ont été faites) :
    ```bash
    
    docker build -t kickdeal-backend:latest ./backend
    ```
2.  **Construisez l'image Docker** du frontend :
    ```bash
    docker build -t kickdeal-frontend:latest ./frontend
    ```
3.  **Déployez le stack** avec Docker Swarm :
    ```bash
    
    


docker compose -f docker-compose.prod.yml --env-file .env config | grep -v '^name:' | docker stack deploy -c - jeremy
    ```
    *(Note : `prenom` est le nom du stack, vous pouvez choisir ce que vous voulez)*.

Votre environnement personnel est maintenant déployé et devrait être accessible à l'adresse que vous avez configurée (ex: `https://mondomaine.site`).


# backend/docker/nginx/default.conf

server {
    listen 80;
    server_name mondomaine.site;

    # On définit le resolver DNS interne de Docker.
    # C'est la clé pour que Nginx puisse trouver les autres services.
    resolver 127.0.0.11 valid=30s;

    root /var/www/html/public;
    index index.php index.html;

    location / {
        try_files $uri /index.php$is_args$args;
    }

    location ~ ^/index\.php(/|$) {
        # On utilise une variable pour le nom du service.
        # Cela force Nginx à utiliser le resolver et à être plus patient.
        set $fastcgi_pass backend:9000;
        fastcgi_pass $fastcgi_pass;

        fastcgi_split_path_info ^(.+\.php)(/.*)$;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_param PATH_INFO $fastcgi_path_info;
        # internal; # Commenté pour le débogage si nécessaire
    }

    location ~ \.php$ {
        return 404;
    }

    error_log /var/log/nginx/error.log;
    access_log /var/log/nginx/access.log;
}

## Note importante sur les fichiers Docker Compose

- `docker-compose.yml` : Pour le développement local (utilise `build`)
- `docker-compose.prod.yml` : Pour la production avec Docker Swarm (utilise des images pré-construites)

En production, toutes les images doivent être construites avant le déploiement car Docker Swarm ne supporte pas la directive `build`.