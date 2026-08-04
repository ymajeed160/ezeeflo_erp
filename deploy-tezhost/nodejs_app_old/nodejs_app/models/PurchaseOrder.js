'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PurchaseOrder extends Model {
    static associate(models) {
      this.belongsTo(models.Tenant, { foreignKey: 'tenantId' });
      this.belongsTo(models.Supplier, { foreignKey: 'supplierId', as: 'supplier' });
      this.belongsTo(models.Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });
      this.belongsTo(models.PurchaseRequest, { foreignKey: 'purchaseRequestId', as: 'purchaseRequest' });
      this.hasMany(models.PurchaseOrderDetail, { foreignKey: 'purchaseOrderId', as: 'details' });
      this.hasMany(models.GoodsReceipt, { foreignKey: 'purchaseOrderId', as: 'goodsReceipts' });
    }
  }

  PurchaseOrder.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false },
    orderNumber: { type: DataTypes.STRING(50), allowNull: false },
    orderDate: { type: DataTypes.DATEONLY, allowNull: false },
    expectedDeliveryDate: { type: DataTypes.DATEONLY, allowNull: true },
    supplierId: { type: DataTypes.UUID, allowNull: true },
    warehouseId: { type: DataTypes.UUID, allowNull: true, field: 'warehouse_id' },
    purchaseRequestId: { type: DataTypes.UUID, allowNull: true },
    status: {
      type: DataTypes.ENUM('draft', 'approved', 'partially_received', 'received', 'closed', 'cancelled'),
      defaultValue: 'draft',
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    totalAmount: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
    createdBy: { type: DataTypes.UUID, allowNull: true },
    updatedBy: { type: DataTypes.UUID, allowNull: true },
    approvedBy: { type: DataTypes.UUID, allowNull: true },
    approvedAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
    deletedAt: { type: DataTypes.DATE, allowNull: true },
  }, {
    sequelize,
    modelName: 'PurchaseOrder',
    tableName: 'purchaseorders',
    paranoid: true,
  });

  return PurchaseOrder;
};