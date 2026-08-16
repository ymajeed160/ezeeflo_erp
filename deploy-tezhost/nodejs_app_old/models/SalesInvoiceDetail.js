'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SalesInvoiceDetail extends Model {
    static associate(models) {
      SalesInvoiceDetail.belongsTo(models.SalesInvoice, { foreignKey: 'salesInvoiceId', as: 'salesInvoice' });
      SalesInvoiceDetail.belongsTo(models.Item, { foreignKey: 'itemId', as: 'item' });
      SalesInvoiceDetail.belongsTo(models.Tenant, { foreignKey: 'tenantId', as: 'tenant' });
    }
  }

  SalesInvoiceDetail.init(
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
      salesInvoiceId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      itemId: {
        type: DataTypes.UUID,
        allowNull: false,
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
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
      },
      discountPercent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
      },
      lineTotal: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0,
      },
      costPrice: {
        type: DataTypes.DECIMAL(18, 4),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: 'SalesInvoiceDetail',
      tableName: 'sales_invoice_details',
      timestamps: true,
      paranoid: true,
    }
  );

  return SalesInvoiceDetail;
};