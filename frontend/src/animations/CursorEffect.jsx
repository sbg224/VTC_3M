/**
 * Curseur personnalisé fluide – 3M Drive
 *
 * Architecture :
 * - quickTo() pour x/y uniquement — jamais touché par les handlers hover
 * - Hover géré par classes CSS uniquement — zéro conflit GSAP
 * - Ripple géré indépendamment
 * - Pas d'opacity:0 initial → pas de race condition au mount
 * - window pour mousemove (coverage maximale, hors iframes)
 */
import { useEffect, useRef } from 'react';
import { gsap } from './gsap';

export default function CursorEffect() {
  const dotRef      = useRef(null);
  const followerRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(hover: none)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const dot      = dotRef.current;
    const follower = followerRef.current;
    if (!dot || !follower) return;

    // ── Position initiale hors-écran (évite le saut depuis 0,0) ─────────────
    // On utilise x/y via GSAP uniquement — jamais left/top CSS
    gsap.set([dot, follower], {
      xPercent: -50,
      yPercent: -50,
      x: -200,
      y: -200,
    });

    // ── quickTo : une instance par axe, réutilisée en boucle ────────────────
    // JAMAIS de overwrite sur ces tweens — ils doivent survivre indéfiniment
    const xDot      = gsap.quickTo(dot,      'x', { duration: 0.06, ease: 'none' });
    const yDot      = gsap.quickTo(dot,      'y', { duration: 0.06, ease: 'none' });
    const xFollower = gsap.quickTo(follower, 'x', { duration: 0.35, ease: 'power2.out' });
    const yFollower = gsap.quickTo(follower, 'y', { duration: 0.35, ease: 'power2.out' });

    // ── Tracking souris ──────────────────────────────────────────────────────
    const onMove = (e) => {
      xDot(e.clientX);
      yDot(e.clientY);
      xFollower(e.clientX);
      yFollower(e.clientY);
    };

    // ── Hover : classes CSS uniquement (aucun tween GSAP sur dot/follower) ───
    const HOVER_SEL = 'a, button, .btn, .feature-card, .gallery-item, .destination-card';

    const onOver = (e) => {
      if (e.target.closest(HOVER_SEL)) {
        dot.classList.add('cursor-hover');
        follower.classList.add('cursor-hover');
      }
    };
    const onOut = (e) => {
      if (e.target.closest(HOVER_SEL)) {
        dot.classList.remove('cursor-hover');
        follower.classList.remove('cursor-hover');
      }
    };

    // ── Ripple au clic ───────────────────────────────────────────────────────
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
        left:   `${e.clientX - rect.left - size / 2}px`,
        top:    `${e.clientY - rect.top  - size / 2}px`,
      });
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    };

    // ── Abonnement ───────────────────────────────────────────────────────────
    window.addEventListener('mousemove', onMove,   { passive: true });
    window.addEventListener('mouseover', onOver,   { passive: true });
    window.addEventListener('mouseout',  onOut,    { passive: true });
    window.addEventListener('click',     onClick);

    // ── Cleanup propre ───────────────────────────────────────────────────────
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
      window.removeEventListener('mouseout',  onOut);
      window.removeEventListener('click',     onClick);
      // Tuer les tweens quickTo pour libérer la mémoire
      gsap.killTweensOf(dot);
      gsap.killTweensOf(follower);
    };
  }, []);

  return (
    <>
      <div ref={dotRef}      className="custom-cursor"           aria-hidden="true" />
      <div ref={followerRef} className="custom-cursor--follower" aria-hidden="true" />
    </>
  );
}
