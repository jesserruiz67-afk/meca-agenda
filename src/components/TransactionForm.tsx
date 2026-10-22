import { useState, type FormEvent } from 'react';
import { X, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import type { PaymentMethod, Transaction, TransactionType } from '../types';
import { PAYMENT_METHODS, todayISO } from '../lib/utils';

const inputClass =
  'w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60';

type Props = {
  methods?: PaymentMethod[];
  onSave: (transaction: Transaction) => void;
  onClose: () => void;
};

export default function TransactionForm({ methods, onSave, onClose }: Props) {
  const [form, setForm] = useState({
    type: 'ingreso' as TransactionType,
    date: todayISO(),
    description: '',
    amount: '',
    method: 'efectivo' as PaymentMethod,
  });
  const [error, setError] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.description.trim() || !amount || amount <= 0) {
      setError('Ingresá una descripción y un monto mayor a cero.');
      return;
    }

    onSave({
      id: crypto.randomUUID(),
      date: form.date || todayISO(),
      type: form.type,
      description: form.description.trim(),
      amount,
      method: form.method,
      createdAt: new Date().toISOString(),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:items-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h2 className="text-lg font-semibold text-white">
            Nuevo movimiento de caja
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, type: 'ingreso' }))}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                form.type === 'ingreso'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 ring-1 ring-slate-700 hover:bg-slate-700'
              }`}
            >
              <ArrowDownCircle className="h-4 w-4" /> Ingreso
            </button>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, type: 'egreso' }))}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                form.type === 'egreso'
                  ? 'bg-red-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 ring-1 ring-slate-700 hover:bg-slate-700'
              }`}
            >
              <ArrowUpCircle className="h-4 w-4" /> Egreso
            </button>
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400">
              Descripción *
            </label>
            <input
              className={inputClass}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Venta de repuesto, pago de proveedor..."
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-slate-400">
                Monto *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
                placeholder="0"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">
                Fecha
              </label>
              <input
                type="date"
                className={inputClass}
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-slate-400">
                Forma de pago
              </label>
              <select
                className={inputClass}
                value={form.method}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    method: e.target.value as PaymentMethod,
                  }))
                }
              >
                {PAYMENT_METHODS.filter(
                  (method) =>
                    !methods ||
                    methods.includes(method.id) ||
                    method.id === form.method,
                ).map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-500/30">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-800 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400"
          >
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}
