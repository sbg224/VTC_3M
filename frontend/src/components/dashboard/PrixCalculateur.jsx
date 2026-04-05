import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Calculator, BarChart2, Car, Clock, CheckCircle, Save, RotateCcw } from 'lucide-react';

const CALC_STORAGE_KEY = '3mdrive_calc_params';
const DEFAULT_PARAMS = {
  chargesFixesMois: 800,
  chargesVarKm: 0.18,
  coutHoraire: 25,
  kmMoyensMois: 3000,
};

export default function PrixCalculateur() {
  const [params, setParams] = useState(() => {
    try {
      const saved = localStorage.getItem(CALC_STORAGE_KEY);
      return saved ? { ...DEFAULT_PARAMS, ...JSON.parse(saved) } : DEFAULT_PARAMS;
    } catch { return DEFAULT_PARAMS; }
  });
  const [paramsSaved, setParamsSaved] = useState(false);
  const [sim, setSim] = useState({ typeService: 'course', distance: '', duree: '', marge: 30 });

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
    return {
      prixRevient: prixRevient.toFixed(2),
      prixFinal:   prixFinal.toFixed(2),
      prixKm:      (prixFinal / dist).toFixed(2),
      prixMin:     (prixFinal / dur).toFixed(2),
      margeEuros:  (prixFinal - prixRevient).toFixed(2),
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
  const resetParams = () => { setParams(DEFAULT_PARAMS); localStorage.removeItem(CALC_STORAGE_KEY); };
  const resetSim    = () => setSim({ typeService: 'course', distance: '', duree: '', marge: 30 });
  const setParam    = (key, val) => setParams(p => ({ ...p, [key]: parseFloat(val) || 0 }));
  const setSf       = (key, val) => setSim(s => ({ ...s, [key]: val }));

  const lbl = "text-xs font-medium text-white/60 uppercase tracking-widest block mb-1.5";
  const hnt = "text-white/25 text-xs mt-1";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* Paramètres */}
      <div className="bg-[#111118] border border-white/8 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Settings size={16} strokeWidth={1.5} className="text-[#D4AF37]" />
            Paramètres de tarification
          </h3>
          <span className="text-white/25 text-xs">Sauvegardés localement</span>
        </div>
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-3">Charges fixes</p>
            <div className="flex flex-col gap-3">
              <div>
                <label className={lbl}>Charges fixes / mois (€)</label>
                <input type="number" className="input-dark" min="0" step="10"
                  value={params.chargesFixesMois} onChange={e => setParam('chargesFixesMois', e.target.value)} />
                <p className={hnt}>Assurance, amortissement véhicule, abonnements…</p>
              </div>
              <div>
                <label className={lbl}>Kilomètres moyens / mois</label>
                <input type="number" className="input-dark" min="1" step="100"
                  value={params.kmMoyensMois} onChange={e => setParam('kmMoyensMois', e.target.value)} />
                <p className={hnt}>Sert à ramener les charges fixes au km</p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-3">Charges variables</p>
            <div>
              <label className={lbl}>Coût variable / km (€)</label>
              <input type="number" className="input-dark" min="0" step="0.01"
                value={params.chargesVarKm} onChange={e => setParam('chargesVarKm', e.target.value)} />
              <p className={hnt}>Carburant, entretien, pneumatiques…</p>
            </div>
          </div>
          <div>
            <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-3">Valorisation du temps</p>
            <div>
              <label className={lbl}>Coût horaire chauffeur (€/h)</label>
              <input type="number" className="input-dark" min="0" step="1"
                value={params.coutHoraire} onChange={e => setParam('coutHoraire', e.target.value)} />
              <p className={hnt}>Rémunération nette souhaitée par heure</p>
            </div>
          </div>
          <div className="bg-white/3 border border-white/5 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Coût fixe ramené au km</span>
              <strong className="text-[#D4AF37]">
                {params.kmMoyensMois > 0 ? (params.chargesFixesMois / params.kmMoyensMois).toFixed(3) : '—'} €/km
              </strong>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Coût total au km (hors temps)</span>
              <strong className="text-[#D4AF37]">
                {params.kmMoyensMois > 0 ? (params.chargesFixesMois / params.kmMoyensMois + params.chargesVarKm).toFixed(3) : '—'} €/km
              </strong>
            </div>
          </div>
          <div className="flex gap-3">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex-1 bg-white text-black font-semibold py-3 rounded-xl flex items-center justify-center gap-2 text-sm"
              onClick={saveParams}>
              {paramsSaved ? <><CheckCircle size={15} strokeWidth={1.5} /> Sauvegardé !</> : <><Save size={15} strokeWidth={1.5} /> Sauvegarder</>}
            </motion.button>
            <button className="border border-white/15 text-white/50 px-4 py-3 rounded-xl text-sm hover:border-white/30 transition-colors flex items-center gap-1.5"
              onClick={resetParams}>
              <RotateCcw size={14} strokeWidth={1.5} />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Simulation + Résultats */}
      <div className="flex flex-col gap-6">
        <div className="bg-[#111118] border border-white/8 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Calculator size={16} strokeWidth={1.5} className="text-[#D4AF37]" />
              Simulation de course
            </h3>
            <button className="text-white/30 hover:text-white/60 text-xs transition-colors flex items-center gap-1" onClick={resetSim}>
              <RotateCcw size={12} strokeWidth={1.5} />
              Réinitialiser
            </button>
          </div>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'course',           label: 'Course',       desc: 'Trajet A → B', Icon: Car },
                { value: 'mise_a_disposition', label: 'Mise à dispo', desc: 'Durée fixe',  Icon: Clock },
              ].map(t => (
                <button key={t.value} type="button" onClick={() => setSf('typeService', t.value)}
                  className={`flex flex-col gap-0.5 p-3 rounded-xl border text-left transition-all duration-200 ${
                    sim.typeService === t.value
                      ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]'
                      : 'bg-white/3 border-white/8 text-white/40 hover:bg-white/5'
                  }`}>
                  <div className="flex items-center gap-1.5 font-medium text-sm">
                    <t.Icon size={13} strokeWidth={1.5} />
                    {t.label}
                  </div>
                  <span className="text-xs opacity-60">{t.desc}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Distance (km)', key: 'distance', placeholder: '42', step: '1', min: '1' },
                { label: 'Durée (min)',   key: 'duree',    placeholder: '55', step: '5', min: '1' },
                { label: 'Marge (%)',     key: 'marge',    placeholder: '30', step: '5', min: '0' },
              ].map(f => (
                <div key={f.key}>
                  <label className={lbl}>{f.label}</label>
                  <input type="number" className="input-dark" min={f.min} step={f.step}
                    placeholder={f.placeholder} value={sim[f.key]} onChange={e => setSf(f.key, e.target.value)} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {result ? (
          <div className="bg-[#111118] border border-white/8 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <BarChart2 size={16} strokeWidth={1.5} className="text-[#D4AF37]" />
                Résultats
              </h3>
              <span className="text-white/25 text-xs">Calcul en temps réel</span>
            </div>
            <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/15 rounded-xl p-5 mb-5">
              <div className="text-white/60 text-xs mb-1">Prix final client</div>
              <div className="text-[#D4AF37] text-4xl font-bold mb-3">{result.prixFinal} €</div>
              <div className="flex gap-4 text-sm">
                <div><div className="text-white font-semibold">{result.prixKm} €</div><div className="text-white/30 text-xs">/ km</div></div>
                <div><div className="text-white font-semibold">{result.prixMin} €</div><div className="text-white/30 text-xs">/ min</div></div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-1">Décomposition</p>
              {[
                { label: `Charges fixes (${sim.distance} km)`, value: `${result.coutFixe} €` },
                { label: 'Charges variables',                    value: `${result.coutVar} €` },
                { label: `Temps (${sim.duree} min)`,             value: `${result.coutTemps} €` },
              ].map((row, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-white/60">{row.label}</span>
                  <span className="text-white/70">{row.value}</span>
                </div>
              ))}
              <div className="border-t border-white/8 pt-2 mt-1 flex justify-between text-sm">
                <span className="text-white/50 font-medium">Prix de revient</span>
                <span className="text-white font-semibold">{result.prixRevient} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Marge ({sim.marge}%)</span>
                <span className="text-green-400">+ {result.margeEuros} €</span>
              </div>
              <div className="border-t border-white/8 pt-2 mt-1 flex justify-between">
                <span className="text-white font-semibold">Prix final</span>
                <strong className="text-[#D4AF37] text-lg">{result.prixFinal} €</strong>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#111118] border border-white/8 rounded-2xl p-8 flex flex-col items-center justify-center text-white/50">
            <Calculator size={32} strokeWidth={1} className="mb-3" />
            <p className="text-sm text-center">Renseignez la distance et la durée<br />pour obtenir le calcul du prix.</p>
          </div>
        )}
      </div>
    </div>
  );
}
