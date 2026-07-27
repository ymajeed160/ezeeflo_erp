import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import MainLayout from './components/Layout/MainLayout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import CompanySelection from './pages/CompanySelection';
import CreateCompany from './pages/CreateCompany';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import RolesPermissions from './pages/RolesPermissions';
import ChartOfAccounts from './pages/ChartOfAccounts';
import JournalEntries from './pages/JournalEntries';
import GeneralLedger from './pages/GeneralLedger';
import ItemCategories from './pages/ItemCategories';
import Items from './pages/Items';
import Warehouses from './pages/Warehouses';
import StockAdjustments from './pages/StockAdjustments';
import StockTransfers from './pages/StockTransfers';
import Customers from './pages/Customers';
import Quotations from './pages/Quotations';
import SalesOrders from './pages/SalesOrders';
import DeliveryNotes from './pages/DeliveryNotes';
import SalesInvoices from './pages/SalesInvoices';
import SalesReturns from './pages/SalesReturns';
import CreditNotes from './pages/CreditNotes';
import CustomerPayments from './pages/CustomerPayments';
import Suppliers from './pages/Suppliers';
import PurchaseRequests from './pages/PurchaseRequests';
import PurchaseOrders from './pages/PurchaseOrders';
import GoodsReceipts from './pages/GoodsReceipts';
import PurchaseInvoices from './pages/PurchaseInvoices';
import PurchaseReturns from './pages/PurchaseReturns';
import DebitNotes from './pages/DebitNotes';
import SupplierPayments from './pages/SupplierPayments';
import InventoryBalances from './pages/InventoryBalances';
import InventoryTransactions from './pages/InventoryTransactions';
import CompanyProfile from './pages/CompanyProfile';
import BankAccounts from './pages/BankAccounts';
import BankTransactions from './pages/BankTransactions';
import PaymentReceipts from './pages/PaymentReceipts';
import PaymentVouchers from './pages/PaymentVouchers';
import BankReconciliation from './pages/BankReconciliation';
import ReportsCenter from './pages/Reports/ReportsCenter';
import ReportViewer from './pages/Reports/ReportViewer';
import BalanceSheet from './pages/Reports/BalanceSheet';
import SalesDashboard from './pages/BI/SalesDashboard';
import PurchaseDashboard from './pages/BI/PurchaseDashboard';
import InventoryDashboard from './pages/BI/InventoryDashboard';
import FinancialDashboard from './pages/BI/FinancialDashboard';
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';
import TrialBalance from './pages/Accounting/TrialBalance';
import ProfitLoss from './pages/Accounting/ProfitLoss';
import SystemConfig from './pages/SystemConfig';
import ReleaseNotes from './pages/ReleaseNotes';
import AuditTrail from './pages/AuditTrail';
import AuditDetail from './pages/AuditDetail';
import SuperAdminDashboard from './pages/SuperAdmin/SuperAdminDashboard';
import SubscriptionPlans from './pages/SuperAdmin/SubscriptionPlans';
import SubscriptionModules from './pages/SuperAdmin/SubscriptionModules';
import SuperAdminAuditTrail from './pages/SuperAdmin/SuperAdminAuditTrail';
import CompanySubscriptions from './pages/SuperAdmin/CompanySubscriptions';
import AssetCategories from './pages/AssetCategories';
import Assets from './pages/Assets';
import AssetAcquisitions from './pages/AssetAcquisitions';
import AssetTransfers from './pages/AssetTransfers';
import AssetDepreciations from './pages/AssetDepreciations';
import AssetDisposals from './pages/AssetDisposals';
import AssetRevaluations from './pages/AssetRevaluations';
import AssetMaintenances from './pages/AssetMaintenances';
import AssetInsurances from './pages/AssetInsurances';
import AssetLocations from './pages/AssetLocations';
import AssetCustodians from './pages/AssetCustodians';
import AssetAudits from './pages/AssetAudits';
import AssetReports from './pages/AssetReports';
import FixedAssetReportViewer from './pages/FixedAssetReportViewer';
import PosDashboard from './pages/PosDashboard';
import PosTerminals from './pages/PosTerminals';
import PosSessions from './pages/PosSessions';
import PosRegister from './pages/PosRegister';
import PosHeldOrders from './pages/PosHeldOrders';
import PosReturnsPage from './pages/PosReturnsPage';
import PosCashManagement from './pages/PosCashManagement';
import PosEndOfDay from './pages/PosEndOfDay';
import PosReports from './pages/PosReports';

