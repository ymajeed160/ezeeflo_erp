/**
 * Sales Invoice PDF Generator
 * Generates a professional PDF invoice matching the standard invoice format
 */

import { formatCurrency } from './currency';

const COMPANY_INFO = {
  name: 'EzeeFlo ERP',
  address: '',
  phone: '',
  email: '',
};

/**
 * Generate a sales invoice PDF and return its blob URL for preview
 * @param {Object} invoice - Full invoice detail from API (toDetail format)
 * @param {Object} companyInfo - Optional company profile info to override defaults
 * @returns {Promise<string>} Blob URL of the generated PDF
 */
export async function generateSalesInvoicePdf(invoice, companyInfo = null) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  const company = companyInfo || COMPANY_INFO;
  const currencyCode = company.currencyCode || 'AED';
  const details = invoice.details || [];

  // ---- Colors ----
  const primaryColor = [41, 98, 255];    // Blue
  const accentColor = [80, 80, 80];       // Dark gray
  const lightGray = [240, 240, 240];
  const darkText = [40, 40, 40];

  // === HEADER: Company Info (Left) + Logo (Right) ===
  let yPos = margin;

  // Left: Company name and info
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(company.name || 'EzeeFlo ERP', margin, yPos + 6);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...accentColor);
  let infoY = yPos + 12;
  if (company.address) {
    doc.text(company.address, margin, infoY);
    infoY += 4;
  }
  if (company.phone) {
    doc.text(`Phone: ${company.phone}`, margin, infoY);
    infoY += 4;
  }
  if (company.email) {
    doc.text(`Email: ${company.email}`, margin, infoY);
    infoY += 4;
  }
  if (company.trnTin) {
    doc.text(`TRN: ${company.trnTin}`, margin, infoY);
    infoY += 4;
  }

  // Right: Logo
  let rightContentStart = yPos;
  if (company.logo) {
    try {
      const logoPath = company.logo.startsWith('/') ? company.logo : `/${company.logo}`;
      const logoUrl = company.logo.startsWith('http')
        ? company.logo
        : `${window.location.origin}${logoPath}`;
      const logoImg = await loadImage(logoUrl);
      // Logo on the right side, max 50x20mm
      doc.addImage(logoImg, 'PNG', pageWidth - margin - 50, yPos, 50, 18);
      rightContentStart = yPos + 22;
    } catch (e) {
      // Logo failed to load, skip
    }
  }

  // Separator line
  yPos = Math.max(infoY + 2, rightContentStart);
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.8);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // === INVOICE TITLE & NUMBER ===
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkText);
  doc.text('INVOICE', margin, yPos);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...accentColor);
  doc.text(`#${invoice.invoiceNumber}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 10;

  // === BILL TO & INVOICE DETAILS (Two Column Layout) ===
  // Left: Bill To
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkText);
  doc.text('Bill To:', margin, yPos);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...accentColor);

  let billY = yPos + 5;
  if (invoice.customerName) {
    doc.text(invoice.customerName, margin, billY);
    billY += 5;
  }
  // Full billing address
  const addressParts = [];
  if (invoice.customerBillingAddress) addressParts.push(invoice.customerBillingAddress);
  const cityState = [invoice.customerCity, invoice.customerState].filter(Boolean).join(', ');
  if (cityState) addressParts.push(cityState);
  if (invoice.customerCountry) addressParts.push(invoice.customerCountry);
  if (invoice.customerPostalCode) addressParts.push(invoice.customerPostalCode);
  if (addressParts.length > 0) {
    // Split long addresses into multiple lines
    const addrLine = addressParts.join(', ');
    const splitAddr = doc.splitTextToSize(addrLine, 75);
    splitAddr.forEach(line => {
      doc.text(line, margin, billY);
      billY += 4.5;
    });
  }
  if (invoice.customerPhone) {
    doc.text(`Phone: ${invoice.customerPhone}`, margin, billY);
    billY += 4.5;
  }
  if (invoice.customerEmail) {
    doc.text(`Email: ${invoice.customerEmail}`, margin, billY);
    billY += 4.5;
  }
  if (invoice.customerTaxNumber) {
    doc.text(`TRN: ${invoice.customerTaxNumber}`, margin, billY);
    billY += 4.5;
  }

  // Right: Invoice Details
  const rightColX = pageWidth / 2 + 5;
  let invDetY = yPos;

  const detailRows = [
    ['Invoice Date:', invoice.invoiceDate ? invoice.invoiceDate.split('T')[0] : '-'],
    ['Due Date:', invoice.dueDate ? invoice.dueDate.split('T')[0] : '-'],
    ['Status:', (invoice.status || '').replace(/_/g, ' ').toUpperCase()],
  ];

  if (invoice.reference) {
    detailRows.push(['Reference:', invoice.reference]);
  }

  detailRows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...darkText);
    doc.text(label, rightColX, invDetY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...accentColor);
    doc.text(value, rightColX + 38, invDetY);

    invDetY += 5.5;
  });

  yPos = Math.max(billY + 2, invDetY + 2);

  // === LINE ITEMS TABLE ===
  const tableHeaders = [['Description', 'Quantity', 'Unit Price', 'Tax', 'Amount']];
  const tableBody = details.map((line) => {
    const qty = parseFloat(line.quantity || 0);
    const unitPrice = parseFloat(line.unitPrice || 0);
    const lineTotal = parseFloat(line.lineTotal || (qty * unitPrice));
    const taxPercent = parseFloat(line.taxPercent || 0);
    const taxAmt = lineTotal * taxPercent / 100;
    return [
      line.description || line.itemName || line.itemCode || '-',
      qty.toString(),
      `${formatCurrency(unitPrice, currencyCode)}`,
      taxPercent > 0 ? `${formatCurrency(taxAmt, currencyCode)}` : '-',
      `${formatCurrency(lineTotal, currencyCode)}`,
    ];
  });

  // Add empty row if no details (for demonstration)
  if (tableBody.length === 0) {
    tableBody.push(['No items', '', '', '', '']);
  }

  autoTable(doc, {
    head: tableHeaders,
    body: tableBody,
    startY: yPos,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: darkText,
    },
    columnStyles: {
      0: { cellWidth: 'auto', halign: 'left' },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250],
    },
    tableLineColor: [220, 220, 220],
    tableLineWidth: 0.1,
  });

  // Get the Y position after the table
  const finalY = doc.lastAutoTable.finalY + 5;

  // === TOTALS SECTION ===
  const totalsColWidth = 70;
  const totalsX = pageWidth - margin - totalsColWidth;
  const totalsLabelX = totalsX + 6;
  const totalsValueX = pageWidth - margin - 6;

  // Build totals rows: Subtotal, Discount (optional), Tax Total (optional), then Total Due
  const totalsRows = [];
  totalsRows.push({ label: 'Subtotal', value: parseFloat(invoice.subTotal || 0), fontSize: 10 });

  if (parseFloat(invoice.discountTotal || 0) > 0) {
    totalsRows.push({ label: 'Discount', value: -parseFloat(invoice.discountTotal), fontSize: 10 });
  }

  if (parseFloat(invoice.taxTotal || 0) > 0) {
    totalsRows.push({ label: 'Tax Total', value: parseFloat(invoice.taxTotal), fontSize: 10 });
  }

  totalsRows.push({ label: 'Total Due', value: parseFloat(invoice.grandTotal || 0), fontSize: 12, bold: true });

  // Calculate box height
  let totalY = finalY + 3;
  const boxStartY = totalY - 3;
  
  totalsRows.forEach((row) => {
    totalY += row.bold ? 9 : 6;
  });
  totalY += 4; // bottom padding
  
  // Draw light background for totals box
  doc.setFillColor(245, 246, 248);
  doc.roundedRect(totalsX - 3, boxStartY - 2, totalsColWidth + 6, totalY - boxStartY + 2, 3, 3, 'F');

  totalY = finalY + 3;

  totalsRows.forEach((row, idx) => {
    const isBold = row.bold || false;
    const isLast = idx === totalsRows.length - 1;
    
    if (isLast) {
      // Separator line before Total Due
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.5);
      doc.line(totalsX - 3, totalY - 1, totalsX + totalsColWidth + 3, totalY - 1);
      totalY += 3;
    }

    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(row.fontSize || 10);
    doc.setTextColor(...(isBold ? primaryColor : accentColor));
    doc.text(row.label, totalsLabelX, totalY + 2);

    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(row.fontSize || 10);
    doc.text(`${formatCurrency(row.value, currencyCode)}`, totalsValueX, totalY + 2, { align: 'right' });

    if (isLast) {
      // Separator line after Total Due
      totalY += 4;
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.5);
      doc.line(totalsX - 3, totalY - 1, totalsX + totalsColWidth + 3, totalY - 1);
      totalY += 1;
    } else {
      totalY += 5;
    }
  });

  // === NOTES SECTION ===
  if (invoice.notes) {
    totalY += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...darkText);
    doc.text('Notes:', margin, totalY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...accentColor);
    const noteLines = doc.splitTextToSize(invoice.notes, contentWidth);
    doc.text(noteLines, margin, totalY + 5);
    totalY += 10 + noteLines.length * 4;
  }

  // === FOOTER ===
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated by EzeeFlo ERP on ${new Date().toLocaleDateString()}`, margin, pageHeight - 10);

  doc.setFontSize(7.5);
  doc.text(`Invoice #${invoice.invoiceNumber} | Thank you for your business`, pageWidth - margin, pageHeight - 10, { align: 'right' });

  // Return blob URL for preview
  const pdfBlob = doc.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);
  return { blobUrl, pdfBlob, filename: `Invoice_${invoice.invoiceNumber || invoice.id}.pdf` };
}

/**
 * Helper to load an image from URL for PDF embedding
 */
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = reject;
    img.src = url;
  });
}
