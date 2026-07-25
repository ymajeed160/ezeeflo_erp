const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');
const db = require('../models');

const {
  Permission,
  Role,
  RolePermission,
  UserRole,
  SystemConfig,
  NumberSeries,
  TaxRate,
  Warehouse,
} = db;

/**
 * Seeds all default data for a newly created company.
 * This includes:
 *  - Chart of Accounts (COA)
 *  - Permissions
 *  - Roles (Super Admin, Admin, User)
 *  - Role-Permission assignments
 *  - System Configurations
 *  - Number Series
 *  - Tax Rates
 *  - Default Warehouse
 *  - User-Role mapping (assigns the creator as Admin)
 */
class CompanySeedService {
  /**
   * Seed default data for a new company
   * @param {string} tenantId - The new company/tenant ID
   * @param {string} userId - The user who created the company (will be mapped as Admin)
   */
  async seedAll(tenantId, userId) {
    logger.info(`Seeding default data for company ${tenantId}...`);

    try {
      await this._seedPermissions(tenantId, userId);
      const { superAdminRoleId, adminRoleId } = await this._seedRoles(tenantId, userId);
      await this._seedRolePermissions(tenantId, superAdminRoleId, adminRoleId);
      await this._seedDefaultAccounts(tenantId, userId);
      await this._seedSystemConfigs(tenantId, userId);
      await this._seedNumberSeries(tenantId, userId);
      await this._seedTaxRates(tenantId, userId);
      await this._seedDefaultWarehouse(tenantId, userId);
      await this._assignUserRole(tenantId, userId, adminRoleId);

      logger.info(`Default data seeded successfully for company ${tenantId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to seed data for company ${tenantId}:`, error.message);
      throw error;
    }
  }

