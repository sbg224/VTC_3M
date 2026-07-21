AUDIT.md

AI Engineering System (AES)

Structure : issue d’AES v1.1.0

Statut : 🟢 Vivant

Responsable : Développeur

Modification par un agent : Proposition uniquement (validation obligatoire)

Documents liés :

* STANDARDS.md
* CHECKLIST.md
* DECISIONS.md
* CHANGELOG.md
* CONTEXT.md
* ARCHITECTURE.md

⸻

1. Objectif

Ce document centralise les résultats des audits réalisés sur le projet.

Il permet de suivre son niveau de qualité, d’identifier les risques et de mesurer les améliorations au fil du temps.

⸻

2. Portée

L’audit évalue l’état global du projet.

Il permet d’identifier les forces, les faiblesses, les risques et les axes d’amélioration qui dépassent une tâche individuelle.

Un audit peut conduire à des recommandations, des plans d’action ou des décisions d’architecture.

⸻

3. Organisation

Chaque audit doit être enregistré sous un identifiant unique.

Exemple :

* AES-A001
* AES-A002
* AES-A003

Les identifiants ne sont jamais réutilisés.

⸻

4. Structure d’un audit

Chaque audit doit contenir au minimum :

Identifiant

Exemple :

AES-A001

Date

Date et heure de réalisation, au format AAAA-MM-JJ HH:MM, pour identifier chaque audit de façon unique et chronologique.

Auteur

Développeur ou agent ayant réalisé l’audit.

Domaine

Exemples :

* Qualité
* Architecture
* Sécurité
* Performance
* Documentation
* Accessibilité

Résumé

Présentation synthétique des conclusions.

Constats

Liste des observations réalisées.

Recommandations

Actions proposées pour améliorer le projet.

Priorité

Par exemple :

* Critique
* Élevée
* Moyenne
* Faible

Statut

Par exemple :

* Ouvert
* En cours
* Corrigé
* Fermé

⸻

5. Bonnes pratiques

Les audits doivent être :

* factuels ;
* vérifiables ;
* reproductibles ;
* argumentés.

Les recommandations doivent être justifiées.

⸻

6. Évolution

Un audit n’est jamais modifié pour masquer son historique.

Si la situation évolue, un nouvel audit ou une mise à jour de son statut est enregistré.

⸻

7. Références

Ce document s’appuie sur :

* STANDARDS.md ;
* CHECKLIST.md.

Les audits peuvent entraîner des mises à jour de :

* DECISIONS.md ;
* CHANGELOG.md ;
* CONTEXT.md ;
* ARCHITECTURE.md.

⸻

8. Conclusion

L’audit complète la checklist.

La checklist valide une tâche.

L’audit évalue durablement la qualité du projet.

---

## AES-A001

**Date**
2026-07-21 17:23

**Auteur**
Agent — absorption et vérification du code actuel

**Domaine**
Conformité, formulaires, migrations, SEO et exploitation

**Résumé**
Absorption vérifiée de `AUDIT_OPERATIONNEL_2026-04-12.md`. Les correctifs légaux, de consentement et de migration sont présents dans le code. Les vérifications nécessitant une base ou des services externes restent à réaliser hors analyse statique.

**Constats**

- Page CGU, route `/cgu`, lien de footer et redirection `/politique-confidentialite` vers `/politique-rgpd` : **Corrigé** — voir `frontend/src/App.jsx`, `frontend/src/components/Footer.jsx` et `frontend/src/pages/ConditionsGenerales.jsx`.
- Consentements RGPD et CGU des réservations et inscriptions chauffeur : **Corrigé** — contrôles client et serveur présents dans `frontend/src/utils/reservationForm.js`, `frontend/src/pages/Register.jsx`, `backend/src/controllers/reservationController.js` et `backend/src/controllers/authController.js`.
- Forçage serveur de `gdprConsent` à `true` : **Corrigé** — le contrôleur de réservation refuse désormais un consentement absent.
- Inscription chauffeur incohérente avec le statut `pending` : **Corrigé** — l’inscription retourne un compte en attente, sans session ; la connexion bloque les comptes `pending` et `suspended`.
- Champs `reviewToken`, `termsAccepted`, `gdprConsent` et migrations idempotentes : **Corrigé** — modèles et runner présents dans `backend/src/models/` et `backend/src/db/runMigrations.js`.
- Vérifications runtime historiques (parcours UI, avis, emails, SMS, PDF et base locale) : **À revalider** — elles dépendent d’un environnement d’exécution et de services configurés.
- SEO SPA, routes légales, `robots.txt` et sitemap : **Corrigé** dans le code ; la limite SSR/prerender reste **Ouverte**.
- Validation juridique du contenu, état de `drivers_backup` et fonctionnement réel des services externes : **Ouvert**.

