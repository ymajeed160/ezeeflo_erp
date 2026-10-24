'use strict';
/**
 * Regression test for Sales Invoice posting preview / account resolution.
 *
 * Covers:
 *   1. Income account resolution (item-level + company default fallback)
 *   2. Posting preview stock-item detection and COGS/Inventory resolution
 *   3. Missing COGS account produces a clear configuration error
 *   4. Insufficient stock produces a clear validation error
 *   5. Journal lines are balanced (debits == credits)
 *
 * Read-only against the real database. Usage: node _test_sales_invoice_posting.js
 */
require('dotenv').config({ path: __dirname + '/.env' });

const { sequelize, Item, InventoryBalance } = require('./models');
const SalesInvoiceService = require('./services/SalesInvoiceService');

const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const WAREHOUSE_ID = '5e87abc8-973c-4e73-8b25-e0860dd2a4cf';
// Real IDs from the default company's chart of accounts.
const AR_ACCOUNT = '02084a92-44d9-40a7-a5b7-0bdcc8cba39c';   // 1100 Cash (asset)
const INCOME_ACCOUNT = '8009cd4c-db14-4aea-bc12-fc0b8cd80799'; // 4100 Sales Revenue
const INVENTORY_ACCOUNT = 'a564b362-1b22-46cf-9a5f-71dcc1506190'; // 1300 Inventory
const COGS_ACCOUNT = '98358178-8d06-4fa8-bef6-cfe2463951be'; // 5100 Cost of Goods Sold
// ASUS TUF product (inventory tracked), qty 3 on hand in warehouse 5e87 (variant null).
const ASUS_ITEM_ID = '4ad77b94-06c9-45b6-ac12-0156fefedb83';
// Posted invoice with a stock line (ASUS TUF).
const INVOICE_ID = '5f563e28-cbf7-4b5a-b592-8ec76f778f8a';

let passed = 0;
let failed = 0;

function check(condition, label) {
  if (condition) {
    passed += 1;
    console.log(`  PASS: ${label}`);
  } else {
    failed += 1;
    console.log(`  FAIL: ${label}`);
  }
}

async function expectThrow(fn, label, matchText) {
  try {
    await fn();
    failed += 1;
    console.log(`  FAIL: ${label} (expected an error but none was thrown)`);
  } catch (e) {
    const msg = e.message || String(e);
    if (matchText && !msg.includes(matchText)) {
      failed += 1;
      console.log(`  FAIL: ${label} (message "${msg}" did not contain "${matchText}")`);
    } else {
      passed += 1;
      console.log(`  PASS: ${label}`);
    }
  }
}

