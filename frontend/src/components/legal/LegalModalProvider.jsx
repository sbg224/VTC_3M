import { useCallback, useMemo, useState } from 'react';
import { LegalModalContext } from './LegalModalContext';
import LegalModal from './LegalModal';

// Monté dans AppLayout : rend la modale légale accessible depuis n'importe
// quelle page publique (footer, formulaires) sans faire descendre de props.
export default function LegalModalProvider({ children }) {
  const [documentKey, setDocumentKey] = useState(null);

  const openLegal = useCallback((key) => setDocumentKey(key), []);
  const closeLegal = useCallback(() => setDocumentKey(null), []);

  const value = useMemo(() => ({ openLegal, closeLegal }), [openLegal, closeLegal]);

  return (
    <LegalModalContext.Provider value={value}>
      {children}
      {documentKey && <LegalModal documentKey={documentKey} onClose={closeLegal} />}
    </LegalModalContext.Provider>
  );
}
