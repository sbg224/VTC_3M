/**
 * Curseur personnalisé fluide + effet ripple au clic sur les boutons
 * Désactivé automatiquement sur les écrans tactiles
 */
import { useEffect, useRef } from 'react';

export default function CursorEffect() {
  const dotRef      = useRef(null);
  const followerRef = useRef(null);

  useEffect(() => {
    // Pas de curseur custom sur tactile
    if (window.matchMedia('(hover: none)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const dot      = dotRef.current;
    const follower = followerRef.current;
    if (!dot || !follower) return;

    let mouseX = 0, mouseY = 0;
    let followerX = 0, followerY = 0;
    let raf;

    const onMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      // Le point suit instantanément
      dot.style.left = `${mouseX}px`;
      dot.style.top  = `${mouseY}px`;
    };

    // Le follower suit avec inertie via requestAnimationFrame
    const loop = () => {
      followerX += (mouseX - followerX) * 0.12;
      followerY += (mouseY - followerY) * 0.12;
      follower.style.left = `${followerX}px`;
      follower.style.top  = `${followerY}px`;
      raf = requestAnimationFrame(loop);
    };

    // Agrandir le follower au survol d'un lien ou bouton
    const onEnter = () => follower.classList.add('custom-cursor--hover');
    const onLeave = () => follower.classList.remove('custom-cursor--hover');

    document.querySelectorAll('a, button, .btn, .feature-card, .gallery-item')
      .forEach(el => {
        el.addEventListener('mouseenter', onEnter);
        el.addEventListener('mouseleave', onLeave);
      });

    // Effet ripple au clic sur les boutons
    const onClick = (e) => {
      const btn = e.target.closest('.btn');
      if (!btn) return;
      const rect   = btn.getBoundingClientRect();
      const size   = Math.max(rect.width, rect.height) * 2;
      const ripple = document.createElement('span');
      ripple.className = 'btn-ripple';
      ripple.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${e.clientX - rect.left - size / 2}px;
        top: ${e.clientY - rect.top - size / 2}px;
      `;
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('click', onClick);
    raf = requestAnimationFrame(loop);

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('click', onClick);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div className="custom-cursor" ref={dotRef} aria-hidden="true" />
      <div className="custom-cursor custom-cursor--follower" ref={followerRef} aria-hidden="true" />
    </>
  );
}
