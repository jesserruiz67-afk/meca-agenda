import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  BadgeCheck,
  Check,
  Crown,
  KeyRound,
  LayoutDashboard,
  Loader2,
  Save,
  ShieldCheck,
  Store,
  UserCog,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import type { Profile as ProfileType, ProfileRole } from '../lib/profiles';
import type { PaymentMethod } from '../types';
import { CURRENCIES, type CurrencyCode } from '../lib/currency';
import { getAccess } from '../lib/profiles';
import type { AppSettings, WorkshopSettings } from '../lib/settings';
import { PAYMENT_METHODS, formatDate } from '../lib/utils';

type Props = {
  profile: ProfileType;
  profiles: ProfileType[];
  settings: WorkshopSettings;
  appSettings: AppSettings;
  onSave: (
    profile: ProfileType,
    settings: WorkshopSettings,
    appSettings: AppSettings,
  ) => void;
  onUpdateLocalProfile: (profile: ProfileType) => void;
  onSetAccess: (profileId: string, action: 'activate' | 'revoke') => void;
  onResetPin: (profileId: string, pin: string) => Promise<void>;
  onSetRole: (profileId: string, role: ProfileRole) => void;
  onClose: () => void;
};

function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function accessLabel(profile: ProfileType): string {
  const access = getAccess(profile);
  if (access.state === 'active') {
    return access.expiresAt
      ? `Activo hasta ${formatDate(access.expiresAt.slice(0, 10))}`
      : 'Activo';
  }
  if (access.state === 'trial') {
    return `Prueba · ${access.daysLeft} día${access.daysLeft === 1 ? '' : 's'}`;
  }
  return 'Vencido';
}

