# Objectif 

On veut pouvoir stocker sur d'autres machines les dumps de la bdd Postgres pour
pouvoir faire le recouvrement.

Il est demandé d'avoir une politique de sauvegarde, avec une sauvegarde en 3-2-1 :
Les sauvegardes concernent uniquement le contenu des bases de données, ainsi que les
fichiers non-générés (images, vidéos, musiques reçues de la part des utilisateurs).

Nous devons utiliser de l'iaC (Dockerfile, Pulumi, Terraform, Ansible) pour la reproductibilité de notre infrastructure.

# Securite

Il est important de sécuriser les transferts de données entre les machines. Pour cela, nous allons utiliser WireGuard, un VPN moderne et performant. 
Les transferts de données seront ainsi chiffrés et protégés contre les interceptions.

# Install WireGuard tools

sudo apt install wireguard-tools

sudo modprobe wireguard

Le conteneur db va écrire la sauvegarde dans un volume, et le conteneur wireguard (ou plutôt l'hôte via le tunnel) y aura accès.

# Service WireGuard
Service WireGuard : Nous utiliserons une image populaire et bien maintenue comme linuxserver/wireguard
Le port sera stocké dans une variable d'environnement WIREGUARD_PORT.
Un volume partagé permettra au conteneur WireGuard d'accéder aux dumps de la base de données.

# le fichier de configuration WireGuard 

Vous devez creer un fichier de configuration , un exemple est fourni dans wireguard-config/wg0.conf.example.

# Génération des clés WireGuard
wg genkey | tee privatekey | wg pubkey > publickey

# Pour le client (téléphone) c'est plus simple avec un qr code
 qrencode -t ansiutf8 < extern.conf