import { useState, type FormEvent } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  LockKeyhole,
  Plus,
  UserRound,
  Wrench,
} from 'lucide-react';
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  type CurrencyCode,
} from '../lib/currency';
import {
  initials,
  verifyPin,
  type NewProfileInput,
  type Profile,
} from '../lib/profiles';

type Props = {
  profiles: Profile[];
  initialMode: 'list' | 'create';
  hasLegacyData: boolean;
  onLogin: (profile: Profile) => void;
  onCreate: (input: NewProfileInput) => Promise<void>;
};

type Mode = 'list' | 'login' | 'create';

export default function LoginScreen({
  profiles,
  initialMode,
  hasLegacyData,
  onLogin,
  onCreate,
}: Props) {
  const [mode, setMode] = useState<Mode>(
    profiles.length === 0 ? 'create' : initialMode,
  );
  const [selectedId, setSelectedId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState('');
  const [shopName, setShopName] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const selected = profiles.find((profile) => profile.id === selectedId);

  function goToLogin(profile: Profile) {
    setSelectedId(profile.id);
    setPin('');
    setError('');
    setMode('login');
  }

  function goToList() {
    setSelectedId('');
    setPin('');
    setError('');
    setMode('list');
  }

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    if (!/^\d{4,8}$/.test(pin)) {
      setError('El PIN debe tener entre 4 y 8 números.');
      return;
    }
    setBusy(true);
    setError('');
    const valid = await verifyPin(selected, pin);
    setBusy(false);
    if (!valid) {
      setError('PIN incorrecto. Intentá de nuevo.');
      setPin('');
      return;
    }
    onLogin(selected);
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !shopName.trim()) {
      setError('Completá tu nombre y el nombre del taller.');
      return;
    }
    if (!/^\d{4,8}$/.test(newPin)) {
      setError('El PIN debe tener entre 4 y 8 números.');
      return;
    }
    if (newPin !== confirmPin) {
      setError('Los PIN no coinciden.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onCreate({
        name: name.trim(),
        shopName: shopName.trim(),
        currency,
        pin: newPin,
      });
    } catch {
      setError('No se pudo crear el perfil. Intentá de nuevo.');
      setBusy(false);
    }
  }

  return (
    <div className="h-[100dvh] overflow-y-auto bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-4 py-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="rounded-2xl bg-amber-500/15 p-3.5 text-amber-400 ring-1 ring-amber-500/30">
            <Wrench className="h-7 w-7" />
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight">MecaAgenda</h1>
          <p className="mt-1 text-sm text-slate-400">
            Agenda, inventario y caja del taller
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-2xl">
          {mode === 'list' && (
            <div>
              <h2 className="text-lg font-semibold">Elegí tu perfil</h2>
              <p className="mt-1 text-xs text-slate-400">
                Ingresá con tu PIN para ver tus datos.
              </p>
              <div className="mt-4 space-y-2">
                {profiles.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => goToLogin(profile)}
                    className="flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-left transition hover:border-amber-500/50 hover:bg-slate-900"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-500 text-sm font-bold text-slate-950">
                      {initials(profile.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-white">
                        {profile.name}
                      </span>
                      <span className="block truncate text-xs text-slate-400">
                        {profile.shopName} · {profile.currency}
                      </span>
                    </span>
                    <LockKeyhole className="h-4 w-4 shrink-0 text-slate-500" />
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setMode('create');
                }}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 hover:border-amber-500/50 hover:text-amber-300"
              >
                <Plus className="h-4 w-4" /> Crear otro perfil
              </button>
            </div>
          )}

          {mode === 'login' && selected && (
            <form onSubmit={handleLogin}>
              <button
                type="button"
                onClick={goToList}
                className="mb-3 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Cambiar de perfil
              </button>
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-amber-500 text-base font-bold text-slate-950">
                  {initials(selected.name)}
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold">
                    {selected.name}
                  </h2>
                  <p className="truncate text-xs text-slate-400">
                    {selected.shopName}
                  </p>
                </div>
              </div>

              <label className="mt-5 block text-sm font-medium text-slate-300">
                PIN
              </label>
              <div className="relative mt-1">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  autoFocus
                  type="password"
                  inputMode="numeric"
                  autoComplete="current-password"
                  aria-label="PIN"
                  value={pin}
                  onChange={(event) =>
                    setPin(event.target.value.replace(/\D/g, '').slice(0, 8))
                  }
                  placeholder="4 a 8 números"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-center text-lg tracking-[0.3em] text-white placeholder:text-sm placeholder:tracking-normal placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
                />
              </div>

              {error && (
                <p className="mt-3 flex items-start gap-1.5 text-xs text-red-300">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserRound className="h-4 w-4" />
                )}
                Ingresar
              </button>
            </form>
          )}

          {mode === 'create' && (
            <form onSubmit={handleCreate}>
              {profiles.length > 0 && (
                <button
                  type="button"
                  onClick={goToList}
                  className="mb-3 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Volver a los perfiles
                </button>
              )}
              <h2 className="text-lg font-semibold">
                {profiles.length === 0 ? 'Creá tu taller' : 'Nuevo perfil'}
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Tus datos quedan separados de los otros perfiles de este
                dispositivo.
              </p>

              {hasLegacyData && (
                <p className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200 ring-1 ring-amber-500/30">
                  Encontramos los datos de la versión anterior. Se van a
                  importar a este perfil.
                </p>
              )}

              <label className="mt-4 block text-xs font-medium text-slate-300">
                Tu nombre
              </label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Juan Pérez"
                aria-label="Tu nombre"
                autoComplete="name"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
              />

              <label className="mt-3 block text-xs font-medium text-slate-300">
                Nombre del taller
              </label>
              <input
                value={shopName}
                onChange={(event) => setShopName(event.target.value)}
                placeholder="Taller Los Hermanos"
                aria-label="Nombre del taller"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
              />

              <label className="mt-3 block text-xs font-medium text-slate-300">
                Moneda
              </label>
              <select
                value={currency}
                aria-label="Moneda"
                onChange={(event) =>
                  setCurrency(event.target.value as CurrencyCode)
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/60"
              >
                {CURRENCIES.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.code} — {option.label}
                  </option>
                ))}
              </select>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300">
                    PIN
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    aria-label="PIN nuevo"
                    value={newPin}
                    onChange={(event) =>
                      setNewPin(
                        event.target.value.replace(/\D/g, '').slice(0, 8),
                      )
                    }
                    placeholder="4 a 8 números"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300">
                    Repetir PIN
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    aria-label="Repetir PIN"
                    value={confirmPin}
                    onChange={(event) =>
                      setConfirmPin(
                        event.target.value.replace(/\D/g, '').slice(0, 8),
                      )
                    }
                    placeholder="Repetí el PIN"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
                  />
                </div>
              </div>

              {error && (
                <p className="mt-3 flex items-start gap-1.5 text-xs text-red-300">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Crear perfil y entrar
              </button>

              <p className="mt-3 text-center text-[11px] text-slate-500">
                Incluye 7 días gratis. Después USD 7,99 al año.
              </p>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-slate-500">
          Los perfiles y los datos se guardan solo en este dispositivo.
          <br />
          No se sincronizan automáticamente entre teléfonos.
        </p>
      </div>
    </div>
  );
}