  /**
   * Create all permissions for the new company
   */
  async _seedPermissions(tenantId, userId) {
    const modules = {
      dashboard: ['read', 'export'],
      sales: ['read', 'create', 'update', 'delete', 'approve', 'export'],
      customers: ['read', 'create', 'update', 'delete', 'export'],
      quotations: ['read', 'create', 'update', 'delete', 'approve', 'export'],
      'sales-orders': ['read', 'create', 'update', 'delete', 'approve', 'export'],
      'delivery-notes': ['read', 'create', 'update', 'delete', 'approve', 'export'],
      'sales-invoices': ['read', 'create', 'update', 'delete', 'approve', 'export'],
      'sales-returns': ['read', 'create', 'update', 'delete', 'approve', 'export'],
      'credit-notes': ['read', 'create', 'update', 'delete', 'approve', 'export'],
      purchases: ['read', 'create', 'update', 'delete', 'approve', 'export'],
      suppliers: ['read', 'create', 'update', 'delete', 'export'],
      'purchase-requests': ['read', 'create', 'update', 'delete', 'approve', 'export'],
      'purchase-orders': ['read', 'create', 'update', 'delete', 'approve', 'export'],
      'goods-receipt-notes': ['read', 'create', 'update', 'delete', 'approve', 'export'],
      'purchase-invoices': ['read', 'create', 'update', 'delete', 'approve', 'export'],
      'purchase-returns': ['read', 'create', 'update', 'delete', 'approve', 'export'],
      'debit-notes': ['read', 'create', 'update', 'delete', 'approve', 'export'],
      category: ['view', 'create', 'edit', 'delete', 'export'],
      item: ['view', 'create', 'edit', 'delete', 'export'],
      warehouse: ['view', 'create', 'edit', 'delete', 'export'],
      stockadjustment: ['view', 'create', 'approve', 'export'],
      stocktransfer: ['view', 'create', 'approve', 'complete', 'export'],
      inventory: ['view', 'export'],
      accounting: ['read', 'create', 'update', 'delete', 'approve', 'export'],
      'chart-of-accounts': ['read', 'create', 'update', 'delete', 'export'],
      'journal-entries': ['read', 'create', 'update', 'delete', 'approve', 'export'],
      'general-ledger': ['read', 'export'],
      ledger: ['view', 'export'],
      'trial-balance': ['read', 'export'],
      'profit-loss': ['read', 'export'],
      'balance-sheet': ['read', 'export'],
      'tax-management': ['read', 'create', 'update', 'delete', 'export'],
      'fiscal-periods': ['read', 'create', 'update', 'delete', 'export'],
      banks: ['read', 'create', 'update', 'delete', 'export'],
      'bank-accounts': ['read', 'create', 'update', 'delete', 'export'],
      'bank-transactions': ['read', 'create', 'update', 'delete', 'export'],
      'payment-receipts': ['read', 'create', 'update', 'delete', 'approve', 'export'],
      'payment-vouchers': ['read', 'create', 'update', 'delete', 'approve', 'export'],
      reconciliation: ['read', 'create', 'update', 'delete', 'export'],
      reports: ['read', 'export'],
      'sales-reports': ['read', 'export'],
      'purchase-reports': ['read', 'export'],
      'inventory-reports': ['read', 'export'],
      'financial-reports': ['read', 'export'],
      'vat-reports': ['read', 'export'],
      settings: ['read', 'update', 'export'],
      'company-profile': ['read', 'update'],
      users: ['read', 'create', 'update', 'delete'],
      roles: ['read', 'create', 'update', 'delete'],
      permissions: ['read'],
      'email-settings': ['read', 'update'],
      'tax-settings': ['read', 'update'],
      'currency-settings': ['read', 'update'],
      'number-series': ['read', 'update'],
      company: ['view', 'create', 'edit', 'delete', 'switch'],
      audit: ['view', 'export'],
    };

    // Route-compatible aliases
    const routeAliases = {
      customer: ['view', 'create', 'edit', 'delete'],
      supplier: ['view', 'create', 'edit', 'delete'],
      salesorder: ['view', 'create', 'edit', 'delete', 'approve'],
      salesinvoice: ['view', 'create', 'edit', 'delete', 'approve'],
      salesreturn: ['view', 'create', 'edit', 'delete', 'approve'],
      deliverynote: ['view', 'create', 'edit', 'delete', 'approve'],
      creditnote: ['view', 'create', 'edit', 'delete', 'post', 'cancel'],
      customerpayment: ['view', 'create', 'edit', 'delete', 'post', 'cancel'],
      purchaseorder: ['view', 'create', 'approve'],
      purchaseinvoice: ['view', 'create', 'edit', 'delete', 'approve', 'cancel'],
      purchaserequest: ['view', 'create', 'edit', 'delete', 'approve'],
      purchasereturn: ['view', 'create', 'approve'],
      goodsreceipt: ['view', 'create', 'edit', 'delete', 'approve'],
      debitnote: ['view', 'create', 'edit', 'delete', 'approve'],
      supplierpayment: ['view', 'create', 'edit', 'delete', 'approve'],
      bankaccount: ['view', 'create', 'edit', 'delete'],
      banktransaction: ['view', 'create', 'edit', 'post', 'reverse', 'import'],
      paymentreceipt: ['view', 'create', 'edit', 'post', 'reverse'],
      paymentvoucher: ['view', 'create', 'edit', 'post', 'reverse'],
      bankreconciliation: ['view', 'create', 'edit', 'reconcile', 'reverse', 'override'],
      quotation: ['view', 'create'],
      audit: ['view', 'view_details', 'export', 'delete', 'view_company', 'view_all_companies'],
    };

    const records = [];

    // Generate from modules
    for (const [module, actions] of Object.entries(modules)) {
      for (const action of actions) {
        const permissionCode = `${module}.${action}`;
        const moduleName = module.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const actionName = action.replace(/\b\w/g, l => l.toUpperCase());
        records.push({
          id: uuidv4(),
          code: permissionCode,
          name: `${moduleName} - ${actionName}`,
          module,
          group: action,
          tenantId,
          isActive: true,
          createdBy: userId,
          updatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    // Generate from route aliases
    for (const [module, actions] of Object.entries(routeAliases)) {
      for (const action of actions) {
        const permissionCode = `${module}.${action}`;
        // Skip duplicates
        if (records.find(r => r.code === permissionCode && r.module === module)) continue;
        const moduleName = module.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const actionName = action.replace(/\b\w/g, l => l.toUpperCase());
        records.push({
          id: uuidv4(),
          code: permissionCode,
          name: `${moduleName} - ${actionName}`,
          module,
          group: action,
          tenantId,
          isActive: true,
          createdBy: userId,
          updatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    await Permission.bulkCreate(records, { ignoreDuplicates: true });
    logger.info(`  ✓ Created ${records.length} permissions`);
    return records;
  }

  /**
   * Create default roles
   */
  async _seedRoles(tenantId, userId) {
    const superAdminRoleId = uuidv4();
    const adminRoleId = uuidv4();
    const userRoleId = uuidv4();

    await Role.bulkCreate([
      {
        id: superAdminRoleId,
        name: 'Super Admin',
        code: 'super_admin',
        description: 'Full system access with all permissions',
        tenantId,
        isSystem: true,
        isActive: true,
        createdBy: userId,
        updatedBy: userId,
      },
      {
        id: adminRoleId,
        name: 'Admin',
        code: 'admin',
        description: 'Administrative access with most permissions',
        tenantId,
        isSystem: false,
        isActive: true,
        createdBy: userId,
        updatedBy: userId,
      },
      {
        id: userRoleId,
        name: 'User',
        code: 'user',
        description: 'Standard user with limited permissions',
        tenantId,
        isSystem: false,
        isActive: true,
        createdBy: userId,
        updatedBy: userId,
      },
    ], { ignoreDuplicates: true });

    logger.info('  ✓ Created 3 default roles');
    return { superAdminRoleId, adminRoleId, userRoleId };
  }

  /**
   * Assign all permissions to Super Admin role, and key permissions to Admin
   */
  async _seedRolePermissions(tenantId, superAdminRoleId, adminRoleId) {
    const permissions = await Permission.findAll({
      where: { tenantId },
      attributes: ['id', 'code'],
    });

    // Assign ALL permissions to Super Admin
    const superAdminRecords = permissions.map(p => ({
      id: uuidv4(),
      roleId: superAdminRoleId,
      permissionId: p.id,
      tenantId,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await RolePermission.bulkCreate(superAdminRecords, { ignoreDuplicates: true });
    logger.info(`  ✓ Assigned ${superAdminRecords.length} permissions to Super Admin`);

    // Assign view/read permissions to Admin
    const adminViewCodes = permissions
      .filter(p => p.code.endsWith('.view') || p.code.endsWith('.read'))
      .map(p => p.id);

    // Add key create/update permissions
    const adminExtraCodes = permissions
      .filter(p => {
        const parts = p.code.split('.');
        const action = parts[parts.length - 1];
        return ['create', 'edit', 'update'].includes(action);
      })
      .map(p => p.id);

    const adminPermissionIds = [...new Set([...adminViewCodes, ...adminExtraCodes])];
    const adminRecords = adminPermissionIds.map(pid => ({
      id: uuidv4(),
      roleId: adminRoleId,
      permissionId: pid,
      tenantId,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    if (adminRecords.length > 0) {
      await RolePermission.bulkCreate(adminRecords, { ignoreDuplicates: true });
      logger.info(`  ✓ Assigned ${adminRecords.length} permissions to Admin`);
    }
  }

  /**
   * Create default Chart of Accounts
   */
  async _seedDefaultAccounts(tenantId, userId) {
    const { Account } = db;
    const now = new Date();
    const accounts = [];

    // Helper to create account entries
    const acc = (name, code, type, parentCode = null) => {
      const id = uuidv4();
      accounts.push({ id, name, code, type, parentCode });
      return id;
    };

    // Parent accounts
    const ASSETS = acc('Assets', '1000', 'asset');
    const LIABILITIES = acc('Liabilities', '2000', 'liability');
    const EQUITY = acc('Equity', '3000', 'equity');
    const REVENUE = acc('Revenue', '4000', 'revenue');
    const EXPENSES = acc('Expenses', '5000', 'expense');

    // Asset children
    acc('Cash', '1100', 'asset', '1000');
    acc('Accounts Receivable', '1200', 'asset', '1000');
    acc('Inventory', '1300', 'asset', '1000');
    acc('Fixed Assets', '1400', 'asset', '1000');
    acc('Accumulated Depreciation', '1450', 'asset', '1000');
    acc('Prepaid Expenses', '1500', 'asset', '1000');

    // Liability children
    acc('Accounts Payable', '2100', 'liability', '2000');
    acc('Accrued Expenses', '2200', 'liability', '2000');
    acc('Loans Payable', '2300', 'liability', '2000');
    acc('Unearned Revenue', '2400', 'liability', '2000');
    acc('Taxes Payable', '2500', 'liability', '2000');

    // Equity children
    acc("Owner's Capital", '3100', 'equity', '3000');
    acc('Retained Earnings', '3200', 'equity', '3000');
    acc('Common Stock', '3300', 'equity', '3000');

    // Revenue children
    acc('Sales Revenue', '4100', 'revenue', '4000');
    acc('Service Revenue', '4200', 'revenue', '4000');
    acc('Interest Income', '4300', 'revenue', '4000');
    acc('Other Income', '4400', 'revenue', '4000');

    // Expense children
    acc('Cost of Goods Sold', '5100', 'expense', '5000');
    acc('Salaries & Wages', '5200', 'expense', '5000');
    acc('Rent Expense', '5300', 'expense', '5000');
    acc('Utilities Expense', '5400', 'expense', '5000');
    acc('Office Supplies', '5500', 'expense', '5000');
    acc('Depreciation Expense', '5600', 'expense', '5000');
    acc('Marketing Expense', '5700', 'expense', '5000');
    acc('Travel Expense', '5800', 'expense', '5000');
    acc('Other Expenses', '5900', 'expense', '5000');

    // Resolve parent IDs
    const accountMap = {};
    for (const a of accounts) {
      accountMap[a.code] = a.id;
    }

    const records = accounts.map(a => {
      const parentId = a.parentCode ? (accountMap[a.parentCode] || null) : null;
      return {
        id: a.id,
        tenantId,
        name: a.name,
        code: a.code,
        type: a.type,
        description: `${a.name} account`,
        parentAccountId: parentId,
        isActive: true,
        openingBalance: 0.00,
        createdBy: userId,
        updatedBy: userId,
        createdAt: now,
        updatedAt: now,
      };
    });

    await Account.bulkCreate(records, { ignoreDuplicates: true });
    logger.info(`  ✓ Created ${records.length} chart of accounts`);
    return accountMap;
  }

  /**
   * Create default system configurations
   */
  async _seedSystemConfigs(tenantId, userId) {
    const configs = [
      { configKey: 'company_timezone', configValue: '+04:00', category: 'general', description: 'Company timezone' },
      { configKey: 'company_date_format', configValue: 'DD/MM/YYYY', category: 'general', description: 'Date format' },
      { configKey: 'company_currency', configValue: 'AED', category: 'general', description: 'Base currency' },
      { configKey: 'decimal_precision', configValue: '2', category: 'accounting', description: 'Decimal precision for amounts' },
      { configKey: 'tax_enabled', configValue: 'true', category: 'tax', description: 'Enable tax module' },
      { configKey: 'inventory_enabled', configValue: 'true', category: 'inventory', description: 'Enable inventory module' },
      { configKey: 'multi_warehouse_enabled', configValue: 'false', category: 'inventory', description: 'Enable multi-warehouse' },
      { configKey: 'fiscal_year_start', configValue: '01-01', category: 'accounting', description: 'Fiscal year start (MM-DD)' },
      { configKey: 'fiscal_year_end', configValue: '12-31', category: 'accounting', description: 'Fiscal year end (MM-DD)' },
      { configKey: 'auto_generate_journal_entries', configValue: 'true', category: 'accounting', description: 'Auto-generate JE from transactions' },
      { configKey: 'default_payment_terms', configValue: '30', category: 'sales', description: 'Default payment terms in days' },
    ];

    const records = configs.map(c => ({
      tenantId,
      configKey: c.configKey,
      configValue: c.configValue,
      category: c.category,
      description: c.description,
      isEncrypted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await SystemConfig.bulkCreate(records, { ignoreDuplicates: true });
    logger.info(`  ✓ Created ${records.length} system configurations`);
  }

  /**
   * Create default number series for documents
   */
  async _seedNumberSeries(tenantId, userId) {
    const series = [
      { seriesName: 'QUOT', prefix: 'QTN-', nextNumber: 1, numberLength: 6, padZero: true },
      { seriesName: 'SO', prefix: 'SO-', nextNumber: 1, numberLength: 6, padZero: true },
      { seriesName: 'DN', prefix: 'DN-', nextNumber: 1, numberLength: 6, padZero: true },
      { seriesName: 'SINV', prefix: 'INV-', nextNumber: 1, numberLength: 6, padZero: true },
      { seriesName: 'SR', prefix: 'SR-', nextNumber: 1, numberLength: 6, padZero: true },
      { seriesName: 'CN', prefix: 'CN-', nextNumber: 1, numberLength: 6, padZero: true },
      { seriesName: 'CP', prefix: 'CP-', nextNumber: 1, numberLength: 6, padZero: true },
      { seriesName: 'PR', prefix: 'PR-', nextNumber: 1, numberLength: 6, padZero: true },
      { seriesName: 'PO', prefix: 'PO-', nextNumber: 1, numberLength: 6, padZero: true },
      { seriesName: 'GRN', prefix: 'GRN-', nextNumber: 1, numberLength: 6, padZero: true },
      { seriesName: 'PINV', prefix: 'PINV-', nextNumber: 1, numberLength: 6, padZero: true },
      { seriesName: 'PRET', prefix: 'PRET-', nextNumber: 1, numberLength: 6, padZero: true },
      { seriesName: 'DEBN', prefix: 'DEBN-', nextNumber: 1, numberLength: 6, padZero: true },
      { seriesName: 'SP', prefix: 'SP-', nextNumber: 1, numberLength: 6, padZero: true },
      { seriesName: 'JE', prefix: 'JE-', nextNumber: 1, numberLength: 6, padZero: true },
      { seriesName: 'BA', prefix: 'BA-', nextNumber: 1, numberLength: 6, padZero: true },
      { seriesName: 'BT', prefix: 'BT-', nextNumber: 1, numberLength: 6, padZero: true },
      { seriesName: 'PV', prefix: 'PV-', nextNumber: 1, numberLength: 6, padZero: true },
    ];

    const records = series.map(s => ({
      tenantId,
      seriesName: s.seriesName,
      prefix: s.prefix,
      suffix: '',
      nextNumber: s.nextNumber,
      numberLength: s.numberLength,
      padZero: s.padZero,
      resetPeriod: 'none',
      lastResetDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await NumberSeries.bulkCreate(records, { ignoreDuplicates: true });
    logger.info(`  ✓ Created ${records.length} number series`);
  }

  /**
   * Create default tax rates
   */
  async _seedTaxRates(tenantId, userId) {
    const rates = [
      { name: 'Zero Rated', code: 'ZR', rate: 0, isDefault: false },
      { name: 'Standard VAT', code: 'VAT', rate: 5.00, isDefault: true },
      { name: 'Exempt', code: 'EX', rate: 0, isDefault: false },
    ];

    const records = rates.map(r => ({
      tenantId,
      name: r.name,
      code: r.code,
      rate: r.rate,
      isActive: true,
      isDefault: r.isDefault,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await TaxRate.bulkCreate(records, { ignoreDuplicates: true });
    logger.info(`  ✓ Created ${records.length} tax rates`);
  }

  /**
   * Create a default warehouse
   */
  async _seedDefaultWarehouse(tenantId, userId) {
    await Warehouse.findOrCreate({
      where: { tenantId, code: 'MAIN' },
      defaults: {
        tenantId,
        code: 'MAIN',
        name: 'Main Warehouse',
        description: 'Default warehouse for all inventory',
        location: '',
        isActive: true,
        createdBy: userId,
        updatedBy: userId,
      },
    });
    logger.info('  ✓ Created default warehouse');
  }

  /**
   * Assign the creating user to the Admin role for this company
   */
  async _assignUserRole(tenantId, userId, adminRoleId) {
    // Check if already assigned
    const existing = await UserRole.findOne({
      where: { userId, tenantId, roleId: adminRoleId },
    });
    if (!existing) {
      await UserRole.create({
        id: uuidv4(),
        userId,
        roleId: adminRoleId,
        tenantId,
        createdBy: userId,
        updatedBy: userId,
      });
      logger.info(`  ✓ Assigned user ${userId} to Admin role`);
    }
  }
}

module.exports = new CompanySeedService();
