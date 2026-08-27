import { Suspense, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { LEGAL_DOCUMENTS } from './legalDocuments';

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Coquille de modale réutilisée par les trois documents légaux. Le contenu
// affiché est strictement celui de la page correspondante (voir legalDocuments.js) ;
// la page reste accessible par son URL, rappelée en pied de modale.
export default function LegalModal({ documentKey, onClose }) {
  const doc = LEGAL_DOCUMENTS[documentKey];
  const dialogRef = useRef(null);
  const bodyRef = useRef(null);
  const closeRef = useRef(null);

  // Verrouillage du défilement de l'arrière-plan + restitution du focus au
  // déclencheur (lien du footer, case à cocher d'un formulaire…) à la fermeture.
  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
    closeRef.current?.focus();

    return () => {
      body.style.overflow = previousOverflow;
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, []);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;

    // Piège à focus : tant que la modale est ouverte, la tabulation reste à
    // l'intérieur du dialogue.
    const focusables = dialogRef.current?.querySelectorAll(FOCUSABLE);
    if (!focusables?.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Passer d'un document à l'autre (renvoi interne des mentions légales vers la
  // politique de confidentialité) ne doit pas conserver la position de lecture.
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [documentKey]);

  if (!doc) return null;

  const { Content, path, title, intro } = doc;
  const titleId = `legal-modal-title-${documentKey}`;

  // mousedown plutôt que click : une sélection de texte relâchée hors de la
  // boîte ne doit pas fermer la modale.
  const handleOverlayMouseDown = (event) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div className="legal-modal-overlay" onMouseDown={handleOverlayMouseDown}>
      <div
        className="legal-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialogRef}
      >
        <div className="legal-modal-header">
          <div className="legal-modal-heading">
            <h2 className="legal-modal-title" id={titleId}>{title}</h2>
            {intro && <p className="legal-modal-intro">{intro}</p>}
          </div>
          <button
            type="button"
            className="legal-modal-close"
            onClick={onClose}
            aria-label="Fermer"
            ref={closeRef}
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        <div className="legal-modal-body" ref={bodyRef}>
          <Suspense fallback={<p className="legal-modal-loading">Chargement du document…</p>}>
            <Content />
          </Suspense>
        </div>

        <div className="legal-modal-footer">
          <Link to={path} className="legal-modal-permalink" onClick={onClose}>
            Ouvrir la page complète
          </Link>
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
