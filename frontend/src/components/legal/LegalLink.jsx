import { Link } from 'react-router-dom';
import { LEGAL_DOCUMENTS } from './legalDocuments';
import { useLegalModal } from './LegalModalContext';

// Lien vers un document légal. Le clic ouvre la modale, mais l'élément reste un
// <a href> réel pointant vers la page canonique : Ctrl/⌘+clic, ouverture dans un
// nouvel onglet, « copier l'adresse du lien » et les robots d'indexation
// continuent de fonctionner. Le comportement est identique partout, y compris
// depuis la page canonique du document. Hors provider, le lien navigue.
export default function LegalLink({ documentKey, className, style, children }) {
  const legalModal = useLegalModal();
  const doc = LEGAL_DOCUMENTS[documentKey];

  if (!doc) return null;

  const handleClick = (event) => {
    if (!legalModal) return;
    // Laisser le navigateur gérer les clics « ouvrir ailleurs ».
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    legalModal.openLegal(documentKey);
  };

  return (
    <Link to={doc.path} className={className} style={style} onClick={handleClick}>
      {children ?? doc.label}
    </Link>
  );
}
