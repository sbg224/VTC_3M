STACK.md

AI Engineering System (AES)

Structure : issue d’AES v1.1.0

Statut : 🟡 Référence

Responsable : Développeur

Modification par un agent : Proposition uniquement (validation obligatoire)

Documents liés :

* SYSTEM.md
* STANDARDS.md
* ARCHITECTURE.md
* CONTEXT.md
* DECISIONS.md

⸻

1. Objectif

Ce document recense les technologies, bibliothèques, services et outils effectivement utilisés par VTC 3M.

Les versions de référence sont celles déclarées dans `backend/package.json` et `frontend/package.json`.

⸻

2. Langages et plateformes

Nom

JavaScript

Catégorie

Langage

Rôle

Implémenter le frontend et le backend.

Justification

Le projet est intégralement écrit en JavaScript et exploite l’écosystème Node.js et React.

Utilisation

`backend/src/` et `frontend/src/`.

Alternatives

TypeScript.

Documentation officielle

https://developer.mozilla.org/fr/docs/Web/JavaScript

⸻

Nom

Node.js

Catégorie

Plateforme d’exécution

Rôle

Exécuter l’API Express, les scripts de développement et les tests backend.

Justification

Le backend et l’outillage du projet sont basés sur l’écosystème Node.js.

Utilisation

Dossier `backend/`, outils Vite, Cypress et Lighthouse.

Alternatives

Deno, Bun.

Documentation officielle

https://nodejs.org/docs/latest/api/

⸻

3. Frontend

Nom

React 18

Catégorie

Framework d’interface

Rôle

Construire l’interface web en composants.

Justification

React structure les pages, l’état local et les composants partagés de la SPA.

Utilisation

`frontend/src/`.

Alternatives

Vue, Angular, Svelte.

Documentation officielle

https://react.dev/

⸻

Nom

React Router 6

Catégorie

Bibliothèque de routage

Rôle

Gérer les routes publiques, chauffeur et administrateur.

Justification

Il fournit la navigation SPA, les redirections et les protections de routes côté client.

Utilisation

`frontend/src/App.jsx`.

Alternatives

TanStack Router.

Documentation officielle

https://reactrouter.com/

⸻

Nom

Vite 5

Catégorie

Outil de build et serveur de développement

Rôle

Lancer le frontend, compiler la SPA et produire le build de production.

Justification

Vite fournit un cycle de développement rapide et une configuration de build légère pour React.

Utilisation

`frontend/vite.config.js`, scripts `dev`, `build` et `preview`.

Alternatives

Webpack, Parcel.

Documentation officielle

https://vite.dev/

⸻

Nom

Axios

Catégorie

Bibliothèque HTTP

Rôle

Communiquer avec l’API Express.

Justification

Une instance unique centralise l’URL `/api`, les cookies de session, les délais et le traitement global des erreurs.

Utilisation

`frontend/src/services/api.js`.

Alternatives

Fetch API.

Documentation officielle

https://axios-http.com/

⸻

Nom

GSAP et Framer Motion

Catégorie

Bibliothèques d’animation

Rôle

Produire les animations et interactions visuelles du frontend.

Justification

Elles couvrent les animations déclaratives React et les animations plus avancées.

Utilisation

`frontend/src/animations/` et composants d’interface. Elles sont isolées dans un chunk de build dédié.

Alternatives

CSS animations, Motion One.

Documentation officielle

https://gsap.com/docs/

https://www.framer.com/motion/

⸻

Nom

Lucide React et react-qr-code

Catégorie

Bibliothèques d’interface

Rôle

Fournir respectivement les icônes et les QR codes des cartes de visite numériques.

Justification

Ces bibliothèques évitent de maintenir des icônes ou générateurs QR personnalisés.

Utilisation

Frontend.

Alternatives

Heroicons, Font Awesome, génération QR côté serveur.

Documentation officielle

https://lucide.dev/

https://github.com/rosskhanas/react-qr-code

⸻

4. Backend et persistance

Nom

Express 4

Catégorie

Framework HTTP

Rôle

Exposer l’API REST, les middlewares et le flux SSE.

Justification

Express structure les routes API et s’intègre avec les middlewares de sécurité et Sequelize.

Utilisation

`backend/src/index.js`, `routes/`, `controllers/` et `middleware/`.

Alternatives

Fastify, NestJS.

