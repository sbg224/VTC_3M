/* ─────────────────────────────────────────────────────────────────────────────
   Calculateur de prix – 3M Drive
   Logique :
     Coût fixe ramené à la course  = (charges_fixes_mois / km_mois) × distance
     Coût variable                 = charges_var_km × distance
     Coût temps                    = (durée_min / 60) × coût_horaire
     Prix de revient               = fixe + variable + temps
     Prix final                    = prix_de_revient × (1 + marge / 100)
   ───────────────────────────────────────────────────────────────────────────── */
import { useState } from 'react';
import { Settings, Calculator, CheckCircle, TrendingUp } from 'lucide-react';

const CALC_STORAGE_KEY = '3mdrive_calc_params';

const DEFAULT_PARAMS = {
  chargesFixesMois: 800,   // € / mois (assurance, amortissement, abonnements)
  chargesVarKm: 0.18,      // € / km   (carburant, entretien, pneus)
  coutHoraire: 25,         // € / h    (valorisation temps chauffeur)
  kmMoyensMois: 3000,      // km / mois (base de répartition des fixes)
};

export default function PrixCalculateur() {
  // ── Paramètres tarifaires (persistés en localStorage) ──
  const [params, setParams] = useState(() => {
    try {
      const saved = localStorage.getItem(CALC_STORAGE_KEY);
      return saved ? { ...DEFAULT_PARAMS, ...JSON.parse(saved) } : DEFAULT_PARAMS;
    } catch {
      return DEFAULT_PARAMS;
    }
  });
  const [paramsSaved, setParamsSaved] = useState(false);

  // ── Inputs de simulation ──
  const [sim, setSim] = useState({
    typeService: 'course',  // 'course' | 'mise_a_disposition'
    distance: '',
    duree: '',
    marge: 30,
  });

  // ── Calcul dynamique ──
  const result = (() => {
    const dist = parseFloat(sim.distance);
    const dur  = parseFloat(sim.duree);
    const marge = parseFloat(sim.marge) || 0;

    if (!dist || dist <= 0 || !dur || dur <= 0) return null;

    const coutFixe    = (params.chargesFixesMois / params.kmMoyensMois) * dist;
    const coutVar     = params.chargesVarKm * dist;
    const coutTemps   = (dur / 60) * params.coutHoraire;
    const prixRevient = coutFixe + coutVar + coutTemps;
    const prixFinal   = prixRevient * (1 + marge / 100);
    const prixKm      = prixFinal / dist;
    const prixMin     = prixFinal / dur;
    const margeEuros  = prixFinal - prixRevient;

    return {
      prixRevient: prixRevient.toFixed(2),
      prixFinal:   prixFinal.toFixed(2),
      prixKm:      prixKm.toFixed(2),
      prixMin:     prixMin.toFixed(2),
      margeEuros:  margeEuros.toFixed(2),
      coutFixe:    coutFixe.toFixed(2),
      coutVar:     coutVar.toFixed(2),
      coutTemps:   coutTemps.toFixed(2),
    };
  })();

  const saveParams = () => {
    localStorage.setItem(CALC_STORAGE_KEY, JSON.stringify(params));
    setParamsSaved(true);
    setTimeout(() => setParamsSaved(false), 2000);
  };

  const resetParams = () => {
    setParams(DEFAULT_PARAMS);
    localStorage.removeItem(CALC_STORAGE_KEY);
  };

  const resetSim = () => setSim({ typeService: 'course', distance: '', duree: '', marge: 30 });

  const setParam = (key, val) => setParams(p => ({ ...p, [key]: parseFloat(val) || 0 }));
  const setSf    = (key, val) => setSim(s => ({ ...s, [key]: val }));

  return (
    <div className="calc-layout">

      {/* ── COLONNE GAUCHE : Paramètres de tarification ── */}
      <div>
        <div className="card calc-card">
          <div className="card-header calc-card-header">
            <h3 className="icon-heading"><Settings size={15} strokeWidth={1.5} /> Paramètres de tarification</h3>
            <span className="calc-hint">Sauvegardés localement</span>
          </div>
          <div className="card-body">

            <div className="calc-param-group">
              <p className="calc-group-label">Charges fixes</p>
              <div className="form-group">
                <label className="form-label">Charges fixes / mois (€)</label>
                <input type="number" className="form-control" min="0" step="10"
                  value={params.chargesFixesMois}
                  onChange={e => setParam('chargesFixesMois', e.target.value)} />
                <span className="calc-field-hint">Assurance, amortissement véhicule, abonnements…</span>
              </div>
              <div className="form-group">
                <label className="form-label">Kilomètres moyens / mois</label>
                <input type="number" className="form-control" min="1" step="100"
                  value={params.kmMoyensMois}
                  onChange={e => setParam('kmMoyensMois', e.target.value)} />
                <span className="calc-field-hint">Sert à ramener les charges fixes au km</span>
              </div>
            </div>

            <div className="calc-param-group">
              <p className="calc-group-label">Charges variables</p>
              <div className="form-group">
                <label className="form-label">Coût variable / km (€)</label>
                <input type="number" className="form-control" min="0" step="0.01"
                  value={params.chargesVarKm}
                  onChange={e => setParam('chargesVarKm', e.target.value)} />
                <span className="calc-field-hint">Carburant, entretien, pneumatiques…</span>
              </div>
            </div>

            <div className="calc-param-group">
              <p className="calc-group-label">Valorisation du temps</p>
              <div className="form-group">
                <label className="form-label">Coût horaire chauffeur (€/h)</label>
                <input type="number" className="form-control" min="0" step="1"
                  value={params.coutHoraire}
                  onChange={e => setParam('coutHoraire', e.target.value)} />
                <span className="calc-field-hint">Rémunération nette souhaitée par heure</span>
              </div>
            </div>

            {/* Résumé coût fixe au km */}
            <div className="calc-summary-row">
              <span>Coût fixe ramené au km</span>
              <strong className="calc-accent">
                {params.kmMoyensMois > 0
                  ? (params.chargesFixesMois / params.kmMoyensMois).toFixed(3)
                  : '—'} €/km
              </strong>
            </div>
            <div className="calc-summary-row">
              <span>Coût total au km (hors temps)</span>
              <strong className="calc-accent">
                {params.kmMoyensMois > 0
                  ? (params.chargesFixesMois / params.kmMoyensMois + params.chargesVarKm).toFixed(3)
                  : '—'} €/km
              </strong>
            </div>

            <div className="calc-actions">
              <button className="btn btn-primary" onClick={saveParams}>
                {paramsSaved ? <><CheckCircle size={14} strokeWidth={1.5} /> Sauvegardé !</> : <><Settings size={14} strokeWidth={1.5} /> Sauvegarder</>}
              </button>
              <button className="btn btn-outline calc-btn-reset" onClick={resetParams}>
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── COLONNE DROITE : Simulation + Résultats ── */}
      <div className="calc-right">

        {/* Simulation */}
        <div className="card calc-card">
          <div className="card-header calc-card-header">
            <h3 className="icon-heading"><Calculator size={15} strokeWidth={1.5} /> Simulation de course</h3>
            <button className="calc-link" onClick={resetSim}>Réinitialiser</button>
          </div>
          <div className="card-body">

            {/* Type de service */}
            <div className="form-group">
              <label className="form-label">Type de service</label>
              <div className="calc-type-toggle">
                {[
                  { value: 'course', label: 'Course', desc: 'Trajet A → B' },
                  { value: 'mise_a_disposition', label: 'Mise à disposition', desc: 'Durée fixe' },
                ].map(t => (
                  <button
                    key={t.value}
                    className={`calc-type-btn ${sim.typeService === t.value ? 'active' : ''}`}
                    onClick={() => setSf('typeService', t.value)}
                    type="button"
                  >
                    <span className="calc-type-label">{t.label}</span>
                    <span className="calc-type-desc">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="calc-inputs-grid">
              <div className="form-group">
                <label className="form-label">Distance (km)</label>
                <input type="number" className="form-control" min="1" step="1"
                  placeholder="Ex : 42"
                  value={sim.distance}
                  onChange={e => setSf('distance', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Durée estimée (min)</label>
                <input type="number" className="form-control" min="1" step="5"
                  placeholder="Ex : 55"
                  value={sim.duree}
                  onChange={e => setSf('duree', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Marge souhaitée (%)</label>
                <input type="number" className="form-control" min="0" max="200" step="5"
                  value={sim.marge}
                  onChange={e => setSf('marge', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Résultats */}
        {result ? (
          <div className="card calc-card calc-results-card">
            <div className="card-header calc-card-header">
              <h3 className="icon-heading"><TrendingUp size={15} strokeWidth={1.5} /> Résultats</h3>
              <span className="calc-hint">Calcul en temps réel</span>
            </div>
            <div className="card-body">

              {/* Prix principal */}
              <div className="calc-price-hero">
                <div>
                  <div className="calc-price-label">Prix final client</div>
                  <div className="calc-price-value">{result.prixFinal} €</div>
                </div>
                <div className="calc-price-sub">
                  <div className="calc-kpi">
                    <span className="calc-kpi-val">{result.prixKm} €</span>
                    <span className="calc-kpi-label">/ km</span>
                  </div>
                  <div className="calc-kpi">
                    <span className="calc-kpi-val">{result.prixMin} €</span>
                    <span className="calc-kpi-label">/ min</span>
                  </div>
                </div>
              </div>

              {/* Décomposition */}
              <div className="calc-breakdown">
                <p className="calc-group-label">Décomposition du coût</p>
                {[
                  { label: `Charges fixes (${sim.distance} km)`, value: `${result.coutFixe} €` },
                  { label: `Charges variables (${result.coutVar} €)`, value: `${result.coutVar} €` },
                  { label: `Temps (${sim.duree} min)`, value: `${result.coutTemps} €` },
                ].map((row, i) => (
                  <div key={i} className="calc-breakdown-row">
                    <span>{row.label}</span>
                    <span>{row.value}</span>
                  </div>
                ))}
                <div className="calc-breakdown-row calc-breakdown-total">
                  <span>Prix de revient</span>
                  <span>{result.prixRevient} €</span>
                </div>
                <div className="calc-breakdown-row calc-breakdown-marge">
                  <span>Marge ({sim.marge}%)</span>
                  <span>+ {result.margeEuros} €</span>
                </div>
                <div className="calc-breakdown-row calc-breakdown-final">
                  <span>Prix final</span>
                  <strong>{result.prixFinal} €</strong>
                </div>
              </div>

              {/* Indication type */}
              <div className="calc-service-badge">
                {sim.typeService === 'course' ? 'Course simple' : 'Mise à disposition'}
                &nbsp;·&nbsp;{sim.distance} km&nbsp;·&nbsp;{sim.duree} min&nbsp;·&nbsp;marge {sim.marge}%
              </div>

            </div>
          </div>
        ) : (
          <div className="card calc-card calc-empty">
            <div className="calc-empty-icon"><Calculator size={36} strokeWidth={1} /></div>
            <p>Renseignez la distance et la durée<br />pour obtenir le calcul du prix.</p>
          </div>
        )}
      </div>
    </div>
  );
}
