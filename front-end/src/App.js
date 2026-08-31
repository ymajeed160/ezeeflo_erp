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
import CashPaymentVouchers from './pages/CashPaymentVouchers';
import CashReceiptVouchers from './pages/CashReceiptVouchers';
import BankReconciliation from './pages/BankReconciliation';
import ReportsCenter from './pages/Reports/ReportsCenter';
import ReportViewer from './pages/Reports/ReportViewer';
import BalanceSheet from './pages/Reports/BalanceSheet';
import InventoryAgingReport from './pages/Reports/InventoryAgingReport';
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
    () => {
      const isLight = mode === 'light';

      return createTheme({
        palette: {
          mode,
          primary: {
            main: isLight ? '#2563eb' : '#60a5fa',
            light: isLight ? '#dbeafe' : '#1e3a5f',
            dark: isLight ? '#1d4ed8' : '#93bbfd',
            contrastText: '#ffffff',
          },
          secondary: {
            main: isLight ? '#7c3aed' : '#a78bfa',
            light: isLight ? '#ede9fe' : '#2e1065',
            dark: isLight ? '#5b21b6' : '#c4b5fd',
          },
          success: { main: isLight ? '#059669' : '#34d399', light: '#ecfdf5', dark: isLight ? '#047857' : '#6ee7b7' },
          warning: { main: isLight ? '#d97706' : '#fbbf24', light: '#fffbeb', dark: isLight ? '#b45309' : '#fcd34d' },
          error: { main: isLight ? '#dc2626' : '#f87171', light: '#fef2f2', dark: isLight ? '#b91c1c' : '#fca5a5' },
          info: { main: isLight ? '#0891b2' : '#22d3ee', light: '#ecfeff' },
          grey: {
            50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db',
            400: '#9ca3af', 500: '#6b7280', 600: '#4b5563', 700: '#374151',
            800: '#1f2937', 900: '#111827',
          },
          background: {
            default: isLight ? '#f8fafc' : '#0f172a',
            paper: isLight ? '#ffffff' : '#1e293b',
          },
          text: {
            primary: isLight ? '#1e293b' : '#f1f5f9',
            secondary: isLight ? '#64748b' : '#94a3b8',
          },
          divider: isLight ? '#e2e8f0' : '#334155',
        },
        typography: {
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          h4: { fontWeight: 700, fontSize: '1.5rem', letterSpacing: '-0.02em' },
          h5: { fontWeight: 600, fontSize: '1.25rem', letterSpacing: '-0.01em' },
          h6: { fontWeight: 600, fontSize: '1.1rem' },
          subtitle1: { fontWeight: 500, fontSize: '0.9rem', color: isLight ? '#64748b' : '#94a3b8' },
          body2: { fontSize: '0.85rem', color: isLight ? '#475569' : '#cbd5e1' },
          caption: { fontSize: '0.75rem', color: isLight ? '#94a3b8' : '#64748b' },
        },
        shape: { borderRadius: 10 },
        shadows: [
          'none',
          // 1 — subtle lift (cards, papers)
          isLight ? '0px 1px 3px rgba(0,0,0,0.08), 0px 1px 2px rgba(0,0,0,0.06)' : '0px 1px 3px rgba(0,0,0,0.4)',
          // 2 — floating cards
          isLight ? '0px 4px 6px rgba(0,0,0,0.07), 0px 2px 4px rgba(0,0,0,0.06)' : '0px 4px 6px rgba(0,0,0,0.5)',
          // 3 — elevated (dialogs)
          isLight ? '0px 10px 15px rgba(0,0,0,0.08), 0px 4px 6px rgba(0,0,0,0.05)' : '0px 10px 15px rgba(0,0,0,0.6)',
          // 4 — modals
          isLight ? '0px 14px 28px rgba(0,0,0,0.1), 0px 10px 10px rgba(0,0,0,0.06)' : '0px 14px 28px rgba(0,0,0,0.7)',
          // 5
          isLight ? '0px 19px 38px rgba(0,0,0,0.12), 0px 15px 12px rgba(0,0,0,0.06)' : '0px 19px 38px rgba(0,0,0,0.8)',
          ...Array(19).fill('none'),
        ],
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                '&::-webkit-scrollbar': { width: 6, height: 6 },
                '&::-webkit-scrollbar-track': { background: 'transparent' },
                '&::-webkit-scrollbar-thumb': { background: isLight ? '#cbd5e1' : '#475569', borderRadius: 3 },
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                borderRadius: 8,
                padding: '8px 18px',
                boxShadow: 'none',
                '&:hover': { boxShadow: 'none' },
              },
              containedPrimary: {
                background: isLight
                  ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                  : 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
                color: '#ffffff',
                '&:hover': {
                  background: isLight
                    ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                    : 'linear-gradient(135deg, #93bbfd 0%, #60a5fa 100%)',
                },
              },
              outlined: {
                borderColor: isLight ? '#e2e8f0' : '#475569',
                '&:hover': {
                  borderColor: isLight ? '#2563eb' : '#60a5fa',
                  backgroundColor: isLight ? '#f0f7ff' : 'rgba(96,165,250,0.08)',
                },
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                border: `1px solid ${isLight ? '#f1f5f9' : '#334155'}`,
                boxShadow: isLight
                  ? '0px 2px 6px rgba(0,0,0,0.08), 0px 1px 3px rgba(0,0,0,0.06)'
                  : '0px 2px 6px rgba(0,0,0,0.35), 0px 1px 3px rgba(0,0,0,0.25)',
                transition: 'box-shadow 0.25s ease, transform 0.2s ease',
                '&:hover': {
                  boxShadow: isLight
                    ? '0px 8px 20px rgba(0,0,0,0.1), 0px 3px 8px rgba(0,0,0,0.06)'
                    : '0px 8px 20px rgba(0,0,0,0.5)',
                  transform: 'translateY(-1px)',
                },
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
              elevation1: {
                boxShadow: isLight
                  ? '0px 1px 4px rgba(0,0,0,0.08), 0px 1px 3px rgba(0,0,0,0.06)'
                  : '0px 1px 4px rgba(0,0,0,0.4)',
              },
              elevation2: {
                boxShadow: isLight
                  ? '0px 4px 8px rgba(0,0,0,0.08), 0px 2px 4px rgba(0,0,0,0.06)'
                  : '0px 4px 8px rgba(0,0,0,0.5)',
              },
            },
          },
          MuiTableContainer: {
            styleOverrides: {
              root: {
                borderRadius: 10,
                boxShadow: isLight
                  ? '0px 1px 4px rgba(0,0,0,0.06), 0px 1px 3px rgba(0,0,0,0.04)'
                  : '0px 1px 4px rgba(0,0,0,0.35)',
                border: `1px solid ${isLight ? '#f1f5f9' : '#334155'}`,
              },
            },
          },
          MuiTableHead: {
            styleOverrides: {
              root: {
                '& .MuiTableCell-head': {
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  color: isLight ? '#64748b' : '#94a3b8',
                  backgroundColor: isLight ? '#f8fafc' : '#1e293b',
                  borderBottom: `2px solid ${isLight ? '#e2e8f0' : '#334155'}`,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '12px 16px',
                },
              },
            },
          },
          MuiTableRow: {
            styleOverrides: {
              root: {
                '&:hover': {
                  backgroundColor: isLight ? '#f8fafc' : 'rgba(255,255,255,0.03)',
                },
                '&:last-child td': {
                  borderBottom: 0,
                },
              },
            },
          },
          MuiTableCell: {
            styleOverrides: {
              root: {
                borderBottom: `1px solid ${isLight ? '#f1f5f9' : '#1e293b'}`,
                padding: '14px 16px',
                fontSize: '0.875rem',
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                fontWeight: 500,
                fontSize: '0.75rem',
                borderRadius: 6,
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: 8,
                  backgroundColor: isLight ? '#ffffff' : '#1e293b',
                  '& fieldset': {
                    borderColor: isLight ? '#e2e8f0' : '#475569',
                  },
                  '&:hover fieldset': {
                    borderColor: isLight ? '#cbd5e1' : '#64748b',
                  },
                },
              },
            },
          },
          MuiDialog: {
            styleOverrides: {
              paper: {
                borderRadius: 16,
              },
            },
          },
          MuiTooltip: {
            styleOverrides: {
              tooltip: {
                backgroundColor: isLight ? '#1e293b' : '#f1f5f9',
                color: isLight ? '#f8fafc' : '#0f172a',
                borderRadius: 6,
                fontSize: '0.75rem',
                fontWeight: 500,
                padding: '6px 12px',
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
                borderBottom: `1px solid ${isLight ? '#e2e8f0' : '#1e293b'}`,
              },
            },
          },
        },
      });
    },
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
            <Route path="/app/sales/crv" element={<CashReceiptVouchers />} />

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
            <Route path="/app/purchases/cpv" element={<CashPaymentVouchers />} />
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
            <Route path="/app/reports/inventory-aging" element={<InventoryAgingReport reportName="inventory-aging" />} />
            <Route path="/app/reports/inventory-valuation" element={<InventoryAgingReport reportName="inventory-valuation" />} />
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