Documentation officielle

https://expressjs.com/

⸻

Nom

Sequelize 6

Catégorie

ORM

Rôle

Mapper les modèles métier vers SQLite ou PostgreSQL.

Justification

Il permet une même couche de persistance pour le développement local et la cible PostgreSQL.

Utilisation

`backend/src/models/` et `backend/src/db/`.

Alternatives

Prisma, Knex.

Documentation officielle

https://sequelize.org/

⸻

Nom

SQLite 3

Catégorie

Base de données relationnelle

Rôle

Fournir la persistance locale lorsqu’aucune variable `DATABASE_URL` n’est configurée.

Justification

SQLite permet un démarrage local simple, sans service de base de données séparé.

Utilisation

Backend en développement et environnements sans PostgreSQL.

Alternatives

PostgreSQL exclusivement.

Documentation officielle

https://www.sqlite.org/docs.html

⸻

Nom

PostgreSQL

Catégorie

Base de données relationnelle

Rôle

Fournir la persistance lorsque `DATABASE_URL` est défini, notamment pour la cible de production.

Justification

PostgreSQL est retenu pour la production afin de disposer d’un moteur relationnel serveur adapté à une exploitation durable.

Utilisation

Backend via `pg`, `pg-hstore` et Sequelize.

Alternatives

MariaDB, MySQL.

Documentation officielle

https://www.postgresql.org/docs/

⸻

5. Sécurité et validation

Nom

jsonwebtoken, cookie-parser et bcryptjs

Catégorie

Bibliothèques de sécurité

Rôle

Signer et vérifier les JWT, lire les cookies et hacher les mots de passe.

Justification

Les sessions reposent sur un JWT stocké dans un cookie httpOnly et les mots de passe ne sont jamais stockés en clair.

Utilisation

Authentification backend et middleware `auth`.

Alternatives

Sessions serveur, OAuth/OIDC, Argon2.

Documentation officielle

https://github.com/auth0/node-jsonwebtoken

https://expressjs.com/en/resources/middleware/cookie-parser.html

https://github.com/dcodeIO/bcrypt.js

⸻

Nom

Helmet, CORS, HPP, express-rate-limit et xss

Catégorie

Middlewares de sécurité

Rôle

Protéger les en-têtes HTTP, les origines autorisées, la pollution de paramètres, les abus de requêtes et les entrées XSS.

Justification

Ces protections correspondent aux menaces usuelles d’une API publique exposant authentification, réservation et paiement.

Utilisation

Initialisation de l’API et middlewares backend.

Alternatives

Configuration manuelle équivalente.

Documentation officielle

https://helmetjs.github.io/

https://github.com/expressjs/cors

https://github.com/analog-nico/hpp

https://express-rate-limit.mintlify.app/

https://github.com/leizongmin/js-xss

⸻

Nom

express-validator

Catégorie

Bibliothèque de validation

Rôle

Valider et normaliser les données reçues par les routes API.

Justification

La validation est centralisée au niveau des routes avant l’appel aux contrôleurs.

Utilisation

`backend/src/middleware/validate.js` et routes API.

Alternatives

Joi, Zod.

Documentation officielle

https://express-validator.github.io/

⸻

6. Services métier et intégrations externes

Nom

Stripe

Catégorie

Service de paiement

Rôle

Gérer Checkout, portail client, abonnements et webhooks.

Justification

Stripe fournit le cycle de vie complet des abonnements sans manipuler de données de carte bancaire dans l’application.

Utilisation

`backend/src/controllers/billingController.js`.

Alternatives

PayPal, Mollie.

Documentation officielle

https://docs.stripe.com/

⸻

Nom

Base Adresse Nationale et OSRM

Catégorie

APIs de géolocalisation et d’itinéraire

Rôle

Géocoder les adresses françaises et calculer les distances routières nécessaires à la simulation tarifaire.

Justification

Ces services permettent d’offrir une simulation sans maintenir immédiatement une infrastructure géographique dédiée.

Utilisation

`backend/src/services/geoService.js`.

Alternatives

Google Maps Platform, Mapbox, instance OSRM auto-hébergée.

Documentation officielle

https://adresse.data.gouv.fr/api-doc/adresse

https://project-osrm.org/docs/

⸻

Nom

Nodemailer et SMTP

Catégorie

Bibliothèque et protocole de courriel

