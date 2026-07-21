ARCHITECTURE.md

AI Engineering System (AES)

Structure : issue d’AES v1.1.0

Statut : 🟡 Référence

Responsable : Développeur

Modification par un agent : Proposition uniquement (validation obligatoire)

Documents liés :

* SYSTEM.md
* CONTEXT.md
* STACK.md
* DECISIONS.md
* STANDARDS.md
* AUDIT.md

⸻

1. Objectif

Ce document décrit l’architecture technique réelle de VTC 3M.

Il présente l’organisation du dépôt, les composants principaux, les flux métier et les contraintes qui encadrent les évolutions du projet.

⸻

2. Vue d’ensemble

VTC 3M est une application web de réservation VTC multi-chauffeurs.

Elle repose sur une architecture client-serveur :

```text
Navigateur
    │
    ▼
Frontend React / Vite
    │  HTTP(S) + cookies de session httpOnly
    ▼
API Express
    │
    ├── Sequelize ──► SQLite en développement
    │                 PostgreSQL lorsque DATABASE_URL est défini
    │
    ├── Stripe : abonnements et webhooks
    ├── Base Adresse Nationale : géocodage
    ├── OSRM public : calcul d’itinéraires
    ├── SMTP : courriels transactionnels
    └── Twilio : SMS optionnels
```

En développement, le serveur Vite écoute sur le port `3000` et relaie `/api` et `/uploads` vers l’API Express, par défaut sur le port `5001`.

La cible de production PostgreSQL sur Proxmox est documentée par l’ADR-001 dans `DECISIONS.md` et par `PLAN_DEPLOIEMENT_PROXMOX_POSTGRES.md` à la racine du dépôt.

⸻

3. Organisation du projet

```text
ahadi-vtc/
├── backend/
│   ├── src/
│   │   ├── controllers/  Gestion des requêtes HTTP par domaine
│   │   ├── db/           Migrations et initialisation de données
│   │   ├── middleware/   Authentification, rôles, validation, sécurité, upload
│   │   ├── models/       Modèles Sequelize et associations
│   │   ├── routes/       Déclaration des points d’entrée API
│   │   ├── services/     Logique métier et intégrations externes
│   │   └── utils/        Utilitaires partagés
│   └── tests/            Tests Jest et Supertest
├── frontend/
│   ├── src/
│   │   ├── animations/   Effets visuels chargés à la demande
│   │   ├── components/   Composants d’interface partagés
│   │   ├── hooks/        Logique React réutilisable
│   │   ├── pages/        Pages publiques, chauffeur et administration
│   │   ├── services/     Client API Axios et état d’authentification
│   │   ├── styles/       Feuilles de style applicatives
│   │   └── utils/        Utilitaires frontend
│   ├── cypress/          Tests end-to-end
│   └── scripts/          Audits de performance locaux
├── ia/                   Référentiel AES du projet
└── PLAN_DEPLOIEMENT_PROXMOX_POSTGRES.md
```

⸻

4. Architecture applicative

Interface utilisateur

Le frontend est une SPA React. React Router sépare les pages publiques, l’espace chauffeur et l’espace administrateur.

Les pages non critiques au chargement initial sont chargées dynamiquement. Les routes privées attendent la vérification de session avant toute redirection.

API et logique métier

L’API Express expose des routes organisées par domaine : authentification, réservations, simulation tarifaire, chauffeurs, administration, facturation, avis, CRM, comptabilité, notifications et cartes de visite.

Les contrôleurs portent l’adaptation HTTP. Les services portent les calculs, les notifications, la production de PDF, la géolocalisation et les intégrations externes.

Accès aux données

Sequelize est la couche d’accès aux données. SQLite est utilisé en l’absence de `DATABASE_URL`. PostgreSQL est utilisé lorsque cette variable est définie.

Les principaux modèles sont :

* `Driver` ;
* `Reservation` ;
* `PricingConfig` ;
* `Review` ;
* `RevokedToken` ;
* `Contact` ;
* `ContactEvent`.

Un chauffeur possède ses réservations, avis et contacts. Une réservation peut recevoir un avis. Un contact peut posséder plusieurs événements de suivi.

Sécurité et exploitation

L’API applique notamment Helmet, CORS configuré, HPP, limitation de débit, validation des entrées, sanitisation XSS, authentification JWT par cookie httpOnly et contrôle de rôle.

Les journaux HTTP et applicatifs sont centralisés par Winston. Un point de santé est disponible sur `GET /api/health`.

⸻

5. Flux principaux

Authentification

