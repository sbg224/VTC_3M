// Partagé entre CrmView et Dashboard (et désormais tout autre composant du
// dossier dashboard/) — un seul format de date jj/mm/aaaa dans toute l'appli.
export const formatDate = (d) => d
  ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  : '—';