Rôle

Envoyer les courriels transactionnels.

Justification

Nodemailer permet de s’intégrer à un fournisseur SMTP configuré par environnement.

Utilisation

`backend/src/services/emailService.js`.

Alternatives

Resend, SendGrid, Mailgun.

Documentation officielle

https://nodemailer.com/

⸻

Nom

Twilio

Catégorie

Service SMS

Rôle

Envoyer des SMS lorsque la fonctionnalité est activée.

Justification

Twilio est un fournisseur SMS configurable par variables d’environnement.

Utilisation

`backend/src/services/smsService.js`.

Alternatives

OVH Télécom, Brevo, Vonage.

Documentation officielle

https://www.twilio.com/docs

⸻

Nom

PDFKit, Multer et uuid

Catégorie

Bibliothèques de fichiers

Rôle

Générer des PDF, traiter les envois de photos et générer des identifiants ou noms de fichiers non prédictibles.

Justification

Ces bibliothèques couvrent les besoins documentaires et d’upload du projet sans exposer les PDF en fichiers statiques.

Utilisation

Services PDF, middleware d’upload des contacts et modèles.

Alternatives

Puppeteer pour PDF, busboy pour upload, UUID natif.

Documentation officielle

https://pdfkit.org/

https://github.com/expressjs/multer

https://github.com/uuidjs/uuid

⸻

7. Observabilité et qualité

Nom

Winston et Morgan

Catégorie

Journalisation

Rôle

Produire les journaux applicatifs et HTTP.

Justification

Morgan collecte les requêtes HTTP et Winston centralise leur écriture avec les autres événements applicatifs.

Utilisation

`backend/src/middleware/logger.js` et `backend/src/index.js`.

Alternatives

Pino, Bunyan.

Documentation officielle

https://github.com/winstonjs/winston

https://github.com/expressjs/morgan

⸻

Nom

Jest et Supertest

Catégorie

Tests backend

Rôle

Exécuter les tests unitaires et d’intégration HTTP de l’API.

Justification

Ils permettent de tester la logique backend et les routes Express sans navigateur.

Utilisation

`backend/tests/` et script `npm test`.

Alternatives

Vitest, Mocha/Chai.

Documentation officielle

https://jestjs.io/

https://github.com/forwardemail/supertest

⸻

Nom

Cypress

Catégorie

Tests end-to-end

Rôle

Vérifier les parcours utilisateur dans un navigateur, notamment accueil, réservation, connexion et tableau de bord.

Justification

Cypress teste l’intégration effective du frontend, du serveur de développement et de l’API.

Utilisation

`frontend/cypress/` et scripts `cy:run` et `test:e2e`.

Alternatives

Playwright, WebdriverIO.

Documentation officielle

https://docs.cypress.io/

⸻

Nom

Lighthouse et chrome-launcher

Catégorie

Audit de performance

Rôle

Exécuter localement un audit de performance frontend après build.

Justification

Ils permettent de détecter des régressions de performance avant mise en production.

Utilisation

`frontend/scripts/lighthouse-audit.js` et script `test:speed`.

Alternatives

WebPageTest, PageSpeed Insights.

Documentation officielle

https://developer.chrome.com/docs/lighthouse/

https://github.com/GoogleChrome/chrome-launcher

⸻

Nom

dotenv et Nodemon

Catégorie

Outils de développement

Rôle

Charger la configuration locale et relancer automatiquement l’API pendant le développement.

Justification

Ils simplifient le développement local sans être nécessaires au fonctionnement de production.

Utilisation

Backend, scripts `dev` et démarrage de l’API.

Alternatives

Configuration native du processus, `node --watch`.

Documentation officielle

https://github.com/motdotla/dotenv

https://nodemon.io/

⸻

8. Règles

Chaque ajout, retrait ou remplacement significatif de technologie doit entraîner une proposition de mise à jour de ce document.

Les valeurs sensibles de configuration, identifiants et secrets ne doivent jamais être ajoutés à ce document.

Les choix d’architecture structurants restent documentés dans `DECISIONS.md`, notamment l’ADR-001 pour PostgreSQL sur Proxmox.

⸻

9. Références

* SYSTEM.md
* STANDARDS.md
* ARCHITECTURE.md
* CONTEXT.md
* DECISIONS.md
* backend/package.json
* frontend/package.json
