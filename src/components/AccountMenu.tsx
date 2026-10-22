import { useState, type FormEvent } from 'react';
import {
  AlertCircle,
  BadgeCheck,
  Clock3,
  Loader2,
  LogOut,
  ShieldCheck,
  X,
} from 'lucide-react';
import { CURRENCIES, type CurrencyCode } from '../lib/currency';
import {
  PLAN_PRICE_USD,
  initials,
  type Access,
  type Profile,
} from '../lib/profiles';
import { formatDate } from '../lib/utils';

type Props = {
  profile: Profile;
  access: Access;
  onUpdateProfile: (profile: Profile) => void;
  onActivate: (code: string) => Promise<boolean>;
  onLogout: () => void;
  onClose: () => void;
};

export default function AccountMenu({
  profile,
  access,
  onUpdateProfile,
  onActivate,
  onLogout,
  onClose,
}: Props) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleActivate(event: FormEvent) {
    event.preventDefault();
    if (!code.trim()) {
      setError('Ingresá el código de activación.');
      return;
    }
    setBusy(true);
    setError('');
    const activated = await onActivate(code);
    setBusy(false);
    if (!activated) {
      setError('El código no es válido.');
      return;
    }
    setSuccess('Suscripción activada correctamente.');
    setCode('');
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-slate-950/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mx-auto my-auto w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-amber-500 text-sm font-bold text-slate-950">
              {initials(profile.name)}
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-white">
                {profile.name}
              </h2>
              <p className="truncate text-xs text-slate-400">
                {profile.shopName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5">
          <label className="block text-xs font-medium text-slate-300">
            Moneda del taller
          </label>
          <select
            value={profile.currency}
            aria-label="Moneda del taller"
            onChange={(event) =>
              onUpdateProfile({
                ...profile,
                currency: event.target.value as CurrencyCode,
              })
            }
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/60"
          >
            {CURRENCIES.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.code} — {currency.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-slate-500">
            Se aplica a todos los montos, facturas e informes.
          </p>
        </div>

        <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/50 p-3">
          {access.state === 'active' && (
            <div className="flex items-start gap-2">
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <div>
                <p className="text-sm font-semibold text-white">
                  Suscripción activa
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Válida hasta{' '}
                  {access.expiresAt
                    ? formatDate(access.expiresAt.slice(0, 10))
                    : '—'}
                </p>
              </div>
            </div>
          )}

          {access.state === 'trial' && (
            <div className="flex items-start gap-2">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <div>
                <p className="text-sm font-semibold text-white">
                  Prueba gratis
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {access.daysLeft} día
                  {access.daysLeft === 1 ? '' : 's'} restante
                  {access.daysLeft === 1 ? '' : 's'} · después USD{' '}
                  {PLAN_PRICE_USD.toFixed(2)} al año
                </p>
              </div>
            </div>
          )}

          {access.state === 'expired' && (
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <div>
                <p className="text-sm font-semibold text-white">
                  Suscripción vencida
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Activá el plan anual para seguir usando la app.
                </p>
              </div>
            </div>
          )}
        </div>

        {access.state !== 'active' && (
          <form onSubmit={handleActivate} className="mt-4">
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-400" /> Activar
              plan anual
            </label>
            <div className="mt-1 flex gap-2">
              <input
                value={code}
                aria-label="Código de activación"
                onChange={(event) =>
                  setCode(event.target.value.toUpperCase())
                }
                placeholder="Código de activación"
                className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
              />
              <button
                type="submit"
                disabled={busy}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
              >
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Activar
              </button>
            </div>
            {error && (
              <p className="mt-2 text-[11px] text-red-300">{error}</p>
            )}
            {success && (
              <p className="mt-2 text-[11px] text-emerald-300">{success}</p>
            )}
          </form>
        )}

        <div className="mt-5 border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </button>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-500">
            Perfil local en este dispositivo. Para crear otro perfil, cerrá
            sesión y elegí «Crear otro perfil».
          </p>
        </div>
      </div>
    </div>
  );
}