**Recommandations**

1. Exécuter les parcours UI et les intégrations externes sur l’environnement de staging.
2. Valider le contenu juridique avant l’ouverture publique.
3. Traiter le prerender ciblé comme amélioration SEO distincte.

**Priorité**
Moyenne

**Statut**
En cours

**Source**
`AUDIT_OPERATIONNEL_2026-04-12.md`

---

## AES-A002

**Date**
2026-07-21 17:23

**Auteur**
Agent — absorption et vérification du code actuel

**Domaine**
Sécurité, qualité, performance, UX, robustesse et architecture

**Résumé**
Absorption vérifiée de `AUDIT_COMPLET_2026-07-14.md`. Les défauts critiques de webhook et d’identifiants admin sont corrigés. La dette restante concerne principalement les index à planifier avec PostgreSQL, certaines factorisations frontend, les dépendances externes et les validations en conditions réelles.

**Constats**

- Webhook Stripe parsé avant vérification de signature : **Corrigé** — la route RAW est montée directement avant `express.json()` dans `backend/src/index.js`; couverture présente dans `backend/tests/webhook.test.js`.
- Identifiants administrateur par défaut utilisables en production : **Corrigé** — le démarrage en production échoue si les valeurs par défaut sont conservées.
- Index sur `reservations(chauffeur_id, status)`, `drivers(status, role)` et `reviews(chauffeurId)` : **Ouvert** — aucun index métier correspondant n’est déclaré à ce stade. À intégrer dans la migration PostgreSQL.
- `trust proxy` derrière Nginx/Traefik : **Corrigé** — configuration explicite dans `backend/src/index.js`, paramétrable par `TRUST_PROXY_HOPS`.
- JWT dans `localStorage` et JWT dans l’URL SSE : **Corrigé** — session dans cookie `httpOnly` et authentification SSE par cookie.
- Erreurs internes brutes dans les contrôleurs admin/audit comptable : **Corrigé** pour les emplacements audités — réponse masquée en production.
- Restriction explicite de l’algorithme JWT, homogénéité de politique de mot de passe et échappement de `%`/`_` dans les recherches : **Ouvert**.
- Découpage de `Dashboard.jsx` et `AdminDashboard.jsx` : **En cours** — plusieurs sous-composants existent désormais, mais les pages restent volumineuses.
- Duplication entre `Reservation.jsx` et `BookingPage.jsx` : **En cours** — état et validation communs existent dans `frontend/src/utils/reservationForm.js`, mais les écrans ne sont pas encore pleinement factorisés.
- Classes utilitaires sans Tailwind : **Ouvert** — des classes telles que `flex`, `items-center` et `gap-*` subsistent dans les pages auditées.
- Double source de vérité tarifaire : **Corrigé** — le calcul utilise `priceService.js` et son cache mis à jour par l’administration.
- Absence de tests backend : **Corrigé** — 27 tests Jest passent sur cinq suites ; le script conserve `--forceExit`, à investiguer séparément.
- Nommage `chauffeur_id` / `chauffeurId` : **Corrigé** pour les réservations via l’attribut JavaScript `chauffeurId` mappé sur la colonne SQL existante.
- Multiples instances Axios : **Corrigé** pour les emplacements audités — le client partagé est `frontend/src/services/api.js`.
- N+1 sur listes publique et admin : **Corrigé** — requêtes agrégées dans `driverController.getPublicList` et `adminController.getDrivers`.
- Constantes d’essai et commission dupliquées : **Corrigé** — centralisées dans `backend/src/utils/constants.js`.
- Génération de numéro de réservation par `COUNT(*)` : **Partiellement corrigé** — `createUnique()` réessaie après collision, mais la génération n’est pas atomique ; à revoir avec PostgreSQL.
- Bundle frontend et chargement des animations : **Partiellement corrigé** — `manualChunks` et chargement différé du curseur sont présents ; une mesure Lighthouse de production reste à faire.
- Images actives/non référencées : **À revalider** — le volume actuel de `frontend/public/images` est d’environ 1,2 Mo, mais le statut de chaque asset n’a pas été établi par analyse runtime.
- Requêtes séquentielles de statistiques : **Corrigé** — les comptages principaux utilisent `Promise.all`.
- PDF avant réponse HTTP : **Ouvert**.
- Handlers `uncaughtException` et `unhandledRejection` : **Corrigé**.
- Rendu/scroll Home desktop et mobile : **En cours de validation** — le code retire le `blur()` animé et rafraîchit ScrollTrigger après chargement des images, mais une reproduction sur navigateur et smartphone réels reste nécessaire.
- Scroll mobile de `/reservation` : **À revalider** — anomalie initiale non confirmée.
- Chauffeurs de test dupliqués en base : **À revalider** — donnée d’environnement, non vérifiable depuis le code versionné.
- Débordement horizontal mobile : **Fermé** — aucun défaut confirmé par l’audit source ; à couvrir par E2E visuel si le layout évolue.
- Absence d’Error Boundary : **Corrigé** — `frontend/src/components/ErrorBoundary.jsx` enveloppe l’application.
- `aggregateRating` statique : **Corrigé** — retiré tant que les avis réels ne sont pas reliés au JSON-LD.
- Indexation de `/book/:slug` : **Ouvert** — ni interdit dans `robots.txt`, ni présent dans le sitemap.
- SPA sans SSR/prerender : **Ouvert**.
- Dépendance Nominatim/OSRM publics : **Ouvert**.
- Divergence de validation téléphonique `0033` : **Ouvert** — le validateur Express l’accepte, le contrôleur d’inscription le refuse.
- `notifyDriver` contournant `EMAIL_ENABLED=false` : **Corrigé** — réutilisation de `emailService`.
- Absence de mode hors-ligne : **Décision à documenter** — aucun service worker n’est présent ; le choix métier reste à confirmer.

