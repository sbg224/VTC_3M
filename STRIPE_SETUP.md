# Configuration Stripe — 3M Drive Pro

Ce guide vous permet de configurer Stripe en **moins de 10 minutes**
et d'activer le système d'abonnement dans votre backend.

---

## Étape 1 — Clé secrète API

1. Connectez-vous sur [dashboard.stripe.com](https://dashboard.stripe.com)
2. Allez dans **Développeurs → Clés API**
3. Copiez la **Clé secrète** (`sk_test_...` en test, `sk_live_...` en production)
4. Collez-la dans votre `.env` :

```
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_ICI
```

> **Mode test** : utilisez `sk_test_...` pendant le développement.
> Passez en `sk_live_...` uniquement au moment du lancement.

---

## Étape 2 — Créer le produit "3M Drive Pro"

1. Dans le Dashboard Stripe : **Catalogue de produits → + Créer un produit**
2. Renseignez :
   - **Nom** : `3M Drive Pro`
   - **Description** : `Accès complet à la plateforme 3M Drive — réservations illimitées, statistiques, factures PDF`
   - **Image** : *(optionnel, votre logo)*
3. **Ne créez pas encore de prix** à cette étape — cliquez **Enregistrer le produit**

---

## Étape 3 — Créer le prix mensuel

Sur la page du produit "3M Drive Pro" :

1. Cliquez **+ Ajouter un prix**
2. Configurez :
   - **Modèle de prix** : Standard
   - **Devise** : EUR
   - **Prix** : `29,00` (ou votre tarif souhaité)
   - **Récurrence** : Mensuel
   - **Facturation** : À l'avance
3. Cliquez **Enregistrer le prix**
4. Copiez l'**ID du prix** (format `price_xxxxxxxxxxxxxxxxxxxxxxxx`)
5. Collez-le dans `.env` :

```
STRIPE_PRICE_ID_MONTHLY=price_VOTRE_ID_MENSUEL
```

---

## Étape 4 — Créer le prix annuel

Sur la même page du produit :

1. Cliquez **+ Ajouter un prix**
2. Configurez :
   - **Modèle de prix** : Standard
   - **Devise** : EUR
   - **Prix** : `290,00` (économie de ~2 mois vs mensuel)
   - **Récurrence** : Annuel
3. Cliquez **Enregistrer le prix**
4. Copiez l'**ID du prix** (format `price_...`)
5. Collez-le dans `.env` :

```
STRIPE_PRICE_ID_YEARLY=price_VOTRE_ID_ANNUEL
```

---

## Étape 5 — Configurer le Portail client Stripe

Nécessaire pour que vos chauffeurs puissent gérer/résilier leur abonnement.

1. Dans le Dashboard : **Paramètres → Portail client**
   (ou aller directement sur [billing.stripe.com/p/login/...](https://dashboard.stripe.com/settings/billing/portal))
2. Activez **"Permettre aux clients de..."** :
   - Annuler leur abonnement
   - Mettre à jour leur mode de paiement
   - Consulter leur historique de facturation
3. Sous **Produits** : sélectionnez "3M Drive Pro"
4. Cliquez **Enregistrer**

---

## Étape 6 — Configurer le Webhook

Le webhook est indispensable pour que le backend soit notifié en temps réel
des événements Stripe (paiement réussi, annulation, etc.).

### En développement (local) — avec Stripe CLI

```bash
# Installer la CLI Stripe si pas encore fait
npm install -g @stripe/stripe-cli

# Authentification
stripe login

# Lancer l'écoute et forwarder vers votre backend local
stripe listen --forward-to http://localhost:5001/api/billing/webhook
```

La CLI affiche un `whsec_...` — copiez-le dans `.env` :

```
STRIPE_WEBHOOK_SECRET=whsec_VOTRE_SECRET_WEBHOOK
```

### En production — via le Dashboard

1. Dans le Dashboard : **Développeurs → Webhooks → + Ajouter un endpoint**
2. **URL** : `https://votre-domaine.com/api/billing/webhook`
3. **Événements à écouter** (sélectionnez exactement ces 4) :
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Cliquez **Ajouter l'endpoint**
5. Sur la page du webhook, cliquez **Révéler le secret de signature**
6. Copiez le `whsec_...` dans `.env` :

```
STRIPE_WEBHOOK_SECRET=whsec_VOTRE_SECRET_WEBHOOK
```

---

## Résultat final — votre `.env` Stripe complet

```env
# ── Stripe ────────────────────────────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_YEARLY=price_...
```

---

## Tester le paiement (mode test)

Utilisez les cartes de test Stripe :

| Carte | Résultat |
|---|---|
| `4242 4242 4242 4242` | Paiement réussi |
| `4000 0000 0000 9995` | Échec (fonds insuffisants) |
| `4000 0025 0000 3155` | Authentification 3D Secure requise |

Date d'expiration : n'importe quelle date future — CVC : n'importe quels 3 chiffres.

---

## Checklist finale

- [ ] `STRIPE_SECRET_KEY` renseigné (sk_test_ ou sk_live_)
- [ ] Produit "3M Drive Pro" créé sur Stripe
- [ ] `STRIPE_PRICE_ID_MONTHLY` renseigné (price_...)
- [ ] `STRIPE_PRICE_ID_YEARLY` renseigné (price_...)
- [ ] Portail client Stripe configuré
- [ ] `STRIPE_WEBHOOK_SECRET` renseigné (whsec_...)
- [ ] Backend redémarré après modification du `.env`

Une fois ces étapes complètes, l'onglet **Abonnement** du dashboard chauffeur
est pleinement fonctionnel.
