import { useEffect, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  Cloud,
  Package,
  Wallet,
  Wrench,
} from 'lucide-react';
import type { Backup, Maintenance, Product, Transaction } from '../types';
import {
  loadMaintenances,
  loadProducts,
  loadTransactions,
  nextInvoiceNumber,
  readInvoiceCounter,
  saveMaintenances,
  saveProducts,
  saveTransactions,
} from '../lib/storage';
import {
  initials,
  type Access,
  type Profile,
  type ProfileRole,
} from '../lib/profiles';
import {
  loadWorkshopSettings,
  saveWorkshopSettings,
  type AppSettings,
  type WorkshopSettings,
} from '../lib/settings';
import { setActiveCurrency, toISO } from '../lib/utils';
import AgendaView from './AgendaView';
import BackupView from './BackupView';
import CashView from './CashView';
import InventoryView from './InventoryView';
import MaintenanceForm from './MaintenanceForm';
import ReportsView from './ReportsView';
import AccountMenu from './AccountMenu';
import AdminPanel from './AdminPanel';

type Tab = 'agenda' | 'inventario' | 'caja' | 'informes' | 'respaldo';

const TABS: { id: Tab; label: string; icon: typeof CalendarDays }[] = [
  { id: 'agenda', label: 'Agenda', icon: CalendarDays },
  { id: 'inventario', label: 'Inventario', icon: Package },
  { id: 'caja', label: 'Caja', icon: Wallet },
  { id: 'informes', label: 'Informes', icon: BarChart3 },
  { id: 'respaldo', label: 'Respaldo', icon: Cloud },
];

function initialTab(): Tab {
  const hash = window.location.hash.replace('#', '');
  return TABS.some((tab) => tab.id === hash) ? (hash as Tab) : 'agenda';
}

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
      dueDate: dateFromOffset(5),
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

type Props = {
  profile: Profile;
  profiles: Profile[];
  access: Access;
  appSettings: AppSettings;
  onUpdateProfile: (profile: Profile) => void;
  onActivate: (code: string) => Promise<boolean>;
  onLogout: () => void;
  onSaveAppSettings: (settings: AppSettings) => void;
  onAdminUpdateProfile: (profile: Profile) => void;
  onAdminSetAccess: (
    profileId: string,
    action: 'activate' | 'revoke',
  ) => void;
  onAdminResetPin: (profileId: string, pin: string) => Promise<void>;
  onAdminSetRole: (profileId: string, role: ProfileRole) => void;
};

