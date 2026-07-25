const sequelize = require('../config/database');
const { Sequelize, DataTypes } = require('sequelize');
const Tenant = require('./Tenant');
const User = require('./User');
const Role = require('./Role');
const Permission = require('./Permission');
const SystemConfig = require('./SystemConfig');
const NumberSeries = require('./NumberSeries');
const EmailSetting = require('./EmailSetting');
const TaxRate = require('./TaxRate');
const VatCategoryCode = require('./VatCategoryCode');
const UserRole = require('./UserRole');
const RolePermission = require('./RolePermission');
const RefreshToken = require('./RefreshToken');
const AuditLog = require('./AuditLog');
const Account = require('./Account');
const JournalEntry = require('./JournalEntry');
const JournalEntryLine = require('./JournalEntryLine');
const ItemCategory = require('./ItemCategory');
const Item = require('./Item');
const Warehouse = require('./Warehouse');
const InventoryBalance = require('./InventoryBalance');
const StockAdjustment = require('./StockAdjustment');
const StockAdjustmentDetail = require('./StockAdjustmentDetail');
const StockTransfer = require('./StockTransfer');
const StockTransferDetail = require('./StockTransferDetail');
const InventoryTransaction = require('./InventoryTransaction');
const Customer = require('./Customer');
const { Quotation, QuotationDetail } = require('./Quotation');
const SalesOrder = require('./SalesOrder')(sequelize, DataTypes);
const SalesOrderDetail = require('./SalesOrderDetail')(sequelize, DataTypes);
const DeliveryNote = require('./DeliveryNote')(sequelize, DataTypes);
const DeliveryNoteDetail = require('./DeliveryNoteDetail')(sequelize, DataTypes);
const SalesInvoice = require('./SalesInvoice')(sequelize, DataTypes);
const SalesInvoiceDetail = require('./SalesInvoiceDetail')(sequelize, DataTypes);
const SalesReturn = require('./SalesReturn')(sequelize, DataTypes);
const SalesReturnDetail = require('./SalesReturnDetail')(sequelize, DataTypes);
const CreditNote = require('./CreditNote')(sequelize, DataTypes);
const CreditNoteDetail = require('./CreditNoteDetail')(sequelize, DataTypes);
const CustomerPayment = require('./CustomerPayment')(sequelize, DataTypes);
const CustomerPaymentAllocation = require('./CustomerPaymentAllocation')(sequelize, DataTypes);
const Supplier = require('./Supplier');
const { PurchaseRequest, PurchaseRequestDetail } = require('./PurchaseRequest');
const PurchaseOrder = require('./PurchaseOrder')(sequelize, DataTypes);
const PurchaseOrderDetail = require('./PurchaseOrderDetail')(sequelize, DataTypes);
const GoodsReceipt = require('./GoodsReceipt')(sequelize, DataTypes);
const GoodsReceiptDetail = require('./GoodsReceiptDetail')(sequelize, DataTypes);
const PurchaseInvoice = require('./PurchaseInvoice')(sequelize, DataTypes);
const PurchaseInvoiceDetail = require('./PurchaseInvoiceDetail')(sequelize, DataTypes);
const PurchaseReturn = require('./PurchaseReturn')(sequelize, DataTypes);
const PurchaseReturnDetail = require('./PurchaseReturnDetail')(sequelize, DataTypes);
const DebitNote = require('./DebitNote')(sequelize, DataTypes);
const SupplierPayment = require('./SupplierPayment')(sequelize, DataTypes);
const SupplierPaymentAllocation = require('./SupplierPaymentAllocation')(sequelize, DataTypes);
const BankAccount = require('./BankAccount');
const BankTransaction = require('./BankTransaction');
const PaymentReceipt = require('./PaymentReceipt');
const PaymentReceiptAllocation = require('./PaymentReceiptAllocation');
const PaymentVoucher = require('./PaymentVoucher');
const PaymentVoucherAllocation = require('./PaymentVoucherAllocation');
const PaymentVoucherLine = require('./PaymentVoucherLine');
const BankReconciliation = require('./BankReconciliation');
const BankReconciliationLine = require('./BankReconciliationLine');
const UserTenant = require('./UserTenant');
const AssetCategory = require('./AssetCategory');
const Asset = require('./Asset');
const AssetAcquisition = require('./AssetAcquisition');
const AssetAcquisitionLine = require('./AssetAcquisitionLine');
const AssetTransfer = require('./AssetTransfer');
const AssetDepreciation = require('./AssetDepreciation');
const AssetDisposal = require('./AssetDisposal');
const AssetRevaluation = require('./AssetRevaluation');
const AssetMaintenance = require('./AssetMaintenance');
const AssetInsurance = require('./AssetInsurance');
const AssetLocation = require('./AssetLocation');
const AssetCustodian = require('./AssetCustodian');
const AssetAudit = require('./AssetAudit');

// ============================================================
// Super Admin / SaaS Models
// ============================================================
const SubscriptionPlan = require('./SubscriptionPlan');
const SubscriptionModule = require('./SubscriptionModule');
const SubscriptionPlanModule = require('./SubscriptionPlanModule');
const CompanySubscription = require('./CompanySubscription');
const CompanySubscriptionModule = require('./CompanySubscriptionModule');
const FeatureFlag = require('./FeatureFlag');
const License = require('./License');
const BillingInvoice = require('./BillingInvoice');
const Payment = require('./Payment');
const UsageTracking = require('./UsageTracking');
const ModuleUsage = require('./ModuleUsage');
const SubscriptionAuditLog = require('./SubscriptionAuditLog');
const SuperAdminSetting = require('./SuperAdminSetting');

// User-Tenant many-to-many (multi-company support)
User.belongsToMany(Tenant, { through: UserTenant, foreignKey: 'userId', otherKey: 'tenantId' });
Tenant.belongsToMany(User, { through: UserTenant, foreignKey: 'tenantId', otherKey: 'userId' });

// UserTenant direct associations
User.hasMany(UserTenant, { foreignKey: 'userId' });
UserTenant.belongsTo(User, { foreignKey: 'userId' });
Tenant.hasMany(UserTenant, { foreignKey: 'tenantId' });
UserTenant.belongsTo(Tenant, { foreignKey: 'tenantId' });

// Tenant associations
Tenant.hasMany(User, { foreignKey: 'tenantId', sourceKey: 'id' });
User.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// User - Role (Many-to-Many through UserRole)
User.belongsToMany(Role, { through: UserRole, foreignKey: 'userId', otherKey: 'roleId' });
Role.belongsToMany(User, { through: UserRole, foreignKey: 'roleId', otherKey: 'userId' });

// Role - Permission (Many-to-Many through RolePermission)
Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'roleId', otherKey: 'permissionId' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permissionId', otherKey: 'roleId' });

// UserRole direct associations
User.hasMany(UserRole, { foreignKey: 'userId' });
UserRole.belongsTo(User, { foreignKey: 'userId' });
Role.hasMany(UserRole, { foreignKey: 'roleId' });
UserRole.belongsTo(Role, { foreignKey: 'roleId' });

// RolePermission direct associations
Role.hasMany(RolePermission, { foreignKey: 'roleId' });
RolePermission.belongsTo(Role, { foreignKey: 'roleId' });
Permission.hasMany(RolePermission, { foreignKey: 'permissionId' });
RolePermission.belongsTo(Permission, { foreignKey: 'permissionId' });

// RefreshToken - User
User.hasMany(RefreshToken, { foreignKey: 'userId' });
RefreshToken.belongsTo(User, { foreignKey: 'userId' });

// AuditLog - User (optional)
User.hasMany(AuditLog, { foreignKey: 'userId' });
AuditLog.belongsTo(User, { foreignKey: 'userId' });

// Account self-referencing (parent-child hierarchy)
Account.belongsTo(Account, { as: 'parent', foreignKey: 'parentAccountId' });
Account.hasMany(Account, { as: 'children', foreignKey: 'parentAccountId' });

// Tenant - Account
Tenant.hasMany(Account, { foreignKey: 'tenantId', sourceKey: 'id' });
Account.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// JournalEntry - JournalEntryLine (One-to-Many)
JournalEntry.hasMany(JournalEntryLine, { foreignKey: 'journalEntryId', as: 'lines' });
JournalEntryLine.belongsTo(JournalEntry, { foreignKey: 'journalEntryId' });

// JournalEntry - Account (via JournalEntryLine)
Account.hasMany(JournalEntryLine, { foreignKey: 'accountId' });
JournalEntryLine.belongsTo(Account, { foreignKey: 'accountId', as: 'account' });

