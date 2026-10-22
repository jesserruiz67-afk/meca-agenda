import type { Maintenance, Transaction } from '../types';
import {
  allCashMovements,
  cashTotals,
  sortMovements,
  type CashMovement,
  type CashTotals,
} from './cash';
import { sanitizeFileName } from './files';
import type { Profile } from './profiles';
import {
  PAYMENT_LABELS,
  formatDate,
  formatDateTime,
  round2,
  shortDate,
  todayISO,
  toISO,
} from './utils';

export type ReportPeriod = 'dia' | 'semana' | 'mes';

export const REPORT_PERIODS: { id: ReportPeriod; label: string }[] = [
  { id: 'dia', label: 'Diario' },
  { id: 'semana', label: 'Semanal' },
  { id: 'mes', label: 'Mensual' },
];

export type ReportRange = {
  start: string;
  end: string;
  label: string;
};

export type ReportWork = {
  date: string;
  item: Maintenance;
};

export type ReportData = {
  period: ReportPeriod;
  periodLabel: string;
  range: ReportRange;
  generatedAt: string;
  userName: string;
  shopName: string;
  currency: Profile['currency'];
  works: ReportWork[];
  movements: CashMovement[];
  totals: CashTotals;
};

function startOfWeek(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  const offset = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - offset);
  return copy;
}

export function getReportRange(
  period: ReportPeriod,
  now = new Date(),
): ReportRange {
  const end = new Date(now);
  end.setHours(0, 0, 0, 0);
  let start = new Date(end);
  if (period === 'semana') start = startOfWeek(end);
  if (period === 'mes') {
    start = new Date(end.getFullYear(), end.getMonth(), 1);
  }
  const startISO = toISO(start);
  const endISO = toISO(end);
  return {
    start: startISO,
    end: endISO,
    label:
      startISO === endISO
        ? formatDate(startISO)
        : `${formatDate(startISO)} — ${formatDate(endISO)}`,
  };
}

export function workDate(item: Maintenance): string {
  return item.completedAt
    ? toISO(new Date(item.completedAt))
    : item.dueDate;
}

function inRange(date: string, range: ReportRange): boolean {
  return date >= range.start && date <= range.end;
}

function periodLabel(period: ReportPeriod): string {
  if (period === 'dia') return 'Diario';
  if (period === 'semana') return 'Semanal';
  return 'Mensual';
}

