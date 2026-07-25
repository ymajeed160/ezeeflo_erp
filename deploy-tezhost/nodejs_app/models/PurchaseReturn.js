'use strict';

module.exports = (sequelize, DataTypes) => {
  const PurchaseReturn = sequelize.define('PurchaseReturn', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false },
    returnNumber: { type: DataTypes.STRING(50), allowNull: false },
    returnDate: { type: DataTypes.DATEONLY, allowNull: false },
    supplierId: { type: DataTypes.UUID, allowNull: false },
    purchaseInvoiceId: { type: DataTypes.UUID, allowNull: true },
    goodsReceiptId: { type: DataTypes.UUID, allowNull: true },
    warehouseId: { type: DataTypes.UUID, allowNull: true },
    referenceType: { type: DataTypes.ENUM('purchase_invoice', 'goods_receipt'), allowNull: false },
    status: { type: DataTypes.ENUM('draft', 'approved', 'rejected'), defaultValue: 'draft' },
    totalAmount: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
    notes: { type: DataTypes.TEXT, allowNull: true },
    journalEntryId: { type: DataTypes.UUID, allowNull: true },
    createdBy: { type: DataTypes.UUID, allowNull: true },
    updatedBy: { type: DataTypes.UUID, allowNull: true },
  }, {
    tableName: 'purchasereturns',
    paranoid: true,
    timestamps: true,
  });

  PurchaseReturn.associate = (models) => {
    PurchaseReturn.belongsTo(models.Tenant, { foreignKey: 'tenantId' });
    PurchaseReturn.belongsTo(models.Supplier, { foreignKey: 'supplierId', as: 'supplier' });
    PurchaseReturn.belongsTo(models.PurchaseInvoice, { foreignKey: 'purchaseInvoiceId', as: 'purchaseInvoice' });
    PurchaseReturn.belongsTo(models.GoodsReceipt, { foreignKey: 'goodsReceiptId', as: 'goodsReceipt' });
    PurchaseReturn.belongsTo(models.Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });
    PurchaseReturn.belongsTo(models.JournalEntry, { foreignKey: 'journalEntryId', as: 'journalEntry' });
    PurchaseReturn.hasMany(models.PurchaseReturnDetail, { foreignKey: 'purchaseReturnId', as: 'details' });
    PurchaseReturn.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
    PurchaseReturn.belongsTo(models.User, { foreignKey: 'updatedBy', as: 'updater' });
  };

  return PurchaseReturn;
};