// Tenant - JournalEntry
Tenant.hasMany(JournalEntry, { foreignKey: 'tenantId', sourceKey: 'id' });
JournalEntry.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// Tenant - JournalEntryLine
Tenant.hasMany(JournalEntryLine, { foreignKey: 'tenantId', sourceKey: 'id' });
JournalEntryLine.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// JournalEntry - User
User.hasMany(JournalEntry, { foreignKey: 'createdBy' });
JournalEntry.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(JournalEntry, { foreignKey: 'updatedBy' });
JournalEntry.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

// ============================================================
// ItemCategory - Self-referencing (hierarchy)
// ============================================================
ItemCategory.belongsTo(ItemCategory, { as: 'parent', foreignKey: 'parentCategoryId' });
ItemCategory.hasMany(ItemCategory, { as: 'children', foreignKey: 'parentCategoryId' });

// Tenant - ItemCategory
Tenant.hasMany(ItemCategory, { foreignKey: 'tenantId', sourceKey: 'id' });
ItemCategory.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// ============================================================
// Item Associations
// ============================================================

// Tenant - Item
Tenant.hasMany(Item, { foreignKey: 'tenantId', sourceKey: 'id' });
Item.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// ItemCategory - Item
ItemCategory.hasMany(Item, { foreignKey: 'categoryId' });
Item.belongsTo(ItemCategory, { foreignKey: 'categoryId', as: 'category' });

// Item - Account (Income)
Account.hasMany(Item, { foreignKey: 'incomeAccountId' });
Item.belongsTo(Account, { foreignKey: 'incomeAccountId', as: 'incomeAccount' });

// Item - Account (Expense)
Account.hasMany(Item, { foreignKey: 'expenseAccountId' });
Item.belongsTo(Account, { foreignKey: 'expenseAccountId', as: 'expenseAccount' });

// Item - Account (Inventory)
Account.hasMany(Item, { foreignKey: 'inventoryAccountId' });
Item.belongsTo(Account, { foreignKey: 'inventoryAccountId', as: 'inventoryAccount' });

// ============================================================
// Warehouse Associations
// ============================================================

// Tenant - Warehouse
Tenant.hasMany(Warehouse, { foreignKey: 'tenantId', sourceKey: 'id' });
Warehouse.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// ============================================================
// InventoryBalance Associations
// ============================================================

// Tenant - InventoryBalance
Tenant.hasMany(InventoryBalance, { foreignKey: 'tenantId', sourceKey: 'id' });
InventoryBalance.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// Warehouse - InventoryBalance
Warehouse.hasMany(InventoryBalance, { foreignKey: 'warehouseId' });
InventoryBalance.belongsTo(Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });

// Item - InventoryBalance
Item.hasMany(InventoryBalance, { foreignKey: 'itemId' });
InventoryBalance.belongsTo(Item, { foreignKey: 'itemId', as: 'item' });

// ============================================================
// StockAdjustment Associations
// ============================================================

// Tenant - StockAdjustment
Tenant.hasMany(StockAdjustment, { foreignKey: 'tenantId', sourceKey: 'id' });
StockAdjustment.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// Warehouse - StockAdjustment
Warehouse.hasMany(StockAdjustment, { foreignKey: 'warehouseId' });
StockAdjustment.belongsTo(Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });

// StockAdjustment - StockAdjustmentDetail (One-to-Many)
StockAdjustment.hasMany(StockAdjustmentDetail, { foreignKey: 'stockAdjustmentId', as: 'details' });
StockAdjustmentDetail.belongsTo(StockAdjustment, { foreignKey: 'stockAdjustmentId', as: 'adjustment' });

// Tenant - StockAdjustmentDetail
Tenant.hasMany(StockAdjustmentDetail, { foreignKey: 'tenantId', sourceKey: 'id' });
StockAdjustmentDetail.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// Item - StockAdjustmentDetail
Item.hasMany(StockAdjustmentDetail, { foreignKey: 'itemId' });
StockAdjustmentDetail.belongsTo(Item, { foreignKey: 'itemId', as: 'item' });

// StockAdjustment - User (createdBy)
User.hasMany(StockAdjustment, { foreignKey: 'createdBy' });
StockAdjustment.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(StockAdjustment, { foreignKey: 'updatedBy' });
StockAdjustment.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

// ============================================================
// StockTransfer Associations
// ============================================================

// Tenant - StockTransfer
Tenant.hasMany(StockTransfer, { foreignKey: 'tenantId', sourceKey: 'id' });
StockTransfer.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// From Warehouse - StockTransfer
Warehouse.hasMany(StockTransfer, { foreignKey: 'fromWarehouseId' });
StockTransfer.belongsTo(Warehouse, { foreignKey: 'fromWarehouseId', as: 'fromWarehouse' });

// To Warehouse - StockTransfer
Warehouse.hasMany(StockTransfer, { foreignKey: 'toWarehouseId' });
StockTransfer.belongsTo(Warehouse, { foreignKey: 'toWarehouseId', as: 'toWarehouse' });

// StockTransfer - StockTransferDetail (One-to-Many)
StockTransfer.hasMany(StockTransferDetail, { foreignKey: 'stockTransferId', as: 'details' });
StockTransferDetail.belongsTo(StockTransfer, { foreignKey: 'stockTransferId', as: 'transfer' });

// Tenant - StockTransferDetail
Tenant.hasMany(StockTransferDetail, { foreignKey: 'tenantId', sourceKey: 'id' });
StockTransferDetail.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// Item - StockTransferDetail
Item.hasMany(StockTransferDetail, { foreignKey: 'itemId' });
StockTransferDetail.belongsTo(Item, { foreignKey: 'itemId', as: 'item' });

// StockTransfer - User (createdBy)
User.hasMany(StockTransfer, { foreignKey: 'createdBy' });
StockTransfer.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(StockTransfer, { foreignKey: 'updatedBy' });
StockTransfer.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

// ============================================================
// InventoryTransaction Associations
// ============================================================

// Tenant - InventoryTransaction
Tenant.hasMany(InventoryTransaction, { foreignKey: 'tenantId', sourceKey: 'id' });
InventoryTransaction.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// Item - InventoryTransaction
Item.hasMany(InventoryTransaction, { foreignKey: 'itemId' });
InventoryTransaction.belongsTo(Item, { foreignKey: 'itemId', as: 'item' });

// Warehouse - InventoryTransaction
Warehouse.hasMany(InventoryTransaction, { foreignKey: 'warehouseId' });
InventoryTransaction.belongsTo(Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });

// ============================================================
// Customer Associations
// ============================================================

// Tenant - Customer
Tenant.hasMany(Customer, { foreignKey: 'tenantId', sourceKey: 'id' });
Customer.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// Customer - Account (Accounts Receivable)
Account.hasMany(Customer, { foreignKey: 'arAccountId' });
Customer.belongsTo(Account, { foreignKey: 'arAccountId', as: 'arAccount' });

// Customer - User (createdBy)
User.hasMany(Customer, { foreignKey: 'createdBy' });
Customer.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(Customer, { foreignKey: 'updatedBy' });
Customer.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

// ============================================================
// Supplier Associations
// ============================================================

// Tenant - Supplier
Tenant.hasMany(Supplier, { foreignKey: 'tenantId', sourceKey: 'id' });
Supplier.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// Supplier - Account (Accounts Payable)
Account.hasMany(Supplier, { foreignKey: 'apAccountId' });
Supplier.belongsTo(Account, { foreignKey: 'apAccountId', as: 'apAccount' });

// Supplier - User (createdBy)
User.hasMany(Supplier, { foreignKey: 'createdBy' });
Supplier.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(Supplier, { foreignKey: 'updatedBy' });
Supplier.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

// ============================================================
// Quotation Associations
// ============================================================

// Tenant - Quotation
Tenant.hasMany(Quotation, { foreignKey: 'tenantId', sourceKey: 'id' });
Quotation.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// Customer - Quotation
Customer.hasMany(Quotation, { foreignKey: 'customerId' });
Quotation.belongsTo(Customer, { foreignKey: 'customerId' });

// Warehouse - Quotation
Warehouse.hasMany(Quotation, { foreignKey: 'warehouseId' });
Quotation.belongsTo(Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });

// User - Quotation (createdBy)
User.hasMany(Quotation, { foreignKey: 'createdBy' });
Quotation.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(Quotation, { foreignKey: 'updatedBy' });
Quotation.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

// Quotation - QuotationDetail (One-to-Many)
Quotation.hasMany(QuotationDetail, { foreignKey: 'quotationId', as: 'details' });
QuotationDetail.belongsTo(Quotation, { foreignKey: 'quotationId' });

// Item - QuotationDetail
Item.hasMany(QuotationDetail, { foreignKey: 'itemId' });
QuotationDetail.belongsTo(Item, { foreignKey: 'itemId', as: 'item' });

