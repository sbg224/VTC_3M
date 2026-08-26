/**
 * Index métier identifiés par l'audit AES-A002 (ia/AUDIT.md), absents de la
 * baseline. PostgreSQL n'indexe pas automatiquement les colonnes portant une
 * clé étrangère : sans ces index, le filtrage multi-tenant (`chauffeurId` sur
 * chaque requête chauffeur) et les listes d'administration parcourent la table
 * entière.
 *
 * Additive et idempotente : `CREATE INDEX IF NOT EXISTS` ne touche à aucune
 * donnée et peut être rejouée sans effet de bord.
 */
const INDEXES = [
  // Filtre dominant du tableau de bord chauffeur : toutes les requêtes de
  // reservationController portent `where: { chauffeurId }`, souvent complété
  // par `status`. Couvre aussi à elle seule la clé étrangère chauffeur_id.
  { name: 'reservations_chauffeur_status', table: 'reservations', columns: '"chauffeur_id", "status"' },
  // Listes d'administration et sélection publique des chauffeurs actifs
  // (driverController.getPublicList filtre sur status + role).
  { name: 'drivers_status_role', table: 'drivers', columns: '"status", "role"' },
  // Agrégation des avis par chauffeur + clé étrangère non indexée.
  { name: 'reviews_chauffeur_id', table: 'reviews', columns: '"chauffeurId"' },
  // Clé étrangère non indexée : jointure Contact -> Driver du module carte de visite.
  { name: 'contacts_driver_id', table: 'contacts', columns: '"driverId"' },
];

module.exports = {
  name: '20260823_add_business_indexes',
  up: async (sequelize, logger) => {
    for (const index of INDEXES) {
      await sequelize.query(
        `CREATE INDEX IF NOT EXISTS "${index.name}" ON "${index.table}" (${index.columns})`,
      );
      logger.info(`[MIGRATION] Index ${index.name} vérifié/créé sur ${index.table}.`);
    }
  },
};
