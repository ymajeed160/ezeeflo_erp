'use strict';

module.exports = (sequelize, DataTypes) => {
  const PurchaseInvoice = sequelize.define('PurchaseInvoice', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false },
    invoiceNumber: { type: DataTypes.STRING(50), allowNull: false },
    supplierInvoiceNumber: { type: DataTypes.STRING(100), allowNull: true },
    supplierId: { type: DataTypes.UUID, allowNull: false },
    invoiceDate: { type: DataTypes.DATEONLY, allowNull: false },
    dueDate: { type: DataTypes.DATEONLY, allowNull: true },
    warehouseId: { type: DataTypes.UUID, allowNull: true },
    status: { type: DataTypes.ENUM('draft', 'confirmed', 'posted', 'paid', 'cancelled'), defaultValue: 'draft' },
    notes: { type: DataTypes.TEXT, allowNull: true },
    subtotal: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
    taxAmount: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
    discountAmount: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
    totalAmount: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
    journalEntryId: { type: DataTypes.UUID, allowNull: true },
    createdBy: { type: DataTypes.UUID, allowNull: true },
    updatedBy: { type: DataTypes.UUID, allowNull: true },
  }, {
    tableName: 'purchaseinvoices',
    paranoid: true,
    timestamps: true,
  });

  PurchaseInvoice.associate = (models) => {
    PurchaseInvoice.belongsTo(models.Tenant, { foreignKey: 'tenantId' });
    PurchaseInvoice.belongsTo(models.Supplier, { foreignKey: 'supplierId', as: 'supplier' });
    PurchaseInvoice.belongsTo(models.Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });
    PurchaseInvoice.belongsTo(models.JournalEntry, { foreignKey: 'journalEntryId', as: 'journalEntry' });
    PurchaseInvoice.hasMany(models.PurchaseInvoiceDetail, { foreignKey: 'purchaseInvoiceId', as: 'details' });
    PurchaseInvoice.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
    PurchaseInvoice.belongsTo(models.User, { foreignKey: 'updatedBy', as: 'updater' });
  };

  return PurchaseInvoice;
};