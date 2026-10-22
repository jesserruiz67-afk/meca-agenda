import type { Backup, Maintenance, Product, Transaction } from '../types';

const KEYS = {
  maintenances: 'meca-agenda:v1',
  products: 'meca-agenda:products:v1',
  transactions: 'meca-agenda:transactions:v1',
  invoiceCounter: 'meca-agenda:invoice-counter:v1',
} as const;

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* almacenamiento no disponible */
  }
}

export function loadMaintenances(): Maintenance[] {
  const raw = load<Maintenance[]>(KEYS.maintenances, []);
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const legacy = item as Maintenance & { service?: string };
    const services = Array.isArray(legacy.services)
      ? legacy.services
      : legacy.service
        ? [legacy.service]
        : [];
    return {
      ...legacy,
      services,
      vehicleType: legacy.vehicleType === 'moto' ? 'moto' : 'carro',
      totalAmount: Number(legacy.totalAmount) || 0,
      paymentMethod: legacy.paymentMethod ?? 'efectivo',
    };
  });
}

export function saveMaintenances(items: Maintenance[]): void {
  save(KEYS.maintenances, items);
}

export function loadProducts(): Product[] {
  const raw = load<Product[]>(KEYS.products, []);
  return Array.isArray(raw) ? raw : [];
}

export function saveProducts(items: Product[]): void {
  save(KEYS.products, items);
}

export function loadTransactions(): Transaction[] {
  const raw = load<Transaction[]>(KEYS.transactions, []);
  if (!Array.isArray(raw)) return [];
  return raw.filter((transaction) => !transaction.maintenanceId);
}

export function saveTransactions(items: Transaction[]): void {
  save(KEYS.transactions, items);
}

export function nextInvoiceNumber(): string {
  const current = load<number>(KEYS.invoiceCounter, 0);
  const next = (Number(current) || 0) + 1;
  save(KEYS.invoiceCounter, next);
  return `FAC-${String(next).padStart(5, '0')}`;
}

export function readInvoiceCounter(): number {
  return Number(load<number>(KEYS.invoiceCounter, 0)) || 0;
}

export function restoreBackup(backup: Backup): void {
  if (
    !Array.isArray(backup.maintenances) ||
    !Array.isArray(backup.products) ||
    !Array.isArray(backup.transactions)
  ) {
    throw new Error('Respaldo inválido');
  }
  save(KEYS.maintenances, backup.maintenances);
  save(KEYS.products, backup.products);
  save(KEYS.transactions, backup.transactions);
  save(KEYS.invoiceCounter, Number(backup.invoiceCounter) || 0);
}