export function buildReport({
  profile,
  maintenances,
  transactions,
  period,
  now = new Date(),
}: {
  profile: Profile;
  maintenances: Maintenance[];
  transactions: Transaction[];
  period: ReportPeriod;
  now?: Date;
}): ReportData {
  const range = getReportRange(period, now);
  const movements = sortMovements(
    allCashMovements(maintenances, transactions).filter((movement) =>
      inRange(movement.date, range),
    ),
  );
  const works = maintenances
    .filter(
      (item) => item.completed && inRange(workDate(item), range),
    )
    .map((item) => ({ date: workDate(item), item }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    period,
    periodLabel: periodLabel(period),
    range,
    generatedAt: new Date().toISOString(),
    userName: profile.name,
    shopName: profile.shopName,
    currency: profile.currency,
    works,
    movements,
    totals: cashTotals(movements),
  };
}

function csvCell(value: string | number): string {
  const text = String(value ?? '');
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function csvRow(values: (string | number)[]): string {
  return `${values.map(csvCell).join(',')}\r\n`;
}

export function reportCsv(data: ReportData): string {
  const rows: string[] = [];
  rows.push(csvRow(['Informe', data.periodLabel]));
  rows.push(csvRow(['Taller', data.shopName]));
  rows.push(csvRow(['Usuario', data.userName]));
  rows.push(
    csvRow([
      'Período',
      data.range.start === data.range.end
        ? shortDate(data.range.start)
        : `${shortDate(data.range.start)} al ${shortDate(data.range.end)}`,
    ]),
  );
  rows.push(csvRow(['Moneda', data.currency]));
  rows.push(csvRow(['Generado', formatDateTime(data.generatedAt)]));
  rows.push('\r\n');
  rows.push(csvRow(['RESUMEN']));
  rows.push(csvRow(['Concepto', 'Valor']));
  rows.push(csvRow(['Ingresos', round2(data.totals.ingresos)]));
  rows.push(csvRow(['Egresos', round2(data.totals.egresos)]));
  rows.push(csvRow(['Balance', round2(data.totals.balance)]));
  rows.push(csvRow(['Efectivo esperado', round2(data.totals.expectedCash)]));
  rows.push(csvRow(['Trabajos realizados', data.works.length]));
  rows.push('\r\n');
  rows.push(csvRow(['TRABAJOS REALIZADOS']));
  rows.push(
    csvRow([
      'Fecha',
      'Cliente',
      'Vehículo',
      'Patente',
      'Servicios',
      'Método de pago',
      'Monto',
    ]),
  );
  for (const work of data.works) {
    const item = work.item;
    rows.push(
      csvRow([
        shortDate(work.date),
        item.clientName,
        [item.vehicleBrand, item.vehicleModel].filter(Boolean).join(' '),
        item.vehiclePlate,
        item.services.join(' / '),
        PAYMENT_LABELS[item.paymentMethod],
        round2(item.totalAmount),
      ]),
    );
  }
  if (data.works.length === 0) rows.push(csvRow(['Sin registros']));
  rows.push('\r\n');
  rows.push(csvRow(['MOVIMIENTOS DE CAJA']));
  rows.push(
    csvRow(['Fecha', 'Tipo', 'Descripción', 'Método', 'Origen', 'Monto']),
  );
  for (const movement of data.movements) {
    rows.push(
      csvRow([
        shortDate(movement.date),
        movement.type === 'ingreso' ? 'Ingreso' : 'Egreso',
        movement.description,
        PAYMENT_LABELS[movement.method],
        movement.origin === 'servicio' ? 'Servicio' : 'Manual',
        round2(movement.amount),
      ]),
    );
  }
  if (data.movements.length === 0) rows.push(csvRow(['Sin registros']));
  return `\uFEFF${rows.join('')}`;
}

export type CashBackupData = {
  app: 'MecaAgenda';
  version: 1;
  type: 'caja';
  exportedAt: string;
  currency: Profile['currency'];
  profile: { name: string; shopName: string };
  maintenances: Maintenance[];
  transactions: Transaction[];
  totals: CashTotals;
};

export function buildCashBackup(
  profile: Profile,
  maintenances: Maintenance[],
  transactions: Transaction[],
  now = new Date(),
): CashBackupData {
  const completed = maintenances.filter((item) => item.completed);
  const manual = transactions.filter(
    (transaction) => !transaction.maintenanceId,
  );
  return {
    app: 'MecaAgenda',
    version: 1,
    type: 'caja',
    exportedAt: now.toISOString(),
    currency: profile.currency,
    profile: { name: profile.name, shopName: profile.shopName },
    maintenances: completed,
    transactions: manual,
    totals: cashTotals(allCashMovements(maintenances, manual)),
  };
}

export function cashBackupCsv(data: CashBackupData): string {
  const rows: string[] = [];
  rows.push(csvRow(['Respaldo de caja MecaAgenda']));
  rows.push(csvRow(['Taller', data.profile.shopName]));
  rows.push(csvRow(['Perfil', data.profile.name]));
  rows.push(csvRow(['Generado', formatDateTime(data.exportedAt)]));
  rows.push(csvRow(['Moneda', data.currency]));
  rows.push('\r\n');
  rows.push(csvRow(['RESUMEN']));
  rows.push(csvRow(['Ingresos', round2(data.totals.ingresos)]));
  rows.push(csvRow(['Egresos', round2(data.totals.egresos)]));
  rows.push(csvRow(['Balance', round2(data.totals.balance)]));
  rows.push(csvRow(['Efectivo esperado', round2(data.totals.expectedCash)]));
  rows.push('\r\n');
  rows.push(csvRow(['TRABAJOS COBRADOS']));
  rows.push(
    csvRow([
      'Fecha',
      'Cliente',
      'Vehículo',
      'Servicios',
      'Método',
      'Monto',
    ]),
  );
  for (const item of data.maintenances.filter(
    (entry) => entry.totalAmount > 0,
  )) {
    rows.push(
      csvRow([
        item.completedAt
          ? shortDate(toISO(new Date(item.completedAt)))
          : shortDate(item.dueDate),
        item.clientName,
        [item.vehicleBrand, item.vehicleModel].filter(Boolean).join(' '),
        item.services.join(' / '),
        PAYMENT_LABELS[item.paymentMethod],
        round2(item.totalAmount),
      ]),
    );
  }
  if (data.maintenances.length === 0) rows.push(csvRow(['Sin registros']));
  rows.push('\r\n');
  rows.push(csvRow(['MOVIMIENTOS MANUALES']));
  rows.push(csvRow(['Fecha', 'Tipo', 'Descripción', 'Método', 'Monto']));
  for (const transaction of data.transactions) {
    rows.push(
      csvRow([
        shortDate(transaction.date),
        transaction.type === 'ingreso' ? 'Ingreso' : 'Egreso',
        transaction.description,
        PAYMENT_LABELS[transaction.method],
        round2(transaction.amount),
      ]),
    );
  }
  if (data.transactions.length === 0) rows.push(csvRow(['Sin registros']));
  return `\uFEFF${rows.join('')}`;
}

function reportFileBase(
  profile: Profile,
  data: ReportData,
  fallback: string,
): string {
  const label =
    data.period === 'dia'
      ? 'diario'
      : data.period === 'semana'
        ? 'semanal'
        : 'mensual';
  return sanitizeFileName(
    `meca-agenda-informe-${label}-${profile.shopName}-${data.range.end}`,
  ) || fallback;
}

export function reportFileName(
  profile: Profile,
  data: ReportData,
  extension: 'pdf' | 'csv',
): string {
  return `${reportFileBase(profile, data, 'informe')}.${extension}`;
}

export function cashBackupFileName(
  profile: Profile,
  extension: 'json' | 'csv',
  date = todayISO(),
): string {
  return `${sanitizeFileName(`meca-agenda-caja-${profile.shopName}-${date}`)}.${extension}`;
}
