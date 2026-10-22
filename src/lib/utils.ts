import type {
  Maintenance,
  MaintenanceStatus,
  PaymentMethod,
} from '../types';
import { DEFAULT_CURRENCY, type CurrencyCode } from './currency';

export function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function todayISO(): string {
  return toISO(new Date());
}

export function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function daysUntil(iso: string): number {
  const today = startOfDay(new Date());
  const due = startOfDay(new Date(`${iso}T00:00:00`));
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

export function getStatus(item: Maintenance): MaintenanceStatus {
  if (item.completed) return 'completado';
  const diff = daysUntil(item.dueDate);
  if (diff < 0) return 'vencido';
  if (diff === 0) return 'hoy';
  if (diff <= 7) return 'semana';
  return 'proximo';
}

export function formatDate(iso: string): string {
  if (!iso) return 'Sin fecha';
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function relativeDate(iso: string): string {
  const diff = daysUntil(iso);
  if (diff === 0) return 'Vence hoy';
  if (diff === 1) return 'Vence mañana';
  if (diff > 1) return `Vence en ${diff} días`;
  if (diff === -1) return 'Venció ayer';
  return `Venció hace ${Math.abs(diff)} días`;
}

export const STATUS_META: Record<
  MaintenanceStatus,
  { label: string; badge: string; dot: string }
> = {
  vencido: {
    label: 'Vencido',
    badge: 'bg-red-500/10 text-red-300 ring-1 ring-red-500/30',
    dot: 'bg-red-400',
  },
  hoy: {
    label: 'Hoy',
    badge: 'bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/30',
    dot: 'bg-amber-400',
  },
  semana: {
    label: 'Esta semana',
    badge: 'bg-sky-500/10 text-sky-300 ring-1 ring-sky-500/30',
    dot: 'bg-sky-400',
  },
  proximo: {
    label: 'Próximo',
    badge: 'bg-slate-500/10 text-slate-300 ring-1 ring-slate-500/30',
    dot: 'bg-slate-400',
  },
  completado: {
    label: 'Completado',
    badge: 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30',
    dot: 'bg-emerald-400',
  },
};

export function buildWhatsAppMessage(
  item: Maintenance,
  shopName: string,
): string {
  const vehicle =
    [item.vehicleBrand, item.vehicleModel].filter(Boolean).join(' ') ||
    'vehículo';

  const serviceList =
    item.services.length > 0 ? item.services.join(', ') : 'un mantenimiento';
  const serviceNoun = item.services.length > 1 ? 'los servicios' : 'el servicio';

  const parts = [
    `Hola ${item.clientName}, te escribimos de ${shopName}.`,
    `Te recordamos que tu ${vehicle}${
      item.vehiclePlate ? ` (${item.vehiclePlate})` : ''
    } tiene pendiente ${serviceNoun} de ${serviceList}.`,
  ];

  if (item.dueDate) {
    const time = item.dueTime ? ` a las ${item.dueTime}` : '';
    parts.push(`Fecha sugerida: ${formatDate(item.dueDate)}${time}.`);
  }
  if (item.dueKm)
    parts.push(`Kilometraje sugerido: ${item.dueKm.toLocaleString('es-AR')} km.`);

  parts.push('Escribinos para coordinar un turno. ¡Gracias!');
  return parts.join(' ');
}

export function whatsappLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '');
  const text = encodeURIComponent(message);
  return digits
    ? `https://wa.me/${digits}?text=${text}`
    : `https://wa.me/?text=${text}`;
}

let activeCurrency: CurrencyCode = DEFAULT_CURRENCY;

export function setActiveCurrency(currency: CurrencyCode): void {
  activeCurrency = currency;
}

export function getActiveCurrency(): CurrencyCode {
  return activeCurrency;
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: activeCurrency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatMoneyPlain(
  amount: number,
  currency: CurrencyCode = activeCurrency,
): string {
  const value = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${value} ${currency}`;
}

export function shortDate(iso: string): string {
  if (!iso) return '';
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export function round2(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function monthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export const VEHICLE_LABELS = {
  carro: 'Carro',
  moto: 'Moto',
} as const;

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
};

