/**
 * Purchase Order PDF Generator
 */
import { formatCurrency } from './currency';

export async function generatePurchaseOrderPdf(order, companyInfo = null) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  const company = companyInfo || { name: 'EzeeFlo ERP', currencyCode: 'AED' };
  const currencyCode = company.currencyCode || 'AED';
  const details = order.details || [];
  const supplier = order.supplier || {};

  const primaryColor = [41, 98, 255];
  const accentColor = [80, 80, 80];
  const darkText = [40, 40, 40];

  let yPos = margin;

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(company.name || 'EzeeFlo ERP', margin, yPos + 6);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...accentColor);
  let infoY = yPos + 12;
  if (company.address) { doc.text(company.address, margin, infoY); infoY += 4; }
  if (company.phone) { doc.text(`Phone: ${company.phone}`, margin, infoY); infoY += 4; }
  if (company.email) { doc.text(`Email: ${company.email}`, margin, infoY); infoY += 4; }
  if (company.trnTin) { doc.text(`TRN: ${company.trnTin}`, margin, infoY); infoY += 4; }

  let rightStart = yPos;
  if (company.logo) {
    try {
      const p = company.logo.startsWith('/') ? company.logo : `/${company.logo}`;
      const u = company.logo.startsWith('http') ? company.logo : `${window.location.origin}${p}`;
      const img = await loadImage(u);
      doc.addImage(img, 'PNG', pageWidth - margin - 50, yPos, 50, 18);
      rightStart = yPos + 22;
    } catch (e) { /* skip */ }
  }

  yPos = Math.max(infoY + 2, rightStart);
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.8);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // Title
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkText);
  doc.text('PURCHASE ORDER', margin, yPos);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...accentColor);
  doc.text(`#${order.orderNumber}`, pageWidth - margin, yPos, { align: 'right' });
  const status = (order.status || '').replace(/_/g, ' ').toUpperCase();
  doc.setFontSize(8);
  doc.setTextColor(...primaryColor);
  doc.text(`Status: ${status}`, pageWidth - margin, yPos - 4, { align: 'right' });
  yPos += 10;

  // Supplier Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkText);
  doc.text('Supplier:', margin, yPos);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...accentColor);
  let billY = yPos + 5;
  if (supplier.name) { doc.text(supplier.name, margin, billY); billY += 5; }
  const addrParts = [];
  if (supplier.billingAddress) addrParts.push(supplier.billingAddress);
  const cs = [supplier.city, supplier.state].filter(Boolean).join(', ');
  if (cs) addrParts.push(cs);
  if (supplier.country) addrParts.push(supplier.country);
  if (supplier.postalCode) addrParts.push(supplier.postalCode);
  if (addrParts.length > 0) {
    doc.splitTextToSize(addrParts.join(', '), 75).forEach(l => { doc.text(l, margin, billY); billY += 4.5; });
  }
  if (supplier.phone) { doc.text(`Phone: ${supplier.phone}`, margin, billY); billY += 4.5; }
  if (supplier.email) { doc.text(`Email: ${supplier.email}`, margin, billY); billY += 4.5; }
  if (supplier.taxNumber) { doc.text(`TRN: ${supplier.taxNumber}`, margin, billY); billY += 4.5; }

  const rightColX = pageWidth / 2 + 5;
  let detY = yPos;
  const rows = [
    ['Order Date:', order.orderDate ? order.orderDate.split('T')[0] : '-'],
    ['Delivery Date:', order.expectedDeliveryDate ? order.expectedDeliveryDate.split('T')[0] : '-'],
    ['Status:', status],
  ];
  rows.forEach(([l, v]) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...darkText);
    doc.text(l, rightColX, detY);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...accentColor);
    doc.text(v, rightColX + 38, detY);
    detY += 5.5;
  });

  yPos = Math.max(billY + 2, detY + 2);

  // Table
  const headers = [['Description', 'Quantity', 'Unit Price', 'Tax', 'Amount']];
  const body = details.map((line) => {
    const qty = parseFloat(line.quantity || 0);
    const up = parseFloat(line.unitPrice || 0);
    const lt = parseFloat(line.lineTotal || (qty * up));
    const tp = parseFloat(line.taxPercent || line.taxPercentage || 0);
    const ta = lt * tp / 100;
    return [
      line.description || line.item?.name || '-',
      qty.toString(),
      `${formatCurrency(up, currencyCode)}`,
      tp > 0 ? `${formatCurrency(ta, currencyCode)}` : '-',
      `${formatCurrency(lt, currencyCode)}`,
    ];
  });
  if (body.length === 0) body.push(['No items', '', '', '', '']);

  autoTable(doc, {
    head: headers, body, startY: yPos,
    margin: { left: margin, right: margin }, tableWidth: contentWidth,
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9, halign: 'center' },
    bodyStyles: { fontSize: 9, textColor: darkText },
    columnStyles: { 0: { cellWidth: 'auto', halign: 'left' }, 1: { cellWidth: 18, halign: 'center' }, 2: { cellWidth: 30, halign: 'right' }, 3: { cellWidth: 30, halign: 'right' }, 4: { cellWidth: 30, halign: 'right' } },
    alternateRowStyles: { fillColor: [248, 249, 250] },
    tableLineColor: [220, 220, 220], tableLineWidth: 0.1,
  });

  const finalY = doc.lastAutoTable.finalY + 5;

  // Totals
  const tcw = 70;
  const tx = pageWidth - margin - tcw;
  const tlx = tx + 6;
  const tvx = pageWidth - margin - 6;
  const tro = [];
  tro.push({ label: 'Subtotal', value: parseFloat(order.totalAmount || 0), fontSize: 10 });
  tro.push({ label: 'Total', value: parseFloat(order.totalAmount || 0), fontSize: 12, bold: true });

  let ty = finalY + 3;
  const bsy = ty - 3;
  tro.forEach(r => { ty += r.bold ? 9 : 6; }); ty += 4;
  doc.setFillColor(245, 246, 248);
  doc.roundedRect(tx - 3, bsy - 2, tcw + 6, ty - bsy + 2, 3, 3, 'F');

  ty = finalY + 3;
  tro.forEach((r, i) => {
    const isBold = r.bold; const isLast = i === tro.length - 1;
    if (isLast) { doc.setDrawColor(...primaryColor); doc.setLineWidth(0.5); doc.line(tx - 3, ty - 1, tx + tcw + 3, ty - 1); ty += 3; }
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(r.fontSize || 10);
    doc.setTextColor(...(isBold ? primaryColor : accentColor));
    doc.text(r.label, tlx, ty + 2);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.text(`${formatCurrency(r.value, currencyCode)}`, tvx, ty + 2, { align: 'right' });
    if (isLast) { ty += 4; doc.setDrawColor(...primaryColor); doc.setLineWidth(0.5); doc.line(tx - 3, ty - 1, tx + tcw + 3, ty - 1); ty += 1; }
    else ty += 5;
  });

  // Notes
  if (order.notes) {
    ty += 5;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...darkText);
    doc.text('Notes:', margin, ty);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...accentColor);
    doc.text(doc.splitTextToSize(order.notes, contentWidth), margin, ty + 5);
  }

  // Footer
  const ph = doc.internal.pageSize.getHeight();
  doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.3);
  doc.line(margin, ph - 15, pageWidth - margin, ph - 15);
  doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 150, 150);
  doc.text(`Generated by EzeeFlo ERP on ${new Date().toLocaleDateString()}`, margin, ph - 10);
  doc.text(`PO #${order.orderNumber} | Thank you`, pageWidth - margin, ph - 10, { align: 'right' });

  const pdfBlob = doc.output('blob');
  return { blobUrl: URL.createObjectURL(pdfBlob), pdfBlob, filename: `PurchaseOrder_${order.orderNumber || order.id}.pdf` };
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      c.getContext('2d').drawImage(img, 0, 0); resolve(c.toDataURL('image/png'));
    };
    img.onerror = reject; img.src = url;
  });
}
