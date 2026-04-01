/**
 * 3M Drive – Utilitaires d'animation GSAP
 * Centralise l'initialisation et les helpers réutilisables
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';

// Enregistrement des plugins
gsap.registerPlugin(ScrollTrigger, TextPlugin);

// ── Configuration globale ──────────────────────────────────────────────────
gsap.defaults({ ease: 'power3.out', duration: 0.8 });

// Désactive toutes les animations si l'utilisateur préfère moins de mouvement
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
  gsap.globalTimeline.timeScale(1000); // accélère tout → instantané
}

// ── Helper : animation fadeUp générique ───────────────────────────────────
export function fadeUp(targets, options = {}) {
  if (prefersReducedMotion) return;
  return gsap.from(targets, {
    y: options.y ?? 40,
    opacity: 0,
    duration: options.duration ?? 0.8,
    stagger: options.stagger ?? 0,
    delay: options.delay ?? 0,
    ease: options.ease ?? 'power3.out',
    ...options.extra,
  });
}

// ── Helper : ScrollTrigger fadeUp sur un groupe d'éléments ────────────────
export function scrollFadeUp(targets, options = {}) {
  if (prefersReducedMotion) return;
  return gsap.from(targets, {
    y: options.y ?? 50,
    opacity: 0,
    duration: options.duration ?? 0.7,
    stagger: options.stagger ?? 0.12,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: options.trigger ?? targets,
      start: options.start ?? 'top 82%',
      toggleActions: 'play none none none',
      once: true,
    },
  });
}

// ── Helper : compteurs animés ──────────────────────────────────────────────
export function animateCounter(el, endValue, suffix = '') {
  if (prefersReducedMotion) return;
  const obj = { val: 0 };
  gsap.to(obj, {
    val: endValue,
    duration: 2,
    ease: 'power2.out',
    roundProps: 'val',
    scrollTrigger: {
      trigger: el,
      start: 'top 80%',
      once: true,
    },
    onUpdate() {
      el.textContent = obj.val + suffix;
    },
  });
}

// ── Helper : effet clip-path reveal sur image ─────────────────────────────
export function imageReveal(targets, options = {}) {
  if (prefersReducedMotion) return;
  return gsap.from(targets, {
    clipPath: 'inset(0 100% 0 0)',
    duration: options.duration ?? 1.1,
    ease: 'power4.inOut',
    stagger: options.stagger ?? 0,
    scrollTrigger: options.scrollTrigger ?? undefined,
  });
}

export { gsap, ScrollTrigger };
