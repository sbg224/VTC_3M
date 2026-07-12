# Checklist pré-prod VTC_3M

## P0 — obligatoire avant déploiement
- [x] Valider les parcours UI réels dans le navigateur (accueil, réservation, login chauffeur, admin) — automatisé via Cypress (`frontend/cypress/e2e/`), 11/11 tests verts localement
- [ ] Tester une réservation complète en environnement contrôlé avec vrais emails/SMS ou sandbox dédiée — nécessite de vraies clés SMTP/Twilio, à faire manuellement
- [ ] Vérifier toutes les variables d'environnement de prod — à faire sur la VM cible
- [ ] Vérifier les sauvegardes DB et fichiers PDF avant mise en ligne — nécessite l'infra de prod
- [ ] Confirmer les accès réseau / reverse proxy / domaine / HTTPS — nécessite l'infra de prod

## Tests automatisés (nouveau)
- [x] Suite Cypress fonctionnelle : accueil, réservation (avec/sans consentement, email invalide), login (valide/invalide/accès direct bloqué), dashboard admin — `frontend/npm run test:e2e`
- [x] Audits Lighthouse (vitesse, accessibilité, bonnes pratiques, SEO) via `cypress-audit` sur accueil/réservation/mentions légales — `frontend/npm run test:speed` (nécessite Chrome installé localement ; tourne nativement en CI)
- [x] CI GitHub Actions (`.github/workflows/e2e.yml`) : build + suite Cypress + audits Lighthouse sur chaque push/PR vers `main`
- [ ] Étendre la couverture e2e : inscription chauffeur (pending/trial/suspended), avis client via `reviewToken`, webhook Stripe

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
