import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, total, perPage, onPage }) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;
  return (
    <div className="adm-pagination">
      <button className="adm-page-btn" disabled={page === 1} onClick={() => onPage(page - 1)}>
        <ChevronLeft size={15} />
      </button>
      <span style={{ fontSize:'0.82rem', color:'rgba(255,255,255,0.5)' }}>Page {page} / {pages} · {total} résultats</span>
      <button className="adm-page-btn" disabled={page === pages} onClick={() => onPage(page + 1)}>
        <ChevronRight size={15} />
      </button>
    </div>
  );
}