function ProfileRow({
  profile,
  isCurrent,
  ownersCount,
  onUpdate,
  onSetAccess,
  onResetPin,
  onSetRole,
}: {
  profile: ProfileType;
  isCurrent: boolean;
  ownersCount: number;
  onUpdate: (profile: ProfileType) => void;
  onSetAccess: (profileId: string, action: 'activate' | 'revoke') => void;
  onResetPin: (profileId: string, pin: string) => Promise<void>;
  onSetRole: (profileId: string, role: ProfileRole) => void;
}) {
  const [name, setName] = useState(profile.name);
  const [shopName, setShopName] = useState(profile.shopName);
  const [currency, setCurrency] = useState<CurrencyCode>(profile.currency);
  const [pin, setPin] = useState('');
  const [pinBusy, setPinBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const access = getAccess(profile);

  function flash(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage(''), 2500);
  }

  function handleSaveData(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!name.trim() || !shopName.trim()) {
      setError('Nombre y taller son obligatorios.');
      return;
    }
    onUpdate({
      ...profile,
      name: name.trim(),
      shopName: shopName.trim(),
      currency,
    });
    flash('Datos guardados.');
  }

  async function handlePin(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!/^\d{4,8}$/.test(pin)) {
      setError('El PIN debe tener entre 4 y 8 números.');
      return;
    }
    setPinBusy(true);
    try {
      await onResetPin(profile.id, pin);
      setPin('');
      flash('PIN actualizado.');
    } catch {
      setError('No se pudo actualizar el PIN.');
    } finally {
      setPinBusy(false);
    }
  }

  function toggleRole() {
    const next: ProfileRole = profile.role === 'owner' ? 'staff' : 'owner';
    if (next === 'staff' && ownersCount <= 1) return;
    const text =
      next === 'owner'
        ? `¿Dar acceso de administrador a ${profile.name}?`
        : `¿Quitar el acceso de administrador a ${profile.name}?`;
    if (window.confirm(text)) onSetRole(profile.id, next);
  }

  return (
    <div
      role="group"
      aria-label={`Perfil ${profile.name}`}
      className="rounded-xl border border-slate-800 bg-slate-900/60 p-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-white">
            <span className="truncate">{profile.name}</span>
            {profile.role === 'owner' && (
              <Crown className="h-3.5 w-3.5 shrink-0 text-amber-400" />
            )}
            {isCurrent && (
              <span className="shrink-0 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                Actual
              </span>
            )}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-400">
            {profile.shopName} · {profile.currency}
          </p>
          <p
            className={`mt-1 text-[11px] ${
              access.state === 'active'
                ? 'text-emerald-300'
                : access.state === 'trial'
                  ? 'text-amber-300'
                  : 'text-red-300'
            }`}
          >
            {accessLabel(profile)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <button
            type="button"
            onClick={() => {
              if (
                access.state === 'active' &&
                !window.confirm(
                  `¿Revocar la suscripción de ${profile.name}?`,
                )
              ) {
                return;
              }
              onSetAccess(
                profile.id,
                access.state === 'active' ? 'revoke' : 'activate',
              );
            }}
            className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${
              access.state === 'active'
                ? 'border border-slate-700 text-slate-300 hover:border-red-500/40 hover:text-red-300'
                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
            }`}
          >
            {access.state === 'active' ? 'Revocar' : 'Activar 1 año'}
          </button>
          <button
            type="button"
            onClick={toggleRole}
            disabled={profile.role === 'owner' && ownersCount <= 1}
            className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-[11px] font-medium text-slate-300 hover:border-amber-500/40 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {profile.role === 'owner' ? 'Quitar admin' : 'Hacer admin'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSaveData} className="mt-3 grid gap-2 sm:grid-cols-3">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-label={`Nombre de ${profile.name}`}
          placeholder="Nombre"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
        />
        <input
          value={shopName}
          onChange={(event) => setShopName(event.target.value)}
          aria-label={`Taller de ${profile.name}`}
          placeholder="Taller"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
        />
        <div className="flex gap-2">
          <select
            value={currency}
            aria-label={`Moneda de ${profile.name}`}
            onChange={(event) =>
              setCurrency(event.target.value as CurrencyCode)
            }
            className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/60"
          >
            {CURRENCIES.map((option) => (
              <option key={option.code} value={option.code}>
                {option.code}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
          >
            Guardar
          </button>
        </div>
      </form>

      <form onSubmit={handlePin} className="mt-2 flex gap-2">
        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(event) =>
            setPin(event.target.value.replace(/\D/g, '').slice(0, 8))
          }
          aria-label={`Nuevo PIN de ${profile.name}`}
          placeholder="Nuevo PIN (4 a 8)"
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
        />
        <button
          type="submit"
          disabled={pinBusy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:border-amber-500/40 hover:text-amber-300 disabled:opacity-60"
        >
          {pinBusy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <KeyRound className="h-3.5 w-3.5" />
          )}
          PIN
        </button>
      </form>

      {(error || message) && (
        <p
          className={`mt-2 text-[11px] ${
            error ? 'text-red-300' : 'text-emerald-300'
          }`}
        >
          {error || message}
        </p>
      )}
    </div>
  );
}

export default function AdminPanel({
  profile,
  profiles,
  settings,
  appSettings,
  onSave,
  onUpdateLocalProfile,
  onSetAccess,
  onResetPin,
  onSetRole,
  onClose,
}: Props) {
  const [name, setName] = useState(profile.name);
  const [shopName, setShopName] = useState(profile.shopName);
  const [shopPhone, setShopPhone] = useState(settings.shopPhone);
  const [shopAddress, setShopAddress] = useState(settings.shopAddress);
  const [currency, setCurrency] = useState<CurrencyCode>(profile.currency);
  const [welcomeMessage, setWelcomeMessage] = useState(
    settings.welcomeMessage,
  );
  const [showPaymentLinks, setShowPaymentLinks] = useState(
    settings.showPaymentLinks,
  );
  const [methods, setMethods] = useState<PaymentMethod[]>(
    settings.enabledMethods,
  );
  const [paypalLink, setPaypalLink] = useState(settings.paypalLink);
  const [paymentLink, setPaymentLink] = useState(settings.paymentLink);
  const [paymentLinkLabel, setPaymentLinkLabel] = useState(
    settings.paymentLinkLabel,
  );
  const [appPaypalLink, setAppPaypalLink] = useState(appSettings.paypalLink);
  const [appPaymentLink, setAppPaymentLink] = useState(
    appSettings.paymentLink,
  );
  const [appPrice, setAppPrice] = useState(String(appSettings.priceUsd));
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(profile.name);
    setShopName(profile.shopName);
    setCurrency(profile.currency);
  }, [profile.name, profile.shopName, profile.currency]);

  const ownersCount = profiles.filter(
    (entry) => entry.role === 'owner',
  ).length;

  function toggleMethod(method: PaymentMethod) {
    setMethods((current) =>
      current.includes(method)
        ? current.filter((entry) => entry !== method)
        : [...current, method],
    );
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSaved('');
    if (!name.trim() || !shopName.trim()) {
      setError('Completá el nombre y el nombre del taller.');
      return;
    }
    if (methods.length === 0) {
      setError('Habilitá al menos un método de pago.');
      return;
    }
    const price = Number(appPrice);
    const priceCents = Math.round(price * 100);
    if (!Number.isFinite(price) || priceCents < 1 || price > 1000) {
      setError('El precio anual debe estar entre USD 0.01 y USD 1000.');
      return;
    }
    setSaving(true);
    const nextProfile: ProfileType = {
      ...profile,
      name: name.trim(),
      shopName: shopName.trim(),
      currency,
    };
    const nextSettings: WorkshopSettings = {
      shopPhone: shopPhone.trim().slice(0, 32),
      shopAddress: shopAddress.trim().slice(0, 80),
      welcomeMessage: welcomeMessage.trim().slice(0, 180),
      enabledMethods: PAYMENT_METHODS.filter((method) =>
        methods.includes(method.id),
      ).map((method) => method.id),
      paypalLink: normalizeUrl(paypalLink),
      paymentLink: normalizeUrl(paymentLink),
      paymentLinkLabel: paymentLinkLabel.trim().slice(0, 32) || 'Link de pago',
      showPaymentLinks,
    };
    const nextAppSettings: AppSettings = {
      paypalLink: normalizeUrl(appPaypalLink),
      paymentLink: normalizeUrl(appPaymentLink),
      priceUsd: priceCents / 100,
    };
    onSave(nextProfile, nextSettings, nextAppSettings);
    setPaypalLink(nextSettings.paypalLink);
    setPaymentLink(nextSettings.paymentLink);
    setAppPaypalLink(nextAppSettings.paypalLink);
    setAppPaymentLink(nextAppSettings.paymentLink);
    setSaving(false);
    setSaved('Cambios guardados.');
    window.setTimeout(() => setSaved(''), 2500);
  }

  return (
    <div className="no-scrollbar fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/95 px-4 py-2.5 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="rounded-lg bg-amber-500/15 p-2 text-amber-400 ring-1 ring-amber-500/30">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h1
                aria-label="Administración"
                className="truncate text-base font-bold"
              >
                <span className="sm:hidden">Admin</span>
                <span className="hidden sm:inline">Administración</span>
              </h1>
              <p className="truncate text-[10px] text-slate-500">
                {profile.shopName}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="submit"
              form="admin-settings"
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400"
            >
              <Save className="h-3.5 w-3.5" /> Guardar
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar administración"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl space-y-4 px-4 py-4">
        <form id="admin-settings" onSubmit={handleSubmit} className="space-y-4">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
              <LayoutDashboard className="h-4 w-4 text-amber-400" /> Panel
              principal
            </h2>
            <label className="mt-3 block text-xs font-medium text-slate-300">
              Mensaje de bienvenida (opcional)
            </label>
            <input
              value={welcomeMessage}
              onChange={(event) => setWelcomeMessage(event.target.value)}
              aria-label="Mensaje de bienvenida"
              maxLength={180}
              placeholder="Ej.: Turnos de lunes a viernes de 8 a 18 h."
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
            />
            <label className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2.5">
              <span className="text-xs text-slate-300">
                Mostrar links de cobro en Agenda
              </span>
              <input
                type="checkbox"
                checked={showPaymentLinks}
                onChange={(event) =>
                  setShowPaymentLinks(event.target.checked)
                }
                className="h-4 w-4 accent-amber-500"
              />
            </label>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
              <Store className="h-4 w-4 text-amber-400" /> Datos del taller
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  Tu nombre
                </label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  aria-label="Tu nombre"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  Nombre del taller
                </label>
                <input
                  value={shopName}
                  onChange={(event) => setShopName(event.target.value)}
                  aria-label="Nombre del taller"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  Teléfono / WhatsApp
                </label>
                <input
                  value={shopPhone}
                  onChange={(event) => setShopPhone(event.target.value)}
                  aria-label="Teléfono del taller"
                  inputMode="tel"
                  placeholder="Ej.: +505 8888 8888"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  Moneda
                </label>
                <select
                  value={currency}
                  onChange={(event) =>
                    setCurrency(event.target.value as CurrencyCode)
                  }
                  aria-label="Moneda del taller"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/60"
                >
                  {CURRENCIES.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.code} — {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-slate-400">
                  Dirección (opcional)
                </label>
                <input
                  value={shopAddress}
                  onChange={(event) => setShopAddress(event.target.value)}
                  aria-label="Dirección del taller"
                  placeholder="Dirección del taller"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
              <Wallet className="h-4 w-4 text-amber-400" /> Cobros y métodos de
              pago
            </h2>
            <p className="mt-1 text-[11px] text-slate-500">
              Elegí qué formas de pago aparecen al cargar trabajos y
              movimientos.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((method) => {
                const active = methods.includes(method.id);
                return (
                  <button
                    key={method.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleMethod(method.id)}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                      active
                        ? 'bg-amber-500 text-slate-950'
                        : 'border border-slate-700 bg-slate-950 text-slate-300 hover:border-amber-500/40'
                    }`}
                  >
                    {method.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  Link de PayPal
                </label>
                <input
                  value={paypalLink}
                  onChange={(event) => setPaypalLink(event.target.value)}
                  aria-label="Link de PayPal del taller"
                  placeholder="https://paypal.me/tu-taller"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  Nombre del link de pago
                </label>
                <input
                  value={paymentLinkLabel}
                  onChange={(event) =>
                    setPaymentLinkLabel(event.target.value)
                  }
                  aria-label="Nombre del link de pago"
                  maxLength={32}
                  placeholder="Link de pago"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-slate-400">
                  Link de pago común
                </label>
                <input
                  value={paymentLink}
                  onChange={(event) => setPaymentLink(event.target.value)}
                  aria-label="Link de pago del taller"
                  placeholder="https://tu-link-de-pago.com/taller"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
              <BadgeCheck className="h-4 w-4 text-amber-400" /> Suscripción de
              MecaAgenda
            </h2>
            <p className="mt-1 text-[11px] text-slate-500">
              Links que se muestran en la pantalla de pago de la app.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  Precio anual (USD)
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={appPrice}
                  onChange={(event) => setAppPrice(event.target.value)}
                  aria-label="Precio anual de la app"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  PayPal de la app
                </label>
                <input
                  value={appPaypalLink}
                  onChange={(event) => setAppPaypalLink(event.target.value)}
                  aria-label="PayPal de la app"
                  placeholder="https://paypal.me/mecaagenda"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-slate-400">
                  Link de pago de la app
                </label>
                <input
                  value={appPaymentLink}
                  onChange={(event) => setAppPaymentLink(event.target.value)}
                  aria-label="Link de pago de la app"
                  placeholder="https://tu-link-de-pago.com/mecaagenda"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
                />
              </div>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
              Los links de la app se guardan en este dispositivo. En otro
              teléfono hay que configurarlos de nuevo.
            </p>
          </section>

          {(error || saved) && (
            <p
              className={`flex items-start gap-1.5 text-xs ${
                error ? 'text-red-300' : 'text-emerald-300'
              }`}
            >
              {error ? (
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              ) : (
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              )}
              {error || saved}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Guardar configuración
          </button>
        </form>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Users className="h-4 w-4 text-amber-400" /> Perfiles en este
            dispositivo
          </h2>
          <p className="mt-1 text-[11px] text-slate-500">
            Administrá accesos, PIN y datos de los perfiles guardados en este
            teléfono o computadora.
          </p>
          <div className="mt-3 space-y-2">
            {profiles.map((entry) => (
              <ProfileRow
                key={`${entry.id}:${entry.name}:${entry.shopName}:${entry.currency}:${entry.role}`}
                profile={entry}
                isCurrent={entry.id === profile.id}
                ownersCount={ownersCount}
                onUpdate={onUpdateLocalProfile}
                onSetAccess={onSetAccess}
                onResetPin={onResetPin}
                onSetRole={onSetRole}
              />
            ))}
          </div>
          <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-slate-950/60 px-3 py-2 text-[10px] leading-relaxed text-slate-500">
            <UserCog className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            La gestión de perfiles y suscripciones se aplica solo a este
            dispositivo. Para administrar usuarios de otros teléfonos hace
            falta un servidor o backend.
          </p>
        </section>
      </main>
    </div>
  );
}
