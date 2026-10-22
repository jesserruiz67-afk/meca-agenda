export const CURRENCIES = [
  { code: 'ARS', label: 'Peso argentino' },
  { code: 'USD', label: 'Dólar estadounidense' },
  { code: 'EUR', label: 'Euro' },
  { code: 'BRL', label: 'Real brasileño' },
  { code: 'CLP', label: 'Peso chileno' },
  { code: 'UYU', label: 'Peso uruguayo' },
  { code: 'PYG', label: 'Guaraní paraguayo' },
  { code: 'PEN', label: 'Sol peruano' },
  { code: 'MXN', label: 'Peso mexicano' },
  { code: 'COP', label: 'Peso colombiano' },
  { code: 'BOB', label: 'Boliviano' },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]['code'];

export const DEFAULT_CURRENCY: CurrencyCode = 'ARS';

export function isCurrency(value: unknown): value is CurrencyCode {
  return CURRENCIES.some((currency) => currency.code === value);
}

export function normalizeCurrency(value: unknown): CurrencyCode {
  return isCurrency(value) ? value : DEFAULT_CURRENCY;
}
