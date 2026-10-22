import { useMemo, useState } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarDays,
  ClipboardCheck,
  Download,
  FileText,
  Inbox,
  Loader2,
  Wallet,
} from 'lucide-react';
import type { Maintenance, Transaction } from '../types';
import { downloadBlob } from '../lib/files';
import type { Profile } from '../lib/profiles';
import {
  REPORT_PERIODS,
  buildReport,
  reportCsv,
  reportFileName,
  type ReportPeriod,
} from '../lib/reports';
import {
  PAYMENT_LABELS,
  formatMoney,
  shortDate,
} from '../lib/utils';
import StatCard from './StatCard';

type Props = {
  profile: Profile;
  maintenances: Maintenance[];
  transactions: Transaction[];
};

export default function ReportsView({
  profile,
  maintenances,
  transactions,
}: Props) {
  const [period, setPeriod] = useState<ReportPeriod>('dia');
  const [busy, setBusy] = useState<'pdf' | 'csv' | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const report = useMemo(
    () =>
      buildReport({
        profile,
        maintenances,
        transactions,
        period,
      }),
    [profile, maintenances, transactions, period],
  );

  function resetFeedback() {
    setMessage('');
    setError('');
  }

  function handleCsv() {
    resetFeedback();
    try {
      const csv = reportCsv(report);
      downloadBlob(
        new Blob([csv], { type: 'text/csv;charset=utf-8' }),
        reportFileName(profile, report, 'csv'),
      );
      setMessage('CSV descargado. Se puede abrir en Excel o Sheets.');
    } catch {
      setError('No se pudo generar el CSV.');
    }
  }

  async function handlePdf() {
    resetFeedback();
    setBusy('pdf');
    try {
      const { reportPdf } = await import('../lib/reportsPdf');
      const blob = reportPdf(report);
      downloadBlob(blob, reportFileName(profile, report, 'pdf'));
      setMessage('PDF descargado con el resumen del período.');
    } catch {
      setError('No se pudo generar el PDF.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-4 pt-3">
        <div className="flex gap-1.5">
            {REPORT_PERIODS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setPeriod(option.id);
                  resetFeedback();
                }}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                  period === option.id
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-900 text-slate-300 ring-1 ring-slate-800 hover:bg-slate-800'
                }`}
              >
                {option.label}
              </button>
            ))}
        </div>
        <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-slate-500">
          <CalendarDays className="h-3.5 w-3.5" />
          {report.range.label}
        </span>

        <section className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          <StatCard
            label="Ingresos"
            value={formatMoney(report.totals.ingresos)}
            icon={ArrowDownCircle}
            accent="bg-emerald-500/15 text-emerald-400"
          />
          <StatCard
            label="Egresos"
            value={formatMoney(report.totals.egresos)}
            icon={ArrowUpCircle}
            accent="bg-red-500/15 text-red-400"
          />
          <StatCard
            label="Balance"
            value={formatMoney(report.totals.balance)}
            icon={Wallet}
            accent="bg-sky-500/15 text-sky-400"
          />
          <StatCard
            label="Trabajos"
            value={report.works.length}
            icon={ClipboardCheck}
            accent="bg-amber-500/15 text-amber-400"
          />
        </section>

        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={handlePdf}
            disabled={busy !== null}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
          >
            {busy === 'pdf' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Descargar PDF
          </button>
          <button
            type="button"
            onClick={handleCsv}
            disabled={busy !== null}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-60"
          >
            <Download className="h-4 w-4" /> Descargar CSV
          </button>
        </div>

        {(message || error) && (
          <p
            className={`mt-2 text-[11px] ${
              error ? 'text-red-300' : 'text-emerald-300'
            }`}
          >
            {error || message}
          </p>
        )}
      </div>

      <div className="mt-2 flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-4">
        <div className="space-y-3">
          <section>
            <div className="mb-1.5 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200">
                Trabajos realizados
              </h2>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                {report.works.length}
              </span>
            </div>

            {report.works.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 px-4 py-6 text-center">
                <Inbox className="mx-auto h-6 w-6 text-slate-600" />
                <p className="mt-1.5 text-xs text-slate-400">
                  Sin trabajos completados en este período.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
                {report.works.map(({ date, item }) => {
                  const vehicle =
                    [item.vehicleBrand, item.vehicleModel]
                      .filter(Boolean)
                      .join(' ') || 'Vehículo';
                  return (
                    <div key={item.id} className="px-3 py-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 truncate text-sm font-medium text-white">
                          {item.clientName}
                        </p>
                        <p className="shrink-0 text-sm font-semibold text-emerald-300">
                          {formatMoney(item.totalAmount)}
                        </p>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-slate-400">
                        {shortDate(date)} · {vehicle}
                        {item.vehiclePlate ? ` · ${item.vehiclePlate}` : ''}
                      </p>
                      <p className="truncate text-[11px] text-amber-300">
                        {item.services.join(', ') || 'Servicio'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <div className="mb-1.5 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200">
                Caja del período
              </h2>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                {report.movements.length}
              </span>
            </div>

            {report.movements.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 px-4 py-6 text-center">
                <Inbox className="mx-auto h-6 w-6 text-slate-600" />
                <p className="mt-1.5 text-xs text-slate-400">
                  Sin movimientos de caja en este período.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
                {report.movements.map((movement) => {
                  const income = movement.type === 'ingreso';
                  return (
                    <div
                      key={movement.id}
                      className="flex items-center gap-2.5 px-3 py-2.5"
                    >
                      <div
                        className={`rounded-lg p-1.5 ${
                          income
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {income ? (
                          <ArrowDownCircle className="h-4 w-4" />
                        ) : (
                          <ArrowUpCircle className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-slate-200">
                          {movement.description}
                        </p>
                        <p className="truncate text-[10px] text-slate-500">
                          {shortDate(movement.date)} ·{' '}
                          {PAYMENT_LABELS[movement.method]} ·{' '}
                          {movement.origin === 'servicio'
                            ? 'Automático'
                            : 'Manual'}
                        </p>
                      </div>
                      <p
                        className={`shrink-0 text-xs font-semibold ${
                          income ? 'text-emerald-300' : 'text-red-300'
                        }`}
                      >
                        {income ? '+' : '-'} {formatMoney(movement.amount)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <p className="pb-1 text-center text-[10px] leading-relaxed text-slate-500">
            El informe incluye trabajos completados y movimientos de caja del
            período. La caja se puede respaldar por separado desde el módulo
            Caja.
          </p>
        </div>
      </div>
    </div>
  );
}
