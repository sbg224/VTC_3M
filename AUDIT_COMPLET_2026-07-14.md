# Audit complet — VTC 3M / 3M Drive (ahadi-vtc)
**Date : 2026-07-14 — Périmètre : intégralité du monorepo (backend + frontend)**

Méthodologie : lecture exhaustive du code source (pas seulement des fichiers récents), exécution réelle (`npm run build`, tests de layout dans un navigateur réel sur le serveur de dev), inspection du DOM/CSS en conditions réelles desktop et mobile. Quatre audits thématiques approfondis ont été menés en parallèle (sécurité, qualité de code/architecture, performance, robustesse/SEO/architecture globale), puis complétés par une vérification manuelle du rendu visuel. Toute affirmation est sourcée fichier:ligne ; toute incertitude est signalée explicitement plutôt que supposée.

---

## 1. Compréhension du projet

### 1.1 Objectif et fonctionnalités
VTC 3M / 3M Drive est une plateforme SaaS pour chauffeurs VTC indépendants, structurée en monorepo :
- **Vitrine publique** : présentation du service, simulation de prix en temps réel, réservation en ligne (`Reservation.jsx`, `BookingPage.jsx` pour une réservation liée à un chauffeur via `/book/:slug`).
- **Espace chauffeur** (`Dashboard.jsx`) : gestion des réservations, statistiques, CRM clients, calculateur de tarifs, facturation PDF, notifications temps réel (SSE), gestion d'abonnement Stripe.
- **Back-office admin** (`AdminDashboard.jsx`) : gestion des chauffeurs (statuts pending/trial/active/suspended), comptabilité multi-chauffeurs, tarification plateforme, notifications.
- **Avis clients** via lien à token unique (`ReviewPage.jsx`, `reviewToken`).
- **Facturation SaaS** : abonnement mensuel/annuel par chauffeur via Stripe (Checkout + Customer Portal + webhooks).

### 1.2 Stack technique
- **Frontend** : React 18 + Vite 5, React Router 6, Axios, GSAP + Framer Motion (animations), Cypress (E2E), Lighthouse CI.
- **Backend** : Node.js + Express 4, Sequelize 6 (SQLite en dev, PostgreSQL prêt pour la prod via `pg`/`pg-hstore`), JWT + bcryptjs, Helmet, express-rate-limit, express-validator, Winston (logs), PDFKit, Nodemailer, Twilio, Stripe.
- **Services externes** : Nominatim/OSRM (géocodage, serveurs publics gratuits — voir §3 et §7), Stripe, Twilio SMS, SMTP.

### 1.3 Flux utilisateurs principaux
1. **Client** : accueil → simulation de prix → réservation (avec consentement RGPD/CGU obligatoire) → confirmation email/SMS + PDF → (optionnel) avis via lien à token après la course.
2. **Chauffeur** : inscription (statut `pending`) → validation admin → connexion → tableau de bord (réservations, stats, CRM, facturation, abonnement Stripe).
3. **Admin plateforme** : validation des inscriptions chauffeurs, gestion des abonnements, tarification, comptabilité globale.

### 1.4 Zones critiques identifiées
- Le webhook Stripe (`/api/billing/webhook`) — point de rencontre entre argent réel et code applicatif.
- L'authentification JWT et l'isolation multi-tenant des données (`chauffeur_id` filtré dans chaque requête).
- Le formulaire de réservation public (première interaction avec un prospect, sans authentification).
- La base SQLite locale, dont la migration vers PostgreSQL est déjà planifiée avant l'ouverture publique (`PLAN_DEPLOIEMENT_PROXMOX_POSTGRES.md`).

### 1.5 Ce que je n'ai pas pu vérifier
- Le contenu réel de `backend/.env` (volontairement non lu, conformément aux bonnes pratiques — seule sa présence sur disque et son exclusion de Git ont été vérifiées).
- Le comportement réel en environnement de production (VM, reverse proxy, HTTPS) — l'analyse porte sur le code et son exécution en local.
- Les résultats d'un `npm audit` réel (l'évaluation des dépendances ci-dessous est qualitative, basée sur la connaissance des CVE publiques aux versions listées).

