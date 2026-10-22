import { jsPDF } from 'jspdf';
import type { Maintenance } from '../types';
import {
  formatDate,
  formatMoney,
  todayISO,
  VEHICLE_LABELS,
  PAYMENT_LABELS,
} from './utils';

export function generateInvoicePdf(
  item: Maintenance,
  shopName: string,
  details?: { phone?: string; address?: string },
): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const right = pageWidth - margin;

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(251, 191, 36);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(shopName, margin, 19);

  doc.setTextColor(203, 213, 225);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Servicio mecánico y mantenimiento', margin, 26);

  const contact = [details?.phone, details?.address]
    .filter(Boolean)
    .join(' · ');
  if (contact) {
    doc.setFontSize(8);
    const line = doc.splitTextToSize(contact, right - margin)[0];
    doc.text(line, margin, 33);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('FACTURA', right, 18, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(item.invoiceNumber ?? 'FAC-00000', right, 25, { align: 'right' });
  doc.text(`Emisión: ${formatDate(todayISO())}`, right, 31, {
    align: 'right',
  });

  let y = 54;

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('CLIENTE', margin, y);
  doc.text('VEHÍCULO', pageWidth / 2, y);

  y += 6;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.text(item.clientName, margin, y);

  const vehicleName =
    [item.vehicleBrand, item.vehicleModel].filter(Boolean).join(' ') ||
    'Sin datos';
  doc.text(vehicleName, pageWidth / 2, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(9);
  doc.text(item.clientPhone || 'Sin teléfono', margin, y);
  doc.text(
    `${VEHICLE_LABELS[item.vehicleType]} · ${item.vehiclePlate || 'Sin placa'}`,
    pageWidth / 2,
    y,
  );

  y += 5;
  doc.text(
    item.vehicleKm
      ? `Kilometraje: ${item.vehicleKm.toLocaleString('es-AR')} km`
      : 'Kilometraje: sin datos',
    margin,
    y,
  );
  doc.text(
    `Pago: ${PAYMENT_LABELS[item.paymentMethod]}`,
    pageWidth / 2,
    y,
  );

  y += 14;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, right, y);

  y += 8;
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y - 5, right - margin, 9, 'F');
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('SERVICIOS REALIZADOS', margin + 3, y + 1);

  y += 12;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const services = item.services.length > 0 ? item.services : ['Servicio'];
  for (const service of services) {
    doc.text(`•  ${service}`, margin + 3, y);
    y += 6;
  }

  y -= 2;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, right, y);

  if (item.notes) {
    y += 9;
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('OBSERVACIONES', margin, y);
    y += 5;
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const notes = doc.splitTextToSize(item.notes, right - margin);
    doc.text(notes, margin, y);
    y += notes.length * 4.5;
  }

  y += 12;
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(10);
  doc.text('TOTAL', right - 45, y, { align: 'right' });
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(formatMoney(item.totalAmount), right, y, { align: 'right' });

  doc.setDrawColor(15, 23, 42);
  doc.line(right - 60, y + 4, right, y + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Gracias por su confianza. Documento generado automáticamente.',
    margin,
    pageHeight - 20,
  );

  const fileName = `Factura-${item.invoiceNumber ?? 'sin-numero'}.pdf`;
  doc.save(fileName);
}
