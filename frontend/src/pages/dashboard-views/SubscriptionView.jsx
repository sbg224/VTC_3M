import { useState, useEffect } from 'react';
import {
  AlertTriangle, Zap, Shield, FileText, CreditCard, RefreshCw, ExternalLink,
} from 'lucide-react';
import { billingAPI } from '../../services/api';

export default function SubscriptionView({ showToast, driver }) {
  const [billing, setBilling]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    billingAPI.getInfo()
      .then(({ data }) => setBilling(data))
      .catch(() => showToast('Impossible de charger les informations d\'abonnement.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleCheckout = async (interval) => {
    setActionLoading(true);
    try {
      const { data } = await billingAPI.createCheckout(interval);
      window.location.href = data.url;
    } catch {
      showToast('Erreur lors de la création de la session de paiement.', 'error');
      setActionLoading(false);
    }
  };

  const handlePortal = async () => {
    setActionLoading(true);
    try {
      const { data } = await billingAPI.createPortal();
      window.location.href = data.url;
    } catch {
      showToast('Erreur lors de l\'ouverture du portail de gestion.', 'error');
      setActionLoading(false);
    }
  };

  if (loading) return <div className="loader-container"><div className="loader"></div></div>;

  const isTrial    = billing?.status === 'trial';
  const isActive   = billing?.status === 'active';
  const isExpired  = billing?.status === 'expired' || billing?.status === 'suspended';
  const daysLeft   = billing?.trialDaysLeft ?? 0;
  const urgency    = daysLeft <= 3;

  // Badge couleur selon statut
  const statusColor = isActive ? '#22c55e' : isTrial ? (urgency ? '#f97316' : '#267253') : '#ef4444';
  const statusLabel = isActive
    ? (billing.plan === 'pro' ? 'Pro — Actif' : 'Actif')
    : isTrial ? `Essai gratuit — ${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''}`
    : billing?.status === 'suspended' ? 'Compte suspendu' : 'Abonnement expiré';

  return (
    <div style={{ maxWidth: '680px' }}>

      {/* Carte statut */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-body" style={{ padding: '28px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-gray)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                Statut de votre compte
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  display: 'inline-block', padding: '4px 14px', borderRadius: '999px',
                  background: `${statusColor}18`, color: statusColor,
                  fontSize: '0.85rem', fontWeight: '700', border: `1px solid ${statusColor}40`,
                }}>
                  {statusLabel}
                </span>
              </div>
              {isActive && billing?.currentPeriodEnd && (
                <div style={{ marginTop: '8px', fontSize: '0.82rem', color: 'var(--color-gray)' }}>
                  Prochain renouvellement : <strong style={{ color: 'var(--color-white)' }}>
                    {new Date(billing.currentPeriodEnd).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </strong>
                  {billing.cancelAtPeriodEnd && (
                    <span style={{ marginLeft: '8px', color: '#f97316', fontSize: '0.8rem' }}>(annulation prévue)</span>
                  )}
                </div>
              )}
              {isTrial && (
                <div style={{ marginTop: '8px', fontSize: '0.82rem', color: urgency ? '#f97316' : 'var(--color-gray)' }}>
                  {urgency
                    ? <><AlertTriangle size={13} strokeWidth={1.5} style={{ display: 'inline', marginRight: '4px' }} />Votre essai expire bientôt — passez à Pro pour continuer.</>
                    : <>Profitez de toutes les fonctionnalités pendant votre période d'essai.</>}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-gray)', marginBottom: '4px' }}>Plan</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: billing?.plan === 'pro' ? 'var(--color-accent)' : 'var(--color-white)' }}>
                {billing?.plan === 'pro' ? 'Pro' : 'Gratuit'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Offre Pro — affichée si trial ou expiré */}
      {(isTrial || isExpired) && (
        <div className="card card-glass-gold" style={{ marginBottom: '24px' }}>
          <div className="card-body" style={{ padding: '28px 32px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
              Passez à Pro
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '8px', color: 'var(--color-white)' }}>
              3M Drive Pro
            </h3>
            <p style={{ color: 'var(--color-gray)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: '1.6' }}>
              Accédez à toutes les fonctionnalités sans limite : réservations illimitées, statistiques avancées, factures PDF, export de données.
            </p>

            {/* Avantages */}
            <div style={{ display: 'grid', gap: '10px', marginBottom: '28px' }}>
              {[
                { Icon: Zap,    text: 'Réservations illimitées' },
                { Icon: Shield, text: 'Statistiques & analytics avancés' },
                { Icon: FileText, text: 'Factures PDF automatiques par email' },
                { Icon: CreditCard, text: 'Gestion d\'abonnement en libre-service' },
              ].map(({ Icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: 'rgba(255,255,255,0.85)' }}>
                  <Icon size={15} strokeWidth={1.5} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                  {text}
                </div>
              ))}
            </div>

            {/* Boutons prix */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                onClick={() => handleCheckout('month')}
                disabled={actionLoading}
                style={{ flex: '1', minWidth: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {actionLoading
                  ? <><RefreshCw size={15} strokeWidth={1.5} className="animate-spin" /> Redirection…</>
                  : <><Zap size={15} strokeWidth={1.5} /> Mensuel</>}
              </button>
              <button
                className="btn"
                onClick={() => handleCheckout('year')}
                disabled={actionLoading}
                style={{ flex: '1', minWidth: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(38,114,83,0.12)', color: 'var(--color-accent)', border: '1px solid rgba(38,114,83,0.3)' }}
              >
                {actionLoading
                  ? <><RefreshCw size={15} strokeWidth={1.5} className="animate-spin" /> Redirection…</>
                  : <><Zap size={15} strokeWidth={1.5} /> Annuel (économisez 2 mois)</>}
              </button>
            </div>
            <p style={{ marginTop: '12px', fontSize: '0.78rem', color: 'var(--color-gray)' }}>
              Paiement sécurisé via Stripe. Résiliable à tout moment.
            </p>
          </div>
        </div>
      )}

      {/* Gestion abonnement actif */}
      {isActive && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-body" style={{ padding: '28px 32px' }}>
            <h3 style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={16} strokeWidth={1.5} style={{ color: 'var(--color-accent)' }} />
              Gérer mon abonnement
            </h3>
            <p style={{ color: 'var(--color-gray)', fontSize: '0.88rem', marginBottom: '20px' }}>
              Modifiez votre plan, vos informations de paiement ou résiliez depuis le portail sécurisé Stripe.
            </p>
            <button
              className="btn btn-dark"
              onClick={handlePortal}
              disabled={actionLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {actionLoading
                ? <><RefreshCw size={15} strokeWidth={1.5} className="animate-spin" /> Redirection…</>
                : <><ExternalLink size={15} strokeWidth={1.5} /> Ouvrir le portail de facturation</>}
            </button>
          </div>
        </div>
      )}

      {/* Info aide */}
      <div style={{ fontSize: '0.8rem', color: 'var(--color-gray)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <Shield size={13} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: '1px' }} />
        <span>Vos données de paiement sont traitées exclusivement par Stripe. 3M Drive ne stocke aucune information bancaire.</span>
      </div>
    </div>
  );
}