// ============================================================
// Sales Order Associations
// ============================================================

// Tenant - SalesOrder
Tenant.hasMany(SalesOrder, { foreignKey: 'tenantId', sourceKey: 'id' });
SalesOrder.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// Customer - SalesOrder
Customer.hasMany(SalesOrder, { foreignKey: 'customerId' });
SalesOrder.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

// Quotation - SalesOrder
Quotation.hasMany(SalesOrder, { foreignKey: 'quotationId' });
SalesOrder.belongsTo(Quotation, { foreignKey: 'quotationId', as: 'quotation' });

// Warehouse - SalesOrder
Warehouse.hasMany(SalesOrder, { foreignKey: 'warehouseId' });
SalesOrder.belongsTo(Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });

// SalesOrder - SalesOrderDetail (One-to-Many)
SalesOrder.hasMany(SalesOrderDetail, { foreignKey: 'salesOrderId', as: 'details' });
SalesOrderDetail.belongsTo(SalesOrder, { foreignKey: 'salesOrderId', as: 'salesOrder' });

// Item - SalesOrderDetail
Item.hasMany(SalesOrderDetail, { foreignKey: 'itemId' });
SalesOrderDetail.belongsTo(Item, { foreignKey: 'itemId', as: 'item' });

// User - SalesOrder (createdBy/updatedBy)
User.hasMany(SalesOrder, { foreignKey: 'createdBy' });
SalesOrder.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(SalesOrder, { foreignKey: 'updatedBy' });
SalesOrder.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

// ============================================================
// Delivery Note Associations
// ============================================================

// Tenant - DeliveryNote
Tenant.hasMany(DeliveryNote, { foreignKey: 'tenantId', sourceKey: 'id' });
DeliveryNote.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// Customer - DeliveryNote
Customer.hasMany(DeliveryNote, { foreignKey: 'customerId' });
DeliveryNote.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

// SalesOrder - DeliveryNote
SalesOrder.hasMany(DeliveryNote, { foreignKey: 'salesOrderId' });
DeliveryNote.belongsTo(SalesOrder, { foreignKey: 'salesOrderId', as: 'salesOrder' });

// Warehouse - DeliveryNote
Warehouse.hasMany(DeliveryNote, { foreignKey: 'warehouseId' });
DeliveryNote.belongsTo(Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });

// DeliveryNote - DeliveryNoteDetail (One-to-Many)
DeliveryNote.hasMany(DeliveryNoteDetail, { foreignKey: 'deliveryNoteId', as: 'details' });
DeliveryNoteDetail.belongsTo(DeliveryNote, { foreignKey: 'deliveryNoteId', as: 'deliveryNote' });

// Item - DeliveryNoteDetail
Item.hasMany(DeliveryNoteDetail, { foreignKey: 'itemId' });
DeliveryNoteDetail.belongsTo(Item, { foreignKey: 'itemId', as: 'item' });

// SalesOrderDetail - DeliveryNoteDetail
SalesOrderDetail.hasMany(DeliveryNoteDetail, { foreignKey: 'salesOrderDetailId' });
DeliveryNoteDetail.belongsTo(SalesOrderDetail, { foreignKey: 'salesOrderDetailId', as: 'salesOrderDetail' });

// User - DeliveryNote (createdBy/updatedBy)
User.hasMany(DeliveryNote, { foreignKey: 'createdBy' });
DeliveryNote.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(DeliveryNote, { foreignKey: 'updatedBy' });
DeliveryNote.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

// ============================================================
// Sales Invoice Associations
// ============================================================

// Tenant - SalesInvoice
Tenant.hasMany(SalesInvoice, { foreignKey: 'tenantId', sourceKey: 'id' });
SalesInvoice.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// Customer - SalesInvoice
Customer.hasMany(SalesInvoice, { foreignKey: 'customerId' });
SalesInvoice.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

// SalesOrder - SalesInvoice
SalesOrder.hasMany(SalesInvoice, { foreignKey: 'salesOrderId' });
SalesInvoice.belongsTo(SalesOrder, { foreignKey: 'salesOrderId', as: 'salesOrder' });

// DeliveryNote - SalesInvoice
DeliveryNote.hasMany(SalesInvoice, { foreignKey: 'deliveryNoteId' });
SalesInvoice.belongsTo(DeliveryNote, { foreignKey: 'deliveryNoteId', as: 'deliveryNote' });

// Warehouse - SalesInvoice
Warehouse.hasMany(SalesInvoice, { foreignKey: 'warehouseId' });
SalesInvoice.belongsTo(Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });

// JournalEntry - SalesInvoice
JournalEntry.hasMany(SalesInvoice, { foreignKey: 'journalEntryId' });
SalesInvoice.belongsTo(JournalEntry, { foreignKey: 'journalEntryId', as: 'journalEntry' });

// Account - SalesInvoice (Accounting Integration)
Account.hasMany(SalesInvoice, { foreignKey: 'customerAccountId' });
SalesInvoice.belongsTo(Account, { foreignKey: 'customerAccountId', as: 'customerAccount' });
Account.hasMany(SalesInvoice, { foreignKey: 'revenueAccountId' });
SalesInvoice.belongsTo(Account, { foreignKey: 'revenueAccountId', as: 'revenueAccount' });
Account.hasMany(SalesInvoice, { foreignKey: 'taxAccountId' });
SalesInvoice.belongsTo(Account, { foreignKey: 'taxAccountId', as: 'taxAccount' });

// Account - SalesReturn (Accounting Integration)
Account.hasMany(SalesReturn, { foreignKey: 'customerAccountId' });
SalesReturn.belongsTo(Account, { foreignKey: 'customerAccountId', as: 'customerAccount' });
Account.hasMany(SalesReturn, { foreignKey: 'revenueAccountId' });
SalesReturn.belongsTo(Account, { foreignKey: 'revenueAccountId', as: 'revenueAccount' });
Account.hasMany(SalesReturn, { foreignKey: 'taxAccountId' });
SalesReturn.belongsTo(Account, { foreignKey: 'taxAccountId', as: 'taxAccount' });

// SalesInvoice - SalesInvoiceDetail (One-to-Many)
SalesInvoice.hasMany(SalesInvoiceDetail, { foreignKey: 'salesInvoiceId', as: 'details' });
SalesInvoiceDetail.belongsTo(SalesInvoice, { foreignKey: 'salesInvoiceId', as: 'invoice' });

// Item - SalesInvoiceDetail
Item.hasMany(SalesInvoiceDetail, { foreignKey: 'itemId' });
SalesInvoiceDetail.belongsTo(Item, { foreignKey: 'itemId', as: 'item' });

// User - SalesInvoice (createdBy/updatedBy)
User.hasMany(SalesInvoice, { foreignKey: 'createdBy' });
SalesInvoice.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(SalesInvoice, { foreignKey: 'updatedBy' });
SalesInvoice.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

// ============================================================
// Sales Return Associations
// ============================================================

// Tenant - SalesReturn
Tenant.hasMany(SalesReturn, { foreignKey: 'tenantId', sourceKey: 'id' });
SalesReturn.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// Customer - SalesReturn
Customer.hasMany(SalesReturn, { foreignKey: 'customerId' });
SalesReturn.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

// SalesInvoice - SalesReturn
SalesInvoice.hasMany(SalesReturn, { foreignKey: 'salesInvoiceId' });
SalesReturn.belongsTo(SalesInvoice, { foreignKey: 'salesInvoiceId', as: 'salesInvoice' });

// Warehouse - SalesReturn
Warehouse.hasMany(SalesReturn, { foreignKey: 'warehouseId' });
SalesReturn.belongsTo(Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });

// JournalEntry - SalesReturn
JournalEntry.hasMany(SalesReturn, { foreignKey: 'journalEntryId' });
SalesReturn.belongsTo(JournalEntry, { foreignKey: 'journalEntryId', as: 'journalEntry' });

// SalesReturn - SalesReturnDetail (One-to-Many)
SalesReturn.hasMany(SalesReturnDetail, { foreignKey: 'salesReturnId', as: 'details' });
SalesReturnDetail.belongsTo(SalesReturn, { foreignKey: 'salesReturnId', as: 'salesReturn' });

// Item - SalesReturnDetail
Item.hasMany(SalesReturnDetail, { foreignKey: 'itemId' });
SalesReturnDetail.belongsTo(Item, { foreignKey: 'itemId', as: 'item' });

// SalesInvoiceDetail - SalesReturnDetail
SalesInvoiceDetail.hasMany(SalesReturnDetail, { foreignKey: 'salesInvoiceDetailId' });
SalesReturnDetail.belongsTo(SalesInvoiceDetail, { foreignKey: 'salesInvoiceDetailId', as: 'invoiceDetail' });

