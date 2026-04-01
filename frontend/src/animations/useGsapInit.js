/**
 * Hook React pour encapsuler les animations GSAP
 * Crée un contexte GSAP et le nettoie au démontage du composant
 */
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export function useGsapInit(animateFn, deps = []) {
  const ctx = useRef(null);

  useEffect(() => {
    // Crée un contexte scoped pour un nettoyage propre
    ctx.current = gsap.context(() => {
      animateFn();
    });

    return () => {
      // Nettoyage : annule toutes les animations et ScrollTriggers du contexte
      ctx.current?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
