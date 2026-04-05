/**
 * billingController.js
 * Gestion de l'abonnement Stripe pour les chauffeurs 3M Drive
 *
 * Variables .env requises :
 *   STRIPE_SECRET_KEY          → clé secrète Stripe (sk_live_... ou sk_test_...)
 *   STRIPE_WEBHOOK_SECRET      → secret du webhook Stripe (whsec_...)
 *   STRIPE_PRICE_ID_MONTHLY    → ID du prix mensuel Stripe (price_...)
 *   STRIPE_PRICE_ID_YEARLY     → ID du prix annuel Stripe (price_...)  [optionnel]
 *   FRONTEND_URL               → URL du frontend pour les redirections Checkout
 */
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Driver } = require('../models');
const logger = require('../middleware/logger');

// ── Infos abonnement du chauffeur connecté ────────────────────────────────────
exports.getBillingInfo = async (req, res) => {
  try {
    const driver = await Driver.findByPk(req.driver.id, {
      attributes: ['id', 'name', 'email', 'role', 'status', 'plan',
                   'trialEndDate', 'subscriptionStatus', 'stripeCustomerId',
                   'stripeSubscriptionId'],
    });

    const now = new Date();
    const trialEnd = driver.trialEndDate ? new Date(driver.trialEndDate) : null;
    const daysLeft = trialEnd
      ? Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)))
      : 0;

    // Récupérer les détails Stripe si abonnement actif
    let stripeSubscription = null;
    if (driver.stripeSubscriptionId) {
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(
          driver.stripeSubscriptionId
        );
      } catch (_) { /* ignore si subscription Stripe inexistante */ }
    }

    res.json({
      status:             driver.status,
      plan:               driver.plan,
      subscriptionStatus: driver.subscriptionStatus,
      trialEndDate:       driver.trialEndDate,
      trialDaysLeft:      driver.status === 'trial' ? daysLeft : null,
      currentPeriodEnd:   stripeSubscription?.current_period_end
                            ? new Date(stripeSubscription.current_period_end * 1000)
                            : null,
      cancelAtPeriodEnd:  stripeSubscription?.cancel_at_period_end ?? false,
    });
  } catch (err) {
    logger.error(`[BILLING] Erreur getBillingInfo : ${err.message}`);
    res.status(500).json({ error: 'Erreur lors du chargement des informations d\'abonnement.' });
  }
};

// ── Créer une session Stripe Checkout ─────────────────────────────────────────
exports.createCheckoutSession = async (req, res) => {
  try {
    const driver = await Driver.findByPk(req.driver.id);
    const { interval = 'month' } = req.body; // 'month' | 'year'

    const priceId = interval === 'year'
      ? process.env.STRIPE_PRICE_ID_YEARLY
      : process.env.STRIPE_PRICE_ID_MONTHLY;

    if (!priceId) {
      return res.status(503).json({ error: 'Configuration de paiement manquante. Contactez le support.' });
    }

    // Créer ou récupérer le customer Stripe
    let customerId = driver.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: driver.email,
        name:  driver.name,
        metadata: { driver_id: driver.id, driver_slug: driver.slug || '' },
      });
      customerId = customer.id;
      await driver.update({ stripeCustomerId: customerId });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      customer:   customerId,
      mode:       'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      // Essai gratuit restant converti en période de grâce si encore en trial
      subscription_data: {
        metadata: { driver_id: driver.id },
        ...(driver.status === 'trial' && driver.trialEndDate
          ? { trial_end: Math.floor(new Date(driver.trialEndDate).getTime() / 1000) }
          : {}),
      },
      success_url: `${frontendUrl}/dashboard?billing=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${frontendUrl}/dashboard?billing=cancelled`,
      allow_promotion_codes: true,
      locale: 'fr',
    });

    logger.info(`[BILLING] Session Checkout créée pour ${driver.email} – session ${session.id}`);
    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    logger.error(`[BILLING] Erreur createCheckoutSession : ${err.message}`);
    res.status(500).json({ error: 'Erreur lors de la création de la session de paiement.' });
  }
};

// ── Créer un portail client Stripe (gérer/annuler l'abonnement) ───────────────
exports.createPortalSession = async (req, res) => {
  try {
    const driver = await Driver.findByPk(req.driver.id);

    if (!driver.stripeCustomerId) {
      return res.status(400).json({
        error: 'Aucun abonnement actif à gérer.',
        code: 'NO_SUBSCRIPTION',
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const session = await stripe.billingPortal.sessions.create({
      customer:   driver.stripeCustomerId,
      return_url: `${frontendUrl}/dashboard?tab=abonnement`,
      locale:     'fr',
    });

    logger.info(`[BILLING] Portail Stripe ouvert pour ${driver.email}`);
    res.json({ url: session.url });
  } catch (err) {
    logger.error(`[BILLING] Erreur createPortalSession : ${err.message}`);
    res.status(500).json({ error: 'Erreur lors de l\'ouverture du portail de gestion.' });
  }
};

// ── Webhook Stripe (mise à jour statut en temps réel) ─────────────────────────
// ⚠️  Cette route doit recevoir le body RAW (pas parsé en JSON)
exports.handleWebhook = async (req, res) => {
  const sig    = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    logger.warn(`[WEBHOOK] Signature invalide : ${err.message}`);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  logger.info(`[WEBHOOK] Événement reçu : ${event.type}`);

  try {
    switch (event.type) {

      // Abonnement activé / renouvelé
      case 'customer.subscription.updated':
      case 'invoice.payment_succeeded': {
        const sub = event.type === 'invoice.payment_succeeded'
          ? await stripe.subscriptions.retrieve(event.data.object.subscription)
          : event.data.object;

        const driverId = sub.metadata?.driver_id;
        if (!driverId) break;

        const isActive = ['active', 'trialing'].includes(sub.status);
        await Driver.update({
          status:               isActive ? 'active' : 'expired',
          plan:                 'pro',
          subscriptionStatus:   sub.status,
          stripeSubscriptionId: sub.id,
        }, { where: { id: driverId } });

        logger.info(`[WEBHOOK] Abonnement mis à jour pour driver ${driverId} → ${sub.status}`);
        break;
      }

      // Paiement échoué
      case 'invoice.payment_failed': {
        const invoice    = event.data.object;
        const customerId = invoice.customer;
        const driver     = await Driver.findOne({ where: { stripeCustomerId: customerId } });
        if (driver) {
          await driver.update({ subscriptionStatus: 'past_due' });
          logger.warn(`[WEBHOOK] Paiement échoué pour ${driver.email}`);
        }
        break;
      }

      // Abonnement annulé / résilié
      case 'customer.subscription.deleted': {
        const sub      = event.data.object;
        const driverId = sub.metadata?.driver_id;
        if (!driverId) break;

        await Driver.update({
          status:             'expired',
          plan:               'free',
          subscriptionStatus: 'canceled',
        }, { where: { id: driverId } });

        logger.info(`[WEBHOOK] Abonnement annulé pour driver ${driverId}`);
        break;
      }

      default:
        // Événement non géré — on répond 200 pour éviter les retries Stripe
        break;
    }

    res.json({ received: true });
  } catch (err) {
    logger.error(`[WEBHOOK] Erreur traitement événement ${event.type} : ${err.message}`);
    res.status(500).json({ error: 'Erreur traitement webhook.' });
  }
};
