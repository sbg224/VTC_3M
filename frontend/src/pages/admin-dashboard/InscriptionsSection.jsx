import { RefreshCw, Loader2, CheckCircle, XCircle, Eye, Mail, Phone } from 'lucide-react';
import { fmtDate } from './adminHelpers';

export default function InscriptionsSection({ drivers, driversLoading, onRefresh, onValidate, onReject, onSelectDriver }) {
  const pending = drivers.filter(d => d.status === 'pending');

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h1>Inscriptions en attente</h1>
        <button className="adm-btn-icon" onClick={onRefresh}><RefreshCw size={16} strokeWidth={1.75} /></button>
      </div>
      <p className="adm-section-desc">Validez ou rejetez les nouveaux chauffeurs qui souhaitent rejoindre la plateforme.</p>

      {driversLoading ? (
        <div className="adm-loader"><Loader2 size={28} className="animate-spin" /></div>
      ) : pending.length === 0 ? (
        <div className="adm-empty">
          <CheckCircle size={36} strokeWidth={1} style={{ color:'#10b981', marginBottom:12 }} />
          <p>Aucune inscription en attente. Tout est traité.</p>
        </div>
      ) : (
        <div className="adm-inscriptions-list">
          {pending.map(d => (
            <div key={d.id} className="adm-inscription-card">
              <div className="adm-inscription-left">
                <div className="adm-avatar">{d.name?.charAt(0).toUpperCase()}</div>
                <div>
                  <div className="adm-inscription-name">{d.name}</div>
                  <div className="adm-inscription-meta"><Mail size={12} /> {d.email}</div>
                  {d.phone && <div className="adm-inscription-meta"><Phone size={12} /> {d.phone}</div>}
                  {d.businessName && <div className="adm-inscription-meta" style={{ color:'#267253' }}>{d.businessName}</div>}
                  <div className="adm-inscription-date">Inscrit le {fmtDate(d.createdAt)}</div>
                </div>
              </div>
              <div className="adm-inscription-actions">
                <button className="adm-btn-success" onClick={() => onValidate(d.id)}>
                  <CheckCircle size={14} strokeWidth={2} /> Valider (essai 14j)
                </button>
                <button className="adm-btn-danger" onClick={() => onReject(d.id)}>
                  <XCircle size={14} strokeWidth={2} /> Rejeter
                </button>
                <button className="adm-btn-ghost" onClick={() => onSelectDriver(d.id)}>
                  <Eye size={14} strokeWidth={1.75} /> Détail
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
