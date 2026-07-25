import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './slices/authSlice';
import themeReducer from './slices/themeSlice';
import userReducer from './slices/userSlice';
import roleReducer from './slices/roleSlice';
import permissionReducer from './slices/permissionSlice';
import accountReducer from './slices/accountSlice';
import journalEntryReducer from './slices/journalEntrySlice';
import generalLedgerReducer from './slices/generalLedgerSlice';
import itemCategoryReducer from './slices/itemCategorySlice';
import itemReducer from './slices/itemSlice';
import warehouseReducer from './slices/warehouseSlice';
import stockAdjustmentReducer from './slices/stockAdjustmentSlice';
import stockTransferReducer from './slices/stockTransferSlice';
import inventoryReducer from './slices/inventorySlice';
import customerReducer from './slices/customerSlice';
import quotationReducer from './slices/quotationSlice';
import salesOrderReducer from './slices/salesOrderSlice';
import deliveryNoteReducer from './slices/deliveryNoteSlice';
import salesInvoiceReducer from './slices/salesInvoiceSlice';
import salesReturnReducer from './slices/salesReturnSlice';
import creditNoteReducer from './slices/creditNoteSlice';
import customerPaymentReducer from './slices/customerPaymentSlice';
import supplierReducer from './slices/supplierSlice';
import purchaseRequestReducer from './slices/purchaseRequestSlice';
import purchaseOrderReducer from './slices/purchaseOrderSlice';
import goodsReceiptReducer from './slices/goodsReceiptSlice';
import purchaseInvoiceReducer from './slices/purchaseInvoiceSlice';
import purchaseReturnReducer from './slices/purchaseReturnSlice';
import reportReducer from './slices/reportSlice';
import debitNoteReducer from './slices/debitNoteSlice';
import supplierPaymentReducer from './slices/supplierPaymentSlice';
import bankAccountReducer from './slices/bankAccountSlice';
import bankTransactionReducer from './slices/bankTransactionSlice';
import paymentReceiptReducer from './slices/paymentReceiptSlice';
import paymentVoucherReducer from './slices/paymentVoucherSlice';
import bankReconciliationReducer from './slices/bankReconciliationSlice';
import assetCategoryReducer from './slices/assetCategorySlice';
import assetReducer from './slices/assetSlice';
import assetAcquisitionReducer from './slices/assetAcquisitionSlice';
import assetTransferReducer from './slices/assetTransferSlice';
import assetDepreciationReducer from './slices/assetDepreciationSlice';
import assetDisposalReducer from './slices/assetDisposalSlice';
import assetRevaluationReducer from './slices/assetRevaluationSlice';
import assetMaintenanceReducer from './slices/assetMaintenanceSlice';
import assetInsuranceReducer from './slices/assetInsuranceSlice';
import assetLocationReducer from './slices/assetLocationSlice';
import assetCustodianReducer from './slices/assetCustodianSlice';
import assetAuditReducer from './slices/assetAuditSlice';
import companyReducer from './slices/companySlice';
import subscriptionPlanReducer from './slices/subscriptionPlanSlice';
import subscriptionModuleReducer from './slices/subscriptionModuleSlice';
import companySubscriptionReducer from './slices/companySubscriptionSlice';
import auditLogReducer from './slices/auditSlice';
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'theme', 'company'],
};

const appReducer = combineReducers({
  auth: authReducer,
  theme: themeReducer,
  users: userReducer,
  roles: roleReducer,
  permissions: permissionReducer,
  accounts: accountReducer,
  journalEntries: journalEntryReducer,
  generalLedger: generalLedgerReducer,
  itemCategories: itemCategoryReducer,
  items: itemReducer,
  warehouses: warehouseReducer,
  stockAdjustments: stockAdjustmentReducer,
  stockTransfers: stockTransferReducer,
  inventory: inventoryReducer,
  customers: customerReducer,
  quotations: quotationReducer,
  salesOrders: salesOrderReducer,
  deliveryNotes: deliveryNoteReducer,
  salesInvoices: salesInvoiceReducer,
  salesReturns: salesReturnReducer,
  creditNotes: creditNoteReducer,
  customerPayments: customerPaymentReducer,
  suppliers: supplierReducer,
  purchaseRequests: purchaseRequestReducer,
  purchaseOrders: purchaseOrderReducer,
  goodsReceipts: goodsReceiptReducer,
  purchaseInvoices: purchaseInvoiceReducer,
  purchaseReturns: purchaseReturnReducer,
  debitNotes: debitNoteReducer,
  supplierPayments: supplierPaymentReducer,
  bankAccounts: bankAccountReducer,
  bankTransactions: bankTransactionReducer,
  paymentReceipts: paymentReceiptReducer,
  paymentVouchers: paymentVoucherReducer,
  bankReconciliations: bankReconciliationReducer,
  assetCategories: assetCategoryReducer,
  assets: assetReducer,
  assetAcquisitions: assetAcquisitionReducer,
  assetTransfers: assetTransferReducer,
  depreciations: assetDepreciationReducer,
  disposals: assetDisposalReducer,
  revaluations: assetRevaluationReducer,
  maintenances: assetMaintenanceReducer,
  insurances: assetInsuranceReducer,
  locations: assetLocationReducer,
  custodians: assetCustodianReducer,
  audits: assetAuditReducer,
  reports: reportReducer,
  company: companyReducer,
  subscriptionPlans: subscriptionPlanReducer,
  subscriptionModules: subscriptionModuleReducer,
  companySubscriptions: companySubscriptionReducer,
  auditLogs: auditLogReducer,
});

const persistedReducer = persistReducer(persistConfig, appReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/REGISTER'],
      },
    }),
});

export const persistor = persistStore(store);

export default store;