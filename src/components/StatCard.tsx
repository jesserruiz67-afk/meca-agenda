import type { LucideIcon } from 'lucide-react';

type Props = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent: string;
  compact?: boolean;
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  compact = false,
}: Props) {
  return (
    <div
      className={`flex items-center rounded-xl border border-slate-800 bg-slate-900/60 sm:gap-4 sm:rounded-2xl sm:p-4 ${
        compact ? 'gap-1.5 p-2' : 'gap-2.5 p-2.5'
      }`}
    >
      <div
        className={`rounded-lg p-2 sm:rounded-xl sm:p-2.5 ${
          compact ? 'hidden sm:block' : ''
        } ${accent}`}
      >
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <div className="min-w-0">
        <p
          className={`truncate font-bold leading-none text-white sm:text-2xl ${
            compact ? 'text-base' : 'text-lg'
          }`}
        >
          {value}
        </p>
        <p
          className={`mt-1 truncate text-slate-400 sm:text-xs ${
            compact ? 'text-[10px]' : 'text-[11px]'
          }`}
        >
          {label}
        </p>
      </div>
    </div>
  );
}
