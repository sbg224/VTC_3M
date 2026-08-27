import { createContext, useContext } from 'react';

// Contexte séparé du provider pour que les composants qui consomment seulement
// le hook (footer, formulaires, contenus légaux) n'importent pas la modale.
export const LegalModalContext = createContext(null);

// Renvoie { openLegal, closeLegal }, ou null hors d'un LegalModalProvider —
// les liens légaux retombent alors sur une navigation classique.
export function useLegalModal() {
  return useContext(LegalModalContext);
}
