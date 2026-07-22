import { Plus, Search, Loader2, ToggleRight, ToggleLeft, Pencil, Trash2 } from 'lucide-react';
import Pagination from './Pagination';

export default function ContactsSection({
  contactsList, contactsTotal, contactPage, contactSearch, contactsLoading,
  onSearchChange, onPage, onCreate, onEdit, onDelete, onTogglePublic,
}) {
  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h1>Cartes de visite</h1>
        <button className="adm-btn-primary" onClick={onCreate}>
          <Plus size={15} strokeWidth={2} /> Nouvelle carte
        </button>
      </div>
      <p className="adm-section-desc">
        Carte de visite numérique publique (/contact/:slug) avec vCard et QR code — réutilisable pour
        n'importe quel collaborateur ou société, indépendamment des chauffeurs.
      </p>

      <div className="adm-filters">
        <div className="adm-search-wrap">
          <Search size={15} strokeWidth={1.75} />
          <input
            type="text" className="adm-search" placeholder="Rechercher par nom ou société…"
            value={contactSearch} onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {contactsLoading ? (
        <div className="adm-loader"><Loader2 size={28} className="animate-spin" /></div>
      ) : (
        <>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr><th>Contact</th><th>Société</th><th>Lien public</th><th>Statut</th><th></th></tr>
              </thead>
              <tbody>
                {contactsList.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'rgba(255,255,255,0.3)' }}>Aucune carte de visite.</td></tr>
                ) : contactsList.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{c.firstName} {c.lastName}</div>
                      {c.jobTitle && <div style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.38)' }}>{c.jobTitle}</div>}
                    </td>
                    <td style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem' }}>{c.company || '—'}</td>
                    <td style={{ fontSize: '0.8rem' }}>
                      <a href={`/contact/${c.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: '#267253' }}>
                        /contact/{c.slug}
                      </a>
                    </td>
                    <td>
                      <button
                        className="adm-btn-icon" onClick={() => onTogglePublic(c)}
                        title={c.isPublic ? 'Publique — cliquer pour dépublier' : 'Privée — cliquer pour publier'}
                        style={{ color: c.isPublic ? '#10b981' : 'rgba(255,255,255,0.35)' }}
                      >
                        {c.isPublic ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="adm-btn-icon" title="Modifier" onClick={() => onEdit(c.id)}><Pencil size={14} /></button>
                        <button className="adm-btn-icon" title="Supprimer" style={{ color: '#ef4444' }} onClick={() => onDelete(c.id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={contactPage} total={contactsTotal} perPage={20} onPage={onPage} />
        </>
      )}
    </div>
  );
}
