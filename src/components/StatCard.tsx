import type { LucideIcon } from 'lucide-react';

type Props = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent: string;
  compact?: boolean;
  onClick?: () => void;
  active?: boolean;
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  compact = false,
  onClick,
  active = false,
}: Props) {
  const content = (
    <>
      <div
        className={`hidden shrink-0 rounded-lg p-2 sm:block sm:rounded-xl sm:p-2.5 ${accent}`}
      >
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`truncate font-bold leading-none text-white sm:text-2xl ${
            compact ? 'text-base' : 'text-[17px]'
          }`}
        >
          {value}
        </p>
        <p
          className={`mt-1 leading-tight text-slate-400 sm:text-xs ${
            compact ? 'text-[10px]' : 'text-[11px]'
          }`}
        >
          {label}
        </p>
      </div>
    </>
  );

  const base = `flex w-full items-center text-left rounded-xl border bg-slate-900/60 sm:gap-4 sm:rounded-2xl sm:p-4 ${
    compact ? 'gap-1.5 p-2' : 'gap-2.5 p-2.5'
  } ${
    active
      ? 'border-amber-500/50 bg-amber-500/5'
      : 'border-slate-800'
  }`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`Filtrar ${label}: ${value}`}
        aria-pressed={active}
        className={`${base} transition hover:border-amber-500/40 hover:bg-slate-900`}
      >
        {content}
      </button>
    );
  }

  return <div className={base}>{content}</div>;
}