(async () => {
  console.log('Sales Invoice posting regression tests\n');

  const asus = await Item.findByPk(ASUS_ITEM_ID);

  // 1. Income account resolution
  const itemIncome = await SalesInvoiceService._resolveIncomeAccountId(TENANT_ID, asus);
  check(itemIncome === asus.incomeAccountId, 'item income account resolved from item config');

  const fallbackIncome = await SalesInvoiceService._resolveIncomeAccountId(TENANT_ID, { id: 'none', name: 'X', incomeAccountId: null });
  check(fallbackIncome === '990a04e3-5b18-4faa-bebb-e427585bc4f0', 'income account falls back to company default (revenue_account)');

  // 2. Posting preview for a stock invoice
  const preview = await SalesInvoiceService.getPostingPreview(TENANT_ID, INVOICE_ID);
  check(preview.hasStockItems === true, 'preview detects stock items');
  check(Array.isArray(preview.cogsAccounts) && preview.cogsAccounts.length > 0, 'preview resolves COGS accounts');
  check(Array.isArray(preview.inventoryAccounts) && preview.inventoryAccounts.length > 0, 'preview resolves Inventory accounts');
  check(Array.isArray(preview.revenueAccounts) && preview.revenueAccounts.length > 0, 'preview resolves revenue accounts');
  check(Array.isArray(preview.lineDiagnostics) && preview.lineDiagnostics.length > 0, 'preview returns per-line diagnostics');
  check((preview.missingExpenseAccountItems || []).length === 0, 'no missing COGS account reported for configured item');
  check((preview.missingInventoryAccountItems || []).length === 0, 'no missing Inventory account reported for configured item');

  // 3. Missing COGS account -> clear configuration error
  const noCogsInvoice = {
    customerAccountId: AR_ACCOUNT,
    taxTotal: 0,
    warehouseId: WAREHOUSE_ID,
    details: [{
      itemId: ASUS_ITEM_ID,
      quantity: 1,
      item: { id: ASUS_ITEM_ID, name: 'ASUS TUF', itemType: 'product', isInventoryTracked: true, incomeAccountId: INCOME_ACCOUNT, expenseAccountId: null, inventoryAccountId: INVENTORY_ACCOUNT },
    }],
  };
  await expectThrow(
    () => SalesInvoiceService.validatePostingAccounts(TENANT_ID, noCogsInvoice),
    'missing COGS account throws clear error',
    'COGS Account'
  );

  // 4. Insufficient stock -> clear validation error (qty 3 on hand, request 100)
  const insufficientInvoice = {
    customerAccountId: AR_ACCOUNT,
    taxTotal: 0,
    warehouseId: WAREHOUSE_ID,
    details: [{
      itemId: ASUS_ITEM_ID,
      quantity: 100,
      item: { id: ASUS_ITEM_ID, name: 'ASUS TUF', itemType: 'product', isInventoryTracked: true, incomeAccountId: asus.incomeAccountId, expenseAccountId: asus.expenseAccountId, inventoryAccountId: asus.inventoryAccountId, costPrice: asus.costPrice },
    }],
  };
  await expectThrow(
    () => SalesInvoiceService.validatePostingAccounts(TENANT_ID, insufficientInvoice),
    'insufficient stock throws clear error',
    'Insufficient stock'
  );

  // 5. Valid invoice passes validation (qty 1 <= 3 on hand)
  const validInvoice = {
    customerAccountId: AR_ACCOUNT,
    taxTotal: 0,
    warehouseId: WAREHOUSE_ID,
    details: [{
      itemId: ASUS_ITEM_ID,
      quantity: 1,
      item: { id: ASUS_ITEM_ID, name: 'ASUS TUF', itemType: 'product', isInventoryTracked: true, incomeAccountId: asus.incomeAccountId, expenseAccountId: asus.expenseAccountId, inventoryAccountId: asus.inventoryAccountId, costPrice: asus.costPrice },
    }],
  };
  try {
    await SalesInvoiceService.validatePostingAccounts(TENANT_ID, validInvoice);
    passed += 1;
    console.log('  PASS: valid stock invoice passes account validation');
  } catch (e) {
    failed += 1;
    console.log(`  FAIL: valid stock invoice unexpectedly failed: ${e.message}`);
  }

  // 6. Journal lines are balanced
  const invoice = await SalesInvoiceService.getPostingPreview(TENANT_ID, INVOICE_ID);
  // Build a journal from the preview-equivalent invoice is complex; instead fetch the real invoice via repository.
  const SalesInvoiceRepository = require('./repositories/SalesInvoiceRepository');
  const full = await SalesInvoiceRepository.findById(TENANT_ID, INVOICE_ID);
  const lines = await SalesInvoiceService.buildJournalLines(TENANT_ID, full);
  const totalDebit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  check(Math.abs(totalDebit - totalCredit) < 0.01, `journal lines balanced (debit ${totalDebit.toFixed(2)} = credit ${totalCredit.toFixed(2)})`);
  check(lines.some((l) => l.accountId === COGS_ACCOUNT && parseFloat(l.debit) > 0), 'journal includes a COGS debit');
  check(lines.some((l) => l.accountId === INVENTORY_ACCOUNT && parseFloat(l.credit) > 0), 'journal includes an Inventory credit');

  console.log(`\n${passed} passed, ${failed} failed`);
  await sequelize.close();
  process.exit(failed > 0 ? 1 : 0);
})().catch(async (e) => {
  console.error(e);
  await sequelize.close();
  process.exit(1);
});
