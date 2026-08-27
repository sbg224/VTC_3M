import { lazy } from 'react';

// Source unique des trois documents légaux : chemin canonique, libellés et
// composant de contenu. Les pages (/mentions-legales, /cgu, /politique-rgpd) et
// les modales s'appuient sur ce registre — le texte n'existe qu'à un seul
// endroit, dans les composants *Content.
//
// Les contenus sont chargés en différé : ce registre est importé par le footer,
// donc présent dans le bundle initial, alors que le texte légal (~600 lignes)
// n'a aucune raison d'y figurer tant qu'aucune modale n'est ouverte.

export const LEGAL_DOCUMENTS = {
  'mentions-legales': {
    path: '/mentions-legales',
    label: 'Mentions légales',
    title: 'Mentions légales',
    intro:
      "Conformément aux articles 6-III et 19 de la Loi n° 2004-575 du 21 juin 2004 " +
      "pour la Confiance dans l'Économie Numérique (LCEN).",
    Content: lazy(() => import('./MentionsLegalesContent')),
  },
  cgu: {
    path: '/cgu',
    label: 'CGU',
    title: "Conditions générales d'utilisation",
    intro:
      "Les présentes CGU encadrent l'accès et l'utilisation du site 3M Drive, " +
      "notamment le formulaire de réservation, l'espace chauffeur et les services associés.",
    Content: lazy(() => import('./ConditionsGeneralesContent')),
  },
  'politique-rgpd': {
    path: '/politique-rgpd',
    label: 'Politique de confidentialité',
    title: 'Politique de confidentialité & RGPD',
    intro:
      "3M Drive s'engage à protéger vos données personnelles conformément au " +
      "Règlement Général sur la Protection des Données (RGPD — UE 2016/679) " +
      "et à la loi Informatique et Libertés.",
    Content: lazy(() => import('./PolitiqueRGPDContent')),
  },
};

export const LEGAL_DOCUMENT_KEYS = Object.keys(LEGAL_DOCUMENTS);
