import { useState, type FormEvent } from 'react';
import {
  AlertCircle,
  Check,
  Loader2,
  LockKeyhole,
  LogOut,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { PLAN_PRICE_USD, type Profile } from '../lib/profiles';

type Props = {
  profile: Profile;
  onActivate: (code: string) => Promise<boolean>;
  onLogout: () => void;
};

const BENEFITS = [
  'Agenda, recordatorios y facturas',
  'Inventario y control de stock',
  'Caja, arqueo e informes',
  'Reportes diarios, semanales y mensuales',
  'Respaldos completos y de caja para Drive',
];

export default function Paywall({
  profile,
  onActivate,
  onLogout,
}: Props) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const expiredSubscription = Boolean(profile.subscription);

  async function handleSubmit(event: FormEvent) {
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
      setError('El código no es válido. Revisalo e intentá de nuevo.');
    }
  }

  return (
    <div className="h-[100dvh] overflow-y-auto bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-4 py-8">
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="rounded-2xl bg-amber-500/15 p-3.5 text-amber-400 ring-1 ring-amber-500/30">
            <Wrench className="h-7 w-7" />
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight">MecaAgenda</h1>
          <p className="mt-1 text-xs text-slate-400">
            {profile.shopName} · {profile.name}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-amber-500/15 p-2 text-amber-400">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold leading-tight">
                {expiredSubscription
                  ? 'Tu suscripción venció'
                  : 'Tu prueba gratuita terminó'}
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Activá el plan anual para seguir usando todos los módulos.
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="text-xs font-medium text-amber-200">Plan anual</p>
            <p className="mt-1 flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-white">
                USD {PLAN_PRICE_USD.toFixed(2)}
              </span>
              <span className="text-sm text-slate-300">/ año</span>
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Un solo pago por 12 meses. Sin renovación automática.
            </p>
          </div>

          <ul className="mt-4 space-y-2">
            {BENEFITS.map((benefit) => (
              <li
                key={benefit}
                className="flex items-start gap-2 text-xs text-slate-300"
              >
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                {benefit}
              </li>
            ))}
          </ul>

          <form onSubmit={handleSubmit} className="mt-5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
              Código de activación
            </label>
            <input
              value={code}
              aria-label="Código de activación"
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="MECA-XXXX-XXX"
              autoComplete="off"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-center text-sm font-semibold tracking-wider text-white placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
            />

            {error && (
              <p className="mt-2 flex items-start gap-1.5 text-xs text-red-300">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Activar suscripción
            </button>
          </form>

          <p className="mt-3 rounded-lg bg-slate-950/60 px-3 py-2 text-[11px] leading-relaxed text-slate-500">
            Pago simulado en esta versión: el cobro se coordina por fuera y se
            entrega el código de activación. No se piden datos de tarjeta.
          </p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="mt-5 inline-flex items-center justify-center gap-2 text-xs font-medium text-slate-400 hover:text-white"
        >
          <LogOut className="h-3.5 w-3.5" /> Cerrar sesión
        </button>
        <p className="mt-4 text-center text-[11px] text-slate-500">
          Tus datos siguen guardados en este dispositivo.
        </p>
      </div>
    </div>
  );
}
