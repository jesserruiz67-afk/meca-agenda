import { useMemo, useState } from 'react';
import {
  AlertCircle,
  Wallet,
  Plus,
  Trash2,
  ArrowDownCircle,
  ArrowUpCircle,
  Calculator,
  Banknote,
  Landmark,
  CreditCard,
  Cloud,
  Download,
  Loader2,
  Share2,
} from 'lucide-react';
import type { Maintenance, PaymentMethod, Transaction } from '../types';
import {
  allCashMovements,
  cashTotals,
  filterByPeriod,
  type CashPeriod,
} from '../lib/cash';
import { downloadBlob, shareOrDownload } from '../lib/files';
import type { Profile } from '../lib/profiles';
import {
  buildCashBackup,
  cashBackupCsv,
  cashBackupFileName,
} from '../lib/reports';
import {
  PAYMENT_LABELS,
  formatDate,
  formatMoney,
  todayISO,
} from '../lib/utils';
import StatCard from './StatCard';
import TransactionForm from './TransactionForm';

type Props = {
  profile: Profile;
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

const SHORT_LABELS: Record<PaymentMethod, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transf.',
  tarjeta: 'Tarjeta',
};

export default function CashView({
  profile,
  transactions,
  maintenances,
  onAdd,
  onDelete,
}: Props) {
  const [period, setPeriod] = useState<CashPeriod>('hoy');
  const [countedCash, setCountedCash] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [exporting, setExporting] = useState<'json' | 'csv' | null>(null);
  const [exportMessage, setExportMessage] = useState('');
  const [exportError, setExportError] = useState('');

  const allMovements = useMemo(
    () => allCashMovements(maintenances, transactions),
    [maintenances, transactions],
  );

  const filtered = useMemo(
    () => filterByPeriod(allMovements, period),
    [allMovements, period],
  );

  const totals = useMemo(() => cashTotals(filtered), [filtered]);

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

  async function handleCashExport(format: 'json' | 'csv') {
    setExporting(format);
    setExportMessage('');
    setExportError('');
    try {
      const data = buildCashBackup(profile, maintenances, transactions);
      const filename = cashBackupFileName(profile, format, todayISO());
      if (format === 'csv') {
        const csv = cashBackupCsv(data);
        downloadBlob(
          new Blob([csv], { type: 'text/csv;charset=utf-8' }),
          filename,
        );
        setExportMessage('CSV de caja descargado.');
      } else {
        const outcome = await shareOrDownload(
          new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json',
          }),
          filename,
          'Respaldo de caja MecaAgenda',
          `Caja de ${profile.shopName}`,
        );
        setExportMessage(
          outcome === 'shared'
            ? 'Respaldo de caja compartido.'
            : outcome === 'cancelled'
              ? 'Se canceló el compartir.'
              : 'Respaldo de caja descargado.',
        );
      }
    } catch {
      setExportError('No se pudo generar el respaldo de caja.');
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-4 pt-3">
      <section className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
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
      </div>

      <div className="shrink-0 px-4 pt-3">
        <section className="flex items-center justify-between gap-2">
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setPeriod('hoy')}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium sm:text-sm ${
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
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium sm:text-sm ${
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
            aria-label="Nuevo movimiento"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nuevo movimiento</span>
          </button>
        </section>
      </div>

      <div className="shrink-0 px-4 pt-3">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 sm:p-5">
        <h2 className="flex items-center gap-2 text-xs font-semibold text-white sm:text-sm">
          <Calculator className="h-4 w-4 text-amber-400" />
          Arqueo de caja de {periodLabel}
        </h2>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:mt-4 sm:gap-4">
          <div>
            <p className="text-[11px] text-slate-400 sm:text-xs">
              Efectivo esperado
            </p>
            <p className="mt-1 text-base font-bold text-white sm:text-xl">
              {formatMoney(totals.expectedCash)}
            </p>
            <p className="mt-1 hidden text-[11px] text-slate-500 sm:block">
              Cobros en efectivo {formatMoney(totals.cashIn)} · Egresos{' '}
              {formatMoney(totals.cashOut)}
            </p>
          </div>
          <div>
            <label className="text-[11px] text-slate-400 sm:text-xs">
              Efectivo contado
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={countedCash}
              onChange={(e) => setCountedCash(e.target.value)}
              placeholder="0"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60 sm:px-3 sm:py-2 sm:text-sm"
            />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 sm:text-xs">Diferencia</p>
            <p
              className={`mt-1 text-base font-bold sm:text-xl ${differenceClass}`}
            >
              {hasCount ? formatMoney(difference) : '—'}
            </p>
            <p className={`mt-1 text-[10px] sm:text-[11px] ${differenceClass}`}>
              {differenceLabel}
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5 border-t border-slate-800 pt-3 sm:mt-4 sm:gap-2 sm:pt-4">
          {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((method) => {
            const Icon = METHOD_ICONS[method];
            return (
              <div
                key={method}
                className="min-w-0 rounded-lg bg-slate-800/50 px-2 py-1.5 sm:px-3 sm:py-2"
              >
                <span className="flex min-w-0 items-center gap-1 text-[10px] text-slate-400 sm:gap-2 sm:text-xs">
                  <Icon className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
                  <span className="truncate sm:hidden">
                    {SHORT_LABELS[method]}
                  </span>
                  <span className="hidden truncate sm:inline">
                    {PAYMENT_LABELS[method]}
                  </span>
                </span>
                <p
                  className={`mt-1 truncate text-xs font-semibold sm:text-sm ${
                    totals.byMethod[method] < 0
                      ? 'text-red-300'
                      : 'text-slate-200'
                  }`}
                >
                  {formatMoney(totals.byMethod[method])}
                </p>
              </div>
            );
          })}
        </div>
      </section>
      </div>

      <div className="shrink-0 px-4 pt-2">
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-200">
                <Cloud className="h-3.5 w-3.5 text-emerald-400" />
                Respaldo de caja
              </p>
              <p className="truncate text-[10px] text-slate-500">
                Aparte del respaldo general, listo para Drive.
              </p>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <button
                type="button"
                onClick={() => handleCashExport('json')}
                disabled={exporting !== null}
                title="Compartir o guardar la caja en Drive"
                aria-label="Compartir o guardar la caja en Drive"
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
              >
                {exporting === 'json' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Share2 className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">Drive</span>
              </button>
              <button
                type="button"
                onClick={() => handleCashExport('csv')}
                disabled={exporting !== null}
                title="Descargar la caja en CSV"
                aria-label="Descargar la caja en CSV"
                className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-60"
              >
                {exporting === 'csv' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                CSV
              </button>
            </div>
          </div>
          {(exportMessage || exportError) && (
            <p
              className={`mt-1.5 flex items-start gap-1 text-[10px] ${
                exportError ? 'text-red-300' : 'text-emerald-300'
              }`}
            >
              <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
              {exportError || exportMessage}
            </p>
          )}
        </section>
      </div>

      <section className="mt-2 flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-4">
        <h2 className="mb-1 text-sm font-semibold text-slate-300">
          Movimientos de {periodLabel}
        </h2>
        <p className="mb-3 text-[11px] text-slate-500">
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
