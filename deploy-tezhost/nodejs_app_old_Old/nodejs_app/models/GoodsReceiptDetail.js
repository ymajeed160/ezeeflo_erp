'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class GoodsReceiptDetail extends Model {
    static associate(models) {
      GoodsReceiptDetail.belongsTo(models.GoodsReceipt, { foreignKey: 'goodsReceiptId', as: 'goodsReceipt' });
      GoodsReceiptDetail.belongsTo(models.Item, { foreignKey: 'itemId', as: 'item' });
      GoodsReceiptDetail.belongsTo(models.PurchaseOrderDetail, { foreignKey: 'purchaseOrderDetailId', as: 'purchaseOrderDetail' });
    }
  }

  GoodsReceiptDetail.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    goodsReceiptId: { type: DataTypes.UUID, allowNull: false },
    itemId: { type: DataTypes.UUID, allowNull: false },
    purchaseOrderDetailId: { type: DataTypes.UUID, allowNull: true },
    description: { type: DataTypes.STRING(255), allowNull: true },
    orderedQuantity: { type: DataTypes.DECIMAL(18, 4), defaultValue: 0 },
    receivedQuantity: { type: DataTypes.DECIMAL(18, 4), defaultValue: 0 },
    unitPrice: { type: DataTypes.DECIMAL(18, 4), defaultValue: 0 },
    taxPercentage: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    discountPercentage: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    lineTotal: { type: DataTypes.DECIMAL(18, 4), defaultValue: 0 },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  }, {
    sequelize,
    modelName: 'GoodsReceiptDetail',
    tableName: 'goodsreceiptdetails',
    timestamps: true,
  });

  return GoodsReceiptDetail;
};