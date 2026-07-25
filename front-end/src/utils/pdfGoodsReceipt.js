/**
 * Goods Receipt PDF Generator
 */
import { formatCurrency } from './currency';

export async function generateGoodsReceiptPdf(grn, companyInfo = null) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  const company = companyInfo || { name: 'EzeeFlo ERP', currencyCode: 'AED' };
  const currencyCode = company.currencyCode || 'AED';
  const details = grn.details || grn.GoodsReceiptDetails || grn.items || [];
  const supplier = grn.supplier || grn.Supplier || {};

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
  doc.text('GOODS RECEIPT', margin, yPos);
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(...accentColor);
  doc.text(`#${grn.receiptNumber || grn.grnNumber || ''}`, pageWidth - margin, yPos, { align: 'right' });
  const status = (grn.status || '').replace(/_/g, ' ').toUpperCase();
  doc.setFontSize(8); doc.setTextColor(...primaryColor);
  doc.text(`Status: ${status}`, pageWidth - margin, yPos - 4, { align: 'right' });
  yPos += 10;

  // Supplier Info
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...darkText);
  doc.text('Supplier:', margin, yPos);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...accentColor);
  let by = yPos + 5;
  const sName = supplier.name || supplier.supplierName || grn.supplierName || '';
  if (sName) { doc.text(sName, margin, by); by += 5; }
  const sPhone = supplier.phone || grn.supplierPhone || '';
  if (sPhone) { doc.text(`Phone: ${sPhone}`, margin, by); by += 4.5; }
  const sEmail = supplier.email || grn.supplierEmail || '';
  if (sEmail) { doc.text(`Email: ${sEmail}`, margin, by); by += 4.5; }
  const sTrn = supplier.taxNumber || supplier.taxId || grn.supplierTaxNumber || '';
  if (sTrn) { doc.text(`TRN: ${sTrn}`, margin, by); by += 4.5; }

  const rcx = pageWidth / 2 + 5;
  let dy = yPos;
  const dr = [
    ['Receipt Date:', grn.receiptDate ? grn.receiptDate.split('T')[0] : '-'],
    ['Reference:', grn.reference || grn.referenceNo || '-'],
    ['Status:', status],
  ];
  dr.forEach(([l, v]) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...darkText);
    doc.text(l, rcx, dy);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...accentColor);
    doc.text(v, rcx + 38, dy); dy += 5.5;
  });

  yPos = Math.max(by + 2, dy + 2);

  // Table
  const headers = [['Item Name', 'Ordered Qty', 'Received Qty', 'Unit Cost', 'Total']];
  const body = details.map((line) => {
    const oq = parseFloat(line.orderedQuantity || 0);
    const rq = parseFloat(line.receivedQuantity || line.quantity || 0);
    const uc = parseFloat(line.unitCost || line.unitPrice || 0);
    const total = rq * uc;
    const itemName = line.itemName || line.item?.name || line.Item?.name || line.description || '-';
    return [
      itemName,
      oq.toString(),
      rq.toString(),
      `${formatCurrency(uc, currencyCode)}`,
      `${formatCurrency(total, currencyCode)}`,
    ];
  });
  if (body.length === 0) body.push(['No items', '', '', '', '']);

  autoTable(doc, {
    head: headers, body, startY: yPos,
    margin: { left: margin, right: margin }, tableWidth: contentWidth,
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9, halign: 'center' },
    bodyStyles: { fontSize: 9, textColor: darkText },
    columnStyles: { 0: { cellWidth: 'auto', halign: 'left' }, 1: { cellWidth: 22, halign: 'center' }, 2: { cellWidth: 22, halign: 'center' }, 3: { cellWidth: 30, halign: 'right' }, 4: { cellWidth: 30, halign: 'right' } },
    alternateRowStyles: { fillColor: [248, 249, 250] }, tableLineColor: [220, 220, 220], tableLineWidth: 0.1,
  });

  const finalY = doc.lastAutoTable.finalY + 10;

  // Total
  const totalQty = details.reduce((s, d) => s + (parseFloat(d.receivedQuantity || d.quantity || 0)), 0);
  const totalReceived = details.reduce((s, d) => s + (parseFloat(d.receivedQuantity || d.quantity || 0) * parseFloat(d.unitCost || d.unitPrice || 0)), 0);

  const tcw = 90, tx = pageWidth - margin - tcw, tlx = tx + 8, tvx = pageWidth - margin - 8;
  const tro = [
    { label: 'Total Items', value: totalQty, fontSize: 10 },
    { label: 'Total Received Value', value: totalReceived, fontSize: 10, bold: true },
  ];

  // Calculate box height
  let ty = finalY; const bsy = ty;
  tro.forEach(r => ty += r.bold ? 10 : 7);
  ty += 5;

  // Draw box background
  doc.setFillColor(245, 246, 248);
  doc.roundedRect(tx - 4, bsy - 3, tcw + 8, ty - bsy + 3, 3, 3, 'F');

  // Render rows
  ty = finalY;
  tro.forEach((r, idx) => {
    const isBold = r.bold;
    const isLast = idx === tro.length - 1;

    if (isLast) {
      // Separator before Total Due
      doc.setDrawColor(...primaryColor); doc.setLineWidth(0.5);
      doc.line(tx - 4, ty, tx + tcw + 4, ty);
      ty += 4;
    }

    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(r.fontSize || 10);
    doc.setTextColor(...(isBold ? primaryColor : accentColor));
    doc.text(r.label, tlx, ty + 2);
    doc.text(isBold ? `${formatCurrency(r.value, currencyCode)}` : `${r.value}`, tvx, ty + 2, { align: 'right' });
    ty += isBold ? 6 : 5;

    if (isLast) {
      // Separator after Total Due
      doc.setDrawColor(...primaryColor); doc.setLineWidth(0.5);
      doc.line(tx - 4, ty, tx + tcw + 4, ty);
      ty += 3;
    }
  });

  if (grn.notes) {
    ty += 5; doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...darkText);
    doc.text('Notes:', margin, ty);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...accentColor);
    doc.text(doc.splitTextToSize(grn.notes, contentWidth), margin, ty + 5);
  }

  const ph = doc.internal.pageSize.getHeight();
  doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.3);
  doc.line(margin, ph - 15, pageWidth - margin, ph - 15);
  doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 150, 150);
  doc.text(`Generated by EzeeFlo ERP on ${new Date().toLocaleDateString()}`, margin, ph - 10);
  doc.text(`GRN #${grn.receiptNumber || grn.grnNumber || ''} | Thank you`, pageWidth - margin, ph - 10, { align: 'right' });

  const pdfBlob = doc.output('blob');
  return { blobUrl: URL.createObjectURL(pdfBlob), pdfBlob, filename: `GoodsReceipt_${grn.receiptNumber || grn.grnNumber || grn.id}.pdf` };
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
