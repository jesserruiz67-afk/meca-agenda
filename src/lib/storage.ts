import type { Backup, Maintenance, Product, Transaction } from '../types';

const LEGACY_KEYS = {
  maintenances: 'meca-agenda:v1',
  products: 'meca-agenda:products:v1',
  transactions: 'meca-agenda:transactions:v1',
  invoiceCounter: 'meca-agenda:invoice-counter:v1',
} as const;

const MIGRATION_KEY = 'meca-agenda:migrated:v1';

function keys(profileId: string) {
  const base = `meca-agenda:u:${profileId}`;
  return {
    maintenances: `${base}:maintenances:v1`,
    products: `${base}:products:v1`,
    transactions: `${base}:transactions:v1`,
    invoiceCounter: `${base}:invoice-counter:v1`,
    lastBackup: `${base}:last-backup:v1`,
  };
}

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

export function loadMaintenances(profileId: string): Maintenance[] {
  const raw = load<Maintenance[]>(keys(profileId).maintenances, []);
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

export function saveMaintenances(
  profileId: string,
  items: Maintenance[],
): void {
  save(keys(profileId).maintenances, items);
}

export function loadProducts(profileId: string): Product[] {
  const raw = load<Product[]>(keys(profileId).products, []);
  return Array.isArray(raw) ? raw : [];
}

export function saveProducts(profileId: string, items: Product[]): void {
  save(keys(profileId).products, items);
}

export function loadTransactions(profileId: string): Transaction[] {
  const raw = load<Transaction[]>(keys(profileId).transactions, []);
  if (!Array.isArray(raw)) return [];
  return raw.filter((transaction) => !transaction.maintenanceId);
}

export function saveTransactions(
  profileId: string,
  items: Transaction[],
): void {
  save(keys(profileId).transactions, items);
}

export function nextInvoiceNumber(profileId: string): string {
  const current = load<number>(keys(profileId).invoiceCounter, 0);
  const next = (Number(current) || 0) + 1;
  save(keys(profileId).invoiceCounter, next);
  return `FAC-${String(next).padStart(5, '0')}`;
}

export function readInvoiceCounter(profileId: string): number {
  return Number(load<number>(keys(profileId).invoiceCounter, 0)) || 0;
}

export function readLastBackupAt(profileId: string): string {
  return load<string>(keys(profileId).lastBackup, '') || '';
}

export function writeLastBackupAt(profileId: string, iso: string): void {
  save(keys(profileId).lastBackup, iso);
}

export function restoreBackup(profileId: string, backup: Backup): void {
  if (
    !Array.isArray(backup.maintenances) ||
    !Array.isArray(backup.products) ||
    !Array.isArray(backup.transactions)
  ) {
    throw new Error('Respaldo inválido');
  }
  save(keys(profileId).maintenances, backup.maintenances);
  save(keys(profileId).products, backup.products);
  save(keys(profileId).transactions, backup.transactions);
  save(keys(profileId).invoiceCounter, Number(backup.invoiceCounter) || 0);
}

export function hasLegacyData(): boolean {
  try {
    if (localStorage.getItem(MIGRATION_KEY)) return false;
    return Object.values(LEGACY_KEYS).some(
      (key) => localStorage.getItem(key) !== null,
    );
  } catch {
    return false;
  }
}

export function migrateLegacyData(profileId: string): boolean {
  try {
    if (localStorage.getItem(MIGRATION_KEY)) return false;
    const target = keys(profileId);
    let migrated = false;
    for (const [name, legacyKey] of Object.entries(LEGACY_KEYS)) {
      const legacyValue = localStorage.getItem(legacyKey);
      if (legacyValue === null) continue;
      const newKey = target[name as keyof typeof target];
      if (newKey === target.lastBackup) continue;
      if (localStorage.getItem(newKey) === null) {
        localStorage.setItem(newKey, legacyValue);
        migrated = true;
      }
    }
    localStorage.setItem(MIGRATION_KEY, new Date().toISOString());
    return migrated;
  } catch {
    return false;
  }
}
