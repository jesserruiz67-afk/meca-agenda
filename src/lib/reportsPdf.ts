import { jsPDF } from 'jspdf';
import type { ReportData } from './reports';
import {
  PAYMENT_LABELS,
  formatDateTime,
  formatMoneyPlain,
  shortDate,
} from './utils';

type Column = {
  header: string;
  width: number;
  align?: 'left' | 'right';
};

const MARGIN = 15;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const RIGHT = PAGE_WIDTH - MARGIN;

function drawSectionTitle(
  doc: jsPDF,
  title: string,
  subtitle: string,
  y: number,
): number {
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(title, MARGIN, y);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(subtitle, RIGHT, y, { align: 'right' });
  return y + 5;
}

function drawTable(
  doc: jsPDF,
  columns: Column[],
  rows: string[][],
  startY: number,
  emptyText: string,
): number {
  let y = startY;
  const headerHeight = 7;
  const lineHeight = 4;
  const rowPadding = 2;

  const drawHeader = () => {
    if (y + headerHeight + 8 > PAGE_HEIGHT - 18) {
      doc.addPage();
      y = 20;
    }
    doc.setFillColor(241, 245, 249);
    doc.rect(MARGIN, y, RIGHT - MARGIN, headerHeight, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    let x = MARGIN + 2;
    for (const column of columns) {
      if (column.align === 'right') {
        doc.text(column.header, x + column.width - 4, y + 4.8, {
          align: 'right',
        });
      } else {
        doc.text(column.header, x, y + 4.8);
      }
      x += column.width;
    }
    y += headerHeight;
  };

  drawHeader();

  if (rows.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text(emptyText, MARGIN + 2, y + 6);
    return y + 10;
  }

  doc.setFont('helvetica', 'normal');
  for (const row of rows) {
    const cellLines = row.map((cell, index) =>
      doc.splitTextToSize(String(cell), columns[index].width - 4),
    );
    const maxLines = Math.max(...cellLines.map((lines) => lines.length));
    const rowHeight = maxLines * lineHeight + rowPadding * 2;
    if (y + rowHeight > PAGE_HEIGHT - 18) {
      doc.addPage();
      y = 20;
      drawHeader();
      doc.setFont('helvetica', 'normal');
    }
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    let x = MARGIN + 2;
    cellLines.forEach((lines, index) => {
      const column = columns[index];
      const align = column.align === 'right' ? 'right' : 'left';
      const textX = align === 'right' ? x + column.width - 4 : x;
      doc.text(lines, textX, y + rowPadding + 3, { align });
      x += column.width;
    });
    y += rowHeight;
    doc.setDrawColor(241, 245, 249);
    doc.line(MARGIN, y, RIGHT, y);
  }
  return y;
}

export function reportPdf(data: ReportData): Blob {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const money = (amount: number) =>
    formatMoneyPlain(amount, data.currency);

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, PAGE_WIDTH, 36, 'F');

  doc.setTextColor(251, 191, 36);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(data.shopName, MARGIN, 16);

  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('MecaAgenda - gestion del taller', MARGIN, 23);
  doc.text(
    `Generado: ${formatDateTime(data.generatedAt)}`,
    MARGIN,
    29,
  );

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(`INFORME ${data.periodLabel.toUpperCase()}`, RIGHT, 16, {
    align: 'right',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(
    data.range.label,
    RIGHT,
    23,
    { align: 'right' },
  );
  doc.text(`Moneda: ${data.currency}`, RIGHT, 29, { align: 'right' });

  let y = 46;
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('RESUMEN DEL PERIODO', MARGIN, y);
  y += 4;

  const boxes = [
    { label: 'Ingresos', value: money(data.totals.ingresos) },
    { label: 'Egresos', value: money(data.totals.egresos) },
    { label: 'Balance', value: money(data.totals.balance) },
    { label: 'Trabajos', value: String(data.works.length) },
  ];
  const boxGap = 3;
  const boxWidth = (RIGHT - MARGIN - boxGap * 3) / 4;
  const boxHeight = 17;

  boxes.forEach((box, index) => {
    const x = MARGIN + index * (boxWidth + boxGap);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, boxWidth, boxHeight, 2, 2, 'FD');
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(box.label, x + 3, y + 5.5);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(box.value, boxWidth - 6);
    doc.text(lines.slice(0, 2), x + 3, y + 10.5);
  });
  y += boxHeight + 10;

  y = drawSectionTitle(
    doc,
    'Trabajos realizados',
    `${data.works.length} registro${data.works.length === 1 ? '' : 's'}`,
    y,
  );
  y = drawTable(
    doc,
    [
      { header: 'Fecha', width: 20 },
      { header: 'Cliente', width: 38 },
      { header: 'Vehículo', width: 42 },
      { header: 'Servicios', width: 52 },
      { header: 'Monto', width: 28, align: 'right' },
    ],
    data.works.map(({ date, item }) => [
      shortDate(date),
      item.clientName,
      `${[item.vehicleBrand, item.vehicleModel].filter(Boolean).join(' ')}${
        item.vehiclePlate ? ` (${item.vehiclePlate})` : ''
      }`,
      item.services.join(', '),
      money(item.totalAmount),
    ]),
    y,
    'Sin trabajos completados en el período.',
  );

  y += 8;
  y = drawSectionTitle(
    doc,
    'Movimientos de caja',
    `${data.movements.length} movimiento${
      data.movements.length === 1 ? '' : 's'
    }`,
    y,
  );
  y = drawTable(
    doc,
    [
      { header: 'Fecha', width: 20 },
      { header: 'Tipo', width: 18 },
      { header: 'Descripción', width: 82 },
      { header: 'Método', width: 32 },
      { header: 'Monto', width: 28, align: 'right' },
    ],
    data.movements.map((movement) => [
      shortDate(movement.date),
      movement.type === 'ingreso' ? 'Ingreso' : 'Egreso',
      movement.description,
      PAYMENT_LABELS[movement.method],
      money(movement.amount),
    ]),
    y,
    'Sin movimientos de caja en el período.',
  );

  y += 8;
  doc.setDrawColor(226, 232, 240);
  doc.line(MARGIN, y, RIGHT, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Efectivo esperado: ${money(data.totals.expectedCash)}`,
    MARGIN,
    y,
  );
  doc.text(
    `Efectivo: ${money(data.totals.cashIn)} entradas / ${money(
      data.totals.cashOut,
    )} salidas`,
    RIGHT,
    y,
    { align: 'right' },
  );

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `MecaAgenda - ${data.shopName} - ${shortDate(data.range.end)}`,
      MARGIN,
      PAGE_HEIGHT - 10,
    );
    doc.text(
      `Página ${page} de ${totalPages}`,
      RIGHT,
      PAGE_HEIGHT - 10,
      { align: 'right' },
    );
  }

  return doc.output('blob');
}
