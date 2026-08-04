const db = require('./models');

(async () => {
  try {
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await db.sequelize.query('DROP TABLE IF EXISTS debit_notes');
    console.log('Dropped debit_notes');
    await db.sequelize.query('DROP TABLE IF EXISTS supplier_payment_allocations');
    console.log('Dropped supplier_payment_allocations');
    await db.sequelize.query('DROP TABLE IF EXISTS supplier_payments');
    console.log('Dropped supplier_payments');
    await db.sequelize.query('DROP TABLE IF EXISTS PurchaseInvoices');
    console.log('Dropped PurchaseInvoices');
    await db.sequelize.query('DROP TABLE IF EXISTS PurchaseInvoiceDetails');
    console.log('Dropped PurchaseInvoiceDetails');
    await db.sequelize.query('DROP TABLE IF EXISTS PurchaseOrderDetails');
    console.log('Dropped PurchaseOrderDetails');
    await db.sequelize.query('DROP TABLE IF EXISTS PurchaseOrders');
    console.log('Dropped PurchaseOrders');
    await db.sequelize.query('DROP TABLE IF EXISTS PurchaseReturns');
    console.log('Dropped PurchaseReturns');
    await db.sequelize.query('DROP TABLE IF EXISTS PurchaseReturnDetails');
    console.log('Dropped PurchaseReturnDetails');
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Done dropping old purchase tables');
    process.exit(0);
  } catch(e) { console.error(e); process.exit(1); }
})();