// User - SalesReturn (createdBy/updatedBy)
User.hasMany(SalesReturn, { foreignKey: 'createdBy' });
SalesReturn.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(SalesReturn, { foreignKey: 'updatedBy' });
SalesReturn.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

// ============================================================
// Credit Note Associations
// ============================================================

// Tenant - CreditNote
Tenant.hasMany(CreditNote, { foreignKey: 'tenantId', sourceKey: 'id' });
CreditNote.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// Customer - CreditNote
Customer.hasMany(CreditNote, { foreignKey: 'customerId' });
CreditNote.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

// SalesReturn - CreditNote
SalesReturn.hasMany(CreditNote, { foreignKey: 'salesReturnId' });
CreditNote.belongsTo(SalesReturn, { foreignKey: 'salesReturnId', as: 'salesReturn' });

// SalesInvoice - CreditNote
SalesInvoice.hasMany(CreditNote, { foreignKey: 'salesInvoiceId' });
CreditNote.belongsTo(SalesInvoice, { foreignKey: 'salesInvoiceId', as: 'salesInvoice' });

// Warehouse - CreditNote
Warehouse.hasMany(CreditNote, { foreignKey: 'warehouseId' });
CreditNote.belongsTo(Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });

// JournalEntry - CreditNote
JournalEntry.hasMany(CreditNote, { foreignKey: 'journalEntryId' });
CreditNote.belongsTo(JournalEntry, { foreignKey: 'journalEntryId', as: 'journalEntry' });

// CreditNote - CreditNoteDetail (One-to-Many)
CreditNote.hasMany(CreditNoteDetail, { foreignKey: 'creditNoteId', as: 'details' });
CreditNoteDetail.belongsTo(CreditNote, { foreignKey: 'creditNoteId', as: 'creditNote' });

// Item - CreditNoteDetail
Item.hasMany(CreditNoteDetail, { foreignKey: 'itemId' });
CreditNoteDetail.belongsTo(Item, { foreignKey: 'itemId', as: 'item' });

// SalesReturnDetail - CreditNoteDetail
SalesReturnDetail.hasMany(CreditNoteDetail, { foreignKey: 'salesReturnDetailId' });
CreditNoteDetail.belongsTo(SalesReturnDetail, { foreignKey: 'salesReturnDetailId', as: 'salesReturnDetail' });

// User - CreditNote (createdBy/updatedBy)
User.hasMany(CreditNote, { foreignKey: 'createdBy' });
CreditNote.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(CreditNote, { foreignKey: 'updatedBy' });
CreditNote.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

// ============================================================
// Customer Payment Associations
// ============================================================

// Tenant - CustomerPayment
Tenant.hasMany(CustomerPayment, { foreignKey: 'tenantId', sourceKey: 'id' });
CustomerPayment.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// Customer - CustomerPayment
Customer.hasMany(CustomerPayment, { foreignKey: 'customerId' });
CustomerPayment.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

// Account - CustomerPayment (bank/cash account)
Account.hasMany(CustomerPayment, { foreignKey: 'bankAccountId' });
CustomerPayment.belongsTo(Account, { foreignKey: 'bankAccountId', as: 'bankAccount' });
Account.hasMany(CustomerPayment, { foreignKey: 'paymentAccountId' });
CustomerPayment.belongsTo(Account, { foreignKey: 'paymentAccountId', as: 'paymentAccount' });
Account.hasMany(CustomerPayment, { foreignKey: 'customerAccountId' });
CustomerPayment.belongsTo(Account, { foreignKey: 'customerAccountId', as: 'customerAccount' });

// JournalEntry - CustomerPayment
JournalEntry.hasMany(CustomerPayment, { foreignKey: 'journalEntryId' });
CustomerPayment.belongsTo(JournalEntry, { foreignKey: 'journalEntryId', as: 'journalEntry' });

// CustomerPayment - CustomerPaymentAllocation (One-to-Many)
CustomerPayment.hasMany(CustomerPaymentAllocation, { foreignKey: 'customerPaymentId', as: 'allocations' });
CustomerPaymentAllocation.belongsTo(CustomerPayment, { foreignKey: 'customerPaymentId', as: 'payment' });

// SalesInvoice - CustomerPaymentAllocation
SalesInvoice.hasMany(CustomerPaymentAllocation, { foreignKey: 'salesInvoiceId' });
CustomerPaymentAllocation.belongsTo(SalesInvoice, { foreignKey: 'salesInvoiceId', as: 'invoice' });

// User - CustomerPayment (createdBy/updatedBy)
User.hasMany(CustomerPayment, { foreignKey: 'createdBy' });
CustomerPayment.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(CustomerPayment, { foreignKey: 'updatedBy' });
CustomerPayment.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

// ============================================================
// Purchase Request Associations
// ============================================================

// Tenant - PurchaseRequest
Tenant.hasMany(PurchaseRequest, { foreignKey: 'tenantId', sourceKey: 'id' });
PurchaseRequest.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// User - PurchaseRequest (requestedBy/createdBy/updatedBy)
User.hasMany(PurchaseRequest, { foreignKey: 'requestedBy' });
PurchaseRequest.belongsTo(User, { foreignKey: 'requestedBy', as: 'requestor' });
User.hasMany(PurchaseRequest, { foreignKey: 'createdBy' });
PurchaseRequest.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(PurchaseRequest, { foreignKey: 'updatedBy' });
PurchaseRequest.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

// PurchaseRequest - PurchaseRequestDetail (One-to-Many)
PurchaseRequest.hasMany(PurchaseRequestDetail, { foreignKey: 'purchaseRequestId', as: 'details' });
PurchaseRequestDetail.belongsTo(PurchaseRequest, { foreignKey: 'purchaseRequestId' });

// Item - PurchaseRequestDetail
Item.hasMany(PurchaseRequestDetail, { foreignKey: 'itemId' });
PurchaseRequestDetail.belongsTo(Item, { foreignKey: 'itemId', as: 'item' });

// ============================================================
// Purchase Order Associations
// ============================================================

// Tenant - PurchaseOrder
Tenant.hasMany(PurchaseOrder, { foreignKey: 'tenantId', sourceKey: 'id' });
PurchaseOrder.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// Supplier - PurchaseOrder
Supplier.hasMany(PurchaseOrder, { foreignKey: 'supplierId' });
PurchaseOrder.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });

// Warehouse - PurchaseOrder
Warehouse.hasMany(PurchaseOrder, { foreignKey: 'warehouseId' });
PurchaseOrder.belongsTo(Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });

// PurchaseRequest - PurchaseOrder
PurchaseRequest.hasMany(PurchaseOrder, { foreignKey: 'purchaseRequestId' });
PurchaseOrder.belongsTo(PurchaseRequest, { foreignKey: 'purchaseRequestId', as: 'purchaseRequest' });

// PurchaseOrder - PurchaseOrderDetail (One-to-Many)
PurchaseOrder.hasMany(PurchaseOrderDetail, { foreignKey: 'purchaseOrderId', as: 'details' });
PurchaseOrderDetail.belongsTo(PurchaseOrder, { foreignKey: 'purchaseOrderId', as: 'purchaseOrder' });

// Item - PurchaseOrderDetail
Item.hasMany(PurchaseOrderDetail, { foreignKey: 'itemId' });
PurchaseOrderDetail.belongsTo(Item, { foreignKey: 'itemId', as: 'item' });

// User - PurchaseOrder (createdBy/updatedBy)
User.hasMany(PurchaseOrder, { foreignKey: 'createdBy' });
PurchaseOrder.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(PurchaseOrder, { foreignKey: 'updatedBy' });
PurchaseOrder.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

// ============================================================
// Goods Receipt Associations
// ============================================================

// Tenant - GoodsReceipt
Tenant.hasMany(GoodsReceipt, { foreignKey: 'tenantId', sourceKey: 'id' });
GoodsReceipt.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// Supplier - GoodsReceipt
Supplier.hasMany(GoodsReceipt, { foreignKey: 'supplierId' });
GoodsReceipt.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });

// PurchaseOrder - GoodsReceipt
PurchaseOrder.hasMany(GoodsReceipt, { foreignKey: 'purchaseOrderId' });
GoodsReceipt.belongsTo(PurchaseOrder, { foreignKey: 'purchaseOrderId', as: 'purchaseOrder' });

// Warehouse - GoodsReceipt
Warehouse.hasMany(GoodsReceipt, { foreignKey: 'warehouseId' });
GoodsReceipt.belongsTo(Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });

