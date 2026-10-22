import { useMemo, useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Pencil,
  Trash2,
  Minus,
  AlertTriangle,
  Boxes,
  DollarSign,
} from 'lucide-react';
import type { Product } from '../types';
import { formatMoney } from '../lib/utils';
import StatCard from './StatCard';
import ProductForm from './ProductForm';

type Props = {
  products: Product[];
  onAdd: (product: Product) => void;
  onUpdate: (product: Product) => void;
  onDelete: (id: string) => void;
};

export default function InventoryView({
  products,
  onAdd,
  onUpdate,
  onDelete,
}: Props) {
  const [query, setQuery] = useState('');
  const [formState, setFormState] = useState<{
    open: boolean;
    product?: Product;
  }>({ open: false });

  const stats = useMemo(() => {
    const lowStock = products.filter(
      (product) => product.stock <= product.minStock,
    ).length;
    const value = products.reduce(
      (total, product) => total + product.stock * product.unitCost,
      0,
    );
    return { total: products.length, lowStock, value };
  }, [products]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return products
      .filter((product) => {
        if (!term) return true;
        return [product.name, product.sku, product.category]
          .join(' ')
          .toLowerCase()
          .includes(term);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, query]);

  function adjustStock(product: Product, delta: number) {
    const stock = Math.max(0, product.stock + delta);
    if (stock === product.stock) return;
    onUpdate({ ...product, stock, updatedAt: new Date().toISOString() });
  }

  function handleSave(product: Product) {
    if (formState.product) onUpdate(product);
    else onAdd(product);
    setFormState({ open: false });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-4 pt-3">
        <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
          <StatCard
            label="Productos"
            value={stats.total}
            icon={Boxes}
            accent="bg-sky-500/15 text-sky-400"
          />
          <StatCard
            label="Stock bajo"
            value={stats.lowStock}
            icon={AlertTriangle}
            accent="bg-red-500/15 text-red-400"
          />
          <div className="col-span-2 sm:col-span-1">
            <StatCard
              label="Valor inventario"
              value={formatMoney(stats.value)}
              icon={DollarSign}
              accent="bg-emerald-500/15 text-emerald-400"
            />
          </div>
        </section>
      </div>

      <div className="shrink-0 px-4 pt-3">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar producto, SKU..."
              className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 pl-8 pr-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
            />
          </div>
          <button
            type="button"
            onClick={() => setFormState({ open: true })}
            aria-label="Agregar producto"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Agregar</span>
          </button>
        </div>
      </div>

      <div className="mt-3 flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-4">
        {visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 px-6 py-10 text-center">
            <Package className="mx-auto h-9 w-9 text-slate-600" />
            <p className="mt-3 font-medium text-slate-200">
              {products.length === 0
                ? 'No hay productos en el inventario'
                : 'Sin resultados'}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {products.length === 0
                ? 'Agregá repuestos y lubricantes para controlar el stock.'
                : 'Probá con otro término de búsqueda.'}
            </p>
            {products.length === 0 && (
              <button
                type="button"
                onClick={() => setFormState({ open: true })}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400"
              >
                <Plus className="h-4 w-4" /> Agregar producto
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-2 md:hidden">
              {visible.map((product) => {
                const low = product.stock <= product.minStock;
                return (
                  <div
                    key={product.id}
                    className="rounded-xl border border-slate-800 bg-slate-900/60 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                          {product.name}
                        </p>
                        <p className="truncate text-[11px] text-slate-500">
                          {[product.sku, product.category]
                            .filter(Boolean)
                            .join(' · ') || 'Sin categoría'}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() =>
                            setFormState({ open: true, product })
                          }
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(product.id)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex items-end justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => adjustStock(product, -1)}
                          className="rounded-md bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span
                          className={`min-w-[2rem] text-center text-sm font-bold ${
                            low ? 'text-red-400' : 'text-white'
                          }`}
                        >
                          {product.stock}
                        </span>
                        <button
                          type="button"
                          onClick={() => adjustStock(product, 1)}
                          className="rounded-md bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                        {low && (
                          <span className="rounded-full bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-300 ring-1 ring-red-500/30">
                            Bajo
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-slate-500">
                          Costo {formatMoney(product.unitCost)}
                        </p>
                        <p className="text-sm font-semibold text-emerald-300">
                          {formatMoney(product.stock * product.unitCost)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto rounded-2xl border border-slate-800 md:block">
              <table className="min-w-full divide-y divide-slate-800 text-sm">
                <thead className="bg-slate-900/80 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Producto</th>
                    <th className="px-4 py-3 font-medium">Categoría</th>
                    <th className="px-4 py-3 font-medium">Stock</th>
                    <th className="px-4 py-3 font-medium">Mín.</th>
                    <th className="px-4 py-3 font-medium">Costo</th>
                    <th className="px-4 py-3 font-medium">Valor</th>
                    <th className="px-4 py-3 text-right font-medium">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 bg-slate-900/40">
                  {visible.map((product) => {
                    const low = product.stock <= product.minStock;
                    return (
                      <tr key={product.id} className="hover:bg-slate-900/70">
                        <td className="px-4 py-3">
                          <p className="font-medium text-white">
                            {product.name}
                          </p>
                          {product.sku && (
                            <p className="font-mono text-xs text-slate-500">
                              {product.sku}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {product.category || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => adjustStock(product, -1)}
                              className="rounded-md bg-slate-800 p-1 text-slate-300 hover:bg-slate-700"
                              title="Restar stock"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span
                              className={`min-w-[2.5rem] text-center font-semibold ${
                                low ? 'text-red-400' : 'text-white'
                              }`}
                            >
                              {product.stock}
                            </span>
                            <button
                              type="button"
                              onClick={() => adjustStock(product, 1)}
                              className="rounded-md bg-slate-800 p-1 text-slate-300 hover:bg-slate-700"
                              title="Sumar stock"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                            {low && (
                              <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-300 ring-1 ring-red-500/30">
                                Bajo
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {product.minStock}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {formatMoney(product.unitCost)}
                        </td>
                        <td className="px-4 py-3 font-medium text-emerald-300">
                          {formatMoney(product.stock * product.unitCost)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                setFormState({ open: true, product })
                              }
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDelete(product.id)}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {formState.open && (
        <ProductForm
          initial={formState.product}
          onSave={handleSave}
          onClose={() => setFormState({ open: false })}
        />
      )}
    </div>
  );
}
