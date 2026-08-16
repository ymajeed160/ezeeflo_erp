'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CreditNoteDetail extends Model {
    static associate(models) {
      CreditNoteDetail.belongsTo(models.CreditNote, { foreignKey: 'creditNoteId', as: 'creditNote' });
      CreditNoteDetail.belongsTo(models.Item, { foreignKey: 'itemId', as: 'item' });
      CreditNoteDetail.belongsTo(models.SalesInvoiceDetail, { foreignKey: 'salesInvoiceDetailId', as: 'salesInvoiceDetail' });
      CreditNoteDetail.belongsTo(models.Tenant, { foreignKey: 'tenantId', as: 'tenant' });
    }
  }

  CreditNoteDetail.init(
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
      creditNoteId: {
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
    },
    {
      sequelize,
      modelName: 'CreditNoteDetail',
      tableName: 'credit_note_details',
      timestamps: true,
      paranoid: false,
    }
  );

  return CreditNoteDetail;
};