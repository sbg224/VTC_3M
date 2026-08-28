CONTEXT.md

AI Engineering System (AES)

Structure : issue d'AES v1.1.0

Statut : 🟢 Vivant

Responsable : Développeur

Modification par un agent : Proposition uniquement (validation obligatoire)

Documents liés :

* SYSTEM.md
* STACK.md
* ARCHITECTURE.md
* DECISIONS.md
* AUDIT.md

⸻

1. Objectif

Ce document présente le contexte global du projet.

Il permet à un développeur ou à un agent IA de comprendre rapidement le projet, ses objectifs, son périmètre et ses contraintes.

Il constitue le point d'entrée fonctionnel du projet.

⸻

2. Présentation du projet

Nom

« 3M Drive » est le nom commercial affiché aux clients. La société qui exploite le produit est AHADI Services, société par actions simplifiée à associé unique au capital de 500,00 €, immatriculée 108 767 393 R.C.S. Toulouse (anciennement « 3M Services 31 »). Les replis « VTC 3M » qui subsistaient dans le code ont été remplacés par « 3M Drive » ; l'identité légale complète n'est plus écrite en dur mais portée par les variables `COMPANY_*` (voir `backend/.env.example`). Un renommage du produit en « AHADI Transport » sous une ombrelle « AHADI Groupe » est envisagé mais non tranché à ce jour — le nom « 3M Drive » est conservé en attendant une décision sur le nouveau logo.

Description

Plateforme web pour chauffeurs VTC indépendants : vitrine publique de l'entreprise, réservation en ligne pour les clients (formulaire, notifications email/SMS, génération de PDF), tableau de bord chauffeur (réservations, statistiques, factures), tableau de bord administrateur (gestion des chauffeurs, tarification, comptabilité/commissions), abonnement payant via Stripe (essai gratuit puis abonnement mensuel/annuel), avis clients, CRM transverse, et carte de visite numérique par chauffeur.

Objectifs

Fournir une solution SaaS permettant à plusieurs chauffeurs VTC indépendants de gérer leur activité (réservations, facturation, présence en ligne) moyennant un abonnement, sous l'administration d'une plateforme commune opérée par AHADI.

Public cible

* Chauffeurs VTC indépendants (utilisateurs abonnés de la plateforme)
* Leurs clients particuliers (réservation de trajets)
* L'administrateur de la plateforme (AHADI)

État du projet

Développement actif, en phase de pré-production. Le backlog de dette technique P3 (12+ correctifs qualité) est clos ; le chantier de refonte visuelle (rebranding AHADI) est en cours (branche `feat/driver-card-redesign`). Un CHECKLIST_PREPROD.md est déjà rédigé en vue du passage en production, qui n'a pas encore eu lieu.

⸻

3. Fonctionnalités principales

