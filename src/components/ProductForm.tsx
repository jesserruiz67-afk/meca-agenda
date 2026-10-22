import { useState, type FormEvent } from 'react';
import { X, Package } from 'lucide-react';
import type { Product } from '../types';

const inputClass =
  'w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60';

type Props = {
  initial?: Product;
  onSave: (product: Product) => void;
  onClose: () => void;
};

export default function ProductForm({ initial, onSave, onClose }: Props) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    sku: initial?.sku ?? '',
    category: initial?.category ?? '',
    stock: initial ? String(initial.stock) : '',
    minStock: initial ? String(initial.minStock) : '',
    unitCost: initial ? String(initial.unitCost) : '',
  });
  const [error, setError] = useState('');

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('El nombre del producto es obligatorio.');
      return;
    }

    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      name: form.name.trim(),
      sku: form.sku.trim(),
      category: form.category.trim(),
      stock: Number(form.stock) || 0,
      minStock: Number(form.minStock) || 0,
      unitCost: Number(form.unitCost) || 0,
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:items-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Package className="h-5 w-5 text-amber-400" />
            {initial ? 'Editar producto' : 'Nuevo producto'}
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

        <div className="grid gap-3 px-5 py-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-slate-400">
              Nombre *
            </label>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Aceite 5W-30 4L"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">
              Código / SKU
            </label>
            <input
              className={inputClass}
              value={form.sku}
              onChange={(e) => update('sku', e.target.value)}
              placeholder="ACE-5W30"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">
              Categoría
            </label>
            <input
              className={inputClass}
              value={form.category}
              onChange={(e) => update('category', e.target.value)}
              placeholder="Lubricantes"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">
              Stock actual
            </label>
            <input
              type="number"
              min="0"
              className={inputClass}
              value={form.stock}
              onChange={(e) => update('stock', e.target.value)}
              placeholder="10"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">
              Stock mínimo
            </label>
            <input
              type="number"
              min="0"
              className={inputClass}
              value={form.minStock}
              onChange={(e) => update('minStock', e.target.value)}
              placeholder="3"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-slate-400">
              Costo unitario
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputClass}
              value={form.unitCost}
              onChange={(e) => update('unitCost', e.target.value)}
              placeholder="0"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-500/30 sm:col-span-2">
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
