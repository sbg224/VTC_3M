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

## Vérifications runtime déjà faites
- Dépendances backend/frontend installées sur `projects/VTC_3M_local`.
- Backend démarré avec la vraie SQLite locale après correction de migration SQLite.
- Migrations réellement appliquées sur la base locale :
  - `drivers.gdprConsent`
  - `drivers.termsAccepted`
  - `reservations.reviewToken`
  - index unique `reservations_review_token_unique`
  - `reservations.termsAccepted`
- Frontend compilé avec succès via `npm run build`.
- Frontend dev démarré avec succès, mais sur `3001` car le port `3000` est déjà occupé par un autre service.
- Tests non destructifs validés :
  - route publique chauffeur OK,
  - simulation tarifaire OK,
  - validation backend réservation OK,
  - validation backend inscription chauffeur OK.

## Points encore à vérifier en runtime
- Réservation publique complète de bout en bout (sans casser les données métiers).
- Réservation chauffeur via `/book/:slug`.
- Login chauffeur actif / pending / suspendu avec comptes de test contrôlés.
- Génération PDF réelle.
- Émission réelle des emails/SMS.
- Avis client via `reviewToken`.

## Risques / dette restante
- Le contenu juridique doit être **revalidé métier/juridique** avant production finale.
- La table `drivers_backup` existe encore dans la SQLite locale : à documenter ou nettoyer plus tard.
- Il reste à vérifier que les services externes (mail, SMS, Stripe, PDF) fonctionnent réellement avec la configuration locale.
- Le port `3000` attendu par Vite et `FRONTEND_URL=http://localhost:3000` est déjà occupé par un autre service (`uvicorn`) sur cette machine. Tant que ce conflit n'est pas réglé, les liens frontend générés par le backend risquent de viser le mauvais service en local.
- Le premier essai de migration a révélé une contrainte SQLite importante : impossible d'ajouter une colonne `UNIQUE` directement via `ALTER TABLE ... ADD COLUMN`. Correctif appliqué en séparant ajout de colonne et création d'index unique.

## Prochaine étape recommandée
1. Décider quoi faire du conflit de port `3000` (libérer 3000 ou assumer un autre port local et ajuster `FRONTEND_URL`).
2. Tester les parcours critiques de bout en bout avec prudence sur les services externes.
3. Corriger les derniers écarts runtime.
4. Préparer ensuite le déploiement.