export default function WorkshopApp({
  profile,
  profiles,
  access,
  appSettings,
  onUpdateProfile,
  onActivate,
  onLogout,
  onSaveAppSettings,
  onAdminUpdateProfile,
  onAdminSetAccess,
  onAdminResetPin,
  onAdminSetRole,
}: Props) {
  setActiveCurrency(profile.currency);

  const [tab, setTabState] = useState<Tab>(initialTab);
  const [items, setItems] = useState<Maintenance[]>(() =>
    loadMaintenances(profile.id),
  );
  const [products, setProducts] = useState<Product[]>(() =>
    loadProducts(profile.id),
  );
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    loadTransactions(profile.id),
  );
  const [settings, setSettings] = useState<WorkshopSettings>(() =>
    loadWorkshopSettings(profile.id),
  );
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Maintenance | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  function setTab(next: Tab) {
    setTabState(next);
    if (window.location.hash !== `#${next}`) {
      window.history.replaceState(null, '', `#${next}`);
    }
  }

  useEffect(() => {
    saveMaintenances(profile.id, items);
  }, [profile.id, items]);

  useEffect(() => {
    saveProducts(profile.id, products);
  }, [profile.id, products]);

  useEffect(() => {
    saveTransactions(profile.id, transactions);
  }, [profile.id, transactions]);

  useEffect(() => {
    if (profile.role !== 'owner') setAdminOpen(false);
  }, [profile.role]);

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
        dueKm: item.intervalKm ? item.vehicleKm + item.intervalKm : undefined,
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
      invoiceNumber = nextInvoiceNumber(profile.id);
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
    const { generateInvoicePdf } = await import('../lib/invoice');
    generateInvoicePdf({ ...item, invoiceNumber }, profile.shopName, {
      phone: settings.shopPhone,
      address: settings.shopAddress,
    });
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
      invoiceCounter: readInvoiceCounter(profile.id),
    };
  }

  function handleRestored() {
    setItems(loadMaintenances(profile.id));
    setProducts(loadProducts(profile.id));
    setTransactions(loadTransactions(profile.id));
  }

  function handleAdminSave(
    nextProfile: Profile,
    nextSettings: WorkshopSettings,
    nextAppSettings: AppSettings,
  ) {
    onUpdateProfile(nextProfile);
    setSettings(nextSettings);
    saveWorkshopSettings(nextProfile.id, nextSettings);
    onSaveAppSettings(nextAppSettings);
  }

  const trialEnding =
    access.state === 'trial' && access.daysLeft <= 2;

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-slate-950 text-slate-100">
      <header className="shrink-0 border-b border-slate-900 bg-slate-950/95 px-4 py-2.5">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="rounded-xl bg-amber-500/15 p-2 text-amber-400 ring-1 ring-amber-500/30">
              <Wrench className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold leading-none tracking-tight">
                MecaAgenda
              </h1>
              <p className="mt-0.5 hidden truncate text-xs text-slate-400 sm:block">
                {profile.shopName}
              </p>
            </div>
          </div>

          <nav className="hidden gap-1 rounded-xl bg-slate-900 p-1 ring-1 ring-slate-800 lg:flex">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition ${
                  tab === id
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => setAccountOpen(true)}
            className="relative flex shrink-0 items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-2 py-1.5 hover:bg-slate-800"
            aria-label="Cuenta y ajustes"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-amber-500 text-[11px] font-bold text-slate-950">
              {initials(profile.name)}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block max-w-[110px] truncate text-xs font-medium text-white">
                {profile.name}
              </span>
              <span className="block text-[10px] text-slate-500">
                {access.state === 'trial'
                  ? `Prueba · ${access.daysLeft} d`
                  : access.state === 'active'
                    ? 'Plan anual'
                    : 'Vencido'}
              </span>
            </span>
            {trialEnding && (
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-red-400 ring-2 ring-slate-950" />
            )}
          </button>
        </div>
      </header>

      {trialEnding && (
        <button
          type="button"
          onClick={() => setAccountOpen(true)}
          className="shrink-0 border-b border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-center text-[11px] text-amber-200 hover:bg-amber-500/15"
        >
          {access.daysLeft > 0
            ? `Prueba gratis: quedan ${access.daysLeft} día${
                access.daysLeft === 1 ? '' : 's'
              }`
            : 'Prueba gratis: vence hoy'}{' '}
          · Activar plan anual
        </button>
      )}

      <main className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col">
        {tab === 'agenda' && (
          <AgendaView
            items={items}
            shopName={profile.shopName}
            settings={settings}
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
            profile={profile}
            transactions={transactions}
            maintenances={items}
            methods={settings.enabledMethods}
            onAdd={handleAddTransaction}
            onDelete={handleDeleteTransaction}
          />
        )}

        {tab === 'informes' && (
          <ReportsView
            profile={profile}
            maintenances={items}
            transactions={transactions}
          />
        )}

        {tab === 'respaldo' && (
          <BackupView
            profileId={profile.id}
            buildBackup={buildBackup}
            onRestored={handleRestored}
          />
        )}
      </main>

      <nav className="shrink-0 border-t border-slate-800 bg-slate-950 pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="mx-auto flex w-full max-w-5xl items-stretch">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition ${
                tab === id
                  ? 'text-amber-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {showForm && (
        <MaintenanceForm
          editing={editingItem ?? undefined}
          methods={settings.enabledMethods}
          onSave={handleSaveItem}
          onClose={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
        />
      )}

      {adminOpen && (
        <AdminPanel
          profile={profile}
          profiles={profiles}
          settings={settings}
          appSettings={appSettings}
          onSave={handleAdminSave}
          onUpdateLocalProfile={onAdminUpdateProfile}
          onSetAccess={onAdminSetAccess}
          onResetPin={onAdminResetPin}
          onSetRole={onAdminSetRole}
          onClose={() => setAdminOpen(false)}
        />
      )}

      {accountOpen && (
        <AccountMenu
          profile={profile}
          access={access}
          onUpdateProfile={onUpdateProfile}
          onActivate={onActivate}
          onLogout={onLogout}
          onOpenAdmin={
            profile.role === 'owner'
              ? () => {
                  setAccountOpen(false);
                  setAdminOpen(true);
                }
              : undefined
          }
          onClose={() => setAccountOpen(false)}
        />
      )}
    </div>
  );
}
