import type { PaymentMethod } from '../types';
import { PLAN_PRICE_USD } from './profiles';
import { PAYMENT_METHODS } from './utils';

export type WorkshopSettings = {
  shopPhone: string;
  shopAddress: string;
  welcomeMessage: string;
  enabledMethods: PaymentMethod[];
  paypalLink: string;
  paymentLink: string;
  paymentLinkLabel: string;
  showPaymentLinks: boolean;
};

export type AppSettings = {
  paypalLink: string;
  paymentLink: string;
  priceUsd: number;
};

const ALL_METHODS = PAYMENT_METHODS.map((method) => method.id);

export const DEFAULT_WORKSHOP_SETTINGS: WorkshopSettings = {
  shopPhone: '',
  shopAddress: '',
  welcomeMessage: '',
  enabledMethods: ALL_METHODS,
  paypalLink: '',
  paymentLink: '',
  paymentLinkLabel: 'Link de pago',
  showPaymentLinks: true,
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  paypalLink: '',
  paymentLink: '',
  priceUsd: PLAN_PRICE_USD,
};

function workshopKey(profileId: string): string {
  return `meca-agenda:u:${profileId}:settings:v1`;
}

const APP_SETTINGS_KEY = 'meca-agenda:app-settings:v1';

function normalizeLink(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function normalizeMethods(value: unknown): PaymentMethod[] {
  if (!Array.isArray(value)) return [...ALL_METHODS];
  const valid = value.filter((entry): entry is PaymentMethod =>
    ALL_METHODS.includes(entry as PaymentMethod),
  );
  return valid.length > 0 ? Array.from(new Set(valid)) : [...ALL_METHODS];
}

export function loadWorkshopSettings(profileId: string): WorkshopSettings {
  try {
    const raw = localStorage.getItem(workshopKey(profileId));
    if (!raw) return { ...DEFAULT_WORKSHOP_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<WorkshopSettings>;
    return {
      shopPhone:
        typeof parsed.shopPhone === 'string'
          ? parsed.shopPhone.trim().slice(0, 32)
          : '',
      shopAddress:
        typeof parsed.shopAddress === 'string'
          ? parsed.shopAddress.trim().slice(0, 80)
          : '',
      welcomeMessage:
        typeof parsed.welcomeMessage === 'string'
          ? parsed.welcomeMessage.trim().slice(0, 180)
          : '',
      enabledMethods: normalizeMethods(parsed.enabledMethods),
      paypalLink: normalizeLink(parsed.paypalLink),
      paymentLink: normalizeLink(parsed.paymentLink),
      paymentLinkLabel:
        typeof parsed.paymentLinkLabel === 'string' &&
        parsed.paymentLinkLabel.trim()
          ? parsed.paymentLinkLabel.trim().slice(0, 32)
          : 'Link de pago',
      showPaymentLinks:
        typeof parsed.showPaymentLinks === 'boolean'
          ? parsed.showPaymentLinks
          : true,
    };
  } catch {
    return { ...DEFAULT_WORKSHOP_SETTINGS };
  }
}

export function saveWorkshopSettings(
  profileId: string,
  settings: WorkshopSettings,
): void {
  try {
    localStorage.setItem(workshopKey(profileId), JSON.stringify(settings));
  } catch {
    /* almacenamiento no disponible */
  }
}

export function loadAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(APP_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_APP_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    const price = Number(parsed.priceUsd);
    return {
      paypalLink: normalizeLink(parsed.paypalLink),
      paymentLink: normalizeLink(parsed.paymentLink),
      priceUsd:
        Number.isFinite(price) && price > 0
          ? Math.min(1000, Math.round(price * 100) / 100)
          : PLAN_PRICE_USD,
    };
  } catch {
    return { ...DEFAULT_APP_SETTINGS };
  }
}

export function saveAppSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* almacenamiento no disponible */
  }
}
