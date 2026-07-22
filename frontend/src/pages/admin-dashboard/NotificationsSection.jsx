import { Users, UserCog, Send, ChevronRight, Loader2 } from 'lucide-react';

export default function NotificationsSection({ broadcast, setBroadcast, broadcastSending, broadcastResult, onSendBroadcast, onNavigate }) {
  return (
    <div className="adm-section">
      <div className="adm-section-header"><h1>Notifications</h1></div>
      <p className="adm-section-desc">Envoyez un message ciblé à un ou tous vos chauffeurs actifs.</p>

      <div className="adm-notif-cards">
        {/* Broadcast tous chauffeurs */}
        <div className="adm-notif-card">
          <div className="adm-notif-card-header">
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:40, height:40, borderRadius:12, background:'rgba(99,102,241,0.15)', display:'flex', alignItems:'center', justifyContent:'center', color:'#6366f1' }}>
                <Users size={20} strokeWidth={1.5} />
              </div>
              <div>
                <div style={{ fontWeight:700, color:'#fff', fontSize:'0.97rem' }}>Tous les chauffeurs actifs</div>
                <div style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.4)' }}>Diffusion générale</div>
              </div>
            </div>
          </div>
          <div className="adm-notif-form">
            <input type="text" className="adm-input" placeholder="Objet (facultatif)"
              value={broadcast.subject} onChange={e => setBroadcast(p => ({ ...p, subject: e.target.value }))} />
            <textarea className="adm-input" rows={5} placeholder="Rédigez votre message…"
              style={{ resize:'vertical', minHeight:100 }}
              value={broadcast.message} onChange={e => setBroadcast(p => ({ ...p, message: e.target.value }))} />
            <button className="adm-btn-primary" disabled={!broadcast.message.trim() || broadcastSending} onClick={onSendBroadcast}>
              {broadcastSending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} strokeWidth={2} />}
              Envoyer à tous les chauffeurs actifs
            </button>
            {broadcastResult && (
              <div style={{ fontSize:'0.82rem', marginTop:8, color: broadcastResult.includes('Erreur') ? '#ef4444' : '#10b981' }}>
                {broadcastResult}
              </div>
            )}
          </div>
        </div>

        {/* Chauffeur individuel */}
        <div className="adm-notif-card">
          <div className="adm-notif-card-header">
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:40, height:40, borderRadius:12, background:'rgba(38,114,83,0.1)', display:'flex', alignItems:'center', justifyContent:'center', color:'#267253' }}>
                <UserCog size={20} strokeWidth={1.5} />
              </div>
              <div>
                <div style={{ fontWeight:700, color:'#fff', fontSize:'0.97rem' }}>Chauffeur individuel</div>
                <div style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.4)' }}>Cliquez sur un chauffeur dans le CRM pour lui envoyer un message</div>
              </div>
            </div>
          </div>
          <button className="adm-btn-ghost-full" onClick={() => onNavigate('drivers')}>
            <Users size={15} strokeWidth={1.75} /> Aller au CRM Chauffeurs <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
