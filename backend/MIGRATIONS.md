# Migrations de base de données

`src/db/runMigrations.js` et son registre ordonné `src/db/migrations/index.js`
constituent l'unique mécanisme de migration du projet. `sequelize.sync()` n'est
pas utilisé.

## Base vide

Au démarrage, si aucune table applicative n'existe, le runner crée
`schema_migrations`, applique `00000000_initial_schema`, puis les migrations
historiques non encore inscrites.

## Base existante

Si des tables applicatives existent sans baseline inscrite, le démarrage compare
strictement tables, colonnes, types, nullabilité, clés primaires, valeurs par
défaut, index et clés étrangères avec les modèles. Toute divergence arrête le
processus. Même si le schéma est compatible, le démarrage s'arrête sans écrire la
baseline.

Après revue explicite de la cible et sauvegarde opérateur, la seule commande
prévue pour inscrire la baseline d'une base existante est :

```bash
CONFIRM_BASELINE_EXISTING=I_HAVE_VERIFIED_THE_TARGET_DATABASE npm run db:baseline-existing
```

Cette commande ne crée, ne supprime et n'altère aucune table applicative. Elle
refuse une base vide, refuse une baseline déjà inscrite, vérifie d'abord le
schéma complet, puis inscrit uniquement la migration initiale. Elle ne doit
jamais servir à valider les migrations sur une base de production.
