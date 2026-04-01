/**
 * Hook GSAP robuste pour composants React.
 *
 * - Crée un contexte GSAP scopé (scope optionnel = ref vers le container DOM)
 * - ctx.revert() nettoie tweens + ScrollTriggers + listeners GSAP
 * - Stable sous React StrictMode (double invocation neutralisée)
 */
import { useEffect, useRef } from 'react';
import { gsap } from './gsap';

/**
 * @param {Function} animateFn  – Fonction d'animation à exécuter dans le contexte GSAP
 * @param {React.RefObject} [scopeRef] – Ref optionnelle pour scoper les querySelectorAll
 * @param {Array} [deps]        – Dépendances React (comme useEffect)
 */
export function useGsapInit(animateFn, scopeRef, deps = []) {
  const ctxRef = useRef(null);

  useEffect(() => {
    // Scope : élément DOM si fourni, sinon contexte global
    const scope = scopeRef?.current ?? undefined;

    ctxRef.current = gsap.context(() => {
      animateFn();
    }, scope);

    return () => {
      // Revert annule tous tweens + ScrollTriggers créés dans ce contexte
      ctxRef.current?.revert();
      ctxRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