// GoodsReceipt - GoodsReceiptDetail (One-to-Many)
GoodsReceipt.hasMany(GoodsReceiptDetail, { foreignKey: 'goodsReceiptId', as: 'details' });
GoodsReceiptDetail.belongsTo(GoodsReceipt, { foreignKey: 'goodsReceiptId', as: 'goodsReceipt' });

// Item - GoodsReceiptDetail
Item.hasMany(GoodsReceiptDetail, { foreignKey: 'itemId' });
GoodsReceiptDetail.belongsTo(Item, { foreignKey: 'itemId', as: 'item' });

// PurchaseOrderDetail - GoodsReceiptDetail
PurchaseOrderDetail.hasMany(GoodsReceiptDetail, { foreignKey: 'purchaseOrderDetailId' });
GoodsReceiptDetail.belongsTo(PurchaseOrderDetail, { foreignKey: 'purchaseOrderDetailId', as: 'purchaseOrderDetail' });

// User - GoodsReceipt (createdBy/updatedBy)
User.hasMany(GoodsReceipt, { foreignKey: 'createdBy' });
GoodsReceipt.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(GoodsReceipt, { foreignKey: 'updatedBy' });
GoodsReceipt.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

// ============================================================
// Purchase Invoice Associations
// ============================================================

// Tenant - PurchaseInvoice
Tenant.hasMany(PurchaseInvoice, { foreignKey: 'tenantId', sourceKey: 'id' });
PurchaseInvoice.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// Supplier - PurchaseInvoice
Supplier.hasMany(PurchaseInvoice, { foreignKey: 'supplierId' });
PurchaseInvoice.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });

// PurchaseOrder - PurchaseInvoice
PurchaseOrder.hasMany(PurchaseInvoice, { foreignKey: 'purchaseOrderId' });
PurchaseInvoice.belongsTo(PurchaseOrder, { foreignKey: 'purchaseOrderId', as: 'purchaseOrder' });

// GoodsReceipt - PurchaseInvoice
GoodsReceipt.hasMany(PurchaseInvoice, { foreignKey: 'goodsReceiptId' });
PurchaseInvoice.belongsTo(GoodsReceipt, { foreignKey: 'goodsReceiptId', as: 'goodsReceipt' });

// Warehouse - PurchaseInvoice
Warehouse.hasMany(PurchaseInvoice, { foreignKey: 'warehouseId' });
PurchaseInvoice.belongsTo(Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });

// JournalEntry - PurchaseInvoice
JournalEntry.hasMany(PurchaseInvoice, { foreignKey: 'journalEntryId' });
PurchaseInvoice.belongsTo(JournalEntry, { foreignKey: 'journalEntryId', as: 'journalEntry' });

// PurchaseInvoice - PurchaseInvoiceDetail (One-to-Many)
PurchaseInvoice.hasMany(PurchaseInvoiceDetail, { foreignKey: 'purchaseInvoiceId', as: 'details' });
PurchaseInvoiceDetail.belongsTo(PurchaseInvoice, { foreignKey: 'purchaseInvoiceId', as: 'invoice' });

// Item - PurchaseInvoiceDetail
Item.hasMany(PurchaseInvoiceDetail, { foreignKey: 'itemId' });
PurchaseInvoiceDetail.belongsTo(Item, { foreignKey: 'itemId', as: 'item' });

// User - PurchaseInvoice (createdBy/updatedBy)
User.hasMany(PurchaseInvoice, { foreignKey: 'createdBy' });
PurchaseInvoice.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(PurchaseInvoice, { foreignKey: 'updatedBy' });
PurchaseInvoice.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

// ============================================================
// Purchase Return Associations
// ============================================================

// Tenant - PurchaseReturn
Tenant.hasMany(PurchaseReturn, { foreignKey: 'tenantId', sourceKey: 'id' });
PurchaseReturn.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// Supplier - PurchaseReturn
Supplier.hasMany(PurchaseReturn, { foreignKey: 'supplierId' });
PurchaseReturn.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });

// PurchaseInvoice - PurchaseReturn
PurchaseInvoice.hasMany(PurchaseReturn, { foreignKey: 'purchaseInvoiceId' });
PurchaseReturn.belongsTo(PurchaseInvoice, { foreignKey: 'purchaseInvoiceId', as: 'purchaseInvoice' });

// GoodsReceipt - PurchaseReturn
GoodsReceipt.hasMany(PurchaseReturn, { foreignKey: 'goodsReceiptId' });
PurchaseReturn.belongsTo(GoodsReceipt, { foreignKey: 'goodsReceiptId', as: 'goodsReceipt' });

// Warehouse - PurchaseReturn
Warehouse.hasMany(PurchaseReturn, { foreignKey: 'warehouseId' });
PurchaseReturn.belongsTo(Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });

// JournalEntry - PurchaseReturn
JournalEntry.hasMany(PurchaseReturn, { foreignKey: 'journalEntryId' });
PurchaseReturn.belongsTo(JournalEntry, { foreignKey: 'journalEntryId', as: 'journalEntry' });

// PurchaseReturn - PurchaseReturnDetail (One-to-Many)
PurchaseReturn.hasMany(PurchaseReturnDetail, { foreignKey: 'purchaseReturnId', as: 'details' });
PurchaseReturnDetail.belongsTo(PurchaseReturn, { foreignKey: 'purchaseReturnId', as: 'purchaseReturn' });

// Item - PurchaseReturnDetail
Item.hasMany(PurchaseReturnDetail, { foreignKey: 'itemId' });
PurchaseReturnDetail.belongsTo(Item, { foreignKey: 'itemId', as: 'item' });

// User - PurchaseReturn (createdBy/updatedBy)
User.hasMany(PurchaseReturn, { foreignKey: 'createdBy' });
PurchaseReturn.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(PurchaseReturn, { foreignKey: 'updatedBy' });
PurchaseReturn.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

// ============================================================
// Debit Note Associations
// ============================================================

// Tenant - DebitNote
Tenant.hasMany(DebitNote, { foreignKey: 'tenantId', sourceKey: 'id' });
DebitNote.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// Supplier - DebitNote
Supplier.hasMany(DebitNote, { foreignKey: 'supplierId' });
DebitNote.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });

// PurchaseReturn - DebitNote
PurchaseReturn.hasMany(DebitNote, { foreignKey: 'purchaseReturnId' });
DebitNote.belongsTo(PurchaseReturn, { foreignKey: 'purchaseReturnId', as: 'purchaseReturn' });

// JournalEntry - DebitNote
JournalEntry.hasMany(DebitNote, { foreignKey: 'journalEntryId' });
DebitNote.belongsTo(JournalEntry, { foreignKey: 'journalEntryId', as: 'journalEntry' });

// User - DebitNote (createdBy/updatedBy)
User.hasMany(DebitNote, { foreignKey: 'createdBy' });
DebitNote.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(DebitNote, { foreignKey: 'updatedBy' });
DebitNote.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

// ============================================================
// Supplier Payment Associations
// ============================================================

// Tenant - SupplierPayment
Tenant.hasMany(SupplierPayment, { foreignKey: 'tenantId', sourceKey: 'id' });
SupplierPayment.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// Supplier - SupplierPayment
Supplier.hasMany(SupplierPayment, { foreignKey: 'supplierId' });
SupplierPayment.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });

// Account - SupplierPayment (bank/cash account)
Account.hasMany(SupplierPayment, { foreignKey: 'bankAccountId' });
SupplierPayment.belongsTo(Account, { foreignKey: 'bankAccountId', as: 'bankAccount' });

// JournalEntry - SupplierPayment
JournalEntry.hasMany(SupplierPayment, { foreignKey: 'journalEntryId' });
SupplierPayment.belongsTo(JournalEntry, { foreignKey: 'journalEntryId', as: 'journalEntry' });

// SupplierPayment - SupplierPaymentAllocation (One-to-Many)
SupplierPayment.hasMany(SupplierPaymentAllocation, { foreignKey: 'supplierPaymentId', as: 'allocations' });
SupplierPaymentAllocation.belongsTo(SupplierPayment, { foreignKey: 'supplierPaymentId', as: 'payment' });

// PurchaseInvoice - SupplierPaymentAllocation
PurchaseInvoice.hasMany(SupplierPaymentAllocation, { foreignKey: 'purchaseInvoiceId' });
SupplierPaymentAllocation.belongsTo(PurchaseInvoice, { foreignKey: 'purchaseInvoiceId', as: 'invoice' });

// User - SupplierPayment (createdBy/updatedBy/approvedBy)
User.hasMany(SupplierPayment, { foreignKey: 'createdBy' });
SupplierPayment.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(SupplierPayment, { foreignKey: 'updatedBy' });
SupplierPayment.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });
User.hasMany(SupplierPayment, { foreignKey: 'approvedBy' });
SupplierPayment.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });

