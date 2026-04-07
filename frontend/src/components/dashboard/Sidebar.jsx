import { LayoutDashboard, ClipboardList, BarChart2, Calculator, Settings, LogOut } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard',    Icon: LayoutDashboard, label: 'Tableau de bord' },
  { id: 'reservations', Icon: ClipboardList,   label: 'Réservations' },
  { id: 'stats',        Icon: BarChart2,        label: 'Statistiques' },
  { id: 'calculateur',  Icon: Calculator,       label: 'Calculateur prix' },
  { id: 'settings',     Icon: Settings,         label: 'Paramètres' },
];

export default function Sidebar({ view, setView, driver, onLogout }) {
  return (
    <aside className="w-64 bg-[#0a0a12] border-r border-white/8 flex flex-col min-h-screen shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-white/8">
        <div className="flex items-center gap-3">
          <img src="/images/logo-3m-new.svg" alt="Logo 3M Drive" style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }} />
          <div>
            <div className="text-[#D4AF37] font-bold text-sm tracking-wide">3M Drive</div>
            <div className="text-white/30 text-xs">Cockpit chauffeur</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 flex flex-col gap-1">
        {NAV_ITEMS.map(({ id, Icon, label }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              view === id
                ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-l-2 border-[#D4AF37]'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon size={16} strokeWidth={1.5} />
            {label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/8">
        <div className="px-3 py-2 mb-2">
          <div className="text-white/50 text-xs mb-0.5">Connecté en tant que</div>
          <div className="text-[#D4AF37] text-sm font-medium">{driver?.name}</div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut size={16} strokeWidth={1.5} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
