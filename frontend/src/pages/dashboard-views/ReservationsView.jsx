import { ClipboardList, Inbox, Flag } from 'lucide-react';
import { formatDate } from '../../utils/formatDate';
import { STATUS_LABELS } from './statusLabels';

export default function ReservationsView({
  reservations, total, page, pages, statusFilter, search, loadingData,
  onSearchChange, onStatusFilterChange, onPage, onSelectReservation, onCompleteReservation,
}) {
  return (
    <>
      <div className="dashboard-header">
        <h1 className="icon-heading"><ClipboardList size={22} strokeWidth={1.5} /> Réservations</h1>
        <p>Gérez toutes vos courses ({total} au total)</p>
      </div>

      <div className="filters-bar">
        <input
          className="search-input"
          type="search"
          placeholder="Rechercher (nom, email, numéro…)"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
        />
        <select
          className="filter-select"
          value={statusFilter}
          onChange={e => onStatusFilterChange(e.target.value)}
        >
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="confirmed">Confirmées</option>
          <option value="completed">Terminées</option>
          <option value="cancelled">Annulées</option>
        </select>
      </div>

      <div className="card">
        <div className="table-container">
          {loadingData ? (
            <div className="loader-container"><div className="loader"></div></div>
          ) : reservations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-gray)' }}>
              <Inbox size={40} strokeWidth={1} style={{ margin: '0 auto 16px', color: 'var(--color-gray)' }} />
              <p>Aucune réservation trouvée.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>N° Réservation</th>
                  <th>Client</th>
                  <th>Téléphone</th>
                  <th>Date</th>
                  <th>Trajet</th>
                  <th>Statut</th>
                  <th>Prix</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map(r => {
                  const s = STATUS_LABELS[r.status];
                  return (
                    <tr key={r.id}>
                      <td><strong style={{ color: 'var(--color-accent)' }}>{r.reservationNumber}</strong></td>
                      <td>
                        <div style={{ fontWeight: '600' }}>{r.firstName} {r.lastName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-gray)' }}>{r.email}</div>
                      </td>
                      <td>{r.phone}</td>
                      <td>
                        <div>{formatDate(r.date)}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--color-gray)' }}>{r.time}</div>
                      </td>
                      <td style={{ maxWidth: '200px' }}>
                        <div style={{ fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-success)', display: 'inline-block', flexShrink: 0 }}></span> {r.departureAddress}
                        </div>
                        <div style={{ fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-error)', display: 'inline-block', flexShrink: 0 }}></span> {r.arrivalAddress}
                        </div>
                      </td>
                      <td><span className={`badge ${s.badge}`}><s.Icon size={12} strokeWidth={1.5} /> {s.label}</span></td>
                      <td>{r.price ? `${Number(r.price).toFixed(2)} €` : '—'}</td>
                      <td>
                        <div className="actions">
                          <button className="btn btn-sm btn-dark" onClick={() => onSelectReservation(r)}>
                            Détails
                          </button>
                          {(r.status === 'pending' || r.status === 'confirmed') && (
                            <button
                              className="btn btn-sm"
                              style={{ background: 'var(--color-success)', color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => onCompleteReservation(r)}
                            >
                              <Flag size={13} strokeWidth={1.5} /> Valider
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {pages > 1 && (
        <div className="pagination">
          <button className="page-btn" onClick={() => onPage(page - 1)} disabled={page === 1}>‹</button>
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => onPage(p)}>{p}</button>
          ))}
          <button className="page-btn" onClick={() => onPage(page + 1)} disabled={page === pages}>›</button>
        </div>
      )}
    </>
  );
}