// ============================================================
// BankAccount Associations
// ============================================================

// Tenant - BankAccount
Tenant.hasMany(BankAccount, { foreignKey: 'tenantId', sourceKey: 'id' });
BankAccount.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// Account - BankAccount (Chart of Accounts link)
Account.hasMany(BankAccount, { foreignKey: 'chartOfAccountId' });
BankAccount.belongsTo(Account, { foreignKey: 'chartOfAccountId', as: 'chartOfAccount' });

// User - BankAccount (createdBy/updatedBy)
User.hasMany(BankAccount, { foreignKey: 'createdBy' });
BankAccount.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(BankAccount, { foreignKey: 'updatedBy' });
BankAccount.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

// ============================================================
// BankTransaction Associations
// ============================================================

// Tenant - BankTransaction
Tenant.hasMany(BankTransaction, { foreignKey: 'tenantId', sourceKey: 'id' });
BankTransaction.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// BankAccount - BankTransaction
BankAccount.hasMany(BankTransaction, { foreignKey: 'bankAccountId' });
BankTransaction.belongsTo(BankAccount, { foreignKey: 'bankAccountId', as: 'bankAccount' });

// Account - BankTransaction (offset account)
Account.hasMany(BankTransaction, { foreignKey: 'offsetAccountId' });
BankTransaction.belongsTo(Account, { foreignKey: 'offsetAccountId', as: 'offsetAccount' });

// JournalEntry - BankTransaction
JournalEntry.hasMany(BankTransaction, { foreignKey: 'journalEntryId' });
BankTransaction.belongsTo(JournalEntry, { foreignKey: 'journalEntryId', as: 'journalEntry' });

// User - BankTransaction (createdBy/updatedBy/reconciledBy)
User.hasMany(BankTransaction, { foreignKey: 'createdBy' });
BankTransaction.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(BankTransaction, { foreignKey: 'updatedBy' });
BankTransaction.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });
User.hasMany(BankTransaction, { foreignKey: 'reconciledBy' });
BankTransaction.belongsTo(User, { foreignKey: 'reconciledBy', as: 'reconciler' });

// ============================================================
// PaymentReceipt Associations
// ============================================================

// Tenant - PaymentReceipt
Tenant.hasMany(PaymentReceipt, { foreignKey: 'tenantId', sourceKey: 'id' });
PaymentReceipt.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// BankAccount - PaymentReceipt
BankAccount.hasMany(PaymentReceipt, { foreignKey: 'bankAccountId' });
PaymentReceipt.belongsTo(BankAccount, { foreignKey: 'bankAccountId', as: 'bankAccount' });

// Customer - PaymentReceipt
Customer.hasMany(PaymentReceipt, { foreignKey: 'customerId' });
PaymentReceipt.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

// JournalEntry - PaymentReceipt
JournalEntry.hasMany(PaymentReceipt, { foreignKey: 'journalEntryId' });
PaymentReceipt.belongsTo(JournalEntry, { foreignKey: 'journalEntryId', as: 'journalEntry' });

// PaymentReceipt - PaymentReceiptAllocation (One-to-Many)
PaymentReceipt.hasMany(PaymentReceiptAllocation, { foreignKey: 'paymentReceiptId', as: 'allocations' });
PaymentReceiptAllocation.belongsTo(PaymentReceipt, { foreignKey: 'paymentReceiptId', as: 'receipt' });

// SalesInvoice - PaymentReceiptAllocation
SalesInvoice.hasMany(PaymentReceiptAllocation, { foreignKey: 'salesInvoiceId' });
PaymentReceiptAllocation.belongsTo(SalesInvoice, { foreignKey: 'salesInvoiceId', as: 'invoice' });

// Tenant - PaymentReceiptAllocation
Tenant.hasMany(PaymentReceiptAllocation, { foreignKey: 'tenantId', sourceKey: 'id' });
PaymentReceiptAllocation.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// User - PaymentReceipt (createdBy/updatedBy)
User.hasMany(PaymentReceipt, { foreignKey: 'createdBy' });
PaymentReceipt.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(PaymentReceipt, { foreignKey: 'updatedBy' });
PaymentReceipt.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

// ============================================================
// PaymentVoucher Associations
// ============================================================

// Tenant - PaymentVoucher
Tenant.hasMany(PaymentVoucher, { foreignKey: 'tenantId', sourceKey: 'id' });
PaymentVoucher.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// BankAccount - PaymentVoucher
BankAccount.hasMany(PaymentVoucher, { foreignKey: 'bankAccountId' });
PaymentVoucher.belongsTo(BankAccount, { foreignKey: 'bankAccountId', as: 'bankAccount' });

// Supplier - PaymentVoucher
Supplier.hasMany(PaymentVoucher, { foreignKey: 'supplierId' });
PaymentVoucher.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });

// JournalEntry - PaymentVoucher
JournalEntry.hasMany(PaymentVoucher, { foreignKey: 'journalEntryId' });
PaymentVoucher.belongsTo(JournalEntry, { foreignKey: 'journalEntryId', as: 'journalEntry' });

// PaymentVoucher - PaymentVoucherAllocation (One-to-Many)
PaymentVoucher.hasMany(PaymentVoucherAllocation, { foreignKey: 'paymentVoucherId', as: 'allocations' });
PaymentVoucherAllocation.belongsTo(PaymentVoucher, { foreignKey: 'paymentVoucherId', as: 'voucher' });

// PurchaseInvoice - PaymentVoucherAllocation
PurchaseInvoice.hasMany(PaymentVoucherAllocation, { foreignKey: 'purchaseInvoiceId' });
PaymentVoucherAllocation.belongsTo(PurchaseInvoice, { foreignKey: 'purchaseInvoiceId', as: 'invoice' });

// Tenant - PaymentVoucherAllocation
Tenant.hasMany(PaymentVoucherAllocation, { foreignKey: 'tenantId', sourceKey: 'id' });
PaymentVoucherAllocation.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// PaymentVoucher - PaymentVoucherLine (One-to-Many)
PaymentVoucher.hasMany(PaymentVoucherLine, { foreignKey: 'paymentVoucherId', as: 'lines' });
PaymentVoucherLine.belongsTo(PaymentVoucher, { foreignKey: 'paymentVoucherId', as: 'voucher' });

// Account - PaymentVoucherLine
Account.hasMany(PaymentVoucherLine, { foreignKey: 'accountId' });
PaymentVoucherLine.belongsTo(Account, { foreignKey: 'accountId', as: 'account' });

// Account - PaymentVoucherLine (tax)
Account.hasMany(PaymentVoucherLine, { foreignKey: 'taxAccountId' });
PaymentVoucherLine.belongsTo(Account, { foreignKey: 'taxAccountId', as: 'taxAccount' });

// Tenant - PaymentVoucherLine
Tenant.hasMany(PaymentVoucherLine, { foreignKey: 'tenantId', sourceKey: 'id' });
PaymentVoucherLine.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// User - PaymentVoucher (createdBy/updatedBy)
User.hasMany(PaymentVoucher, { foreignKey: 'createdBy' });
PaymentVoucher.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(PaymentVoucher, { foreignKey: 'updatedBy' });
PaymentVoucher.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

// ============================================================
// BankReconciliation Associations
// ============================================================

// Tenant - BankReconciliation
Tenant.hasMany(BankReconciliation, { foreignKey: 'tenantId', sourceKey: 'id' });
BankReconciliation.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// BankAccount - BankReconciliation
BankAccount.hasMany(BankReconciliation, { foreignKey: 'bankAccountId' });
BankReconciliation.belongsTo(BankAccount, { foreignKey: 'bankAccountId', as: 'bankAccount' });

// BankReconciliation - BankReconciliationLine (One-to-Many)
BankReconciliation.hasMany(BankReconciliationLine, { foreignKey: 'bankReconciliationId', as: 'lines' });
BankReconciliationLine.belongsTo(BankReconciliation, { foreignKey: 'bankReconciliationId', as: 'reconciliation' });

// BankTransaction - BankReconciliationLine
BankTransaction.hasMany(BankReconciliationLine, { foreignKey: 'bankTransactionId' });
BankReconciliationLine.belongsTo(BankTransaction, { foreignKey: 'bankTransactionId', as: 'bankTransaction' });

// Tenant - BankReconciliationLine
Tenant.hasMany(BankReconciliationLine, { foreignKey: 'tenantId', sourceKey: 'id' });
BankReconciliationLine.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// User - BankReconciliation (createdBy/updatedBy/reconciledBy)
User.hasMany(BankReconciliation, { foreignKey: 'createdBy' });
BankReconciliation.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(BankReconciliation, { foreignKey: 'updatedBy' });
BankReconciliation.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });
User.hasMany(BankReconciliation, { foreignKey: 'reconciledBy' });
BankReconciliation.belongsTo(User, { foreignKey: 'reconciledBy', as: 'reconciler' });