**Recommandations**

1. Ajouter les index lors de la migration PostgreSQL décrite dans `PLAN_DEPLOIEMENT_PROXMOX_POSTGRES.md`.
2. Valider les anomalies de scroll, les données de démonstration et les intégrations externes en staging.
3. Prioriser la convergence de validation téléphone, la réponse PDF asynchrone et la décision SEO de `/book/:slug`.
4. Finaliser la factorisation des formulaires et des dashboards.

**Priorité**
Élevée

**Statut**
En cours

**Source**
`AUDIT_COMPLET_2026-07-14.md`

---

## AES-A003

**Date**
2026-07-21 17:23

**Auteur**
Agent — vérification des correctifs AES-A002

**Domaine**
Sécurité, robustesse et qualité backend

**Résumé**
Les écarts techniques ciblés d’AES-A002 ont été corrigés dans le code. La génération PDF asynchrone était déjà en place avant cette intervention. La suite Jest ciblée a été ajoutée mais son exécution est en écart, bloquée par une limite d’usage de l’environnement d’exécution.

**Constats**

- Validation téléphonique incohérente pour le préfixe `0033` : **Corrigé** — une normalisation partagée convertit désormais `0033` en `+33` avant validation et persistance.
- JWT sans restriction explicite d’algorithme : **Corrigé** — les sessions utilisent exclusivement `HS256` à la signature et à la vérification.
- Politique de mot de passe divergente entre inscription et changement : **Corrigé** — les deux parcours exigent au moins huit caractères, une majuscule et un chiffre.
- Jokers `%`, `_` et caractère `\` non échappés dans les recherches `LIKE` : **Corrigé** — les recherches concernées utilisent désormais un échappement explicite, compatible SQLite et PostgreSQL.
- Génération du PDF avant réponse HTTP : **Corrigé avant cette intervention** — `createReservation` répond au client avant le traitement PDF et des notifications.
- Tests automatisés des nouveaux comportements : **En écart de vérification** — test ajouté dans `backend/tests/securityUtils.test.js`, exécution Jest non disponible dans l’environnement actuel.
- Vérification syntaxique et format du diff : **Vérifié** — `node --check` et `git diff --check` réussissent.

**Recommandations**

1. Exécuter `npm test -- --runInBand` dans `backend/` dès que l’environnement le permet.
2. Mettre à jour l’entrée AES-A002 lors de la prochaine revue pour refléter les constats corrigés.

**Priorité**
Moyenne

**Statut**
En cours

**Source**
AES-A002 et correctifs backend du 2026-07-21

---

## AES-A004

**Date**
2026-07-21 18:16

**Auteur**
Développeur — exécution de la vérification

**Domaine**
Qualité backend

**Résumé**
Validation différée des correctifs consignés dans AES-A003.

**Constats**

- Suite Jest backend : **Vérifié** — 6 suites et 31 tests passent avec `npm test -- --runInBand`.
- Avertissement `--forceExit` : **Ouvert** — un handle asynchrone reste actif après les tests ; il n’empêche pas la validation actuelle mais doit être diagnostiqué avec `--detectOpenHandles`.

**Recommandations**

1. Planifier un diagnostic ciblé des handles Jest avant de retirer `--forceExit`.

**Priorité**
Faible

**Statut**
En cours

**Source**
AES-A003
