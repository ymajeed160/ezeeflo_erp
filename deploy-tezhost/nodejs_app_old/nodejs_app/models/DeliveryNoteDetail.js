'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DeliveryNoteDetail extends Model {
    static associate(models) {
      DeliveryNoteDetail.belongsTo(models.DeliveryNote, { foreignKey: 'deliveryNoteId', as: 'deliveryNote' });
      DeliveryNoteDetail.belongsTo(models.Item, { foreignKey: 'itemId', as: 'item' });
      DeliveryNoteDetail.belongsTo(models.SalesOrderDetail, { foreignKey: 'salesOrderDetailId', as: 'salesOrderDetail' });
      DeliveryNoteDetail.belongsTo(models.Tenant, { foreignKey: 'tenantId', as: 'tenant' });
    }
  }

  DeliveryNoteDetail.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      deliveryNoteId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      salesOrderDetailId: {
        type: DataTypes.UUID,
        allowNull: true,
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
        type: DataTypes.DECIMAL(15, 3),
        allowNull: false,
        defaultValue: 0,
      },
      unitPrice: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: false,
        defaultValue: 0,
      },
      taxPercentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0,
      },
      discountPercentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0,
      },
      totalAmount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      tenantId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      updatedBy: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'DeliveryNoteDetail',
      tableName: 'delivery_note_details',
      paranoid: true,
      timestamps: true,
    }
  );

  return DeliveryNoteDetail;
};