// ============================================================
// AssetCategory Associations
// ============================================================

// Tenant - AssetCategory
Tenant.hasMany(AssetCategory, { foreignKey: 'tenantId', sourceKey: 'id' });
AssetCategory.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// Account - AssetCategory (Default Asset Account)
Account.hasMany(AssetCategory, { foreignKey: 'defaultAssetAccountId' });
AssetCategory.belongsTo(Account, { foreignKey: 'defaultAssetAccountId', as: 'defaultAssetAccount' });

// Account - AssetCategory (Accumulated Depreciation Account)
Account.hasMany(AssetCategory, { foreignKey: 'accumulatedDepreciationAccountId' });
AssetCategory.belongsTo(Account, { foreignKey: 'accumulatedDepreciationAccountId', as: 'accumulatedDepreciationAccount' });

// Account - AssetCategory (Depreciation Expense Account)
Account.hasMany(AssetCategory, { foreignKey: 'depreciationExpenseAccountId' });
AssetCategory.belongsTo(Account, { foreignKey: 'depreciationExpenseAccountId', as: 'depreciationExpenseAccount' });

// Account - AssetCategory (Gain on Disposal Account)
Account.hasMany(AssetCategory, { foreignKey: 'gainOnDisposalAccountId' });
AssetCategory.belongsTo(Account, { foreignKey: 'gainOnDisposalAccountId', as: 'gainOnDisposalAccount' });

// Account - AssetCategory (Loss on Disposal Account)
Account.hasMany(AssetCategory, { foreignKey: 'lossOnDisposalAccountId' });
AssetCategory.belongsTo(Account, { foreignKey: 'lossOnDisposalAccountId', as: 'lossOnDisposalAccount' });

// Account - AssetCategory (Default Tax Account)
Account.hasMany(AssetCategory, { foreignKey: 'defaultTaxAccountId' });
AssetCategory.belongsTo(Account, { foreignKey: 'defaultTaxAccountId', as: 'defaultTaxAccount' });

// ============================================================
// Asset Associations
// ============================================================

// Tenant - Asset
Tenant.hasMany(Asset, { foreignKey: 'tenantId', sourceKey: 'id' });
Asset.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// AssetCategory - Asset
AssetCategory.hasMany(Asset, { foreignKey: 'categoryId' });
Asset.belongsTo(AssetCategory, { foreignKey: 'categoryId', as: 'category' });

// Supplier - Asset
Supplier.hasMany(Asset, { foreignKey: 'supplierId' });
Asset.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });

// PurchaseInvoice - Asset
PurchaseInvoice.hasMany(Asset, { foreignKey: 'purchaseInvoiceId' });
Asset.belongsTo(PurchaseInvoice, { foreignKey: 'purchaseInvoiceId', as: 'purchaseInvoice' });

// User - Asset (createdBy/updatedBy)
User.hasMany(Asset, { foreignKey: 'createdBy' });
Asset.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(Asset, { foreignKey: 'updatedBy' });
Asset.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

// ============================================================
// AssetAcquisition Associations
// ============================================================

// Tenant - AssetAcquisition
Tenant.hasMany(AssetAcquisition, { foreignKey: 'tenantId', sourceKey: 'id' });
AssetAcquisition.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// Supplier - AssetAcquisition
Supplier.hasMany(AssetAcquisition, { foreignKey: 'supplierId' });
AssetAcquisition.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });

// AssetAcquisition - AssetAcquisitionLine (One-to-Many)
AssetAcquisition.hasMany(AssetAcquisitionLine, { foreignKey: 'acquisitionId', as: 'lines' });
AssetAcquisitionLine.belongsTo(AssetAcquisition, { foreignKey: 'acquisitionId' });

// Tenant - AssetAcquisitionLine
Tenant.hasMany(AssetAcquisitionLine, { foreignKey: 'tenantId', sourceKey: 'id' });
AssetAcquisitionLine.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// AssetCategory - AssetAcquisitionLine
AssetCategory.hasMany(AssetAcquisitionLine, { foreignKey: 'categoryId' });
AssetAcquisitionLine.belongsTo(AssetCategory, { foreignKey: 'categoryId', as: 'category' });

// Asset - AssetAcquisitionLine
Asset.hasMany(AssetAcquisitionLine, { foreignKey: 'assetId' });
AssetAcquisitionLine.belongsTo(Asset, { foreignKey: 'assetId', as: 'asset' });

// AssetAcquisition - Asset (for acquisition_id on assets)
AssetAcquisition.hasMany(Asset, { foreignKey: 'acquisitionId' });
Asset.belongsTo(AssetAcquisition, { foreignKey: 'acquisitionId', as: 'acquisition' });

// User - AssetAcquisition (createdBy/updatedBy)
User.hasMany(AssetAcquisition, { foreignKey: 'createdBy' });
AssetAcquisition.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(AssetAcquisition, { foreignKey: 'updatedBy' });
AssetAcquisition.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

// ============================================================
// AssetTransfer Associations
// ============================================================

Tenant.hasMany(AssetTransfer, { foreignKey: 'tenantId', sourceKey: 'id' });
AssetTransfer.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

Asset.hasMany(AssetTransfer, { foreignKey: 'assetId' });
AssetTransfer.belongsTo(Asset, { foreignKey: 'assetId', as: 'asset' });

User.hasMany(AssetTransfer, { foreignKey: 'createdBy' });
AssetTransfer.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(AssetTransfer, { foreignKey: 'updatedBy' });
AssetTransfer.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

// User - AssetCategory (createdBy/updatedBy)
User.hasMany(AssetCategory, { foreignKey: 'createdBy' });
AssetCategory.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(AssetCategory, { foreignKey: 'updatedBy' });
AssetCategory.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

// ============================================================
// AssetDepreciation Associations
// ============================================================
Tenant.hasMany(AssetDepreciation, { foreignKey: 'tenantId', sourceKey: 'id' });
AssetDepreciation.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });
Asset.hasMany(AssetDepreciation, { foreignKey: 'assetId' });
AssetDepreciation.belongsTo(Asset, { foreignKey: 'assetId', as: 'asset' });
User.hasMany(AssetDepreciation, { foreignKey: 'createdBy' });
AssetDepreciation.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(AssetDepreciation, { foreignKey: 'updatedBy' });
AssetDepreciation.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

// ============================================================
// AssetDisposal Associations
// ============================================================
Tenant.hasMany(AssetDisposal, { foreignKey: 'tenantId', sourceKey: 'id' });
AssetDisposal.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });
Asset.hasMany(AssetDisposal, { foreignKey: 'assetId' });
AssetDisposal.belongsTo(Asset, { foreignKey: 'assetId', as: 'asset' });
User.hasMany(AssetDisposal, { foreignKey: 'createdBy' });
AssetDisposal.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(AssetDisposal, { foreignKey: 'updatedBy' });
AssetDisposal.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

// ============================================================
// AssetRevaluation Associations
// ============================================================
Tenant.hasMany(AssetRevaluation, { foreignKey: 'tenantId', sourceKey: 'id' });
AssetRevaluation.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });
Asset.hasMany(AssetRevaluation, { foreignKey: 'assetId' });
AssetRevaluation.belongsTo(Asset, { foreignKey: 'assetId', as: 'asset' });
User.hasMany(AssetRevaluation, { foreignKey: 'createdBy' });
AssetRevaluation.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(AssetRevaluation, { foreignKey: 'updatedBy' });
AssetRevaluation.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

// ============================================================
// AssetMaintenance Associations
// ============================================================
Tenant.hasMany(AssetMaintenance, { foreignKey: 'tenantId', sourceKey: 'id' });
AssetMaintenance.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });
Asset.hasMany(AssetMaintenance, { foreignKey: 'assetId' });
AssetMaintenance.belongsTo(Asset, { foreignKey: 'assetId', as: 'asset' });
User.hasMany(AssetMaintenance, { foreignKey: 'createdBy' });
AssetMaintenance.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(AssetMaintenance, { foreignKey: 'updatedBy' });
AssetMaintenance.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

// ============================================================
// AssetInsurance Associations
// ============================================================
Tenant.hasMany(AssetInsurance, { foreignKey: 'tenantId', sourceKey: 'id' });
AssetInsurance.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });
Asset.hasMany(AssetInsurance, { foreignKey: 'assetId' });
AssetInsurance.belongsTo(Asset, { foreignKey: 'assetId', as: 'asset' });
User.hasMany(AssetInsurance, { foreignKey: 'createdBy' });
AssetInsurance.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(AssetInsurance, { foreignKey: 'updatedBy' });
AssetInsurance.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

