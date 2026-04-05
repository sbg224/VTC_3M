export default function KpiCard({ label, value, context, Icon }) {
  return (
    <div className="bg-[#111118] border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-white/50 text-sm">{label}</span>
        <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center">
          <Icon size={18} strokeWidth={1.5} className="text-[#D4AF37]" />
        </div>
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
      {context && <div className="text-xs text-white/30 mt-1">{context}</div>}
    </div>
  );
}
