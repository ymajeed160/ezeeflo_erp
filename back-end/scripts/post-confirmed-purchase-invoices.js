/**
 * One-off repair: post purchase invoices left in "confirmed" status so their
 * journal entries appear in the General Ledger.
 *
 * Usage (from the back-end folder on the server):
 *   node scripts/post-confirmed-purchase-invoices.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const db = require('../models');
const purchaseInvoiceService = require('../services/PurchaseInvoiceService');

(async () => {
  const invoices = await db.PurchaseInvoice.findAll({ where: { status: 'confirmed' } });
  console.log(`Found ${invoices.length} confirmed purchase invoice(s)`);

  for (const invoice of invoices) {
    try {
      const superAdmin = await db.User.findOne({
        where: { tenantId: invoice.tenantId, isSuperAdmin: true },
        order: [['createdAt', 'ASC']],
      });
      const userId = invoice.updatedBy || invoice.createdBy || superAdmin?.id || null;
      const result = await purchaseInvoiceService.confirm(invoice.id, invoice.tenantId, userId);
      console.log(`[OK] ${invoice.invoiceNumber} -> ${result.status} (JE ${result.journalEntryId})`);
    } catch (err) {
      console.error(`[FAIL] ${invoice.invoiceNumber}: ${err.message}`);
    }
  }

  await db.sequelize.close();
  process.exit(0);
})();
