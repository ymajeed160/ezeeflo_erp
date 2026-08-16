'use strict';

const { Op, fn, col, literal, Sequelize } = require('sequelize');
const db = require('../models');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

const {
  SalesInvoice,
  SalesInvoiceDetail,
  Customer,
  Supplier,
  Item,
  InventoryBalance,
  PurchaseOrder,
  SalesOrder,
  JournalEntry,
  JournalEntryLine,
  Account,
  CustomerPayment,
  SupplierPayment,
  PurchaseInvoice,
} = db;

/**
 * DashboardController — Aggregates real-time business data for the ERP dashboard.
 * All queries are scoped to the authenticated user's tenant.
 */
class DashboardController {

  /**
   * GET /api/dashboard/summary
   * Returns the four summary cards: Total Revenue, Active Customers, Inventory Value, Pending Orders
   */
  static async getSummary(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { sequelize } = db;

      // Helper to safely query — returns 0 if table doesn't exist
      const safeQuery = async (sql, params) => {
        try {
          const [rows] = await sequelize.query(sql, { ...params, type: Sequelize.QueryTypes.SELECT });
          return rows;
        } catch (err) {
          if (err.message && err.message.includes("doesn't exist")) {
            logger.warn(`Dashboard table missing: ${err.message}`);
            return null;
          }
          throw err;
        }
      };

      // ── 1. Total Revenue (sum of grand_total from posted sales invoices) ──
      const revenueRows = await safeQuery(
        `SELECT COALESCE(SUM(grand_total), 0) as totalRevenue
         FROM sales_invoices
         WHERE tenant_id = :tenantId
           AND status IN ('posted', 'paid', 'partially_paid')
           AND deleted_at IS NULL`,
        { replacements: { tenantId } }
      );
      const totalRevenue = parseFloat(revenueRows?.totalRevenue || 0);

      // Revenue for previous period (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
      const prevRevenueRows = await safeQuery(
        `SELECT COALESCE(SUM(grand_total), 0) as prevRevenue
         FROM sales_invoices
         WHERE tenant_id = :tenantId
           AND status IN ('posted', 'paid', 'partially_paid')
           AND invoice_date < :thirtyDaysAgo
           AND deleted_at IS NULL`,
        { replacements: { tenantId, thirtyDaysAgo: thirtyDaysAgoStr } }
      );
      const prevRevenue = parseFloat(prevRevenueRows?.prevRevenue || 0);
      const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

      // ── 2. Active Customers ──
      const custRows = await safeQuery(
        `SELECT COUNT(*) as count
         FROM customers
         WHERE tenant_id = :tenantId
           AND status = 'active'
           AND deleted_at IS NULL`,
        { replacements: { tenantId } }
      );
      const activeCustomers = parseInt(custRows?.count || 0, 10);

      // Previous period customer count
      const prevCustRows = await safeQuery(
        `SELECT COUNT(*) as count
         FROM customers
         WHERE tenant_id = :tenantId
           AND status = 'active'
           AND created_at < :thirtyDaysAgo
           AND deleted_at IS NULL`,
        { replacements: { tenantId, thirtyDaysAgo: thirtyDaysAgoStr } }
      );
      const prevCustomers = parseInt(prevCustRows?.count || 0, 10);
      const customerChange = prevCustomers > 0 ? ((activeCustomers - prevCustomers) / prevCustomers) * 100 : 0;

      // ── 3. Inventory Value (sum of quantity_on_hand * average_cost) ──
      const invRows = await safeQuery(
        `SELECT COALESCE(SUM(quantity_on_hand * average_cost), 0) as inventoryValue
         FROM inventory_balances
         WHERE tenant_id = :tenantId`,
        { replacements: { tenantId } }
      );
      const inventoryValue = parseFloat(invRows?.inventoryValue || 0);

      // ── 4. Pending Orders (pending sales orders + pending purchase orders) ──
      const soRows = await safeQuery(
        `SELECT COUNT(*) as count
         FROM sales_orders
         WHERE tenant_id = :tenantId
           AND status IN ('draft', 'approved', 'partially_delivered')
           AND deleted_at IS NULL`,
        { replacements: { tenantId } }
      );
      const pendingSalesOrders = parseInt(soRows?.count || 0, 10);

      const poRows = await safeQuery(
        `SELECT COUNT(*) as count
         FROM purchase_orders
         WHERE tenant_id = :tenantId
           AND status IN ('draft', 'approved', 'partially_received')
           AND deleted_at IS NULL`,
        { replacements: { tenantId } }
      );
      const pendingPurchaseOrders = parseInt(poRows?.count || 0, 10);
      const pendingOrders = pendingSalesOrders + pendingPurchaseOrders;

      return ApiResponse.success(res, {
        data: {
          totalRevenue: { value: totalRevenue, change: parseFloat(revenueChange.toFixed(1)) },
          activeCustomers: { value: activeCustomers, change: parseFloat(customerChange.toFixed(1)) },
          inventoryValue: { value: inventoryValue, change: 0 },
          pendingOrders: { value: pendingOrders, change: 0 },
        },
      });
    } catch (error) {
      logger.error('Dashboard summary error:', error);
      next(error);
    }
  }

  /**
   * GET /api/dashboard/revenue?period=monthly|yearly
   * Returns revenue data grouped by month or year, respecting the tenant's fiscal year
   */
  static async getRevenueOverview(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { period = 'monthly' } = req.query;

      // Fetch tenant's fiscal year settings
      const tenant = await db.Tenant.findByPk(tenantId, {
        attributes: ['fiscalYearStart', 'fiscalYearEnd'],
        raw: true,
      });

      const fyStart = tenant?.fiscalYearStart || '01-01';
      const fyStartMonth = parseInt(fyStart.split('-')[0], 10);
      const fyStartDay = parseInt(fyStart.split('-')[1], 10);

      const now = new Date();
      const currentYear = now.getFullYear();

      // Determine the current fiscal year start year
      // If today is before the fiscal year start month/day, the FY started last year
      let fyStartYear = currentYear;
      const todayMD = (now.getMonth() + 1) * 100 + now.getDate();
      const fyStartMD = fyStartMonth * 100 + fyStartDay;
      if (todayMD < fyStartMD) {
        fyStartYear = currentYear - 1;
      }

      // Build fiscal year date range
      const fyStartDate = `${fyStartYear}-${String(fyStartMonth).padStart(2, '0')}-${String(fyStartDay).padStart(2, '0')}`;
      
      // Calculate end date: one day before next FY start
      let fyEndYear = fyStartYear + 1;
      let fyEndMonth = fyStartMonth;
      let fyEndDay = fyStartDay - 1;
      if (fyEndDay === 0) {
        fyEndMonth -= 1;
        if (fyEndMonth === 0) {
          fyEndMonth = 12;
          fyEndYear -= 1;
        }
        // Get last day of previous month
        const tempDate = new Date(fyEndYear, fyEndMonth, 0);
        fyEndDay = tempDate.getDate();
      }
      const fyEndStr = `${fyEndYear}-${String(fyEndMonth).padStart(2, '0')}-${String(fyEndDay).padStart(2, '0')}`;

      if (period === 'yearly') {
        // For yearly, group all invoice data by fiscal year
        const revenueData = await SalesInvoice.findAll({
          attributes: [
            [fn('COALESCE', fn('SUM', literal('`grand_total`')), 0), 'revenue'],
            [fn('COUNT', literal('`id`')), 'count'],
          ],
          where: {
            tenantId,
            status: { [Op.in]: ['posted', 'paid', 'partially_paid'] },
            invoiceDate: { [Op.between]: [fyStartDate, fyEndStr] },
          },
          raw: true,
        });

        const totalRevenue = parseFloat(revenueData[0]?.revenue || 0);
        const totalCount = parseInt(revenueData[0]?.count || 0);

        // Also get previous fiscal year for comparison
        const prevFyStartDate = `${fyStartYear - 1}-${String(fyStartMonth).padStart(2, '0')}-${String(fyStartDay).padStart(2, '0')}`;
        let prevFyEndDay2 = fyStartDay - 1;
        let prevFyEndMonth2 = fyStartMonth;
        let prevFyEndYear2 = fyStartYear;
        if (prevFyEndDay2 === 0) {
          prevFyEndMonth2 -= 1;
          if (prevFyEndMonth2 === 0) {
            prevFyEndMonth2 = 12;
            prevFyEndYear2 -= 1;
          }
          const tempDate2 = new Date(prevFyEndYear2, prevFyEndMonth2, 0);
          prevFyEndDay2 = tempDate2.getDate();
        }
        const prevFyEndStr = `${prevFyEndYear2}-${String(prevFyEndMonth2).padStart(2, '0')}-${String(prevFyEndDay2).padStart(2, '0')}`;

        const prevData = await SalesInvoice.findOne({
          attributes: [
            [fn('COALESCE', fn('SUM', literal('`grand_total`')), 0), 'revenue'],
          ],
          where: {
            tenantId,
            status: { [Op.in]: ['posted', 'paid', 'partially_paid'] },
            invoiceDate: { [Op.between]: [prevFyStartDate, prevFyEndStr] },
          },
          raw: true,
        });
        const prevRevenue = parseFloat(prevData?.revenue || 0);

        // Build period label e.g. "2025-2026"
        const periodLabel = `${fyStartYear}-${fyStartYear + 1}`;

        return ApiResponse.success(res, {
          data: [{
            period: periodLabel,
            revenue: totalRevenue,
            count: totalCount,
            change: prevRevenue > 0 ? parseFloat((((totalRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1)) : 0,
          }],
          meta: { fiscalYear: { start: fyStartDate, end: fyEndStr } },
        });
      }

      // ── Monthly mode: return all 12 months of the current fiscal year ──
      const revenueData = await SalesInvoice.findAll({
        attributes: [
          [fn('DATE_FORMAT', col('invoice_date'), '%Y-%m'), 'period'],
          [fn('COALESCE', fn('SUM', literal('`grand_total`')), 0), 'revenue'],
          [fn('COUNT', literal('`id`')), 'count'],
        ],
        where: {
          tenantId,
          status: { [Op.in]: ['posted', 'paid', 'partially_paid'] },
          invoiceDate: { [Op.between]: [fyStartDate, fyEndStr] },
        },
        group: [literal('`period`')],
        order: [[literal('`period`'), 'ASC']],
        raw: true,
      });

      // Build a map of month -> revenue from query results
      const revenueMap = {};
      revenueData.forEach((r) => {
        revenueMap[r.period] = {
          revenue: parseFloat(r.revenue || 0),
          count: parseInt(r.count || 0),
        };
      });

      // Generate all 12 months of the fiscal year, filling gaps with 0
      const result = [];
      for (let i = 0; i < 12; i++) {
        const fyMonth = (fyStartMonth + i - 1) % 12 + 1;
        const fyYear = fyStartYear + (fyStartMonth + i > 12 ? 1 : 0);
        const periodKey = `${fyYear}-${String(fyMonth).padStart(2, '0')}`;
        const entry = revenueMap[periodKey];
        result.push({
          period: periodKey,
          revenue: entry?.revenue || 0,
          count: entry?.count || 0,
        });
      }

      return ApiResponse.success(res, {
        data: result,
        meta: { fiscalYear: { start: fyStartDate, end: fyEndStr } },
      });
    } catch (error) {
      logger.error('Dashboard revenue error:', error);
      next(error);
    }
  }

  /**
   * GET /api/dashboard/recent-transactions?limit=10
   * Returns a unified list of recent transactions across all modules
   */
  static async getRecentTransactions(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const limit = parseInt(req.query.limit) || 10;
      const transactions = [];

      // Sales Invoices (posted)
      const salesInvoices = await SalesInvoice.findAll({
        where: { tenantId, status: { [Op.not]: 'cancelled' } },
        include: [{ model: Customer, as: 'customer', attributes: ['name'] }],
        order: [['createdAt', 'DESC']],
        limit,
        raw: true,
        nest: true,
      });
      salesInvoices.forEach((inv) => {
        transactions.push({
          id: inv.id,
          type: 'Sales Invoice',
          reference: inv.invoiceNumber,
          party: inv.customer?.name || '—',
          date: inv.invoiceDate,
          amount: parseFloat(inv.grandTotal || 0),
          status: inv.status,
          module: 'sales',
          link: `/sales/invoices/${inv.id}/view`,
        });
      });

      // Purchase Invoices (posted)
      const purchaseInvoices = await PurchaseInvoice.findAll({
        where: { tenantId, status: { [Op.not]: 'cancelled' } },
        include: [{ model: db.Supplier, as: 'supplier', attributes: ['name'] }],
        order: [['createdAt', 'DESC']],
        limit,
        raw: true,
        nest: true,
      });
      purchaseInvoices.forEach((inv) => {
        transactions.push({
          id: inv.id,
          type: 'Purchase Invoice',
          reference: inv.invoiceNumber,
          party: inv.supplier?.name || '—',
          date: inv.invoiceDate,
          amount: parseFloat(inv.totalAmount || 0),
          status: inv.status,
          module: 'purchases',
          link: `/purchases/purchase-invoices/${inv.id}/view`,
        });
      });

      // Customer Payments (posted)
      const customerPayments = await CustomerPayment.findAll({
        where: { tenantId, status: { [Op.not]: 'cancelled' } },
        include: [{ model: Customer, as: 'customer', attributes: ['name'] }],
        order: [['createdAt', 'DESC']],
        limit,
        raw: true,
        nest: true,
      });
      customerPayments.forEach((pmt) => {
        transactions.push({
          id: pmt.id,
          type: 'Customer Payment',
          reference: pmt.paymentNumber,
          party: pmt.customer?.name || '—',
          date: pmt.paymentDate,
          amount: parseFloat(pmt.amount || 0),
          status: pmt.status,
          module: 'sales',
          link: `/sales/payments/${pmt.id}/view`,
        });
      });

      // Supplier Payments (posted)
      const supplierPayments = await SupplierPayment.findAll({
        where: { tenantId, status: { [Op.not]: 'cancelled' } },
        include: [{ model: db.Supplier, as: 'supplier', attributes: ['name'] }],
        order: [['createdAt', 'DESC']],
        limit,
        raw: true,
        nest: true,
      });
      supplierPayments.forEach((pmt) => {
        transactions.push({
          id: pmt.id,
          type: 'Supplier Payment',
          reference: pmt.paymentNumber,
          party: pmt.supplier?.name || '—',
          date: pmt.paymentDate,
          amount: parseFloat(pmt.amount || 0),
          status: pmt.status,
          module: 'purchases',
          link: `/purchases/payments/${pmt.id}/view`,
        });
      });

      // Journal Entries (posted)
      const journalEntries = await JournalEntry.findAll({
        where: { tenantId, status: 'posted' },
        order: [['createdAt', 'DESC']],
        limit,
        raw: true,
      });
      journalEntries.forEach((je) => {
        transactions.push({
          id: je.id,
          type: 'Journal Entry',
          reference: je.entryNumber,
          party: je.description || '—',
          date: je.entryDate,
          amount: 0,
          status: je.status,
          module: 'accounting',
          link: `/accounting/journal-entries/${je.id}/view`,
        });
      });

      // Sort all by date descending and take top N
      transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
      const recent = transactions.slice(0, limit);

      return ApiResponse.success(res, { data: recent });
    } catch (error) {
      logger.error('Dashboard recent transactions error:', error);
      next(error);
    }
  }

  /**
   * GET /api/dashboard/customer-balances?limit=10
   * Returns customers with outstanding balances
   */
  static async getCustomerBalances(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const limit = parseInt(req.query.limit) || 10;

      // Get all active customers
      const customers = await Customer.findAll({
        where: { tenantId, status: 'active' },
        attributes: ['id', 'name', 'email', 'phone', 'status', 'creditLimit'],
        limit,
        raw: true,
      });

      // For each customer, calculate outstanding balance from unpaid sales invoices
      const result = await Promise.all(
        customers.map(async (c) => {
          const invoiceResult = await SalesInvoice.findOne({
            attributes: [
              [fn('COALESCE', fn('SUM', literal('`grand_total`')), 0), 'totalInvoiced'],
            ],
            where: {
              tenantId,
              customerId: c.id,
              status: { [Op.in]: ['posted', 'partially_paid', 'overdue'] },
            },
            raw: true,
          });

          const paymentResult = await CustomerPayment.findOne({
            attributes: [
              [fn('COALESCE', fn('SUM', literal('`amount`')), 0), 'totalPaid'],
            ],
            where: {
              tenantId,
              customerId: c.id,
              status: 'posted',
            },
            raw: true,
          });

          const totalInvoiced = parseFloat(invoiceResult?.totalInvoiced || 0);
          const totalPaid = parseFloat(paymentResult?.totalPaid || 0);
          const outstanding = Math.max(0, totalInvoiced - totalPaid);

          return {
            id: c.id,
            name: c.name,
            email: c.email || '—',
            phone: c.phone || '—',
            outstandingBalance: outstanding,
            creditLimit: parseFloat(c.creditLimit || 0),
            status: outstanding > 0 ? (outstanding > (parseFloat(c.creditLimit || 0) * 0.8) ? 'warning' : 'active') : 'active',
          };
        })
      );

      // Sort by outstanding balance descending
      result.sort((a, b) => b.outstandingBalance - a.outstandingBalance);

      return ApiResponse.success(res, { data: result });
    } catch (error) {
      logger.error('Dashboard customer balances error:', error);
      next(error);
    }
  }

  /**
   * GET /api/dashboard/inventory-alerts
   * Returns items with low stock, out of stock, or reorder needed
   */
  static async getInventoryAlerts(req, res, next) {
    try {
      const tenantId = req.user.tenantId;

      // Get all tracked items with their inventory balances
      const items = await Item.findAll({
        where: { tenantId, isInventoryTracked: true },
        attributes: ['id', 'itemCode', 'name'],
        raw: true,
      });

      const alerts = [];
      const LOW_STOCK_THRESHOLD = 10; // Default threshold if no minStockLevel defined

      await Promise.all(
        items.map(async (item) => {
          const balance = await InventoryBalance.findOne({
            attributes: [
              [fn('COALESCE', fn('SUM', literal('`quantity_on_hand`')), 0), 'totalQuantity'],
            ],
            where: { tenantId, itemId: item.id },
            raw: true,
          });

          const quantity = parseFloat(balance?.totalQuantity || 0);

          if (quantity === 0) {
            alerts.push({
              itemId: item.id,
              itemCode: item.itemCode,
              itemName: item.name,
              currentQuantity: quantity,
              minStockLevel: LOW_STOCK_THRESHOLD,
              type: 'Out of Stock',
              severity: 'error',
            });
          } else if (quantity <= LOW_STOCK_THRESHOLD) {
            alerts.push({
              itemId: item.id,
              itemCode: item.itemCode,
              itemName: item.name,
              currentQuantity: quantity,
              minStockLevel: LOW_STOCK_THRESHOLD,
              type: 'Low Stock',
              severity: 'warning',
            });
          } else if (quantity <= LOW_STOCK_THRESHOLD * 3) {
            alerts.push({
              itemId: item.id,
              itemCode: item.itemCode,
              itemName: item.name,
              currentQuantity: quantity,
              minStockLevel: LOW_STOCK_THRESHOLD,
              type: 'Reorder Required',
              severity: 'info',
            });
          }
        })
      );

      // Sort by severity then quantity ascending
      const severityOrder = { error: 0, warning: 1, info: 2 };
      alerts.sort((a, b) => {
        const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (sevDiff !== 0) return sevDiff;
        return a.currentQuantity - b.currentQuantity;
      });

      return ApiResponse.success(res, { data: alerts });
    } catch (error) {
      logger.error('Dashboard inventory alerts error:', error);
      next(error);
    }
  }

  /**
   * GET /api/dashboard/quick-stats
   * Returns additional quick stats for the dashboard
   */
  static async getQuickStats(req, res, next) {
    try {
      const tenantId = req.user.tenantId;

      // Total Sales Orders
      const totalSalesOrders = await SalesOrder.count({ where: { tenantId } });

      // Total Purchase Orders
      const totalPurchaseOrders = await PurchaseOrder.count({ where: { tenantId } });

      // Total Customers
      const totalCustomers = await Customer.count({ where: { tenantId } });

      // Total Suppliers
      const totalSuppliers = await Supplier.count({ where: { tenantId } });

      // Total Items
      const totalItems = await Item.count({ where: { tenantId } });

      // Total posted Journal Entries
      const totalJournalEntries = await JournalEntry.count({
        where: { tenantId, status: 'posted' },
      });

      return ApiResponse.success(res, {
        data: {
          totalSalesOrders,
          totalPurchaseOrders,
          totalCustomers,
          totalSuppliers,
          totalItems,
          totalJournalEntries,
        },
      });
    } catch (error) {
      logger.error('Dashboard quick stats error:', error);
      next(error);
    }
  }
}

module.exports = DashboardController;