// ============================================================
// AssetLocation Associations
// ============================================================

Tenant.hasMany(AssetLocation, { foreignKey: 'tenantId', sourceKey: 'id' });
AssetLocation.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

// Self-referencing parent/child
AssetLocation.hasMany(AssetLocation, { foreignKey: 'parentId', as: 'children' });
AssetLocation.belongsTo(AssetLocation, { foreignKey: 'parentId', as: 'parent' });

User.hasMany(AssetLocation, { foreignKey: 'createdBy' });
AssetLocation.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(AssetLocation, { foreignKey: 'updatedBy' });
AssetLocation.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

// ============================================================
// AssetCustodian Associations
// ============================================================

Tenant.hasMany(AssetCustodian, { foreignKey: 'tenantId', sourceKey: 'id' });
AssetCustodian.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

User.hasMany(AssetCustodian, { foreignKey: 'createdBy' });
AssetCustodian.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(AssetCustodian, { foreignKey: 'updatedBy' });
AssetCustodian.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

// ============================================================
// AssetAudit Associations
// ============================================================

Tenant.hasMany(AssetAudit, { foreignKey: 'tenantId', sourceKey: 'id' });
AssetAudit.belongsTo(Tenant, { foreignKey: 'tenantId', targetKey: 'id' });

Asset.hasMany(AssetAudit, { foreignKey: 'assetId' });
AssetAudit.belongsTo(Asset, { foreignKey: 'assetId', as: 'asset' });

User.hasMany(AssetAudit, { foreignKey: 'createdBy' });
AssetAudit.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(AssetAudit, { foreignKey: 'updatedBy' });
AssetAudit.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

// ============================================================
// Super Admin / SaaS Model Associations
// ============================================================

// SubscriptionPlan <-> SubscriptionPlanModule <-> SubscriptionModule
SubscriptionPlan.hasMany(SubscriptionPlanModule, { foreignKey: 'planId', as: 'planModules' });
SubscriptionPlanModule.belongsTo(SubscriptionPlan, { foreignKey: 'planId', as: 'plan' });

SubscriptionModule.hasMany(SubscriptionPlanModule, { foreignKey: 'moduleId', as: 'planModules' });
SubscriptionPlanModule.belongsTo(SubscriptionModule, { foreignKey: 'moduleId', as: 'module' });

// CompanySubscription -> SubscriptionPlan
CompanySubscription.belongsTo(SubscriptionPlan, { foreignKey: 'planId', as: 'plan' });
SubscriptionPlan.hasMany(CompanySubscription, { foreignKey: 'planId', as: 'subscriptions' });

// CompanySubscription -> Tenant (Company)
CompanySubscription.belongsTo(Tenant, { foreignKey: 'companyId', as: 'company' });
Tenant.hasMany(CompanySubscription, { foreignKey: 'companyId', as: 'companySubscriptions' });

// CompanySubscription <-> CompanySubscriptionModule <-> SubscriptionModule
CompanySubscription.hasMany(CompanySubscriptionModule, { foreignKey: 'subscriptionId', as: 'enabledModules' });
CompanySubscriptionModule.belongsTo(CompanySubscription, { foreignKey: 'subscriptionId', as: 'subscription' });

SubscriptionModule.hasMany(CompanySubscriptionModule, { foreignKey: 'moduleId', as: 'companyModuleMappings' });
CompanySubscriptionModule.belongsTo(SubscriptionModule, { foreignKey: 'moduleId', as: 'module' });

// License -> Company (Tenant)
License.belongsTo(Tenant, { foreignKey: 'companyId', as: 'company' });
Tenant.hasMany(License, { foreignKey: 'companyId', as: 'licenses' });

License.belongsTo(CompanySubscription, { foreignKey: 'subscriptionId', as: 'subscription' });
CompanySubscription.hasMany(License, { foreignKey: 'subscriptionId', as: 'licenses' });

// BillingInvoice -> Company, Subscription
BillingInvoice.belongsTo(Tenant, { foreignKey: 'companyId', as: 'company' });
Tenant.hasMany(BillingInvoice, { foreignKey: 'companyId', as: 'billingInvoices' });

BillingInvoice.belongsTo(CompanySubscription, { foreignKey: 'subscriptionId', as: 'subscription' });
CompanySubscription.hasMany(BillingInvoice, { foreignKey: 'subscriptionId', as: 'invoices' });

// Payment -> Company, Invoice, Subscription
Payment.belongsTo(Tenant, { foreignKey: 'companyId', as: 'company' });
Tenant.hasMany(Payment, { foreignKey: 'companyId', as: 'payments' });

Payment.belongsTo(BillingInvoice, { foreignKey: 'invoiceId', as: 'invoice' });
BillingInvoice.hasMany(Payment, { foreignKey: 'invoiceId', as: 'payments' });

Payment.belongsTo(CompanySubscription, { foreignKey: 'subscriptionId', as: 'subscription' });
CompanySubscription.hasMany(Payment, { foreignKey: 'subscriptionId', as: 'payments' });

// UsageTracking -> Company, Subscription
UsageTracking.belongsTo(Tenant, { foreignKey: 'companyId', as: 'company' });
Tenant.hasMany(UsageTracking, { foreignKey: 'companyId', as: 'usageRecords' });

UsageTracking.belongsTo(CompanySubscription, { foreignKey: 'subscriptionId', as: 'subscription' });
CompanySubscription.hasMany(UsageTracking, { foreignKey: 'subscriptionId', as: 'usageRecords' });

// ModuleUsage -> Company, Module
ModuleUsage.belongsTo(Tenant, { foreignKey: 'companyId', as: 'company' });
Tenant.hasMany(ModuleUsage, { foreignKey: 'companyId', as: 'moduleUsageRecords' });

ModuleUsage.belongsTo(SubscriptionModule, { foreignKey: 'moduleId', as: 'module' });
SubscriptionModule.hasMany(ModuleUsage, { foreignKey: 'moduleId', as: 'usageRecords' });

// SubscriptionAuditLog
SubscriptionAuditLog.belongsTo(Tenant, { foreignKey: 'companyId', as: 'company' });
SubscriptionAuditLog.belongsTo(CompanySubscription, { foreignKey: 'subscriptionId', as: 'subscription' });

module.exports = {
  sequelize,
  Sequelize,
  Tenant,
  User,
  Role,
  Permission,
  UserRole,
  RolePermission,
  RefreshToken,
  AuditLog,
  Account,
  JournalEntry,
  JournalEntryLine,
  ItemCategory,
  Item,
  Warehouse,
  InventoryBalance,
  StockAdjustment,
  StockAdjustmentDetail,
  StockTransfer,
  StockTransferDetail,
  InventoryTransaction,
  Customer,
  Supplier,
  Quotation,
  QuotationDetail,
  SalesOrder,
  SalesOrderDetail,
  DeliveryNote,
  DeliveryNoteDetail,
  SalesInvoice,
  SalesInvoiceDetail,
  SalesReturn,
  SalesReturnDetail,
  CreditNote,
  CreditNoteDetail,
  CustomerPayment,
  CustomerPaymentAllocation,
  SystemConfig,
  NumberSeries,
  EmailSetting,
  TaxRate,
  VatCategoryCode,
  PurchaseRequest,
  PurchaseRequestDetail,
  PurchaseOrder,
  PurchaseOrderDetail,
  GoodsReceipt,
  GoodsReceiptDetail,
  PurchaseInvoice,
  PurchaseInvoiceDetail,
  PurchaseReturn,
  PurchaseReturnDetail,
  DebitNote,
  SupplierPayment,
  SupplierPaymentAllocation,
  BankAccount,
  BankTransaction,
  PaymentReceipt,
  PaymentReceiptAllocation,
  PaymentVoucher,
  PaymentVoucherAllocation,
  PaymentVoucherLine,
  BankReconciliation,
  BankReconciliationLine,
  UserTenant,
  AssetCategory,
  Asset,
  AssetAcquisition,
  AssetAcquisitionLine,
  AssetTransfer,
  AssetDepreciation,
  AssetDisposal,
  AssetRevaluation,
  AssetMaintenance,
  AssetInsurance,
  AssetLocation,
  AssetCustodian,
  AssetAudit,
  // Super Admin / SaaS Models
  SubscriptionPlan,
  SubscriptionModule,
  SubscriptionPlanModule,
  CompanySubscription,
  CompanySubscriptionModule,
  FeatureFlag,
  License,
  BillingInvoice,
  Payment,
  UsageTracking,
  ModuleUsage,
  SubscriptionAuditLog,
  SuperAdminSetting,
};
