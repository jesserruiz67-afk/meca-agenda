import type { Maintenance, PaymentMethod, Transaction } from '../types';
import { monthKey, todayISO, toISO } from './utils';

export type CashPeriod = 'hoy' | 'mes';

export type CashMovement = Transaction & {
  origin: 'servicio' | 'manual';
};

export type CashTotals = {
  ingresos: number;
  egresos: number;
  balance: number;
  cashIn: number;
  cashOut: number;
  expectedCash: number;
  byMethod: Record<PaymentMethod, number>;
};

export function serviceIncomes(maintenances: Maintenance[]): CashMovement[] {
  return maintenances
    .filter((item) => item.completed && item.totalAmount > 0)
    .map((item) => ({
      id: `service-${item.id}`,
      date: item.completedAt ? toISO(new Date(item.completedAt)) : item.dueDate,
      type: 'ingreso',
      description: `${item.services.join(', ')} - ${item.clientName}`,
      amount: item.totalAmount,
      method: item.paymentMethod,
      maintenanceId: item.id,
      createdAt: item.completedAt ?? item.createdAt,
      origin: 'servicio',
    }));
}

export function allCashMovements(
  maintenances: Maintenance[],
  transactions: Transaction[],
): CashMovement[] {
  const manual = transactions
    .filter((transaction) => !transaction.maintenanceId)
    .map((transaction) => ({ ...transaction, origin: 'manual' as const }));
  return [...serviceIncomes(maintenances), ...manual];
}

export function filterByPeriod(
  movements: CashMovement[],
  period: CashPeriod,
): CashMovement[] {
  const today = todayISO();
  const month = monthKey();
  return movements
    .filter((transaction) =>
      period === 'hoy'
        ? transaction.date === today
        : transaction.date.startsWith(month),
    )
    .sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.createdAt.localeCompare(a.createdAt);
    });
}

export function sortMovements(movements: CashMovement[]): CashMovement[] {
  return [...movements].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.createdAt.localeCompare(b.createdAt);
  });
}

export function cashTotals(movements: CashMovement[]): CashTotals {
  let ingresos = 0;
  let egresos = 0;
  let cashIn = 0;
  let cashOut = 0;
  const byMethod: Record<PaymentMethod, number> = {
    efectivo: 0,
    transferencia: 0,
    tarjeta: 0,
    paypal: 0,
    link: 0,
  };

  for (const transaction of movements) {
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
}
