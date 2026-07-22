import { RefreshCw, Loader2, CalendarDays, ReceiptText, Euro, Percent, Wallet, Eye, Download, Check, X, Edit3, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fmt, fmtDate } from './adminHelpers';
import KpiCard from './KpiCard';

const PERIODS = [
  { id: 'week',       label: 'Cette semaine' },
  { id: 'month',      label: 'Ce mois' },
  { id: 'prev_month', label: 'Mois précédent' },
  { id: 'custom',     label: 'Personnalisé' },
];

export default function AccountingSection({
  accPeriod, accStart, accEnd, accSummary, accTotals, accPeriodLabel, accLoading,
  accDetail, accDetailLoading, accPdfLoading, accEditComm, accCommSaving,
  onPeriodChange, onStartChange, onEndChange, onApplyCustom, onRefresh,
  onStartEditCommission, onCommissionInputChange, onCancelEditCommission, onSaveCommission,
  onDownloadPdf, onViewDetail, onCloseDetail,
}) {
  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h1>Comptabilité</h1>
        <button className="adm-btn-icon" onClick={onRefresh} title="Rafraîchir">
          <RefreshCw size={16} strokeWidth={1.75} />
        </button>
      </div>
      <p className="adm-section-desc">
        Calculez le net à reverser à chaque chauffeur sur la période choisie, après déduction de la commission plateforme.
      </p>

      {/* ── Sélecteur de période ── */}
      <div className="adm-acc-period-bar">
        <div className="adm-filter-tabs">
          {PERIODS.map(p => (
            <button
              key={p.id}
              className={`adm-filter-tab ${accPeriod === p.id ? 'active' : ''}`}
              onClick={() => onPeriodChange(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
        {accPeriod === 'custom' && (
          <div className="adm-acc-custom-range">
            <input type="date" className="adm-input" style={{ maxWidth:155, width:'100%', minWidth:130, marginBottom:0 }}
              value={accStart} onChange={e => onStartChange(e.target.value)} />
            <span style={{ color:'rgba(255,255,255,0.3)', padding:'0 4px' }}>→</span>
            <input type="date" className="adm-input" style={{ maxWidth:155, width:'100%', minWidth:130, marginBottom:0 }}
              value={accEnd} onChange={e => onEndChange(e.target.value)} />
            <button
              className="adm-btn-primary" style={{ padding:'8px 18px' }}
              disabled={!accStart || !accEnd}
              onClick={onApplyCustom}
            >
              <CalendarDays size={14} /> Appliquer
            </button>
          </div>
        )}
      </div>

      {accLoading ? (
        <div className="adm-loader"><Loader2 size={28} className="animate-spin" /></div>
      ) : accSummary ? (
        <>
          {/* Période affichée */}
          {accPeriodLabel && (
            <div className="adm-acc-period-label">
              <CalendarDays size={14} strokeWidth={1.75} /> {accPeriodLabel}
            </div>
          )}

          {/* KPIs globaux */}
          {accTotals && (
            <div className="adm-kpi-grid" style={{ marginBottom:28 }}>
              <KpiCard icon={<ReceiptText size={20} strokeWidth={1.5} />} value={accTotals.rideCount} label="Courses terminées" color="#6366f1" />
              <KpiCard icon={<Euro size={20} strokeWidth={1.5} />} value={`${fmt(accTotals.grossRevenue)} €`} label="CA brut total" color="#267253" />
              <KpiCard icon={<Percent size={20} strokeWidth={1.5} />} value={`${fmt(accTotals.commissionAmount)} €`} label="Commissions plateforme" color="#f59e0b" />
              <KpiCard icon={<Wallet size={20} strokeWidth={1.5} />} value={`${fmt(accTotals.netAmount)} €`} label="Net à reverser (total)" color="#10b981" />
            </div>
          )}

          {/* Tableau des chauffeurs */}
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Chauffeur</th>
                  <th style={{ textAlign:'center' }}>Courses</th>
                  <th style={{ textAlign:'right' }}>CA brut</th>
                  <th style={{ textAlign:'center' }}>Commission</th>
                  <th style={{ textAlign:'right' }}>Commission €</th>
                  <th style={{ textAlign:'right', color:'#10b981' }}>Net à reverser</th>
                  <th style={{ textAlign:'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {accSummary.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign:'center', padding:32, color:'rgba(255,255,255,0.3)' }}>Aucun chauffeur.</td></tr>
                ) : accSummary.map(d => (
                  <tr key={d.id} className={d.rideCount === 0 ? 'adm-acc-row-inactive' : ''}>
                    <td>
                      <div style={{ fontWeight:600, color:'#fff' }}>{d.name}</div>
                      <div style={{ fontSize:'0.76rem', color:'rgba(255,255,255,0.38)' }}>{d.email}</div>
                      {d.businessName && <div style={{ fontSize:'0.74rem', color:'#267253' }}>{d.businessName}</div>}
                    </td>
                    <td style={{ textAlign:'center', color: d.rideCount > 0 ? '#fff' : 'rgba(255,255,255,0.25)', fontWeight:700, fontSize:'1.05rem' }}>
                      {d.rideCount}
                    </td>
                    <td style={{ textAlign:'right', color:'#267253', fontWeight:700 }}>
                      {d.grossRevenue > 0 ? `${fmt(d.grossRevenue)} €` : <span style={{ color:'rgba(255,255,255,0.2)' }}>—</span>}
                    </td>
                    {/* Commission — édition inline */}
                    <td style={{ textAlign:'center' }}>
                      {accEditComm[d.id] !== undefined ? (
                        <div style={{ display:'flex', alignItems:'center', gap:4, justifyContent:'center' }}>
                          <input
                            type="number" min="0" max="100" step="0.5"
                            className="adm-input"
                            style={{ width:72, marginBottom:0, padding:'5px 8px', textAlign:'center' }}
                            value={accEditComm[d.id]}
                            onChange={e => onCommissionInputChange(d.id, e.target.value)}
                          />
                          <span style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.8rem' }}>%</span>
                          <button
                            className="adm-btn-icon-sm" style={{ color:'#10b981' }}
                            disabled={accCommSaving[d.id]}
                            onClick={() => onSaveCommission(d.id, accEditComm[d.id])}
                            title="Enregistrer"
                          >
                            {accCommSaving[d.id] ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} strokeWidth={2.5} />}
                          </button>
                          <button className="adm-btn-icon-sm" style={{ color:'rgba(255,255,255,0.3)' }}
                            onClick={() => onCancelEditCommission(d.id)}>
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display:'flex', alignItems:'center', gap:4, justifyContent:'center' }}>
                          <span className="adm-acc-rate">{d.commissionRate}%</span>
                          <button
                            className="adm-btn-icon-sm"
                            title="Modifier le taux"
                            onClick={() => onStartEditCommission(d.id, d.commissionRate)}
                          ><Edit3 size={12} strokeWidth={1.75} /></button>
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign:'right', color:'#f59e0b', fontWeight:600 }}>
                      {d.commissionAmount > 0 ? `${fmt(d.commissionAmount)} €` : <span style={{ color:'rgba(255,255,255,0.2)' }}>—</span>}
                    </td>
                    <td style={{ textAlign:'right' }}>
                      <span style={{
                        color: d.netAmount > 0 ? '#10b981' : 'rgba(255,255,255,0.25)',
                        fontWeight: 800, fontSize:'1rem',
                      }}>
                        {d.netAmount > 0 ? `${fmt(d.netAmount)} €` : '—'}
                      </span>
                    </td>
                    <td style={{ textAlign:'center' }}>
                      <div style={{ display:'flex', gap:4, justifyContent:'center' }}>
                        <button
                          className="adm-btn-icon-sm" title="Voir le détail"
                          onClick={() => onViewDetail(d.id)}
                        ><Eye size={14} strokeWidth={1.75} /></button>
                        <button
                          className="adm-btn-icon-sm" title="Télécharger le bordereau PDF"
                          disabled={accPdfLoading[d.id] || d.rideCount === 0}
                          style={{ color: d.rideCount > 0 ? '#267253' : 'rgba(255,255,255,0.2)', cursor: d.rideCount === 0 ? 'not-allowed' : 'pointer' }}
                          onClick={() => onDownloadPdf(d.id)}
                        >
                          {accPdfLoading[d.id] ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} strokeWidth={1.75} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Détail chauffeur (inline panel) ── */}
          <AnimatePresence>
            {(accDetail || accDetailLoading) && (
              <motion.div
                className="adm-acc-detail-panel"
                initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, y:8 }} transition={{ duration:0.2 }}
              >
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <FileText size={16} strokeWidth={1.75} style={{ color:'#267253' }} />
                    <strong style={{ color:'#fff', fontSize:'0.97rem' }}>
                      {accDetailLoading ? 'Chargement…' : `Détail — ${accDetail?.driver?.name}`}
                    </strong>
                    {accDetail && <span style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.35)' }}>{accDetail.period?.label}</span>}
                  </div>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    {accDetail && (
                      <button
                        className="adm-btn-ghost" style={{ fontSize:'0.82rem', padding:'6px 14px' }}
                        disabled={accPdfLoading[accDetail.driver.id] || accDetail.summary.rideCount === 0}
                        onClick={() => onDownloadPdf(accDetail.driver.id)}
                      >
                        {accPdfLoading[accDetail.driver.id] ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} strokeWidth={1.75} />}
                        Bordereau PDF
                      </button>
                    )}
                    <button className="adm-btn-icon-sm" onClick={onCloseDetail}><X size={16} /></button>
                  </div>
                </div>

                {accDetailLoading ? (
                  <div style={{ textAlign:'center', padding:24 }}><Loader2 size={22} className="animate-spin" style={{ color:'#267253' }} /></div>
                ) : accDetail && (
                  <>
                    {/* Recap financier */}
                    <div className="adm-acc-recap">
                      {[
                        { label:'Courses',          value:`${accDetail.summary.rideCount}`,                  color:'#6366f1' },
                        { label:'CA brut',          value:`${fmt(accDetail.summary.grossRevenue)} €`,        color:'#267253' },
                        { label:`Commission (${accDetail.summary.commissionRate}%)`, value:`– ${fmt(accDetail.summary.commissionAmount)} €`, color:'#f59e0b' },
                        { label:'Net à reverser',   value:`${fmt(accDetail.summary.netAmount)} €`,           color:'#10b981' },
                      ].map((s, i) => (
                        <div key={i} className="adm-acc-recap-item">
                          <span className="adm-acc-recap-value" style={{ color:s.color }}>{s.value}</span>
                          <span className="adm-acc-recap-label">{s.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Liste des courses */}
                    {accDetail.rides.length === 0 ? (
                      <div style={{ color:'rgba(255,255,255,0.3)', fontSize:'0.85rem', padding:'12px 0' }}>Aucune course sur cette période.</div>
                    ) : (
                      <div className="adm-table-wrap" style={{ marginTop:16 }}>
                        <table className="adm-table" style={{ fontSize:'0.82rem' }}>
                          <thead>
                            <tr><th>N°</th><th>Date</th><th>Trajet</th><th>Dist.</th><th style={{ textAlign:'right' }}>Prix</th></tr>
                          </thead>
                          <tbody>
                            {accDetail.rides.map(r => (
                              <tr key={r.id}>
                                <td style={{ color:'#267253', fontWeight:700, fontSize:'0.78rem' }}>{r.reservationNumber}</td>
                                <td style={{ color:'rgba(255,255,255,0.55)', whiteSpace:'nowrap' }}>{fmtDate(r.date)}</td>
                                <td style={{ maxWidth:220 }}>
                                  <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'rgba(255,255,255,0.7)' }}>{r.departureAddress}</div>
                                  <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'rgba(255,255,255,0.38)', fontSize:'0.76rem' }}>→ {r.arrivalAddress}</div>
                                </td>
                                <td style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.78rem', whiteSpace:'nowrap' }}>{r.distance ? `${parseFloat(r.distance).toFixed(1)} km` : '—'}</td>
                                <td style={{ textAlign:'right', color:'#267253', fontWeight:700 }}>{fmt(r.price)} €</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <div className="adm-empty">Cliquez sur une période pour charger les données.</div>
      )}
    </div>
  );
}
