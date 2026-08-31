'use strict';
const { SystemConfig } = require('../models');

/**
 * Deletion control settings (Settings → Deletion Control tab).
 * Each transaction type can be independently enabled/disabled for deletion.
 * Config is stored in system_configs with category 'deletion'.
 */

const DELETION_LABELS = {
  purchase_requests: 'Purchase Requests',
  purchase_orders: 'Purchase Orders',
  goods_receipts: 'Goods Receipts',
  purchase_invoices: 'Purchase Invoices',
  purchase_returns: 'Purchase Returns',
  debit_notes: 'Debit Notes',
  supplier_payments: 'Supplier Payments',
  quotations: 'Quotations',
  sales_orders: 'Sales Orders',
  delivery_notes: 'Delivery Notes',
  sales_invoices: 'Sales Invoices',
  sales_returns: 'Sales Returns',
  credit_notes: 'Credit Notes',
  customer_payments: 'Customer Payments',
};

async function isDeletionEnabled(tenantId, key) {
  const cfg = await SystemConfig.findOne({
    where: { tenantId, category: 'deletion', configKey: key },
    attributes: ['configValue'],
  });
  return !!(cfg && String(cfg.configValue) === 'true');
}

/**
 * Throws a 400 Bad Request if deletion is not enabled for the given key.
 */
async function requireDeletionEnabled(tenantId, key) {
  if (!(await isDeletionEnabled(tenantId, key))) {
    const label = DELETION_LABELS[key] || key;
    throw Object.assign(
      new Error(`Deletion is disabled for ${label}. Enable it in Settings → Deletion Control before deleting.`),
      { statusCode: 400 }
    );
  }
}

module.exports = { isDeletionEnabled, requireDeletionEnabled, DELETION_LABELS };