* Vitrine entreprise (accueil, services, témoignages, contact)
* Réservation en ligne, en deux modes tarifés : **transfert** d'un point à un autre, au kilomètre, avec calcul d'itinéraire ; **mise à disposition** à l'heure, avec forfait kilométrique inclus et supplément au-delà. Notification email/SMS et génération de PDF dans les deux cas.
* Facturation : numérotation légale en série continue (`AH-2026-000001`), ventilation HT/TVA au taux propre à chaque mode, facture PDF envoyée au client à la validation de la course.
* Authentification sécurisée (JWT en cookie httpOnly, bcrypt)
* Tableau de bord chauffeur (réservations, statistiques, validation de course, facturation PDF)
* Tableau de bord administrateur (gestion des chauffeurs, statistiques globales, tarification)
* Abonnement/facturation Stripe (essai gratuit, statuts trial/active/expired/suspended)
* Comptabilité (relevés par chauffeur, commission, export PDF)
* CRM transverse (gestion clients)
* Avis clients (par réservation, via lien à token)
* Carte de visite numérique par chauffeur (page publique, vCard, suivi d'événements)
* Conformité RGPD (mentions légales, politique RGPD, CGU, consentement au compte)

⸻

4. Contraintes

Techniques

* Monorepo sans outillage de workspace partagé : `backend/` et `frontend/` sont deux applications Node indépendantes (installation et lancement séparés).
* En développement, SQLite reste le défaut et `DATABASE_URL` sélectionne PostgreSQL. La production exige PostgreSQL et les tests exigent une `DATABASE_URL_TEST` locale sûre ou SQLite en mémoire. Le runner interne versionné (`db/runMigrations.js` + `db/migrations/`) est l'unique autorité de schéma ; `sequelize.sync()` n'est plus utilisé.
* La base PostgreSQL de production est **opérationnelle sur Supabase** et à jour des migrations (voir ADR-002). Une conséquence pratique : `src/models/index.js` charge `dotenv` à son import et rétablit `DATABASE_URL` depuis `backend/.env`. Tout script de test de migration qui passe par ce module atteint donc la base réelle, y compris en tentant de la rediriger vers SQLite — un rejeu à blanc doit construire sa propre instance Sequelize sans importer `src/models`.
* Le vérificateur strict de schéma (`verifyExistingSchema`) est calibré pour PostgreSQL et produit de nombreux faux positifs sous SQLite (ENUM lus en TEXT, index de clé primaire, clés étrangères). Il ne s'exécute que sur le chemin « base non baselinée » et ne bloque donc pas le démarrage courant. Deux faux positifs subsistent aussi sous PostgreSQL : `describeTable` renvoie `NUMERIC` sans précision, incompatible avec `DECIMAL(10,2)` attendu, et un défaut entier valant zéro est normalisé en booléen.
* Dépendance à un serveur public de démonstration OSRM pour le calcul d'itinéraire — dette technique connue (voir Évolution).

Réglementaires

* RGPD : consentement obligatoire, mentions légales, politique de confidentialité, CGU.

Organisationnelles

* Développeur unique (Mohamed Bah), assisté par Claude Code.

Non trouvé / à confirmer

* Contraintes budgétaires : aucune information trouvée dans le code ou la documentation existante.

⸻

5. Règles métier

* Statuts chauffeur : `pending` (en attente de validation admin) → `trial` / `active` / `expired` / `suspended`. Bascule automatique `trial` → `expired` à l'échéance de l'essai.
* L'administrateur de la plateforme (`role: admin`) contourne entièrement les règles d'abonnement, n'a pas de page publique et n'a pas de plan payant.
* Commission par chauffeur (`commissionRate`, 20 % par défaut) utilisée pour la comptabilité de la plateforme.
* Un chauffeur nouvellement inscrit reste `pending` jusqu'à validation par l'administrateur avant de pouvoir se connecter.
* Les PDF de réservation/facture ne sont jamais accessibles publiquement : uniquement par le chauffeur propriétaire, authentifié.
* Les identifiants du compte administrateur par défaut (documentés publiquement dans le README) sont bloqués en production tant que des valeurs réelles n'ont pas été définies.
* Les pages publiques par chauffeur (`/book/:slug`, `/contact/:slug`) sont volontairement désindexées, leur contenu étant quasiment dupliqué d'un chauffeur à l'autre.
* La société est **assujettie à la TVA** — elle n'est pas en franchise en base. Le taux dépend de la nature réelle de la prestation, pas de l'activité : un **transfert** est un contrat de transport de voyageurs, au taux réduit de **10 %** (art. 279 b quater du CGI) ; une **mise à disposition**, facturée à l'heure et sans trajet prédéfini, est assimilée à une location de véhicule avec chauffeur et relève du taux normal de **20 %** (art. 278 du CGI). N° de TVA intracommunautaire : `FR11 108767393`.
* Le prix convenu avec le client est un prix **TTC** : la facture en extrait la base HT (`TTC ÷ (1 + taux)`) au lieu d'ajouter la taxe par-dessus, afin que le total facturé reste le montant accepté à la réservation.
* Mise à disposition : **2 heures minimum facturables** — toute réservation plus courte est facturée à cette durée — et **25 kilomètres inclus par heure facturée**. Au-delà du forfait, les kilomètres sont facturés au tarif kilométrique du mode transfert. Le supplément n'est calculable qu'après la course, faute de destination connue à la réservation : le chauffeur relève le kilométrage à la validation. Ces trois paramètres sont pilotables depuis l'administration.
* Les factures portent une série chronologique **continue et sans rupture** (art. 242 nonies A du CGI), distincte des numéros de réservation. Le numéro n'est attribué qu'à la facturation : une course annulée n'en consomme aucun.

⸻

6. Dépendances fonctionnelles

* Stripe — monétisation de la plateforme (abonnement des chauffeurs, essai gratuit puis abonnement payant).
* SMTP (Gmail par défaut, via Nodemailer) — confirmation de réservation, notifications diverses.
* Twilio (SMS) — notification optionnelle lors d'une nouvelle réservation ; désactivée silencieusement si non configurée.
* API Adresse (Base Adresse Nationale, data.gouv.fr) — géocodage des adresses de départ/arrivée.
* OSRM (serveur de démonstration public) — calcul de distance/itinéraire pour la tarification automatique ; dépendance externe non maîtrisée à ce stade.

⸻

7. Évolution

Court terme

* Redesign des cartes chauffeurs sur la page d'accueil (branche en cours), suite du chantier de rebranding AHADI.
* Décision produit en attente : afficher publiquement tous les chauffeurs inscrits dès qu'il n'y en a qu'un ou deux.
* Décision en attente : conserver ou retirer la section « Une expérience premium » (équipements véhicule) de l'accueil.
* Rédaction de la documentation finale / passage README, prévue en dernière étape.
* Report assumé : `Reservation.arrivalAddress` reste `NOT NULL` et reçoit une chaîne vide en mise à disposition, faute de destination. `NULL` exprimerait plus justement cette absence, mais l'assouplir suppose un `changeColumn` — opération non additive, qui recrée la table sous SQLite. À reprendre lors du prochain chantier de schéma plutôt qu'isolément.
* Dette de test connue : le parcours de réservation en mise à disposition (choix du mode, durée, estimation affichée, envoi) n'a **aucun test end-to-end** — `cypress/e2e/reservation.cy.js` ne couvre que le transfert. Le backend est couvert unitairement (tarification horaire, supplément kilométrique, ventilation TVA, numérotation), mais pas le parcours client complet. À traiter dans une tâche dédiée aux tests.

Moyen terme

* Mode sombre fonctionnel sur le tableau de bord chauffeur et admin — chantier dédié, retiré des pages publiques lors de la refonte de l'accueil. Diagnostic déjà établi, à ne pas refaire : la bascule pose bien `data-theme` sur `<html>` et le persiste (amorçage sans clignotement dans `index.html`), mais **aucun token n'est redéfini par thème** — les 14 règles `[data-theme]` rapiècent des composants isolés (barre flottante, panneau mobile, `.features`) au lieu de basculer la palette. Mesuré : 3 propriétés sur 14 changent, dont 2 visibles. S'y ajoutent **578 valeurs de couleur écrites en dur hors du bloc de tokens** dans `global.css` (257 distinctes), et aucune prise en charge de `prefers-color-scheme`. Le chantier consiste d'abord à ramener ces couleurs dans le système de tokens, ensuite seulement à définir les deux palettes.

* Auto-hébergement d'OSRM une fois l'hébergement de production stabilisé — le calcul d'itinéraire repose encore sur le serveur public de démonstration.
* Numérotation de facture : le compteur est en place et testé, mais aucune facture réelle n'a encore été émise. Contrôler la continuité de la série après les premières courses facturées.

**Déjà réalisé** (conservé ici pour éviter que ces points ne soient relancés) : la migration vers PostgreSQL est **faite**, sur Supabase managé et non sur VM Proxmox — ADR-001 prévoyait Proxmox, ADR-002 l'a remplacé par Supabase, ADR-003 a séparé les hébergements entre Render (backend) et Vercel (frontend). Le document `PLAN_DEPLOIEMENT_PROXMOX_POSTGRES.md` décrit une infrastructure abandonnée et **ne doit plus servir de référence**.

Long terme

* Renommage éventuel du produit en « AHADI Transport » sous l'ombrelle AHADI Groupe — non tranché à ce jour.
* Non trouvé / à confirmer : feuille de route long terme au-delà de ce renommage.

⸻

8. Mise à jour

Ce document est vivant.

Les agents doivent signaler toute information devenue obsolète ou incomplète.

Toute mise à jour reste soumise à la validation du développeur.

⸻

9. Références

Pour compléter la compréhension du projet, consulter également :

* SYSTEM.md
* STACK.md
* ARCHITECTURE.md
* DECISIONS.md
* AUDIT.md
