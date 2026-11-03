# ODC Taches

## Lancer le projet

Docker Compose démarre PostgreSQL, le backend Django et le frontend Vite :

```sh
docker compose up --build
```

Le frontend est accessible sur <http://localhost:5173> et l’API du backend sur
<http://localhost:8000>. Django applique les migrations après que PostgreSQL
est prêt. Pour arrêter les services, utilisez `docker compose down`.

### Accès depuis le réseau local

Les autres appareils connectés au même Wi-Fi peuvent ouvrir l’application avec
l’adresse IP locale de l’ordinateur qui exécute Docker, par exemple
<http://192.168.252.132:5173>. L’adresse configurée par défaut est celle du
réseau actuel ; si elle change, démarrez Compose avec `LAN_HOST_IP` défini sur
la nouvelle adresse (par exemple `LAN_HOST_IP=192.168.1.25 docker compose up -d
--build`). Autorisez les connexions entrantes sur les ports 5173 et 8000 dans
le pare-feu de l’ordinateur si nécessaire.