1. Le frontend envoie les identifiants à l’API.
2. L’API valide les données et vérifie le mot de passe.
3. Un JWT est renvoyé dans un cookie `httpOnly`.
4. Le frontend vérifie la session via `GET /api/auth/me`.
5. Les routes chauffeur et administrateur contrôlent l’authentification et le rôle avant affichage.

Réservation publique

1. Le client utilise la réservation générale ou l’URL publique d’un chauffeur.
2. Le frontend envoie les données de réservation à l’API.
3. L’API valide, limite les tentatives et crée la réservation associée au chauffeur visé.
4. Le chauffeur accède ensuite uniquement à ses réservations, sous réserve d’un abonnement actif.

Simulation tarifaire

1. Le frontend transmet les adresses de départ et d’arrivée.
2. L’API les géocode avec la Base Adresse Nationale.
3. L’itinéraire est calculé avec OSRM.
4. Le prix est calculé à partir de `PricingConfig`.
5. Le résultat est retourné au frontend.

Abonnement

1. Un chauffeur authentifié crée une session Stripe Checkout.
2. Stripe gère le paiement et les changements d’abonnement.
3. Stripe appelle `POST /api/billing/webhook`.
4. Cette route reçoit impérativement le corps brut avant le parseur JSON afin de vérifier la signature Stripe.
5. L’API met à jour le statut d’abonnement du chauffeur.

Notifications et documents

Les courriels peuvent être envoyés par SMTP et les SMS par Twilio lorsque ces services sont activés par configuration.

Les PDF de réservation, facture et relevé comptable sont générés côté serveur. Ils ne sont pas exposés comme fichiers statiques : les téléchargements passent par des routes authentifiées et isolées par chauffeur.

Notifications temps réel

Le tableau de bord chauffeur ouvre un flux SSE authentifié par le cookie de session sur `/api/notifications/stream`.

⸻

6. Découpage des responsabilités

Frontend

Responsable de l’expérience utilisateur, de la navigation, de la collecte des données et de l’affichage des réponses de l’API.

Routes

Responsables de l’exposition des endpoints, de l’application des middlewares et du routage vers les contrôleurs.

Contrôleurs

Responsables de la traduction entre HTTP et logique métier : lecture des paramètres, appel des services et construction des réponses.

Services

Responsables de la logique métier réutilisable et des intégrations : tarification, géocodage, PDF, courriel, SMS, SSE et vCard.

Modèles

Responsables de la persistance, des contraintes de données et des relations entre entités.

Middlewares

Responsables des préoccupations transverses : sécurité, authentification, autorisation, validation, sanitisation, upload et journalisation.

⸻

7. Évolutivité

Les points d’extension principaux sont :

* ajout d’un domaine API par route, contrôleur, service et modèle ;
* ajout de pages frontend avec chargement différé si elles ne sont pas nécessaires au rendu initial ;
* bascule SQLite vers PostgreSQL via la configuration `DATABASE_URL` ;
* migrations de schéma centralisées dans `backend/src/db/` ;
* activation conditionnelle des services SMS et courriel ;
* remplacement des services publics de géocodage ou de routage par des services maîtrisés.

Les limites connues sont documentées dans `AUDIT.md`. En particulier, l’utilisation d’OSRM public ne convient pas à une charge de production durable.

⸻

8. Contraintes d’architecture

* Les secrets et la configuration d’environnement ne doivent jamais être versionnés.
* Les sessions reposent sur un cookie JWT httpOnly ; le frontend ne manipule pas le jeton.
* Le webhook Stripe doit rester monté avant `express.json()`.
* Les routes administratives exigent un JWT valide et le rôle administrateur.
* Les données chauffeur doivent rester isolées par `chauffeurId`.
* Les téléchargements PDF doivent rester protégés par authentification et autorisation.
* Les photos de cartes de visite peuvent être publiques uniquement dans le cadre des profils publics.
* Toute évolution de schéma doit préserver la compatibilité SQLite/PostgreSQL et passer par une migration appropriée.
* La topologie de production derrière reverse proxy doit conserver une configuration `trust proxy` cohérente avec le nombre de sauts réseau.

⸻

9. Mise à jour

Toute évolution importante de l’architecture doit entraîner une proposition de mise à jour de ce document.

Les modifications restent soumises à la validation du développeur.

⸻

10. Références

* SYSTEM.md
* CONTEXT.md
* STACK.md
* DECISIONS.md, notamment ADR-001
* STANDARDS.md
* AUDIT.md
* PLAN_DEPLOIEMENT_PROXMOX_POSTGRES.md