---

## 2. Sécurité (priorité maximale)

**Verdict global : bases solides, deux défauts critiques à corriger avant toute exposition publique.** L'architecture backend suit dans l'ensemble de bonnes pratiques (Sequelize paramétré partout, isolation multi-tenant systématique, CSP Helmet sans `unsafe-inline`/`unsafe-eval` sur les scripts, sanitisation XSS globale, rate limiting différencié par route sensible, aucun secret en dur). Deux problèmes structurels menacent cependant le fonctionnement même de l'application en production.

### 2.1 Critique

| # | Problème | Fichier:ligne | Impact |
|---|---|---|---|
| 1 | **Le routeur `billing` est monté deux fois** (`/api/billing/webhook` avant `express.json()`, puis `/api/billing` après) : la route `/webhook` interne ne correspond jamais au premier montage et le corps de la requête webhook Stripe est **parsé en JSON avant validation de signature**, ce qui fait échouer systématiquement `stripe.webhooks.constructEvent()`. **Tous les webhooks Stripe sont rejetés.** | `backend/src/index.js:74,77,112` | Les statuts d'abonnement (paiement réussi, échec, résiliation) ne sont **jamais synchronisés automatiquement**. Confirmé par reproduction isolée d'Express (même version). |
| 2 | **Identifiants admin par défaut** (`admin@vtc3m.fr` / `Admin2024!`, documentés publiquement dans le README) recréés/écrasés au démarrage si `ADMIN_PASSWORD`/`ADMIN_LOGIN_EMAIL` ne sont pas positionnés en production. | `backend/src/index.js:155-195` | Prise de contrôle admin triviale (accès total, y compris tarification plateforme et données de tous les chauffeurs) si la variable d'environnement est oubliée en prod. |
| 3 | **Absence d'index sur `chauffeur_id`/`status`** (table `reservations`, la plus sollicitée du système) et sur `status+role` (`drivers`). Sans gravité aujourd'hui sur SQLite local, mais dégradation linéaire garantie après la migration PostgreSQL déjà planifiée. | `backend/src/models/Reservation.js`, `Driver.js` | Ralentissement progressif de la quasi-totalité des requêtes (dashboard, stats, CRM, admin) à mesure que le volume de réservations augmente. |

### 2.2 Haute
- **Pas de `app.set('trust proxy', ...)`** : derrière un reverse-proxy (Nginx/Traefik, prévu dans `PLAN_DEPLOIEMENT_PROXMOX_POSTGRES.md`), `req.ip` correspondra à l'IP du proxy pour tous les utilisateurs → rate limiting soit inopérant (tous mélangés dans le même compteur), soit contournable via `X-Forwarded-For` si mal configuré plus tard. — `backend/src/index.js`

