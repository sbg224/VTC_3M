# Audit opérationnel VTC_3M — 2026-04-12

## Objectif
Rendre le code réellement opérationnel avant déploiement, en priorisant :
1. conformité minimale front/back,
2. formulaires critiques,
3. schéma base de données et migrations sans casse.

## Constats initiaux

### Légal / conformité
- Les pages **Mentions légales** et **Politique RGPD** existent déjà.
- Il manquait une vraie page **CGU** accessible depuis l'application.
- Un lien de confidentialité côté réservation pointait vers une route incorrecte.
- Les formulaires critiques ne stockaient pas correctement les acceptations légales.

### Formulaires
- Le backend de réservation **forçait `gdprConsent: true`**, même si le client n'avait rien coché.
- Il n'y avait pas de validation serveur suffisante sur les réservations.
- Le formulaire d'inscription chauffeur ne demandait pas explicitement l'acceptation RGPD + CGU.
- Le parcours d'inscription était incohérent avec le statut `pending` annoncé.

### Base / migrations
- La base SQLite locale ne contenait pas encore certaines colonnes attendues par le code actuel.
- Cas critique identifié : `reviewToken` était utilisé par les contrôleurs d'avis, mais pas déclaré dans le modèle Sequelize.
- Les migrations étaient gérées inline au démarrage dans `backend/src/index.js`, sans suivi d'exécution structuré.

## Correctifs déjà appliqués

### Frontend
- Ajout de la page `ConditionsGenerales.jsx`.
- Ajout de la route `/cgu`.
- Ajout d'une redirection `/politique-confidentialite` -> `/politique-rgpd`.
- Ajout du lien **CGU** dans le footer.
- Correction du lien cassé vers la politique de confidentialité dans `Reservation.jsx`.
- Ajout d'une case obligatoire **CGU** dans :
  - `Reservation.jsx`
  - `BookingPage.jsx`
  - `Register.jsx`
- Remontée des erreurs de validation backend dans les formulaires de réservation.

### Backend
- Ajout du champ `reviewToken` dans le modèle `Reservation`.
- Ajout du champ `termsAccepted` dans le modèle `Reservation`.
- Ajout des champs `gdprConsent` et `termsAccepted` dans le modèle `Driver`.
- Renforcement de `createReservation` :
  - validation serveur des champs requis,
  - validation email/téléphone,
  - obligation RGPD,
  - obligation CGU,
  - suppression du forçage artificiel du consentement.
- Renforcement de `register` :
  - validation serveur des champs,
  - obligation RGPD,
  - obligation CGU,
  - suppression du token renvoyé à l'inscription `pending`.
- Renforcement de `login` : blocage des comptes `pending` et `suspended`.

### Migrations
- Création d'un runner de migrations idempotent : `backend/src/db/runMigrations.js`
- Ajout d'une table `schema_migrations`.
- Migrations prévues/appliquées par le runner :
  - `drivers.commissionRate`
  - `drivers.gdprConsent`
  - `drivers.termsAccepted`
  - `reservations.reviewToken`
  - `reservations.termsAccepted`
- Remplacement du bricolage inline dans `backend/src/index.js` par le runner dédié.

## Points encore à vérifier en runtime
- Installer les dépendances backend/frontend sur la copie locale exécutable.
- Démarrer le projet avec le vrai `.env` et la vraie SQLite locale.
- Vérifier l'application réelle des migrations sur `backend/database.sqlite`.
- Tester les parcours complets :
  - réservation publique,
  - réservation chauffeur via `/book/:slug`,
  - inscription chauffeur,
  - login chauffeur actif / pending / suspendu,
  - génération PDF,
  - émission d'emails/SMS,
  - avis client via `reviewToken`.

## Risques / dette restante
- Le contenu juridique doit être **revalidé métier/juridique** avant production finale.
- La table `drivers_backup` existe encore dans la SQLite locale : à documenter ou nettoyer plus tard.
- Il reste à vérifier que les services externes (mail, SMS, Stripe, PDF) fonctionnent réellement avec la configuration locale.

## Prochaine étape recommandée
1. Installer les dépendances sur `projects/VTC_3M_local`.
2. Lancer backend + frontend.
3. Laisser les migrations s'exécuter.
4. Tester les parcours critiques de bout en bout.
5. Corriger les écarts restants, puis préparer le déploiement.
