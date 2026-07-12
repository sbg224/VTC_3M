# Checklist pré-prod VTC_3M

## P0 — obligatoire avant déploiement
- [x] Valider les parcours UI réels dans le navigateur (accueil, réservation, login chauffeur, admin) — automatisé via Cypress (`frontend/cypress/e2e/`), 11/11 tests verts localement
- [ ] Tester une réservation complète en environnement contrôlé avec vrais emails/SMS ou sandbox dédiée — nécessite de vraies clés SMTP/Twilio, à faire manuellement
- [ ] Vérifier toutes les variables d'environnement de prod — à faire sur la VM cible
- [ ] Vérifier les sauvegardes DB et fichiers PDF avant mise en ligne — nécessite l'infra de prod
- [ ] Confirmer les accès réseau / reverse proxy / domaine / HTTPS — nécessite l'infra de prod

## Tests automatisés (nouveau)
- [x] Suite Cypress fonctionnelle : accueil, réservation (avec/sans consentement, email invalide), login (valide/invalide/accès direct bloqué), dashboard admin — `frontend/npm run test:e2e`
- [x] Audits Lighthouse (vitesse, accessibilité, bonnes pratiques, SEO) via un script CLI indépendant (`frontend/scripts/lighthouse-audit.js`, chrome-launcher direct — pas de relais via Cypress) sur accueil/réservation/mentions légales — `frontend/npm run test:speed` (nécessite Chrome installé localement ; tourne nativement en CI)
- [x] CI GitHub Actions (`.github/workflows/e2e.yml`) : build + suite Cypress + audits Lighthouse sur chaque push/PR vers `main`
- [ ] Étendre la couverture e2e : inscription chauffeur (pending/trial/suspended), avis client via `reviewToken`, webhook Stripe

### Baseline Lighthouse — évolution 2026-07-12
Première mesure faite contre le **serveur de dev Vite** (JS non minifié/non
compressé) par erreur de méthodologie — chiffres de performance trompeurs.
Corrigé : l'audit build désormais puis mesure le **build de production**
(`vite preview`) via `frontend/scripts/lighthouse-audit.js`.

| Page | Perf (dev, erroné) | Perf (prod, réel) | A11y (avant fix) | A11y (après fix) |
|---|---|---|---|---|
| Accueil | 50 | 74-78 | 78 | 88 |
| Réservation | 55 | 78-85 | 75 | 96 |
| Mentions légales | 55 | 83-88 | 87 | 96 |

Seuils CI : performance 65+, accessibilité 80+ (marge sous les scores mesurés).

Correctifs d'accessibilité appliqués (accueil + réservation, identifiés via
rapport Lighthouse détaillé) :
- [x] Contraste texte insuffisant — nouveau token `--color-accent-text`
  (`#7a5f18`, ratio 6:1 sur fond clair) utilisé par `.section-label` et les
  liens RGPD/CGU ; `.exp-reserve-note` remonté à `rgba(255,255,255,0.62)`
- [x] Hiérarchie de titres qui saute un niveau — `h2→h4` (accueil, section
  contact) et `h1→h3` (réservation, en-têtes de section) corrigés en séquence
- [x] Champs de formulaire sans label associé — `date`, `time`, `passengers`,
  `luggage` (et tous les autres champs) reliés via `id`/`htmlFor` explicites
- [x] Liens icône sans nom accessible — `aria-label` ajouté sur les 3 liens
  sociaux du footer
- [x] Cibles tactiles trop petites — liens sociaux du footer : découverte au
  passage qu'ils reposaient uniquement sur des classes façon Tailwind
  inexistantes dans le projet (`w-10 h-10 flex ...` sans CSS réelle
  derrière), rendus en `display: inline` non cliquable proprement ; corrigé
  avec une vraie classe `.footer-social-link` (44×44px)
- [x] Lien qui ne se distingue que par la couleur — soulignement ajouté aux
  liens RGPD/CGU dans le formulaire de réservation

Reste à traiter :
- [ ] Performance encore sous les standards Core Web Vitals — lié à la dette
  déjà connue (bundle ~500 kB, pas de prerender/SSR, voir P3)
- [ ] **Découverte hors périmètre** : des classes CSS façon Tailwind sont
  utilisées dans plusieurs composants sans que Tailwind soit installé —
  certaines cassent silencieusement le rendu (footer social links corrigé,
  liens légaux du footer collés sans espacement repéré mais pas corrigé).
  Tâche de fond proposée pour un audit complet.

## P1 — fortement recommandé
- [x] Corriger les consentements RGPD + CGU dans les formulaires
- [x] Mettre en place des migrations idempotentes sans casse
- [x] Corriger le CORS pour usage local/VPN en développement
- [x] Remettre le front sur le port 3000 côté VM
- [x] Mettre un SEO par route (title, description, canonical, OG, robots, sitemap)
- [ ] Réduire encore le bundle frontend (manualChunks, lazy supplémentaires si utile)
- [ ] Vérifier les images lourdes et optimiser les assets

## P2 — qualité produit
- [ ] Ajouter un vrai parcours de reset / changement de mot de passe chauffeur
- [ ] Revoir la cohérence juridique finale des pages légales avant prod
- [ ] Vérifier les messages d'erreur front pour qu'ils soient plus explicites côté login/réservation
- [ ] Décider si les pages `/book/:slug` doivent être indexées ou non à long terme

## P3 — amélioration SEO / perf avancée
- [ ] Étudier un prerender / SSR / génération statique des pages publiques
- [ ] Améliorer encore Core Web Vitals
- [ ] Éventuellement enrichir les données structurées selon les pages publiques

## Dernier état vérifié
- backend local fonctionnel
- frontend local fonctionnel
- flux métier critiques validés en mode sûr local
- base de données intacte
