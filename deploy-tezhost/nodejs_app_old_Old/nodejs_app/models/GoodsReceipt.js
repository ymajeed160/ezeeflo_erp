'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class GoodsReceipt extends Model {
    static associate(models) {
      GoodsReceipt.belongsTo(models.Tenant, { foreignKey: 'tenantId', as: 'tenant' });
      GoodsReceipt.belongsTo(models.PurchaseOrder, { foreignKey: 'purchaseOrderId', as: 'purchaseOrder' });
      GoodsReceipt.belongsTo(models.Supplier, { foreignKey: 'supplierId', as: 'supplier' });
      GoodsReceipt.belongsTo(models.Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });
      GoodsReceipt.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
      GoodsReceipt.belongsTo(models.User, { foreignKey: 'updatedBy', as: 'updater' });
      GoodsReceipt.hasMany(models.GoodsReceiptDetail, { foreignKey: 'goodsReceiptId', as: 'details' });
    }
  }

  GoodsReceipt.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false },
    grnNumber: { type: DataTypes.STRING(50), allowNull: false },
    receiptDate: { type: DataTypes.DATEONLY, allowNull: false },
    purchaseOrderId: { type: DataTypes.UUID, allowNull: true },
    supplierId: { type: DataTypes.UUID, allowNull: false },
    warehouseId: { type: DataTypes.UUID, allowNull: true },
    reference: { type: DataTypes.STRING(100), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('draft', 'received', 'cancelled'), defaultValue: 'draft' },
    totalQuantity: { type: DataTypes.DECIMAL(18, 4), defaultValue: 0 },
    createdBy: { type: DataTypes.UUID, allowNull: true },
    updatedBy: { type: DataTypes.UUID, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
    deletedAt: { type: DataTypes.DATE, allowNull: true },
  }, {
    sequelize,
    modelName: 'GoodsReceipt',
    tableName: 'goodsreceipts',
    paranoid: true,
    timestamps: true,
  });

  return GoodsReceipt;
};