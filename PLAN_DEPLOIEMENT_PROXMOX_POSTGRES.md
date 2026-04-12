# Plan de déploiement recommandé — VTC_3M

## Décision retenue
- **Ne pas déployer en production publique avec SQLite**.
- **Migrer d'abord vers PostgreSQL**.
- Déployer ensuite sur une **VM dédiée** dans Proxmox.
- Exposer le site publiquement **de manière contrôlée et sécurisée**.

## Pourquoi cette stratégie
- Le projet est déjà assez avancé pour être déployé, mais pas dans son état de dev local brut.
- PostgreSQL est plus adapté qu'une SQLite unique pour une vraie mise en ligne publique.
- Une VM dédiée permet d'isoler l'application, les secrets, les logs et les sauvegardes.
- Cette approche limite le risque de casser d'autres services de l'infra Proxmox.

## Architecture recommandée

### VM cible
- Debian 12 minimal
- 2 vCPU minimum
- 4 Go RAM minimum
- 40 Go disque minimum
- IP fixe sur le réseau interne

### Services recommandés
1. **Caddy** ou **Nginx** en reverse proxy
2. **Frontend buildé** et servi en statique
3. **Backend Node.js** en service applicatif
4. **PostgreSQL** dédié à l'application
5. Sauvegardes applicatives + dump PostgreSQL + snapshot VM

### Règles d'exposition
- Exposer uniquement **80/443** vers le reverse proxy
- Garder PostgreSQL **non exposé publiquement**
- Garder le backend **non exposé publiquement** (localhost ou réseau interne uniquement)
- Stocker les secrets uniquement dans `.env` côté serveur
- Aucun secret dans GitHub, dans le repo, ni dans les logs

## Stratégie d'exposition recommandée

### Étape A — staging privé
- Déployer d'abord sur la VM
- Tester via réseau local / VPN uniquement
- Vérifier UI, auth, réservation, PDF, logs, base

### Étape B — ouverture publique
Deux options possibles :

1. **Reverse proxy + ports 80/443 + HTTPS Let's Encrypt**
   - solution standard
   - demande port forwarding / DNS / domaine

2. **Tunnel sécurisé (si adapté à ton infra)**
   - utile si tu veux éviter d'ouvrir directement des ports entrants
   - à évaluer selon ton réseau, ton domaine et ton niveau de confort

## Recommandation actuelle
1. Migrer vers PostgreSQL
2. Préparer la VM dédiée
3. Déployer en privé via VPN / LAN
4. Vérifier toute l'application
5. Ouvrir ensuite publiquement avec HTTPS

## Plan de migration SQLite -> PostgreSQL

### Tables métier à migrer
- `drivers`
- `reservations`
- `reviews`
- `PricingConfigs`
- `revoked_tokens`

### Méthode recommandée
1. Geler temporairement les écritures pendant la migration finale
2. Créer la base PostgreSQL cible
3. Appliquer le schéma applicatif sur PostgreSQL
4. Exporter les données SQLite
5. Importer les données dans PostgreSQL en conservant :
   - UUID
   - timestamps
   - relations
   - statuts
6. Vérifier les volumes et des échantillons de données
7. Basculer `DATABASE_URL` vers PostgreSQL
8. Refaire les tests critiques

### Pourquoi c'est faisable proprement ici
- Le volume actuel est encore faible
- Les modèles Sequelize supportent déjà PostgreSQL
- Le moment est bon pour le faire avant la vraie ouverture publique

## Check sécurité avant ouverture publique
- pare-feu actif
- ports exposés minimaux
- reverse proxy en HTTPS
- secrets uniquement côté serveur
- sauvegardes testées
- logs sans données sensibles
- accès admin vérifiés
- base PostgreSQL non exposée

## Ordre d'exécution conseillé
1. Préparer la VM dédiée
2. Installer l'environnement de base
3. Installer PostgreSQL
4. Préparer la migration des données
5. Déployer frontend + backend
6. Tester en privé
7. Activer HTTPS
8. Ouvrir publiquement
