import { useState, type FormEvent } from 'react';
import { X, Car, Bike, User, Wrench, Check } from 'lucide-react';
import type {
  Maintenance,
  PaymentMethod,
  VehicleType,
} from '../types';
import { PAYMENT_LABELS, todayISO } from '../lib/utils';

const SERVICES = [
  'Cambio de aceite',
  'Filtros (aceite / aire / combustible)',
  'Frenos',
  'Alineación y balanceo',
  'Correa de distribución',
  'Batería',
  'Neumáticos',
  'Revisión general',
  'Otro',
];

const inputClass =
  'w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60';

type Props = {
  editing?: Maintenance;
  onSave: (item: Maintenance) => void;
  onClose: () => void;
};

export default function MaintenanceForm({ editing, onSave, onClose }: Props) {
  const [form, setForm] = useState(() => ({
    clientName: editing?.clientName ?? '',
    clientPhone: editing?.clientPhone ?? '',
    vehicleType: (editing?.vehicleType ?? 'carro') as VehicleType,
    vehicleBrand: editing?.vehicleBrand ?? '',
    vehicleModel: editing?.vehicleModel ?? '',
    vehiclePlate: editing?.vehiclePlate ?? '',
    vehicleKm: editing ? String(editing.vehicleKm || '') : '',
    services: editing?.services ?? ([] as string[]),
    customService: '',
    dueDate: editing?.dueDate ?? todayISO(),
    dueTime: editing?.dueTime ?? '',
    dueKm: editing?.dueKm ? String(editing.dueKm) : '',
    intervalMonths: editing?.intervalMonths
      ? String(editing.intervalMonths)
      : '',
    intervalKm: editing?.intervalKm ? String(editing.intervalKm) : '',
    totalAmount: editing ? String(editing.totalAmount || '') : '',
    paymentMethod: (editing?.paymentMethod ?? 'efectivo') as PaymentMethod,
    notes: editing?.notes ?? '',
  }));
  const [error, setError] = useState('');

  function update<K extends keyof typeof form>(
    field: K,
    value: (typeof form)[K],
  ) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleService(service: string) {
    setForm((f) => ({
      ...f,
      services: f.services.includes(service)
        ? f.services.filter((item) => item !== service)
        : [...f.services, service],
    }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.clientName.trim() || !form.dueDate) {
      setError('Completá al menos el nombre del cliente y la fecha.');
      return;
    }

    const customService = form.customService.trim();
    const services = Array.from(
      new Set(customService ? [...form.services, customService] : form.services),
    );
    if (services.length === 0) {
      setError('Seleccioná al menos un servicio.');
      return;
    }

    onSave({
      id: editing?.id ?? crypto.randomUUID(),
      clientName: form.clientName.trim(),
      clientPhone: form.clientPhone.trim(),
      vehicleType: form.vehicleType,
      vehicleBrand: form.vehicleBrand.trim(),
      vehicleModel: form.vehicleModel.trim(),
      vehiclePlate: form.vehiclePlate.trim().toUpperCase(),
      vehicleKm: Number(form.vehicleKm) || 0,
      services,
      dueDate: form.dueDate,
      dueTime: form.dueTime || undefined,
      dueKm: form.dueKm ? Number(form.dueKm) : undefined,
      intervalMonths: form.intervalMonths
        ? Number(form.intervalMonths)
        : undefined,
      intervalKm: form.intervalKm ? Number(form.intervalKm) : undefined,
      totalAmount: Number(form.totalAmount) || 0,
      paymentMethod: form.paymentMethod,
      notes: form.notes.trim() || undefined,
      completed: editing?.completed ?? false,
      completedAt: editing?.completedAt,
      nextMaintenanceId: editing?.nextMaintenanceId,
      invoiceNumber: editing?.invoiceNumber,
      invoicedAt: editing?.invoicedAt,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:items-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h2 className="text-lg font-semibold text-white">
            {editing ? 'Editar mantenimiento' : 'Nuevo mantenimiento'}
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

        <div className="space-y-5 px-5 py-5">
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-400">
              <User className="h-4 w-4" /> Cliente
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  Nombre *
                </label>
                <input
                  className={inputClass}
                  value={form.clientName}
                  onChange={(e) => update('clientName', e.target.value)}
                  placeholder="Juan Pérez"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  Teléfono (con código de país)
                </label>
                <input
                  className={inputClass}
                  value={form.clientPhone}
                  onChange={(e) => update('clientPhone', e.target.value)}
                  placeholder="5491123456789"
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-400">
              <Car className="h-4 w-4" /> Vehículo
            </h3>
            <div>
              <label className="mb-1 block text-xs text-slate-400">
                Tipo de vehículo
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => update('vehicleType', 'carro')}
                  className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                    form.vehicleType === 'carro'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 ring-1 ring-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <Car className="h-4 w-4" /> Carro
                </button>
                <button
                  type="button"
                  onClick={() => update('vehicleType', 'moto')}
                  className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                    form.vehicleType === 'moto'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 ring-1 ring-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <Bike className="h-4 w-4" /> Moto
                </button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  Marca
                </label>
                <input
                  className={inputClass}
                  value={form.vehicleBrand}
                  onChange={(e) => update('vehicleBrand', e.target.value)}
                  placeholder="Toyota / Honda"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  Modelo
                </label>
                <input
                  className={inputClass}
                  value={form.vehicleModel}
                  onChange={(e) => update('vehicleModel', e.target.value)}
                  placeholder="Corolla / Wave"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  Placa / Patente
                </label>
                <input
                  className={inputClass}
                  value={form.vehiclePlate}
                  onChange={(e) => update('vehiclePlate', e.target.value)}
                  placeholder="AB123CD"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  Kilometraje actual
                </label>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={form.vehicleKm}
                  onChange={(e) => update('vehicleKm', e.target.value)}
                  placeholder="85000"
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-400">
              <Wrench className="h-4 w-4" /> Mantenimiento y cobro
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-slate-400">
                  Servicios (podés elegir varios)
                </label>
                <div className="flex flex-wrap gap-2">
                  {SERVICES.map((service) => {
                    const selected = form.services.includes(service);
                    return (
                      <button
                        key={service}
                        type="button"
                        onClick={() => toggleService(service)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ring-1 transition ${
                          selected
                            ? 'bg-amber-500 text-slate-950 ring-amber-500'
                            : 'bg-slate-800 text-slate-300 ring-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {selected && <Check className="h-3.5 w-3.5" />}
                        {service}
                      </button>
                    );
                  })}
                </div>
                <input
                  className={`${inputClass} mt-2`}
                  value={form.customService}
                  onChange={(e) => update('customService', e.target.value)}
                  placeholder="Otro servicio (opcional)"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  Fecha objetivo *
                </label>
                <input
                  type="date"
                  className={inputClass}
                  value={form.dueDate}
                  onChange={(e) => update('dueDate', e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  Hora del turno
                </label>
                <input
                  type="time"
                  className={inputClass}
                  value={form.dueTime}
                  onChange={(e) => update('dueTime', e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  Kilometraje objetivo
                </label>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={form.dueKm}
                  onChange={(e) => update('dueKm', e.target.value)}
                  placeholder="90000"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  Monto total
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={inputClass}
                  value={form.totalAmount}
                  onChange={(e) => update('totalAmount', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  Forma de pago
                </label>
                <select
                  className={inputClass}
                  value={form.paymentMethod}
                  onChange={(e) =>
                    update('paymentMethod', e.target.value as PaymentMethod)
                  }
                >
                  {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  Recordar cada (meses)
                </label>
                <input
                  type="number"
                  min="1"
                  className={inputClass}
                  value={form.intervalMonths}
                  onChange={(e) => update('intervalMonths', e.target.value)}
                  placeholder="6"
                />
              </div>
              <div className="sm:col-span-2">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">
                      Recordar cada (km)
                    </label>
                    <input
                      type="number"
                      min="0"
                      className={inputClass}
                      value={form.intervalKm}
                      onChange={(e) => update('intervalKm', e.target.value)}
                      placeholder="10000"
                    />
                  </div>
                  <p className="self-end text-[11px] leading-snug text-slate-500">
                    Si cargás meses, al completar el trabajo se agenda solo el
                    próximo service. El km se calcula sobre el kilometraje
                    actual.
                  </p>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-slate-400">
                  Notas
                </label>
                <textarea
                  className={`${inputClass} min-h-[72px] resize-y`}
                  value={form.notes}
                  onChange={(e) => update('notes', e.target.value)}
                  placeholder="Repuesto pedido, observaciones, etc."
                />
              </div>
            </div>
          </section>

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
            {editing ? 'Guardar cambios' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
