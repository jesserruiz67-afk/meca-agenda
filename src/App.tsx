import { useEffect, useState } from 'react';
import { Wrench, CalendarDays, Package, Wallet, Cloud } from 'lucide-react';
import type {
  Backup,
  Maintenance,
  Product,
  Transaction,
} from './types';
import {
  loadMaintenances,
  saveMaintenances,
  loadProducts,
  saveProducts,
  loadTransactions,
  saveTransactions,
  nextInvoiceNumber,
  readInvoiceCounter,
} from './lib/storage';
import { toISO } from './lib/utils';
import AgendaView from './components/AgendaView';
import InventoryView from './components/InventoryView';
import CashView from './components/CashView';
import BackupView from './components/BackupView';
import MaintenanceForm from './components/MaintenanceForm';

const SHOP_NAME = 'MecaAgenda';

type Tab = 'agenda' | 'inventario' | 'caja' | 'respaldo';

function seedExamples(): Maintenance[] {
  const now = new Date();
  const dateFromOffset = (offset: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() + offset);
    return toISO(date);
  };
  const base = {
    completed: false,
    createdAt: new Date().toISOString(),
  };

  return [
    {
      ...base,
      id: crypto.randomUUID(),
      clientName: 'María González',
      clientPhone: '5491123456789',
      vehicleType: 'carro',
      vehicleBrand: 'Toyota',
      vehicleModel: 'Corolla',
      vehiclePlate: 'AB123CD',
      vehicleKm: 84200,
      services: ['Cambio de aceite'],
      dueDate: dateFromOffset(-3),
      dueTime: '09:30',
      dueKm: 85000,
      intervalMonths: 6,
      intervalKm: 10000,
      totalAmount: 45000,
      paymentMethod: 'efectivo',
      notes: 'Aceite 5W-30 sintético.',
    },
    {
      ...base,
      id: crypto.randomUUID(),
      clientName: 'Carlos Ramírez',
      clientPhone: '5491198765432',
      vehicleType: 'carro',
      vehicleBrand: 'Ford',
      vehicleModel: 'Ranger',
      vehiclePlate: 'AC456EF',
      vehicleKm: 121000,
      services: ['Frenos'],
      dueDate: dateFromOffset(0),
      dueTime: '11:00',
      totalAmount: 80000,
      paymentMethod: 'transferencia',
    },
    {
      ...base,
      id: crypto.randomUUID(),
      clientName: 'Sofía Torres',
      clientPhone: '5491177778888',
      vehicleType: 'moto',
      vehicleBrand: 'Honda',
      vehicleModel: 'Wave 110',
      vehiclePlate: 'A123BCD',
      vehicleKm: 15400,
      services: ['Cambio de aceite'],
      dueDate: dateFromOffset(2),
      dueTime: '15:00',
      dueKm: 16000,
      intervalMonths: 3,
      intervalKm: 3000,
      totalAmount: 15000,
      paymentMethod: 'efectivo',
    },
    {
      ...base,
      id: crypto.randomUUID(),
      clientName: 'Lucía Fernández',
      clientPhone: '5491155554444',
      vehicleType: 'moto',
      vehicleBrand: 'Yamaha',
      vehicleModel: 'FZ 2.0',
      vehiclePlate: 'B456EFG',
      vehicleKm: 22300,
      services: ['Alineación y balanceo'],
      dueDate: dateFromOffset(4),
      totalAmount: 22000,
      paymentMethod: 'tarjeta',
    },
    {
      ...base,
      id: crypto.randomUUID(),
      clientName: 'Diego Sosa',
      clientPhone: '5491133332222',
      vehicleType: 'carro',
      vehicleBrand: 'Chevrolet',
      vehicleModel: 'Onix',
      vehiclePlate: 'AE321JK',
      vehicleKm: 45800,
      services: ['Revisión general'],
      dueDate: dateFromOffset(12),
      totalAmount: 35000,
      paymentMethod: 'efectivo',
    },
  ];
}

