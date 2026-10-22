import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Plus,
  Sparkles,
  Inbox,
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  ListChecks,
  CheckCircle2,
  Link2,
  Share2,
  Wallet,
} from 'lucide-react';
import type { Maintenance, VehicleType } from '../types';
import type { WorkshopSettings } from '../lib/settings';
import { getStatus } from '../lib/utils';
import MaintenanceCard from './MaintenanceCard';
import StatCard from './StatCard';

type FilterId = 'pendientes' | 'vencidos' | 'hoy' | 'semana' | 'completados';
type VehicleFilter = 'todos' | VehicleType;

type Props = {
  items: Maintenance[];
  shopName: string;
  settings: WorkshopSettings;
  onNew: () => void;
  onSeed: () => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onInvoice: (item: Maintenance) => void;
  onEdit: (item: Maintenance) => void;
};

export default function AgendaView({
  items,
  shopName,
  settings,
  onNew,
  onSeed,
  onToggle,
  onDelete,
  onInvoice,
  onEdit,
}: Props) {
  const [filter, setFilter] = useState<FilterId>('pendientes');
  const [vehicleFilter, setVehicleFilter] = useState<VehicleFilter>('todos');
  const [query, setQuery] = useState('');
  const [shared, setShared] = useState(false);
  const listRef = useRef<HTMLElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 });
  }, [filter, vehicleFilter, query]);

  const counts = useMemo(
    () => ({
      pendientes: items.filter((item) => !item.completed).length,
      vencidos: items.filter((item) => getStatus(item) === 'vencido').length,
      hoy: items.filter((item) => getStatus(item) === 'hoy').length,
      semana: items.filter((item) => getStatus(item) === 'semana').length,
      completados: items.filter((item) => item.completed).length,
    }),
    [items],
  );

  const visibleItems = useMemo(() => {
    const term = query.trim().toLowerCase();
    return items
      .filter((item) => {
        if (vehicleFilter !== 'todos' && item.vehicleType !== vehicleFilter) {
          return false;
        }
        if (filter === 'completados') return item.completed;
        if (item.completed) return false;
        const status = getStatus(item);
        if (filter === 'vencidos') return status === 'vencido';
        if (filter === 'hoy') return status === 'hoy';
        if (filter === 'semana') return status === 'semana';
        return true;
      })
      .filter((item) => {
        if (!term) return true;
        return [
          item.clientName,
          item.clientPhone,
          item.vehicleBrand,
          item.vehicleModel,
          item.vehiclePlate,
          item.services.join(' '),
        ]
          .join(' ')
          .toLowerCase()
          .includes(term);
      })
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
  }, [items, filter, vehicleFilter, query]);

  const paypalLink = settings.enabledMethods.includes('paypal')
    ? settings.paypalLink
    : '';
  const paymentLink = settings.enabledMethods.includes('link')
    ? settings.paymentLink
    : '';
  const paymentLinkLabel = settings.paymentLinkLabel || 'Link de pago';
  const hasLinks =
    settings.showPaymentLinks && Boolean(paypalLink || paymentLink);

  async function shareLinks() {
    const text = [
      paypalLink ? `PayPal: ${paypalLink}` : '',
      paymentLink ? `${paymentLinkLabel}: ${paymentLink}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Cobros de ${shopName}`,
          text,
        });
        return;
      }
      await navigator.clipboard.writeText(text);
      setShared(true);
      window.setTimeout(() => setShared(false), 2000);
    } catch {
      /* el usuario canceló o el navegador no permite compartir */
    }
  }

  const filters: { id: FilterId; label: string; count: number }[] = [
    { id: 'pendientes', label: 'Pendientes', count: counts.pendientes },
    { id: 'vencidos', label: 'Vencidos', count: counts.vencidos },
    { id: 'hoy', label: 'Hoy', count: counts.hoy },
    { id: 'semana', label: 'Esta semana', count: counts.semana },
    { id: 'completados', label: 'Completados', count: counts.completados },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-4 pt-3">
        <section className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <StatCard
          label="Vencidos"
          value={counts.vencidos}
          icon={AlertTriangle}
          accent="bg-red-500/15 text-red-400"
          onClick={() => setFilter('vencidos')}
          active={filter === 'vencidos'}
        />
        <StatCard
          label="Para hoy"
          value={counts.hoy}
          icon={CalendarClock}
          accent="bg-amber-500/15 text-amber-400"
          onClick={() => setFilter('hoy')}
          active={filter === 'hoy'}
        />
        <StatCard
          label="Esta semana"
          value={counts.semana}
          icon={CalendarDays}
          accent="bg-sky-500/15 text-sky-400"
          onClick={() => setFilter('semana')}
          active={filter === 'semana'}
        />
        <StatCard
          label="Pendientes totales"
          value={counts.pendientes}
          icon={ListChecks}
          accent="bg-slate-500/15 text-slate-300"
          onClick={() => setFilter('pendientes')}
          active={filter === 'pendientes'}
        />
        </section>
        {settings.welcomeMessage && (
          <p className="mt-2 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-[11px] leading-relaxed text-slate-300">
            {settings.welcomeMessage}
          </p>
        )}
        {hasLinks && (
          <section className="mt-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-medium text-slate-300">
                Links de cobro
              </p>
              <button
                type="button"
                onClick={shareLinks}
                aria-label="Compartir links de cobro"
                title="Compartir links de cobro"
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-amber-300 hover:bg-amber-500/10"
              >
                {shared ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Share2 className="h-3.5 w-3.5" />
                )}
                {shared ? 'Copiado' : 'Compartir'}
              </button>
            </div>
            <div
              className={`mt-2 grid gap-2 ${
                paypalLink && paymentLink ? 'sm:grid-cols-2' : ''
              }`}
            >
              {paypalLink && (
                <a
                  href={paypalLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 px-2 py-2 text-xs font-medium text-slate-100 ring-1 ring-slate-700 hover:bg-slate-700"
                >
                  <Wallet className="h-3.5 w-3.5 text-sky-300" /> PayPal
                </a>
              )}
              {paymentLink && (
                <a
                  href={paymentLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 px-2 py-2 text-xs font-medium text-slate-100 ring-1 ring-slate-700 hover:bg-slate-700"
                >
                  <Link2 className="h-3.5 w-3.5 text-emerald-300" />
                  <span className="truncate text-center">
                    {paymentLinkLabel}
                  </span>
                </a>
              )}
            </div>
          </section>
        )}
      </div>

      <div className="shrink-0 px-4 pt-3">
        <div className="no-scrollbar -mx-1 hidden gap-1.5 overflow-x-auto px-1 pb-1 sm:flex">
          {filters.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id)}
              className={`shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                filter === option.id
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-900 text-slate-300 ring-1 ring-slate-800 hover:bg-slate-800'
              }`}
            >
              {option.label}
              <span
                className={`ml-1 text-[11px] ${
                  filter === option.id ? 'text-slate-800' : 'text-slate-500'
                }`}
              >
                {option.count}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-2 flex items-center gap-2">
          <select
            value={vehicleFilter}
            onChange={(e) =>
              setVehicleFilter(e.target.value as VehicleFilter)
            }
            aria-label="Filtrar por vehículo"
            className="w-20 shrink-0 rounded-lg border border-slate-800 bg-slate-900 px-2 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/60 sm:w-auto sm:px-3 sm:text-sm"
          >
            <option value="todos">Todos</option>
            <option value="carro">Carros</option>
            <option value="moto">Motos</option>
          </select>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 pl-8 pr-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60 sm:w-56"
            />
          </div>
          <button
            type="button"
            onClick={() =>
              setFilter((current) =>
                current === 'completados' ? 'pendientes' : 'completados',
              )
            }
            aria-label={
              filter === 'completados'
                ? 'Volver a pendientes'
                : 'Ver trabajos completados'
            }
            aria-pressed={filter === 'completados'}
            title={
              filter === 'completados'
                ? 'Volver a pendientes'
                : 'Ver trabajos completados'
            }
            className={`inline-flex shrink-0 items-center justify-center rounded-lg p-2 transition sm:hidden ${
              filter === 'completados'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-900 text-slate-400 ring-1 ring-slate-800 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onNew}
            aria-label="Nuevo registro"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nuevo</span>
          </button>
        </div>
      </div>

      <section ref={listRef} className="no-scrollbar mt-3 flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-4">
        {filter === 'completados' && (
          <div className="mb-2 flex items-center justify-between gap-2 text-[11px] text-slate-400">
            <span>Mostrando completados ({counts.completados})</span>
            <button
              type="button"
              onClick={() => setFilter('pendientes')}
              className="font-medium text-amber-300 hover:text-amber-200"
            >
              Volver
            </button>
          </div>
        )}
        <div className="space-y-3">
        {visibleItems.map((item) => (
          <MaintenanceCard
            key={item.id}
            item={item}
            shopName={shopName}
            onToggle={onToggle}
            onDelete={onDelete}
            onInvoice={onInvoice}
            onEdit={onEdit}
          />
        ))}

        {visibleItems.length === 0 && items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 px-6 py-12 text-center">
            <Inbox className="mx-auto h-10 w-10 text-slate-600" />
            <p className="mt-3 font-medium text-slate-200">
              Todavía no hay registros
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Cargá tu primer cliente o probá con datos de ejemplo.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={onNew}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400"
              >
                <Plus className="h-4 w-4" /> Nuevo registro
              </button>
              <button
                type="button"
                onClick={onSeed}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
              >
                <Sparkles className="h-4 w-4" /> Cargar ejemplos
              </button>
            </div>
          </div>
        )}

        {visibleItems.length === 0 && items.length > 0 && (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 px-6 py-12 text-center">
            <Search className="mx-auto h-8 w-8 text-slate-600" />
            <p className="mt-3 text-sm text-slate-400">
              No hay registros que coincidan con este filtro.
            </p>
          </div>
        )}
        </div>
      </section>
    </div>
  );
}
