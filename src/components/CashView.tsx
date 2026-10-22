import { useMemo, useState } from 'react';
import {
  Wallet,
  Plus,
  Trash2,
  ArrowDownCircle,
  ArrowUpCircle,
  Calculator,
  Banknote,
  Landmark,
  CreditCard,
} from 'lucide-react';
import type { Maintenance, PaymentMethod, Transaction } from '../types';
import {
  PAYMENT_LABELS,
  formatDate,
  formatMoney,
  monthKey,
  todayISO,
  toISO,
} from '../lib/utils';
import StatCard from './StatCard';
import TransactionForm from './TransactionForm';

type Period = 'hoy' | 'mes';

type Props = {
  transactions: Transaction[];
  maintenances: Maintenance[];
  onAdd: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
};

const METHOD_ICONS: Record<PaymentMethod, typeof Banknote> = {
  efectivo: Banknote,
  transferencia: Landmark,
  tarjeta: CreditCard,
};

export default function CashView({
  transactions,
  maintenances,
  onAdd,
  onDelete,
}: Props) {
  const [period, setPeriod] = useState<Period>('hoy');
  const [countedCash, setCountedCash] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  const allMovements = useMemo(() => {
    const serviceIncomes: Transaction[] = maintenances
      .filter((item) => item.completed && item.totalAmount > 0)
      .map((item) => ({
        id: `service-${item.id}`,
        date: item.completedAt
          ? toISO(new Date(item.completedAt))
          : item.dueDate,
        type: 'ingreso',
        description: `${item.services.join(', ')} - ${item.clientName}`,
        amount: item.totalAmount,
        method: item.paymentMethod,
        maintenanceId: item.id,
        createdAt: item.completedAt ?? item.createdAt,
      }));
    const manual = transactions.filter(
      (transaction) => !transaction.maintenanceId,
    );
    return [...serviceIncomes, ...manual];
  }, [maintenances, transactions]);

  const filtered = useMemo(() => {
    const today = todayISO();
    const month = monthKey();
    return allMovements
      .filter((transaction) =>
        period === 'hoy'
          ? transaction.date === today
          : transaction.date.startsWith(month),
      )
      .sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [allMovements, period]);

  const totals = useMemo(() => {
    let ingresos = 0;
    let egresos = 0;
    let cashIn = 0;
    let cashOut = 0;
    const byMethod: Record<PaymentMethod, number> = {
      efectivo: 0,
      transferencia: 0,
      tarjeta: 0,
    };

    for (const transaction of filtered) {
      const sign = transaction.type === 'ingreso' ? 1 : -1;
      const signed = transaction.amount * sign;
      if (transaction.type === 'ingreso') ingresos += transaction.amount;
      else egresos += transaction.amount;

      byMethod[transaction.method] += signed;

      if (transaction.method === 'efectivo') {
        if (transaction.type === 'ingreso') cashIn += transaction.amount;
        else cashOut += transaction.amount;
      }
    }

    return {
      ingresos,
      egresos,
      balance: ingresos - egresos,
      cashIn,
      cashOut,
      expectedCash: cashIn - cashOut,
      byMethod,
    };
  }, [filtered]);

  const hasCount = countedCash.trim() !== '';
  const difference = hasCount ? Number(countedCash) - totals.expectedCash : 0;
  const differenceLabel = !hasCount
    ? 'Ingresá el efectivo contado'
    : difference === 0
      ? 'Caja cuadrada'
      : difference > 0
        ? 'Sobrante'
        : 'Faltante';
  const differenceClass = !hasCount
    ? 'text-slate-400'
    : difference === 0
      ? 'text-emerald-300'
      : difference > 0
        ? 'text-sky-300'
        : 'text-red-300';

  const periodLabel = period === 'hoy' ? 'hoy' : 'este mes';

  return (
    <div>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Ingresos"
          value={formatMoney(totals.ingresos)}
          icon={ArrowDownCircle}
          accent="bg-emerald-500/15 text-emerald-400"
        />
        <StatCard
          label="Egresos"
          value={formatMoney(totals.egresos)}
          icon={ArrowUpCircle}
          accent="bg-red-500/15 text-red-400"
        />
        <StatCard
          label="Balance"
          value={formatMoney(totals.balance)}
          icon={Wallet}
          accent="bg-sky-500/15 text-sky-400"
        />
        <StatCard
          label="Efectivo esperado"
          value={formatMoney(totals.expectedCash)}
          icon={Banknote}
          accent="bg-amber-500/15 text-amber-400"
        />
      </section>

      <section className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPeriod('hoy')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              period === 'hoy'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-900 text-slate-300 ring-1 ring-slate-800 hover:bg-slate-800'
            }`}
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => setPeriod('mes')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              period === 'mes'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-900 text-slate-300 ring-1 ring-slate-800 hover:bg-slate-800'
            }`}
          >
            Este mes
          </button>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400"
        >
          <Plus className="h-4 w-4" /> Nuevo movimiento
        </button>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Calculator className="h-4 w-4 text-amber-400" />
          Arqueo de caja de {periodLabel}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-slate-400">Efectivo esperado</p>
            <p className="mt-1 text-xl font-bold text-white">
              {formatMoney(totals.expectedCash)}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Cobros en efectivo {formatMoney(totals.cashIn)} · Egresos{' '}
              {formatMoney(totals.cashOut)}
            </p>
          </div>
          <div>
            <label className="text-xs text-slate-400">
              Efectivo contado
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={countedCash}
              onChange={(e) => setCountedCash(e.target.value)}
              placeholder="0"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
            />
          </div>
          <div>
            <p className="text-xs text-slate-400">Diferencia</p>
            <p className={`mt-1 text-xl font-bold ${differenceClass}`}>
              {hasCount ? formatMoney(difference) : '—'}
            </p>
            <p className={`mt-1 text-[11px] ${differenceClass}`}>
              {differenceLabel}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-2 border-t border-slate-800 pt-4 sm:grid-cols-3">
          {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((method) => {
            const Icon = METHOD_ICONS[method];
            return (
              <div
                key={method}
                className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2"
              >
                <span className="inline-flex items-center gap-2 text-xs text-slate-400">
                  <Icon className="h-3.5 w-3.5" />
                  {PAYMENT_LABELS[method]}
                </span>
                <span
                  className={`text-sm font-semibold ${
                    totals.byMethod[method] < 0
                      ? 'text-red-300'
                      : 'text-slate-200'
                  }`}
                >
                  {formatMoney(totals.byMethod[method])}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-6 pb-10">
        <h2 className="mb-1 text-sm font-semibold text-slate-300">
          Movimientos de {periodLabel}
        </h2>
        <p className="mb-3 text-xs text-slate-500">
          Los cobros de servicios se agregan automáticamente al completar un
          trabajo en la Agenda.
        </p>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 px-6 py-10 text-center">
            <Wallet className="mx-auto h-9 w-9 text-slate-600" />
            <p className="mt-3 text-sm text-slate-400">
              No hay movimientos registrados en este período.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
            {filtered.map((transaction) => {
              const isIncome = transaction.type === 'ingreso';
              return (
                <div
                  key={transaction.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div
                    className={`rounded-lg p-1.5 ${
                      isIncome
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    {isIncome ? (
                      <ArrowDownCircle className="h-4 w-4" />
                    ) : (
                      <ArrowUpCircle className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {transaction.description}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(transaction.date)} ·{' '}
                      {PAYMENT_LABELS[transaction.method]}
                      {transaction.maintenanceId
                        ? ' · Automático'
                        : ' · Manual'}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-semibold ${
                      isIncome ? 'text-emerald-300' : 'text-red-300'
                    }`}
                  >
                    {isIncome ? '+' : '-'} {formatMoney(transaction.amount)}
                  </span>
                  {!transaction.maintenanceId && (
                    <button
                      type="button"
                      onClick={() => onDelete(transaction.id)}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400"
                      title="Eliminar movimiento"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {formOpen && (
        <TransactionForm
          onSave={(transaction) => {
            onAdd(transaction);
            setFormOpen(false);
          }}
          onClose={() => setFormOpen(false)}
        />
      )}
    </div>
  );
}
