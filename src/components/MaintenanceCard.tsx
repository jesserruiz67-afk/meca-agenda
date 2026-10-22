import {
  Car,
  Bike,
  CalendarDays,
  Gauge,
  Phone,
  MessageCircle,
  Check,
  RotateCcw,
  Trash2,
  FileText,
  Pencil,
  Repeat,
} from 'lucide-react';
import type { Maintenance } from '../types';
import {
  STATUS_META,
  formatDate,
  formatMoney,
  getStatus,
  relativeDate,
  buildWhatsAppMessage,
  whatsappLink,
  PAYMENT_LABELS,
} from '../lib/utils';

type Props = {
  item: Maintenance;
  shopName: string;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onInvoice: (item: Maintenance) => void;
  onEdit: (item: Maintenance) => void;
};

export default function MaintenanceCard({
  item,
  shopName,
  onToggle,
  onDelete,
  onInvoice,
  onEdit,
}: Props) {
  const status = getStatus(item);
  const meta = STATUS_META[status];
  const VehicleIcon = item.vehicleType === 'moto' ? Bike : Car;
  const vehicle =
    [item.vehicleBrand, item.vehicleModel].filter(Boolean).join(' ') ||
    'Vehículo sin datos';
  const link = whatsappLink(
    item.clientPhone,
    buildWhatsAppMessage(item, shopName),
  );

  return (
    <article
      className={`rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700 ${
        item.completed ? 'opacity-70' : ''
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
            <h3 className="truncate font-semibold text-white">
              {item.clientName}
            </h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.badge}`}
            >
              {meta.label}
            </span>
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-300">
            <VehicleIcon className="h-4 w-4 shrink-0 text-slate-500" />
            <span className="truncate">
              {vehicle}
              {item.vehiclePlate ? (
                <span className="ml-2 rounded bg-slate-800 px-1.5 py-0.5 text-xs font-mono text-slate-300">
                  {item.vehiclePlate}
                </span>
              ) : null}
            </span>
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {item.services.map((service) => (
              <span
                key={service}
                className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-xs font-medium text-amber-300 ring-1 ring-amber-500/20"
              >
                {service}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {item.clientPhone && (
            <a
              href={`tel:${item.clientPhone.replace(/\s/g, '')}`}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              title="Llamar"
            >
              <Phone className="h-4 w-4" />
            </a>
          )}
          {item.totalAmount > 0 && (
            <button
              type="button"
              onClick={() => onInvoice(item)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-amber-300 ring-1 ring-amber-500/40 hover:bg-amber-500/10"
              title="Generar factura PDF"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Factura</span>
            </button>
          )}
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600/90 px-2.5 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
            title="Enviar recordatorio por WhatsApp"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Recordar</span>
          </a>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" />
          {formatDate(item.dueDate)}
          {item.dueTime ? ` · ${item.dueTime}` : ''}
          {!item.completed && (
            <span className="text-slate-500">· {relativeDate(item.dueDate)}</span>
          )}
        </span>
        {item.dueKm ? (
          <span className="inline-flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5" />
            {item.dueKm.toLocaleString('es-AR')} km
          </span>
        ) : null}
        {item.vehicleKm ? (
          <span className="text-slate-500">
            Km actual: {item.vehicleKm.toLocaleString('es-AR')}
          </span>
        ) : null}
        {item.totalAmount > 0 ? (
          <span className="font-semibold text-emerald-300">
            {formatMoney(item.totalAmount)}
            <span className="ml-1.5 font-normal text-slate-500">
              · {PAYMENT_LABELS[item.paymentMethod]}
            </span>
          </span>
        ) : null}
        {(item.intervalMonths || item.intervalKm) && (
          <span className="inline-flex items-center gap-1.5 text-slate-500">
            <Repeat className="h-3.5 w-3.5" />
            {[
              item.intervalMonths ? `cada ${item.intervalMonths} meses` : '',
              item.intervalKm
                ? `cada ${item.intervalKm.toLocaleString('es-AR')} km`
                : '',
            ]
              .filter(Boolean)
              .join(' / ')}
          </span>
        )}
      </div>

      {item.notes && (
        <p className="mt-3 rounded-lg bg-slate-800/60 px-3 py-2 text-xs text-slate-300">
          {item.notes}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3">
        <span className="min-w-0 truncate text-[11px] text-slate-500">
          {item.invoiceNumber ? `Factura ${item.invoiceNumber}` : ''}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
          >
            <Pencil className="h-3.5 w-3.5" /> Editar
          </button>
          <button
            type="button"
            onClick={() => onToggle(item.id)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
              item.completed
                ? 'text-slate-300 hover:bg-slate-800'
                : 'bg-slate-800 text-white hover:bg-slate-700'
            }`}
          >
            {item.completed ? (
              <>
                <RotateCcw className="h-3.5 w-3.5" /> Reabrir
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" /> Completar
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400"
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