### 2.3 Moyenne
- **JWT stocké en `localStorage`** (pas de cookie `httpOnly`) : surface d'exposition en cas de XSS future, atténuée aujourd'hui par une CSP stricte et l'absence de `dangerouslySetInnerHTML` sur du contenu utilisateur. — `frontend/src/services/auth.jsx:7,35-36`
- **JWT transmis en query string** pour la connexion SSE (`EventSource` ne supporte pas les headers custom) : risque de fuite via les logs d'un reverse-proxy en amont. — `backend/src/routes/notifications.js:10`
- **Erreurs internes (`err.message`) renvoyées brutes** au client dans plusieurs contrôleurs admin (comptabilité, notification), au lieu de passer par le masquage global en production. — `accountingController.js:152,198,254,279`, `adminController.js:364`
- Versions des dépendances à confirmer par un vrai `npm audit`/Dependabot avant mise en production (aucune CVE non corrigée identifiée qualitativement aux versions actuelles, mais ce n'est pas un substitut à un scan réel).

### 2.4 Faible
- `jwt.verify()` sans restriction explicite `algorithms: ['HS256']` (défense en profondeur).
- Léger canal de timing sur le login permettant une énumération de comptes par mesure de latence.
- Politique de mot de passe plus faible sur `changePassword` (8 caractères) que sur `register` (règles complètes).
- Recherches `Op.like` sans échappement de `%`/`_` (impact quasi nul, déjà isolées par `chauffeur_id`).

### 2.5 Points forts confirmés
Isolation multi-tenant systématique (aucun IDOR trouvé sur réservations/CRM/stats), aucune requête SQL brute vulnérable, vérification de signature webhook Stripe correcte dans son principe (seul le montage de route la casse), aucun secret en dur ni commité, aucune fonctionnalité d'upload à risque, aucun path traversal/SSRF exploitable (géocodage vers hôtes fixes, noms de fichiers PDF dérivés de valeurs serveur uniquement).

---

## 3. Qualité de code & dette technique

### 3.1 Critique
**Double montage du routeur `billing`** — voir §2.1, même cause racine identifiée indépendamment par l'audit qualité et l'audit sécurité (reproduction technique confirmée par un test Express isolé).

### 3.2 Haute
- **`Dashboard.jsx` (2164 lignes, 52 `useState`, 11 composants imbriqués) et `AdminDashboard.jsx` (1318 lignes, 48 `useState`)** : à découper en sous-composants dédiés (`components/dashboard/*`). Illisibilité croissante, tout render local re-exécute l'intégralité du fichier.
- **Duplication massive entre `Reservation.jsx` et `BookingPage.jsx`** : fonction `validate()`, widget de simulation, état de formulaire quasi identiques dans les deux fichiers (le code lui-même le documente en commentaire). Risque de divergence silencieuse déjà visible (messages d'erreur légèrement différents). À factoriser dans un hook partagé.
- **23 occurrences de classes CSS façon Tailwind non fonctionnelles** (`flex`, `items-center`, `gap-2`, `justify-center`, `inline-flex`…) dans **5 fichiers** (`Login.jsx`, `BookingPage.jsx`, `Register.jsx`, `Home.jsx`, `Dashboard.jsx`) alors que Tailwind n'est pas installé. Rendu visuel cassé silencieusement (icônes empilées au lieu d'alignées) sur des pages critiques : connexion, inscription, réservation, accueil, dashboard. Liste précise fichier:ligne disponible dans le rapport détaillé de l'audit qualité (annexe interne).
- **Incohérence `config/pricing.js` vs `priceService.js`** : deux sources de vérité tarifaire, la seconde étant la vraie source dynamique (mise à jour par l'admin), la première figée au démarrage. Après une modification tarifaire admin, le détail affiché en simulation (`breakdown`) diverge du prix réellement calculé.
- **Aucun test backend** (0 fichier `*test*` dans `backend/`). La logique métier critique (calcul de prix, webhooks Stripe — dont le bug §2.1/§3.1 —, statut d'abonnement) n'est validée par aucun filet de sécurité automatisé.

### 3.3 Moyenne
- Incohérence de nommage `chauffeur_id` (snake_case) vs `chauffeurId` (camelCase) selon les modèles — source de confusion et d'erreurs de frappe silencieuses.
- 3 instances Axios distinctes (`services/api.js`, `services/auth.jsx`, `ReviewPage.jsx`) au lieu d'une seule — la gestion d'erreur centralisée (401/402) n'est pas partagée par toutes.
- N+1 query dans `driverController.getPublicList` (page d'accueil publique) — une requête `Review` par chauffeur au lieu d'une requête groupée.
- Durée d'essai (14 jours) et commission par défaut (20%) codées en dur à deux endroits distincts plutôt que centralisées.

### 3.4 Faible
- Hook `useGsapInit` exporté mais jamais utilisé (dead code).
- `formatDate()` dupliquée entre `emailService.js` et `pdfService.js`.
- Génération de `reservationNumber` via `COUNT(*)` non atomique (race condition mineure sous forte concurrence, à revoir avant la migration PostgreSQL).

### 3.5 Points forts
Séparation controllers/middleware/models/routes/services bien respectée, associations Sequelize correctes, aucune dépendance frontend ou backend clairement inutilisée, code-splitting par route déjà en place (`React.lazy`), contexte d'authentification unique sans props drilling, migrations idempotentes bien conçues (`runMigrations.js`), suite Cypress fonctionnelle (11 tests) couvrant les parcours critiques principaux.

---

## 4. Performance

### 4.1 Frontend
- **Bundle principal 509 kB minifié / 174 kB gzip** (mesuré via `npm run build` réel) — Vite avertit explicitement du dépassement de seuil. Cause : absence de `manualChunks` dans `vite.config.js` (vendor React + gsap + framer-motion tout fusionné dans le chunk eager). **Priorité Haute.**
- **gsap ET framer-motion chargées en eager sur toutes les routes** via `CursorEffect` et `Navbar` importés statiquement, y compris sur `/login`, `/admin`, `/dashboard` où l'effet curseur n'a pas d'utilité. **Priorité Haute.**
- **~2 Mo d'images non optimisées** sur la page d'accueil (aucun format webp/avif), + **15 Mo d'images `.png` mortes** dans `public/images/` non référencées dans le code (restes d'un ancien commit). **Priorité Haute** (images actives) / **Faible** (images mortes, impact dépôt uniquement).
- Aucune memoization (`React.memo`/`useMemo`) dans `Dashboard.jsx`/`AdminDashboard.jsx` — impact atténué par la pagination serveur déjà en place (listes ≤ 25 lignes).
- Point positif : SSE bien implémenté côté chauffeur (pas de polling), pagination serveur cohérente sur toutes les routes de listing.

### 4.2 Backend
- **N+1 jusqu'à 200 requêtes SQL potentielles** sur `adminController.getDrivers` (2 requêtes par chauffeur affiché, jusqu'à 100 chauffeurs par page). Négligeable sur SQLite local, deviendra un vrai goulot d'étranglement après la migration PostgreSQL distant déjà planifiée. **Priorité Haute.**
- Boucle séquentielle de 7 requêtes (non parallélisées) dans `statsController.getStats` pour le graphique 7 jours, appelée à chaque connexion chauffeur.
- Génération PDF synchrone **avant** la réponse HTTP (`await generateReservationPdf` avant `res.status(201)`), retardant la confirmation de réservation du temps de génération du document.
- Aucun handler global `process.on('unhandledRejection'/'uncaughtException')` — risque de crash serveur silencieux en cas de bug futur échappant aux `try/catch`.

### 4.3 Base de données
**Absence d'index sur les colonnes de filtrage systématique** (`chauffeur_id`, `status` sur `Reservation` ; `status+role` sur `Driver` ; `chauffeurId` sur `Review`) — voir §2.1. C'est le changement structurel le plus important identifié dans cet audit avant la migration PostgreSQL déjà actée par l'équipe.

---

## 5. UX, navigation et vérification visuelle desktop/mobile

Vérification effectuée en conditions réelles sur le serveur de développement, aux formats desktop (1280×800) et mobile (375×812), sans aucune modification du code.

### 5.1 Bug confirmé — rendu cassé en cours de défilement sur la page d'accueil (desktop)
En faisant défiler la page d'accueil (section « Notre service — Votre chauffeur & votre véhicule »), l'écran devient **entièrement blanc pendant une large portion du scroll**, alors que l'inspection du DOM à ce moment précis montre des éléments avec `opacity: 1`, `visibility: visible` et des couleurs de fond non transparentes — c'est-à-dire un contenu qui *devrait* être visible mais ne s'affiche pas. Constaté à plusieurs reprises, par scroll JS et par scroll natif (molette), de façon reproductible.
- La hauteur de la section concernée est **anormalement variable d'un chargement à l'autre** (mesurée à 6638 px, puis 4109 px, puis 3805 px selon les tentatives) pour un contenu qui ne devrait occuper qu'environ 1800 px de haut sur desktop — signe d'un recalcul de mise en page instable, cohérent avec un commentaire du code lui-même (`frontend/src/pages/Home.jsx:382-387`) qui reconnaît déjà ce type de problème de timing entre chargement des images et recalcul de `ScrollTrigger` (GSAP), documenté comme « observé sur mobile » mais que cette vérification retrouve également sur desktop.
- Par ailleurs, les gestes de défilement natifs sur cette page ont fait **échouer/expirer l'outil d'automatisation à répétition (30 s de timeout)**, symptomatique d'un rendu très coûteux en cours de scroll — cohérent avec l'animation de la galerie « Vos destinations » plus bas sur la page, qui recalcule à chaque frame de scroll (`scrub`) la position, l'échelle, l'opacité **et un filtre `blur()`** de chaque carte (`frontend/src/pages/Home.jsx:323-350`) — un `filter: blur()` recalculé en boucle est coûteux à faire peindre par le navigateur.
- **Priorité : Haute.** Recommandation : vérifier manuellement sur un vrai navigateur/appareil (l'automatisation ne permet pas d'exclure à 100 % un artefact de l'outil de test, mais la variabilité de hauteur mesurée et le commentaire préexistant dans le code pointent vers un vrai problème d'application), profiler les performances de scroll (Chrome DevTools Performance) pendant le passage sur les sections « Notre service » et « Vos destinations », et vérifier le déclenchement de `ScrollTrigger.refresh()` après chargement des images pour toutes les sections (pas seulement celles déjà couvertes par `scheduleRefresh`).

### 5.2 Bug confirmé — le défilement reste bloqué sur mobile après un scroll vers le bas (page d'accueil)
Sur mobile (375×812), après avoir fait défiler la page vers le bas, tout appel programmatique `scrollTo(0, 0)` échoue à ramener la page en haut : la position de scroll **revient systématiquement à ~788 px**, y compris en réessayant après 100 ms, 600 ms et 1600 ms. C'est un test au niveau de l'API JavaScript du navigateur (pas un geste tactile simulé), donc indépendant d'une éventuelle limitation de l'outil de test sur les gestes tactiles — un signal fort d'un vrai comportement applicatif.
- Cause probable : le `ScrollTrigger.create({ pin: true, ... })` de la galerie « Vos destinations » (`Home.jsx:353-360`) piège la position de scroll sur mobile, où les calculs de position de pin sont particulièrement sensibles au timing de chargement des images (cf. commentaire déjà présent dans le code à ce sujet).
- **Impact concret pour un visiteur mobile** : une fois descendu dans la page, impossible de revenir en haut pour revoir le formulaire de réservation rapide du hero sans recharger la page.
- **Priorité : Haute.** À reproduire et confirmer sur un vrai smartphone avant correction.

### 5.3 Anomalie observée (non confirmée) — défilement inopérant sur la page de réservation mobile
Sur `/reservation` en format mobile, aucune tentative de scroll programmatique (JS) n'a permis de faire bouger la position de défilement, contrairement à la page d'accueil où le scroll fonctionne (juste bloqué à un point précis). **Je ne peux pas exclure ici un artefact de l'environnement de test** plutôt qu'un vrai bug de l'application — cette page n'utilise pas GSAP/ScrollTrigger (contrairement à `Home.jsx`), ce qui rend un vrai bug applicatif moins probable mais pas impossible. **À revérifier manuellement sur un appareil réel avant d'en tirer une conclusion.**

### 5.4 Donnée de test visible par de vrais visiteurs — priorité Critique produit
La base de données locale contient **6 fiches chauffeur strictement identiques** (« Chauffeur Test QA », slugs `chauffeur-test-qa`, `chauffeur-test-qa-1`, etc.), retournées telles quelles par l'API publique `/api/drivers/public` et affichées 6 fois de suite dans la section « Notre service » de la page d'accueil. Si cette donnée de test se retrouve en production, un visiteur verrait la **même carte chauffeur (même nom, même bio) répétée 6 fois** — une impression de site cassé ou non fini, immédiatement visible dès le scroll sur la page d'accueil. Sans lien avec un bug de code : c'est un problème d'hygiène des données de seed/démo à nettoyer avant toute mise en production. **Priorité : Critique avant lancement** (mais correction triviale : suppression des doublons en base).

### 5.5 Pas de débordement horizontal constaté
Aucun débordement horizontal détecté sur mobile (375 px) sur les pages Accueil et Réservation (`document.documentElement.scrollWidth === window.innerWidth` vérifié programmatiquement). Le formulaire de réservation s'affiche correctement en une colonne sur mobile, sans élément débordant.

### 5.6 Absence d'Error Boundary React
Aucun composant `ErrorBoundary` dans toute l'application (`frontend/src/main.jsx` monte `<App />` sans protection). Toute exception de rendu non prévue (donnée API malformée, accès à une propriété `undefined`) provoque un **écran blanc total** sans message ni possibilité de recharger — risque réel vu la complexité de `Dashboard.jsx`/`AdminDashboard.jsx`. **Priorité Haute**, correction triviale (boundary générique autour de `<App />`).

### 5.7 SEO — couverture large mais deux angles morts
- Composant `Seo.jsx` bien conçu, utilisé sur toutes les pages publiques avec title/description uniques, Open Graph, JSON-LD (`LocalBusiness` + `BreadcrumbList` sur les pages légales).
- **`aggregateRating` codé en dur** dans le JSON-LD de la page d'accueil (note 4.9, 47 avis) alors qu'un vrai système d'avis existe en base — non connecté, risque de non-conformité aux consignes Google sur les avis si le nombre réel diverge significativement. **Priorité Haute avant ouverture publique.**
- Décision non tranchée sur l'indexation des pages `/book/:slug` (ni interdites, ni listées dans le sitemap) — déjà identifié comme point ouvert dans `CHECKLIST_PREPROD.md`.
- SPA sans SSR/prerender : impact réel sur le partage social (les metadata figées d'`index.html` s'affichent tant que le JS n'a pas exécuté `Seo.jsx`). Recommandation pragmatique : prerender ciblé sur les ~5 pages publiques plutôt qu'une migration Next.js complète, disproportionnée pour la taille actuelle du projet.

---

## 6. Robustesse

### Points forts
Gestion d'erreur cohérente dans tous les contrôleurs (try/catch systématique, pas de crash process possible identifié), double validation client + serveur sur tous les formulaires critiques (consentements RGPD/CGU non contournables), échecs des services externes (email/SMS/PDF) correctement isolés et non bloquants pour la création de réservation, démarrage fail-fast si la base est inaccessible.

### Points faibles
- **Dépendance à des serveurs publics gratuits (Nominatim/OSRM) sans clé API** pour le géocodage et la tarification — ces services ont des politiques d'usage strictes et aucune garantie de disponibilité ; une panne ou un blocage IP casserait silencieusement la simulation de prix pour tous les visiteurs. **Priorité Haute avant ouverture publique**, absent des checklists existantes.
- Divergence de règles de validation téléphone entre `express-validator` (accepte le préfixe `0033`) et la re-validation manuelle des contrôleurs (le rejette) — incohérence visible utilisateur, pas de faille de sécurité.
- `notifyDriver` (admin) recrée sa propre instance Nodemailer au lieu de réutiliser `emailService.js`, ce qui ignore le kill-switch `EMAIL_ENABLED=false` utilisé pour les tests.
- Aucun comportement hors-ligne (pas de service worker) — choix assumé cohérent pour ce type de métier, à documenter comme tel plutôt que comme oubli.

---

## 7. Architecture

L'architecture SPA (Vite/React) + API REST Express séparée est cohérente avec les besoins réels (vitrine, dashboard chauffeur, admin, facturation). Le système est **déjà multi-tenant fonctionnel**, pas juste préparé : isolation stricte par `chauffeur_id` vérifiée dans tous les contrôleurs, gating d'abonnement Stripe complet (`checkSubscription.js`) avec synchronisation par webhook (une fois le bug §2.1 corrigé). Ajouter une fonctionnalité de paiement en ligne du trajet par le client serait raisonnablement simple avec la structure actuelle (webhook déjà en `switch` extensible, migrations idempotentes).

Les trois dettes techniques principales (SQLite dev/prod déjà en cours de traitement, bundle frontend lourd, classes CSS mortes) dessinent le profil d'un projet **solide côté backend/sécurité mais avec une dette de finition côté frontend** (performance, CSS, cohérence visuelle) à traiter avant une montée en charge ou une campagne d'acquisition.

---

## 8. Rapport final

### Résumé exécutif
Le projet est **globalement bien construit sur le plan de la sécurité et de la robustesse backend** — isolation multi-tenant rigoureuse, validation systématique, aucune injection exploitable, aucun secret exposé. Il n'est en revanche **pas prêt pour une mise en production réelle en l'état**, à cause de deux défauts critiques faciles à corriger (webhook Stripe cassé, identifiants admin par défaut) et d'une dette de finition frontend plus large (bundle, CSS mort, bugs de rendu au scroll, données de test visibles publiquement) qui nuirait à la crédibilité du service dès les premières visites.

**Note globale : 6,5/10** — une base technique saine, freinée par des défauts de finition et deux bugs critiques concentrés et rapides à corriger.

### Points excellents
- Isolation multi-tenant systématique, aucun IDOR trouvé.
- CSP Helmet stricte, sanitisation XSS globale efficace.
- Validation serveur systématique, consentements RGPD/CGU non contournables.
- Architecture d'abonnement Stripe complète et cohérente (une fois le webhook corrigé).
- Migrations idempotentes bien conçues, suite Cypress fonctionnelle sur les parcours critiques.

### Points satisfaisants
- Code-splitting par route déjà en place, SSE fonctionnel côté chauffeur.
- SEO par page bien couvert (title/description/OG/JSON-LD uniques).
- Séparation des responsabilités backend respectée (controllers/services/models).
- Gestion d'erreur backend cohérente, aucun crash process identifié.

### Points à améliorer
- Bundle frontend (509 kB), classes CSS mortes (23 occurrences sur 5 pages), fichiers `Dashboard.jsx`/`AdminDashboard.jsx` à découper.
- Absence totale de tests backend.
- Duplication `Reservation.jsx`/`BookingPage.jsx`.
- Absence d'Error Boundary React (risque d'écran blanc).

### Vulnérabilités critiques
1. Webhook Stripe cassé par double montage de route (`backend/src/index.js:74,77,112`).
2. Identifiants admin par défaut si variables d'environnement absentes en prod (`backend/src/index.js:155-195`).
3. Absence d'index DB sur les colonnes de filtrage systématique (`Reservation`, `Driver`).

### Dette technique
SQLite en prod (migration déjà planifiée), bundle non découpé en chunks vendor, classes CSS mortes type Tailwind, `config/pricing.js` en doublon désynchronisable avec `priceService.js`, incohérence de nommage `chauffeur_id`/`chauffeurId`, absence de tests backend.

### Performances
Point le plus critique : absence d'index DB (impact différé mais garanti après migration PostgreSQL). Ensuite : poids du bundle frontend et des images non optimisées, N+1 sur la liste admin des chauffeurs (jusqu'à 200 requêtes), génération PDF bloquante avant réponse HTTP.

### UX
Bugs de rendu confirmés au défilement sur la page d'accueil (desktop et mobile), données de test « Chauffeur Test QA » x6 visibles publiquement, absence d'Error Boundary. Le reste du parcours (réservation, formulaires, responsive) est propre et sans débordement constaté.

### Architecture
Cohérente et déjà multi-tenant fonctionnel ; dette concentrée sur la finition frontend plutôt que sur des choix structurels à remettre en cause.

### Sécurité
Bases solides (voir §2.5), deux correctifs critiques concentrés et rapides à appliquer avant toute exposition publique.

---

## Feuille de route priorisée

### Priorité 1 — à corriger immédiatement (avant toute mise en production)
1. Corriger le double montage du routeur `billing` pour rétablir la vérification de signature webhook Stripe (`backend/src/index.js`).
2. Empêcher le démarrage en production si `ADMIN_PASSWORD`/`ADMIN_LOGIN_EMAIL` ne sont pas explicitement définis et différents des valeurs par défaut.
3. Ajouter les index manquants sur `chauffeur_id`/`status` (`Reservation`), `status+role` (`Driver`), `chauffeurId` (`Review`).
4. Nettoyer les 6 fiches chauffeur de test dupliquées en base avant toute ouverture publique.
5. Configurer `app.set('trust proxy', ...)` avant déploiement derrière Nginx/Traefik.
6. Reproduire et corriger les bugs de rendu/scroll bloqué constatés sur la page d'accueil (desktop et mobile) — profiler avec Chrome DevTools Performance.

### Priorité 2 — fortement recommandé
1. Ajouter un Error Boundary React global.
2. Migrer le géocodage/tarification vers un fournisseur avec clé API dédiée (sortir de Nominatim/OSRM publics).
3. Rendre dynamique le `aggregateRating` du JSON-LD ou le retirer tant que le volume d'avis réel est faible.
4. Factoriser la duplication `Reservation.jsx`/`BookingPage.jsx`.
5. Supprimer `config/pricing.js` au profit de `priceService.js` uniquement.
6. Corriger les 23 classes CSS mortes type Tailwind (5 fichiers).
7. Ajouter un `manualChunks` Vite (vendor React / gsap+framer-motion) et différer le chargement de `CursorEffect`.
8. Convertir les images actives en webp.
9. Écrire des tests backend minimaux, en priorité sur `priceService.js` et le webhook Stripe.

### Priorité 3 — qualité produit
1. Découper `Dashboard.jsx` et `AdminDashboard.jsx` en sous-composants.
2. Unifier les 3 instances Axios sur `services/api.js`.
3. Corriger la divergence de validation téléphone (`0033`) entre `validate.js` et les contrôleurs.
4. Corriger le N+1 de `adminController.getDrivers` et `driverController.getPublicList`.
5. Décider et implémenter le traitement SEO des pages `/book/:slug`.
6. Faire respecter `EMAIL_ENABLED=false` par `notifyDriver`.

### Améliorations futures
1. Prerender ciblé des pages publiques pour un meilleur partage social/SEO.
2. Génération PDF asynchrone (après réponse HTTP) plutôt que bloquante.
3. Étendre la couverture Cypress (inscription chauffeur, avis client, webhook Stripe).
4. Ajouter des handlers globaux `unhandledRejection`/`uncaughtException`.
5. Étudier un flux de paiement en ligne du trajet par le client (architecture déjà prête à l'accueillir).

---

*Fichiers clés consultés (chemins relatifs au dossier `ahadi-vtc`) : `README.md`, `AUDIT_OPERATIONNEL_2026-04-12.md`, `CHECKLIST_PREPROD.md`, `PLAN_DEPLOIEMENT_PROXMOX_POSTGRES.md`, `STRIPE_SETUP.md`, l'intégralité de `backend/src/` (controllers, middleware, models, routes, services, config, db) et `frontend/src/` (pages, components, services, styles, animations), `frontend/vite.config.js`, `frontend/index.html`, `frontend/public/{robots.txt,sitemap.xml}`, ainsi qu'une vérification visuelle en direct sur le serveur de développement (desktop 1280×800 et mobile 375×812).*
