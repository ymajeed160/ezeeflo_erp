'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SalesReturnDetail extends Model {
    static associate(models) {
      SalesReturnDetail.belongsTo(models.SalesReturn, { foreignKey: 'salesReturnId', as: 'salesReturn' });
      SalesReturnDetail.belongsTo(models.Item, { foreignKey: 'itemId', as: 'item' });
      SalesReturnDetail.belongsTo(models.SalesInvoiceDetail, { foreignKey: 'salesInvoiceDetailId', as: 'salesInvoiceDetail' });
      SalesReturnDetail.belongsTo(models.Tenant, { foreignKey: 'tenantId', as: 'tenant' });
    }
  }

  SalesReturnDetail.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      tenantId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      salesReturnId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      itemId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      salesInvoiceDetailId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      quantity: {
        type: DataTypes.DECIMAL(18, 4),
        allowNull: false,
        defaultValue: 0,
      },
      unitPrice: {
        type: DataTypes.DECIMAL(18, 4),
        allowNull: false,
        defaultValue: 0,
      },
      taxPercent: {
        type: DataTypes.DECIMAL(8, 4),
        allowNull: false,
        defaultValue: 0,
      },
      discountPercent: {
        type: DataTypes.DECIMAL(8, 4),
        allowNull: false,
        defaultValue: 0,
      },
      lineTotal: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0,
      },
      returnReason: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'SalesReturnDetail',
      tableName: 'sales_return_details',
      timestamps: true,
      paranoid: false,
    }
  );

  return SalesReturnDetail;
};