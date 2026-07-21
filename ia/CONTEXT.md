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

« 3M Drive » (le code et le README utilisent encore « VTC 3M »). L'entreprise qui opère le produit s'appelle désormais AHADI (anciennement « 3M Services 31»). Un renommage du produit en « AHADI Transport » sous une ombrelle « AHADI Groupe » est envisagé mais non tranché à ce jour — le nom « 3M Drive » est conservé en attendant une décision sur le nouveau logo.

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
* Réservation en ligne (formulaire client, notification email/SMS, génération PDF)
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
* Base de données SQLite par défaut, bascule automatique vers PostgreSQL si `DATABASE_URL` est défini ; pas de Sequelize-CLI, un runner de migration interne (`db/runMigrations.js`) gère les évolutions de schéma sur les tables existantes.
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

Moyen terme

* Migration de SQLite vers PostgreSQL auto-hébergé sur VM Proxmox (décision déjà prise, non encore mise en œuvre — voir `PLAN_DEPLOIEMENT_PROXMOX_POSTGRES.md`).
* Auto-hébergement d'OSRM une fois l'hébergement de production en place.

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