const TABS: { id: Tab; label: string; icon: typeof CalendarDays }[] = [
  { id: 'agenda', label: 'Agenda', icon: CalendarDays },
  { id: 'inventario', label: 'Inventario', icon: Package },
  { id: 'caja', label: 'Caja', icon: Wallet },
  { id: 'respaldo', label: 'Respaldo', icon: Cloud },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('agenda');
  const [items, setItems] = useState<Maintenance[]>(() => loadMaintenances());
  const [products, setProducts] = useState<Product[]>(() => loadProducts());
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    loadTransactions(),
  );
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Maintenance | null>(null);

  useEffect(() => {
    saveMaintenances(items);
  }, [items]);

  useEffect(() => {
    saveProducts(products);
  }, [products]);

  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  function handleSaveItem(item: Maintenance) {
    if (editingItem) {
      setItems((current) =>
        current.map((entry) => (entry.id === item.id ? item : entry)),
      );
    } else {
      setItems((current) => [item, ...current]);
    }
    setShowForm(false);
    setEditingItem(null);
    setTab('agenda');
  }

  function handleToggle(id: string) {
    const item = items.find((entry) => entry.id === id);
    if (!item) return;

    if (item.completed) {
      setItems((current) =>
        current.map((entry) =>
          entry.id === id
            ? { ...entry, completed: false, completedAt: undefined }
            : entry,
        ),
      );
      return;
    }

    const completedAt = new Date().toISOString();
    const months = item.intervalMonths ?? 0;
    let next: Maintenance | null = null;

    if (months > 0 && !item.nextMaintenanceId) {
      const due = new Date(completedAt);
      due.setMonth(due.getMonth() + months);
      next = {
        ...item,
        id: crypto.randomUUID(),
        dueDate: toISO(due),
        dueKm: item.intervalKm
          ? item.vehicleKm + item.intervalKm
          : undefined,
        totalAmount: 0,
        completed: false,
        completedAt: undefined,
        nextMaintenanceId: undefined,
        invoiceNumber: undefined,
        invoicedAt: undefined,
        notes: `Próximo service programado automáticamente (cada ${months} meses${
          item.intervalKm
            ? ` / ${item.intervalKm.toLocaleString('es-AR')} km`
            : ''
        }).`,
        createdAt: completedAt,
      };
    }

    setItems((current) => {
      const updated = current.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              completed: true,
              completedAt,
              nextMaintenanceId: next?.id ?? entry.nextMaintenanceId,
            }
          : entry,
      );
      return next ? [next, ...updated] : updated;
    });
  }

  function handleDeleteItem(id: string) {
    if (!window.confirm('¿Eliminar este registro?')) return;
    setItems((current) => current.filter((item) => item.id !== id));
  }

  async function handleInvoice(item: Maintenance) {
    let invoiceNumber = item.invoiceNumber;
    if (!invoiceNumber) {
      invoiceNumber = nextInvoiceNumber();
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                invoiceNumber,
                invoicedAt: new Date().toISOString(),
              }
            : entry,
        ),
      );
    }
    const { generateInvoicePdf } = await import('./lib/invoice');
    generateInvoicePdf({ ...item, invoiceNumber }, SHOP_NAME);
  }

  function handleAddProduct(product: Product) {
    setProducts((current) => [product, ...current]);
  }

  function handleUpdateProduct(product: Product) {
    setProducts((current) =>
      current.map((entry) => (entry.id === product.id ? product : entry)),
    );
  }

  function handleDeleteProduct(id: string) {
    if (!window.confirm('¿Eliminar este producto del inventario?')) return;
    setProducts((current) => current.filter((product) => product.id !== id));
  }

  function handleAddTransaction(transaction: Transaction) {
    setTransactions((current) => [transaction, ...current]);
  }

  function handleDeleteTransaction(id: string) {
    setTransactions((current) =>
      current.filter((transaction) => transaction.id !== id),
    );
  }

  function buildBackup(): Backup {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      maintenances: items,
      products,
      transactions,
      invoiceCounter: readInvoiceCounter(),
    };
  }

  function handleRestored() {
    setItems(loadMaintenances());
    setProducts(loadProducts());
    setTransactions(loadTransactions());
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-500/15 p-3 text-amber-400 ring-1 ring-amber-500/30">
              <Wrench className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">MecaAgenda</h1>
              <p className="text-sm text-slate-400">
                Agenda, inventario y caja del taller
              </p>
            </div>
          </div>

          <nav className="flex gap-1 rounded-xl bg-slate-900 p-1 ring-1 ring-slate-800">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  tab === id
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </nav>
        </header>

        <main className="mt-6">
          {tab === 'agenda' && (
            <AgendaView
              items={items}
              shopName={SHOP_NAME}
              onNew={() => {
                setEditingItem(null);
                setShowForm(true);
              }}
              onSeed={() => setItems(seedExamples())}
              onToggle={handleToggle}
              onDelete={handleDeleteItem}
              onInvoice={handleInvoice}
              onEdit={(item) => {
                setEditingItem(item);
                setShowForm(true);
              }}
            />
          )}

          {tab === 'inventario' && (
            <InventoryView
              products={products}
              onAdd={handleAddProduct}
              onUpdate={handleUpdateProduct}
              onDelete={handleDeleteProduct}
            />
          )}

          {tab === 'caja' && (
            <CashView
              transactions={transactions}
              maintenances={items}
              onAdd={handleAddTransaction}
              onDelete={handleDeleteTransaction}
            />
          )}

          {tab === 'respaldo' && (
            <BackupView
              buildBackup={buildBackup}
              onRestored={handleRestored}
            />
          )}
        </main>

        <footer className="border-t border-slate-900 py-5 text-center text-xs text-slate-500">
          Los datos se guardan en este dispositivo (localStorage).
        </footer>
      </div>

      {showForm && (
        <MaintenanceForm
          editing={editingItem ?? undefined}
          onSave={handleSaveItem}
          onClose={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}
