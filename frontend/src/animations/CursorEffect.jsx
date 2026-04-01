/**
 * Curseur personnalisé – 3M Drive
 *
 * Règles strictes appliquées :
 * - GSAP quickTo() gère x/y (jamais style.left/top ni CSS transform)
 * - xPercent/yPercent centrent les éléments (remplace CSS translate(-50%,-50%))
 * - Position initiale = centre de l'écran pour éviter le glissement depuis (0,0)
 * - Un seul addEventListener mousemove, retiré dans le cleanup
 * - Hover : gsap.to() sur width/height, pas de classe CSS avec transition:transform
 * - Désactivé sur écrans tactiles (hover:none) et prefers-reduced-motion
 */
import { useEffect, useRef } from 'react';
import { gsap } from './gsap';

export default function CursorEffect() {
  const dotRef      = useRef(null);
  const followerRef = useRef(null);

  useEffect(() => {
    // Désactivé sur tactile ou si l'utilisateur préfère moins de mouvements
    if (window.matchMedia('(hover: none)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const dot      = dotRef.current;
    const follower = followerRef.current;
    if (!dot || !follower) return;

    // ── Initialisation de la position AVANT tout mousemove ──────────────────
    // Sans ça, le follower "glisse" depuis (0,0) lors du premier déplacement
    const startX = window.innerWidth  / 2;
    const startY = window.innerHeight / 2;

    // xPercent/yPercent centrent les éléments sans CSS transform
    gsap.set([dot, follower], {
      xPercent: -50,
      yPercent: -50,
      x: startX,
      y: startY,
      opacity: 0,           // cachés jusqu'au premier mouvement souris
    });

    // ── quickTo : une instance par axe/élément, réutilisée à chaque move ────
    // Évite la création d'un nouveau tween à chaque événement mousemove
    const xDot      = gsap.quickTo(dot,      'x', { duration: 0.08, ease: 'none' });
    const yDot      = gsap.quickTo(dot,      'y', { duration: 0.08, ease: 'none' });
    const xFollower = gsap.quickTo(follower, 'x', { duration: 0.45, ease: 'power3.out' });
    const yFollower = gsap.quickTo(follower, 'y', { duration: 0.45, ease: 'power3.out' });

    let visible = false;

    // ── Listener unique mousemove ────────────────────────────────────────────
    const onMove = (e) => {
      xDot(e.clientX);
      yDot(e.clientY);
      xFollower(e.clientX);
      yFollower(e.clientY);

      // Affiche les curseurs au premier mouvement détecté
      if (!visible) {
        gsap.to([dot, follower], { opacity: 1, duration: 0.3, overwrite: true });
        visible = true;
      }
    };

    // ── Hover sur éléments interactifs ───────────────────────────────────────
    // gsap.to() sur width/height uniquement – pas de conflit avec x/y
    const onEnter = () => {
      gsap.to(dot,      { scale: 0,  duration: 0.2, overwrite: true });
      gsap.to(follower, { width: 52, height: 52, opacity: 0.2, duration: 0.3, overwrite: true });
    };
    const onLeave = () => {
      gsap.to(dot,      { scale: 1,  duration: 0.2, overwrite: true });
      gsap.to(follower, { width: 36, height: 36, opacity: 0.5, duration: 0.3, overwrite: true });
    };

    // Délègue les hover via le document (gère les éléments ajoutés dynamiquement)
    const onDocEnter = (e) => {
      if (e.target.closest('a, button, .btn, .feature-card, .gallery-item')) onEnter();
    };
    const onDocLeave = (e) => {
      if (e.target.closest('a, button, .btn, .feature-card, .gallery-item')) onLeave();
    };

    // ── Effet ripple au clic ─────────────────────────────────────────────────
    const onClick = (e) => {
      const btn = e.target.closest('.btn');
      if (!btn) return;
      const rect   = btn.getBoundingClientRect();
      const size   = Math.max(rect.width, rect.height) * 2;
      const ripple = document.createElement('span');
      ripple.className = 'btn-ripple';
      Object.assign(ripple.style, {
        width:  `${size}px`,
        height: `${size}px`,
        left:   `${e.clientX - rect.left  - size / 2}px`,
        top:    `${e.clientY - rect.top   - size / 2}px`,
      });
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    };

    // Abonnement des listeners
    document.addEventListener('mousemove',   onMove,     { passive: true });
    document.addEventListener('mouseover',   onDocEnter, { passive: true });
    document.addEventListener('mouseout',    onDocLeave, { passive: true });
    document.addEventListener('click',       onClick);

    // ── Cleanup complet au démontage ─────────────────────────────────────────
    return () => {
      document.removeEventListener('mousemove',   onMove);
      document.removeEventListener('mouseover',   onDocEnter);
      document.removeEventListener('mouseout',    onDocLeave);
      document.removeEventListener('click',       onClick);
      gsap.killTweensOf([dot, follower]);
    };
  }, []);

  return (
    <>
      <div className="custom-cursor"            ref={dotRef}      aria-hidden="true" />
      <div className="custom-cursor--follower"  ref={followerRef} aria-hidden="true" />
    </>
  );
}
