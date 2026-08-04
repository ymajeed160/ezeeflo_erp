'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PurchaseOrderDetail extends Model {
    static associate(models) {
      this.belongsTo(models.PurchaseOrder, { foreignKey: 'purchaseOrderId', as: 'purchaseOrder' });
      this.belongsTo(models.Item, { foreignKey: 'itemId', as: 'item' });
    }
  }

  PurchaseOrderDetail.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    purchaseOrderId: { type: DataTypes.UUID, allowNull: false },
    itemId: { type: DataTypes.UUID, allowNull: false },
    description: { type: DataTypes.STRING(500), allowNull: true },
    quantity: { type: DataTypes.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
    receivedQuantity: { type: DataTypes.DECIMAL(18, 4), defaultValue: 0 },
    unitPrice: { type: DataTypes.DECIMAL(18, 4), defaultValue: 0 },
    taxPercent: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
    discountPercent: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
    discountAmount: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
    taxAmount: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
    lineTotal: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
    sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  }, {
    sequelize,
    modelName: 'PurchaseOrderDetail',
    tableName: 'purchaseorderdetails',
    timestamps: true,
  });

  return PurchaseOrderDetail;
};