import { RefreshCw, Loader2, SlidersHorizontal, Save, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { fmt, fmtDateTime } from './adminHelpers';

export default function PricingSection({ pricing, pricingForm, pricingLoading, pricingSaving, pricingMsg, onFieldChange, onSave, onRefresh }) {
  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h1>Tarification</h1>
        <button className="adm-btn-icon" onClick={onRefresh} title="Rafraîchir">
          <RefreshCw size={16} strokeWidth={1.75} />
        </button>
      </div>
      <p className="adm-section-desc">Définissez les tarifs appliqués à toutes les courses de la plateforme. Les modifications sont effectives immédiatement.</p>

      {pricingLoading ? (
        <div className="adm-loader"><Loader2 size={28} className="animate-spin" /></div>
      ) : (
        <div className="adm-pricing-grid">

          {/* Formulaire */}
          <div className="adm-pricing-card">
            <div className="adm-pricing-card-title">
              <SlidersHorizontal size={16} strokeWidth={1.75} style={{ color:'#267253' }} />
              Paramètres tarifaires
            </div>

            <div className="adm-pricing-field">
              <label>Prix par kilomètre (€/km)</label>
              <div className="adm-pricing-input-wrap">
                <input
                  type="number" min="0" step="0.1"
                  className="adm-input"
                  value={pricingForm.pricePerKm}
                  onChange={e => onFieldChange('pricePerKm', e.target.value)}
                />
                <span className="adm-pricing-unit">€/km</span>
              </div>
              <p className="adm-pricing-hint">Tarif de base appliqué à chaque kilomètre parcouru.</p>
            </div>

            <div className="adm-pricing-field">
              <label>Prix minimum garanti (€)</label>
              <div className="adm-pricing-input-wrap">
                <input
                  type="number" min="0" step="0.5"
                  className="adm-input"
                  value={pricingForm.minimumPrice}
                  onChange={e => onFieldChange('minimumPrice', e.target.value)}
                />
                <span className="adm-pricing-unit">€</span>
              </div>
              <p className="adm-pricing-hint">Montant minimum facturé quelle que soit la distance.</p>
            </div>

            <div className="adm-pricing-field">
              <label>Frais de prise en charge (€)</label>
              <div className="adm-pricing-input-wrap">
                <input
                  type="number" min="0" step="0.5"
                  className="adm-input"
                  value={pricingForm.baseFee}
                  onChange={e => onFieldChange('baseFee', e.target.value)}
                />
                <span className="adm-pricing-unit">€</span>
              </div>
              <p className="adm-pricing-hint">Frais fixes ajoutés à chaque course (0 = désactivé).</p>
            </div>

            <button
              className="adm-btn-primary"
              disabled={pricingSaving}
              onClick={onSave}
              style={{ marginTop:8 }}
            >
              {pricingSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} strokeWidth={2} />}
              Enregistrer la tarification
            </button>

            {pricingMsg.text && (
              <div style={{ marginTop:10, fontSize:'0.82rem', color: pricingMsg.ok ? '#10b981' : '#ef4444', display:'flex', alignItems:'center', gap:6 }}>
                {pricingMsg.ok ? <CheckCircle size={13} /> : <AlertTriangle size={13} />}
                {pricingMsg.text}
              </div>
            )}

            {pricing?.updatedBy && (
              <div style={{ marginTop:16, fontSize:'0.76rem', color:'rgba(255,255,255,0.3)', borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:12 }}>
                Dernière mise à jour par <strong style={{ color:'rgba(255,255,255,0.5)' }}>{pricing.updatedBy}</strong>
                {pricing.updatedAt && <> · {fmtDateTime(pricing.updatedAt)}</>}
              </div>
            )}
          </div>

          {/* Aperçu des prix */}
          <div className="adm-pricing-card">
            <div className="adm-pricing-card-title">
              <TrendingUp size={16} strokeWidth={1.75} style={{ color:'#6366f1' }} />
              Aperçu des tarifs
            </div>
            <p style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.35)', marginBottom:16 }}>
              Prix calculés en temps réel avec les valeurs du formulaire.
            </p>
            <table className="adm-table" style={{ marginTop:0 }}>
              <thead>
                <tr>
                  <th>Distance</th>
                  <th style={{ textAlign:'right' }}>Prix estimé</th>
                </tr>
              </thead>
              <tbody>
                {[5, 10, 15, 20, 30, 50].map(km => {
                  const ppkm = parseFloat(pricingForm.pricePerKm) || 0;
                  const min  = parseFloat(pricingForm.minimumPrice) || 0;
                  const base = parseFloat(pricingForm.baseFee) || 0;
                  const raw  = base + km * ppkm;
                  const price = Math.round(Math.max(min, raw) * 100) / 100;
                  const isMin = price === min && raw < min;
                  return (
                    <tr key={km}>
                      <td style={{ color:'rgba(255,255,255,0.65)', fontWeight:500 }}>{km} km</td>
                      <td style={{ textAlign:'right', color: isMin ? '#f59e0b' : '#267253', fontWeight:700 }}>
                        {fmt(price)} €
                        {isMin && <span style={{ fontSize:'0.7rem', color:'#f59e0b', marginLeft:6, fontWeight:400 }}>min.</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ marginTop:16, padding:'10px 14px', background:'rgba(38,114,83,0.06)', borderRadius:8, border:'1px solid rgba(38,114,83,0.15)', fontSize:'0.78rem', color:'rgba(255,255,255,0.45)', lineHeight:1.6 }}>
              <strong style={{ color:'rgba(255,255,255,0.65)' }}>Formule :</strong><br/>
              Prix = max(minimum, frais_base + distance × prix_km)
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
