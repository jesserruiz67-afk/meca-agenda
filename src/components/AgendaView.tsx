import { useMemo, useState } from 'react';
import {
  Search,
  Plus,
  Sparkles,
  Inbox,
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  ListChecks,
} from 'lucide-react';
import type { Maintenance, VehicleType } from '../types';
import { getStatus } from '../lib/utils';
import MaintenanceCard from './MaintenanceCard';
import StatCard from './StatCard';

type FilterId = 'pendientes' | 'vencidos' | 'hoy' | 'semana' | 'completados';
type VehicleFilter = 'todos' | VehicleType;

type Props = {
  items: Maintenance[];
  shopName: string;
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

  const filters: { id: FilterId; label: string; count: number }[] = [
    { id: 'pendientes', label: 'Pendientes', count: counts.pendientes },
    { id: 'vencidos', label: 'Vencidos', count: counts.vencidos },
    { id: 'hoy', label: 'Hoy', count: counts.hoy },
    { id: 'semana', label: 'Esta semana', count: counts.semana },
    { id: 'completados', label: 'Completados', count: counts.completados },
  ];

  return (
    <div>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Vencidos"
          value={counts.vencidos}
          icon={AlertTriangle}
          accent="bg-red-500/15 text-red-400"
        />
        <StatCard
          label="Para hoy"
          value={counts.hoy}
          icon={CalendarClock}
          accent="bg-amber-500/15 text-amber-400"
        />
        <StatCard
          label="Esta semana"
          value={counts.semana}
          icon={CalendarDays}
          accent="bg-sky-500/15 text-sky-400"
        />
        <StatCard
          label="Pendientes totales"
          value={counts.pendientes}
          icon={ListChecks}
          accent="bg-slate-500/15 text-slate-300"
        />
      </section>

      <section className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                filter === option.id
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-900 text-slate-300 ring-1 ring-slate-800 hover:bg-slate-800'
              }`}
            >
              {option.label}
              <span
                className={`ml-1.5 text-xs ${
                  filter === option.id ? 'text-slate-800' : 'text-slate-500'
                }`}
              >
                {option.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={vehicleFilter}
            onChange={(e) =>
              setVehicleFilter(e.target.value as VehicleFilter)
            }
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
          >
            <option value="todos">Todos los vehículos</option>
            <option value="carro">Carros</option>
            <option value="moto">Motos</option>
          </select>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar cliente, placa..."
              className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60 sm:w-56"
            />
          </div>
          <button
            type="button"
            onClick={onNew}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400"
          >
            <Plus className="h-4 w-4" /> Nuevo
          </button>
        </div>
      </section>

      <section className="mt-5 space-y-3 pb-10">
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
      </section>
    </div>
  );
}
