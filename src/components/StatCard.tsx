import type { LucideIcon } from 'lucide-react';

type Props = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent: string;
};

export default function StatCard({ label, value, icon: Icon, accent }: Props) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex items-center gap-4">
      <div className={`rounded-xl p-2.5 ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white leading-none">{value}</p>
        <p className="text-xs text-slate-400 mt-1">{label}</p>
      </div>
    </div>
  );
}
