/**
 * 3M Drive – Configuration GSAP centrale
 * Enregistre les plugins une seule fois au niveau module.
 * À importer en premier dans tout fichier qui utilise GSAP.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Enregistrement unique des plugins
gsap.registerPlugin(ScrollTrigger);

// Valeurs par défaut globales
gsap.defaults({ ease: 'power3.out', duration: 0.7 });

// ScrollTrigger : normalise le scroll sur mobile
ScrollTrigger.config({ limitCallbacks: true });

export { gsap, ScrollTrigger };
