/**
 * Purchase Invoice PDF Generator
 */
import { formatCurrency } from './currency';

export async function generatePurchaseInvoicePdf(invoice, companyInfo = null) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  const company = companyInfo || { name: 'EzeeFlo ERP', currencyCode: 'AED' };
  const currencyCode = company.currencyCode || 'AED';
  const details = invoice.details || invoice.items || [];
  const supplier = invoice.supplier || {};

  const primaryColor = [41, 98, 255], accentColor = [80, 80, 80], darkText = [40, 40, 40];
  let yPos = margin;

  // Header
  doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.setTextColor(...primaryColor);
  doc.text(company.name || 'EzeeFlo ERP', margin, yPos + 6);
  doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...accentColor);
  let iy = yPos + 12;
  if (company.address) { doc.text(company.address, margin, iy); iy += 4; }
  if (company.phone) { doc.text(`Phone: ${company.phone}`, margin, iy); iy += 4; }
  if (company.email) { doc.text(`Email: ${company.email}`, margin, iy); iy += 4; }
  if (company.trnTin) { doc.text(`TRN: ${company.trnTin}`, margin, iy); iy += 4; }
  let rs = yPos;
  if (company.logo) {
    try {
      const p = company.logo.startsWith('/') ? company.logo : `/${company.logo}`;
      const u = company.logo.startsWith('http') ? company.logo : `${window.location.origin}${p}`;
      doc.addImage(await loadImage(u), 'PNG', pageWidth - margin - 50, yPos, 50, 18);
      rs = yPos + 22;
    } catch (e) { /* skip */ }
  }
  yPos = Math.max(iy + 2, rs);
  doc.setDrawColor(...primaryColor); doc.setLineWidth(0.8);
  doc.line(margin, yPos, pageWidth - margin, yPos); yPos += 8;

  // Title
  doc.setFontSize(26); doc.setFont('helvetica', 'bold'); doc.setTextColor(...darkText);
  doc.text('PURCHASE INVOICE', margin, yPos);
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(...accentColor);
  doc.text(`#${invoice.invoiceNumber || invoice.invoiceNo || ''}`, pageWidth - margin, yPos, { align: 'right' });
  const status = (invoice.status || '').replace(/_/g, ' ').toUpperCase();
  doc.setFontSize(8); doc.setTextColor(...primaryColor);
  doc.text(`Status: ${status}`, pageWidth - margin, yPos - 4, { align: 'right' });
  yPos += 10;

  // Supplier
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...darkText);
  doc.text('Supplier:', margin, yPos);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...accentColor);
  let by = yPos + 5;
  if (supplier.name) { doc.text(supplier.name, margin, by); by += 5; }
  const ap = [];
  if (supplier.billingAddress) ap.push(supplier.billingAddress);
  const cs = [supplier.city, supplier.state].filter(Boolean).join(', ');
  if (cs) ap.push(cs);
  if (supplier.country) ap.push(supplier.country);
  if (supplier.postalCode) ap.push(supplier.postalCode);
  if (ap.length > 0) { doc.splitTextToSize(ap.join(', '), 75).forEach(l => { doc.text(l, margin, by); by += 4.5; }); }
  if (supplier.phone) { doc.text(`Phone: ${supplier.phone}`, margin, by); by += 4.5; }
  if (supplier.email) { doc.text(`Email: ${supplier.email}`, margin, by); by += 4.5; }
  if (supplier.taxNumber) { doc.text(`TRN: ${supplier.taxNumber}`, margin, by); by += 4.5; }

  const rcx = pageWidth / 2 + 5;
  let dy = yPos;
  const dr = [
    ['Invoice Date:', invoice.invoiceDate ? invoice.invoiceDate.split('T')[0] : '-'],
    ['Due Date:', invoice.dueDate ? invoice.dueDate.split('T')[0] : '-'],
    ['Status:', status],
  ];
  if (invoice.reference) dr.push(['Reference:', invoice.reference]);
  dr.forEach(([l, v]) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...darkText);
    doc.text(l, rcx, dy);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...accentColor);
    doc.text(v, rcx + 38, dy); dy += 5.5;
  });

  yPos = Math.max(by + 2, dy + 2);

  // Table
  const headers = [['Description', 'Quantity', 'Unit Cost', 'Tax', 'Amount']];
  const body = details.map((line) => {
    const qty = parseFloat(line.quantity || 0);
    const uc = parseFloat(line.unitCost || line.unitPrice || 0);
    const lt = parseFloat(line.lineTotal || line.totalAmount || (qty * uc));
    const tp = parseFloat(line.taxPercent || line.taxRate || 0);
    const ta = lt * tp / 100;
    return [
      line.description || line.item?.name || '-',
      qty.toString(),
      `${formatCurrency(uc, currencyCode)}`,
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
    alternateRowStyles: { fillColor: [248, 249, 250] }, tableLineColor: [220, 220, 220], tableLineWidth: 0.1,
  });

  const finalY = doc.lastAutoTable.finalY + 5;

  // Totals
  const tcw = 70, tx = pageWidth - margin - tcw, tlx = tx + 6, tvx = pageWidth - margin - 6;
  const tro = [];
  tro.push({ label: 'Subtotal', value: parseFloat(invoice.subTotal || invoice.subtotalAmount || 0), fontSize: 10 });
  if (parseFloat(invoice.discountTotal || invoice.discountAmount || 0) > 0)
    tro.push({ label: 'Discount', value: -parseFloat(invoice.discountTotal || invoice.discountAmount || 0), fontSize: 10 });
  if (parseFloat(invoice.taxTotal || invoice.taxAmount || 0) > 0)
    tro.push({ label: 'Tax Total', value: parseFloat(invoice.taxTotal || invoice.taxAmount || 0), fontSize: 10 });
  tro.push({ label: 'Total Due', value: parseFloat(invoice.grandTotal || invoice.totalAmount || 0), fontSize: 12, bold: true });

  let ty = finalY + 3; const bsy = ty - 3;
  tro.forEach(r => ty += r.bold ? 9 : 6); ty += 4;
  doc.setFillColor(245, 246, 248);
  doc.roundedRect(tx - 3, bsy - 2, tcw + 6, ty - bsy + 2, 3, 3, 'F');
  ty = finalY + 3;
  tro.forEach((r, idx) => {
    const isBold = r.bold, isLast = idx === tro.length - 1;
    if (isLast) { doc.setDrawColor(...primaryColor); doc.setLineWidth(0.5); doc.line(tx - 3, ty - 1, tx + tcw + 3, ty - 1); ty += 3; }
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(r.fontSize || 10); doc.setTextColor(...(isBold ? primaryColor : accentColor));
    doc.text(r.label, tlx, ty + 2);
    doc.text(`${formatCurrency(r.value, currencyCode)}`, tvx, ty + 2, { align: 'right' });
    if (isLast) { ty += 4; doc.setDrawColor(...primaryColor); doc.setLineWidth(0.5); doc.line(tx - 3, ty - 1, tx + tcw + 3, ty - 1); ty += 1; }
    else ty += 5;
  });

  if (invoice.notes) {
    ty += 5; doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...darkText);
    doc.text('Notes:', margin, ty);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...accentColor);
    doc.text(doc.splitTextToSize(invoice.notes, contentWidth), margin, ty + 5);
  }

  const ph = doc.internal.pageSize.getHeight();
  doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.3);
  doc.line(margin, ph - 15, pageWidth - margin, ph - 15);
  doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 150, 150);
  doc.text(`Generated by EzeeFlo ERP on ${new Date().toLocaleDateString()}`, margin, ph - 10);
  doc.text(`Invoice #${invoice.invoiceNumber || invoice.invoiceNo || ''} | Thank you`, pageWidth - margin, ph - 10, { align: 'right' });

  const pdfBlob = doc.output('blob');
  return { blobUrl: URL.createObjectURL(pdfBlob), pdfBlob, filename: `PurchaseInvoice_${invoice.invoiceNumber || invoice.invoiceNo || invoice.id}.pdf` };
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
