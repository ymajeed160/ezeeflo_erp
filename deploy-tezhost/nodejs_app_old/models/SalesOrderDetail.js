'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SalesOrderDetail extends Model {
    static associate(models) {
      this.belongsTo(models.SalesOrder, { foreignKey: 'salesOrderId', as: 'salesOrder' });
      this.belongsTo(models.Item, { foreignKey: 'itemId', as: 'item' });
    }
  }

  SalesOrderDetail.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      tenantId: { type: DataTypes.UUID, allowNull: false },
      salesOrderId: { type: DataTypes.UUID, allowNull: false },
      itemId: { type: DataTypes.UUID, allowNull: false },
      description: { type: DataTypes.STRING(255), allowNull: true },
      quantity: { type: DataTypes.DECIMAL(15, 3), allowNull: false, defaultValue: 0 },
      deliveredQuantity: { type: DataTypes.DECIMAL(15, 3), allowNull: false, defaultValue: 0 },
      unitPrice: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      taxPercentage: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
      discountPercentage: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
      lineTotal: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    },
    {
      sequelize,
      modelName: 'SalesOrderDetail',
      tableName: 'sales_order_details',
      timestamps: true,
    }
  );

  return SalesOrderDetail;
};