const App = () => {
  const mode = useSelector((state) => state.theme.mode);

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: '#1976d2', light: '#e3f2fd', dark: '#1565c0' },
          secondary: { main: '#9c27b0' },
          success: { main: '#2e7d32', light: '#e8f5e9' },
          warning: { main: '#ed6c02', light: '#fff3e0' },
          error: { main: '#d32f2f', light: '#fce4ec' },
          background: {
            default: mode === 'light' ? '#f5f7fa' : '#121212',
            paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
          },
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        },
        shape: { borderRadius: 8 },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                fontWeight: 600,
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                boxShadow: mode === 'light'
                  ? '0px 2px 8px rgba(0,0,0,0.08)'
                  : '0px 2px 8px rgba(0,0,0,0.3)',
              },
            },
          },
        },
      }),
    [mode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          {/* Public routes — Landing Page */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/select-company"
            element={
              <ProtectedRoute requireCompany={false}>
                <CompanySelection />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/create"
            element={
              <ProtectedRoute requireCompany={false}>
                <CreateCompany />
              </ProtectedRoute>
            }
          />

          {/* Protected routes (under /app) */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="/app/dashboard" element={<Dashboard />} />
            <Route path="/app/settings/users" element={<Users />} />
            <Route path="/app/settings/roles" element={<RolesPermissions />} />
            <Route path="/app/accounting/chart-of-accounts" element={<ChartOfAccounts />} />
            <Route path="/app/accounting/journal-entries" element={<JournalEntries />} />
            <Route path="/app/accounting/general-ledger" element={<GeneralLedger />} />
            <Route path="/app/profile" element={<Profile />} />
            <Route path="/app/change-password" element={<ChangePassword />} />

            {/* Inventory - Items */}
            <Route path="/app/inventory/items" element={<Items />} />
            <Route path="/app/inventory/items/new" element={<Items />} />
            <Route path="/app/inventory/items/:id/edit" element={<Items />} />
            <Route path="/app/inventory/item-categories" element={<ItemCategories />} />

            {/* Inventory - Warehouses */}
            <Route path="/app/inventory/warehouses" element={<Warehouses />} />
            <Route path="/app/inventory/warehouses/new" element={<Warehouses />} />
            <Route path="/app/inventory/warehouses/:id/edit" element={<Warehouses />} />

            {/* Inventory - Stock Adjustments */}
            <Route path="/app/inventory/adjustments" element={<StockAdjustments />} />
            <Route path="/app/inventory/adjustments/new" element={<StockAdjustments />} />
            <Route path="/app/inventory/adjustments/:id/edit" element={<StockAdjustments />} />

            {/* Inventory - Stock Transfers */}
            <Route path="/app/inventory/transfers" element={<StockTransfers />} />
            <Route path="/app/inventory/transfers/new" element={<StockTransfers />} />
            <Route path="/app/inventory/transfers/:id/edit" element={<StockTransfers />} />

            {/* Inventory - Balances & Transactions */}
            <Route path="/app/inventory/balances" element={<InventoryBalances />} />
            <Route path="/app/inventory/transactions" element={<InventoryTransactions />} />

            {/* Sales - Customers */}
            <Route path="/app/sales/customers" element={<Customers />} />
            <Route path="/app/sales/customers/new" element={<Customers />} />
            <Route path="/app/sales/customers/:id/edit" element={<Customers />} />
            <Route path="/app/sales/customers/:id/view" element={<Customers />} />

            {/* Sales - Quotations */}
            <Route path="/app/sales/quotations" element={<Quotations />} />
            <Route path="/app/sales/quotations/new" element={<Quotations />} />
            <Route path="/app/sales/quotations/:id/edit" element={<Quotations />} />
            <Route path="/app/sales/quotations/:id/view" element={<Quotations />} />

            {/* Sales - Sales Orders */}
            <Route path="/app/sales/sales-orders" element={<SalesOrders />} />
            <Route path="/app/sales/sales-orders/new" element={<SalesOrders />} />
            <Route path="/app/sales/sales-orders/:id/edit" element={<SalesOrders />} />
            <Route path="/app/sales/sales-orders/:id/view" element={<SalesOrders />} />

            {/* Sales - Delivery Notes */}
            <Route path="/app/sales/delivery-notes" element={<DeliveryNotes />} />
            <Route path="/app/sales/delivery-notes/new" element={<DeliveryNotes />} />
            <Route path="/app/sales/delivery-notes/:id/edit" element={<DeliveryNotes />} />
            <Route path="/app/sales/delivery-notes/:id/view" element={<DeliveryNotes />} />

            {/* Sales - Sales Invoices */}
            <Route path="/app/sales/invoices" element={<SalesInvoices />} />
            <Route path="/app/sales/invoices/new" element={<SalesInvoices />} />
            <Route path="/app/sales/invoices/:id/edit" element={<SalesInvoices />} />
            <Route path="/app/sales/invoices/:id/view" element={<SalesInvoices />} />

            {/* Sales - Sales Returns */}
            <Route path="/app/sales/returns" element={<SalesReturns />} />
            <Route path="/app/sales/returns/new" element={<SalesReturns />} />
            <Route path="/app/sales/returns/:id/edit" element={<SalesReturns />} />
            <Route path="/app/sales/returns/:id/view" element={<SalesReturns />} />

            {/* Sales - Credit Notes */}
            <Route path="/app/sales/credit-notes" element={<CreditNotes />} />
            <Route path="/app/sales/credit-notes/new" element={<CreditNotes />} />
            <Route path="/app/sales/credit-notes/:id/edit" element={<CreditNotes />} />
            <Route path="/app/sales/credit-notes/:id/view" element={<CreditNotes />} />

            {/* Sales - Customer Payments */}
            <Route path="/app/sales/payments" element={<CustomerPayments />} />
            <Route path="/app/sales/payments/new" element={<CustomerPayments />} />
            <Route path="/app/sales/payments/:id/edit" element={<CustomerPayments />} />
            <Route path="/app/sales/payments/:id/view" element={<CustomerPayments />} />

            {/* Purchases - Suppliers */}
            <Route path="/app/purchases/suppliers" element={<Suppliers />} />
            <Route path="/app/purchases/suppliers/new" element={<Suppliers />} />
            <Route path="/app/purchases/suppliers/:id/edit" element={<Suppliers />} />
            <Route path="/app/purchases/suppliers/:id/view" element={<Suppliers />} />

            {/* Purchases - Purchase Requests */}
            <Route path="/app/purchases/purchase-requests" element={<PurchaseRequests />} />
            <Route path="/app/purchases/purchase-requests/new" element={<PurchaseRequests />} />
            <Route path="/app/purchases/purchase-requests/:id/edit" element={<PurchaseRequests />} />
            <Route path="/app/purchases/purchase-requests/:id/view" element={<PurchaseRequests />} />

            {/* Purchases - Purchase Orders */}
            <Route path="/app/purchases/purchase-orders" element={<PurchaseOrders />} />
            <Route path="/app/purchases/purchase-orders/new" element={<PurchaseOrders />} />
            <Route path="/app/purchases/purchase-orders/:id/edit" element={<PurchaseOrders />} />
            <Route path="/app/purchases/purchase-orders/:id/view" element={<PurchaseOrders />} />

            {/* Purchases - Goods Receipts */}
            <Route path="/app/purchases/goods-receipts" element={<GoodsReceipts />} />
            <Route path="/app/purchases/goods-receipts/new" element={<GoodsReceipts />} />
            <Route path="/app/purchases/goods-receipts/:id/edit" element={<GoodsReceipts />} />
            <Route path="/app/purchases/goods-receipts/:id/view" element={<GoodsReceipts />} />

            {/* Purchases - Purchase Invoices */}
            <Route path="/app/purchases/purchase-invoices" element={<PurchaseInvoices />} />
            <Route path="/app/purchases/purchase-invoices/new" element={<PurchaseInvoices />} />
            <Route path="/app/purchases/purchase-invoices/:id/edit" element={<PurchaseInvoices />} />
            <Route path="/app/purchases/purchase-invoices/:id/view" element={<PurchaseInvoices />} />

            {/* Purchases - Purchase Returns */}
            <Route path="/app/purchases/purchase-returns" element={<PurchaseReturns />} />
            <Route path="/app/purchases/purchase-returns/new" element={<PurchaseReturns />} />
            <Route path="/app/purchases/purchase-returns/:id/edit" element={<PurchaseReturns />} />
            <Route path="/app/purchases/purchase-returns/:id/view" element={<PurchaseReturns />} />

            {/* Purchases - Debit Notes */}
            <Route path="/app/purchases/debit-notes" element={<DebitNotes />} />
            <Route path="/app/purchases/debit-notes/new" element={<DebitNotes />} />
            <Route path="/app/purchases/debit-notes/:id/edit" element={<DebitNotes />} />
            <Route path="/app/purchases/debit-notes/:id/view" element={<DebitNotes />} />

            {/* Fixed Assets - Asset Categories */}
            <Route path="/app/fixed-assets/categories" element={<AssetCategories />} />
            <Route path="/app/fixed-assets/categories/new" element={<AssetCategories />} />
            <Route path="/app/fixed-assets/categories/:id/edit" element={<AssetCategories />} />
            <Route path="/app/fixed-assets/categories/:id/view" element={<AssetCategories />} />

            {/* Fixed Assets - Asset Register */}
            <Route path="/app/fixed-assets/register" element={<Assets />} />
            <Route path="/app/fixed-assets/register/new" element={<Assets />} />
            <Route path="/app/fixed-assets/register/:id/edit" element={<Assets />} />
            <Route path="/app/fixed-assets/register/:id/view" element={<Assets />} />

            {/* Fixed Assets - Acquisitions */}
            <Route path="/app/fixed-assets/acquisitions" element={<AssetAcquisitions />} />

            {/* Fixed Assets - Transfers */}
            <Route path="/app/fixed-assets/transfers" element={<AssetTransfers />} />

            {/* Fixed Assets - Depreciation */}
            <Route path="/app/fixed-assets/depreciation" element={<AssetDepreciations />} />

            {/* Fixed Assets - Disposals */}
            <Route path="/app/fixed-assets/disposals" element={<AssetDisposals />} />

            {/* Fixed Assets - Revaluations */}
            <Route path="/app/fixed-assets/revaluations" element={<AssetRevaluations />} />

            {/* Fixed Assets - Maintenance */}
            <Route path="/app/fixed-assets/maintenance" element={<AssetMaintenances />} />

            {/* Fixed Assets - Insurance */}
            <Route path="/app/fixed-assets/insurance" element={<AssetInsurances />} />

            {/* Fixed Assets - Locations */}
            <Route path="/app/fixed-assets/locations" element={<AssetLocations />} />

            {/* Fixed Assets - Custodians */}
            <Route path="/app/fixed-assets/custodians" element={<AssetCustodians />} />

            {/* Fixed Assets - Audits */}
            <Route path="/app/fixed-assets/audits" element={<AssetAudits />} />

            {/* Fixed Assets - Reports */}
            <Route path="/app/fixed-assets/reports" element={<AssetReports />} />
            <Route path="/app/fixed-assets/reports/:reportName" element={<FixedAssetReportViewer />} />

            {/* Purchases - Supplier Payments */}
            <Route path="/app/purchases/payments" element={<SupplierPayments />} />
            <Route path="/app/purchases/payments/new" element={<SupplierPayments />} />
            <Route path="/app/purchases/payments/:id/edit" element={<SupplierPayments />} />
            <Route path="/app/purchases/payments/:id/view" element={<SupplierPayments />} />

            {/* Banks - Bank Accounts */}
            <Route path="/app/banks/accounts" element={<BankAccounts />} />
            <Route path="/app/banks/accounts/new" element={<BankAccounts />} />
            <Route path="/app/banks/accounts/:id/edit" element={<BankAccounts />} />
            <Route path="/app/banks/accounts/:id/view" element={<BankAccounts />} />

            {/* Banks - Transactions */}
            <Route path="/app/banks/transactions" element={<BankTransactions />} />
            <Route path="/app/banks/transactions/new" element={<BankTransactions />} />
            <Route path="/app/banks/transactions/:id/edit" element={<BankTransactions />} />
            <Route path="/app/banks/transactions/:id/view" element={<BankTransactions />} />

            {/* Banks - Payment Receipts */}
            <Route path="/app/banks/receipts" element={<PaymentReceipts />} />
            <Route path="/app/banks/receipts/new" element={<PaymentReceipts />} />
            <Route path="/app/banks/receipts/:id/edit" element={<PaymentReceipts />} />
            <Route path="/app/banks/receipts/:id/view" element={<PaymentReceipts />} />

            {/* Banks - Payment Vouchers */}
            <Route path="/app/banks/vouchers" element={<PaymentVouchers />} />
            <Route path="/app/banks/vouchers/new" element={<PaymentVouchers />} />
            <Route path="/app/banks/vouchers/:id/edit" element={<PaymentVouchers />} />
            <Route path="/app/banks/vouchers/:id/view" element={<PaymentVouchers />} />

            {/* Banks - Reconciliation */}
            <Route path="/app/banks/reconciliation" element={<BankReconciliation />} />
            <Route path="/app/banks/reconciliation/new" element={<BankReconciliation />} />
            <Route path="/app/banks/reconciliation/:id/edit" element={<BankReconciliation />} />
            <Route path="/app/banks/reconciliation/:id/view" element={<BankReconciliation />} />

            {/* Reports */}
            <Route path="/app/reports" element={<ReportsCenter />} />
            <Route path="/app/reports/balance-sheet" element={<BalanceSheet />} />
            <Route path="/app/reports/:reportName" element={<ReportViewer />} />

            {/* BI Dashboards */}
            <Route path="/app/bi/sales" element={<SalesDashboard />} />
            <Route path="/app/bi/purchase" element={<PurchaseDashboard />} />
            <Route path="/app/bi/inventory" element={<InventoryDashboard />} />
            <Route path="/app/bi/financial" element={<FinancialDashboard />} />

            {/* Placeholder routes for modules to be developed */}
            <Route path="/app/sales/*" element={<Dashboard />} />
            <Route path="/app/purchases/*" element={<Dashboard />} />
            <Route path="/app/accounting/trial-balance" element={<TrialBalance />} />
            <Route path="/app/accounting/profit-loss" element={<ProfitLoss />} />
            <Route path="/app/accounting/balance-sheet" element={<Navigate to="/app/reports/balance-sheet" replace />} />
            <Route path="/app/accounting/*" element={<Dashboard />} />
            <Route path="/app/banks/*" element={<Dashboard />} />
            <Route path="/app/settings/company" element={<CompanyProfile />} />
            <Route path="/app/settings/system" element={<SystemConfig />} />
            <Route path="/app/audit" element={<AuditTrail />} />
            <Route path="/app/audit/:id" element={<AuditDetail />} />
            <Route path="/app/release-notes" element={<ReleaseNotes />} />

            {/* POS Module Routes */}
            <Route path="/app/pos/dashboard" element={<PosDashboard />} />
            <Route path="/app/pos/terminals" element={<PosTerminals />} />
            <Route path="/app/pos/sessions" element={<PosSessions />} />
            <Route path="/app/pos/register" element={<PosRegister />} />
            <Route path="/app/pos/held-orders" element={<PosHeldOrders />} />
            <Route path="/app/pos/returns" element={<PosReturnsPage />} />
            <Route path="/app/pos/cash" element={<PosCashManagement />} />
            <Route path="/app/pos/end-of-day" element={<PosEndOfDay />} />
            <Route path="/app/pos/reports" element={<PosReports />} />
          </Route>

          {/* Super Admin Routes (no company context required) */}
          <Route path="/superadmin" element={<ProtectedRoute requireCompany={false}><SuperAdminDashboard /></ProtectedRoute>} />
          <Route path="/superadmin/plans" element={<ProtectedRoute requireCompany={false}><SubscriptionPlans /></ProtectedRoute>} />
          <Route path="/superadmin/modules" element={<ProtectedRoute requireCompany={false}><SubscriptionModules /></ProtectedRoute>} />
          <Route path="/superadmin/subscriptions" element={<ProtectedRoute requireCompany={false}><CompanySubscriptions /></ProtectedRoute>} />
          <Route path="/superadmin/audit" element={<ProtectedRoute requireCompany={false}><SuperAdminAuditTrail /></ProtectedRoute>} />
          <Route path="/superadmin/audit/:id" element={<ProtectedRoute requireCompany={false}><SuperAdminAuditTrail /></ProtectedRoute>} />

          {/* Catch all — redirect to Landing Page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;