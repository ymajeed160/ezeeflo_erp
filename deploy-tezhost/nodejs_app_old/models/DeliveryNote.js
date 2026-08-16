'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DeliveryNote extends Model {
    static associate(models) {
      DeliveryNote.belongsTo(models.Tenant, { foreignKey: 'tenantId', as: 'tenant' });
      DeliveryNote.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
      DeliveryNote.belongsTo(models.User, { foreignKey: 'updatedBy', as: 'updater' });
      DeliveryNote.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
      DeliveryNote.belongsTo(models.SalesOrder, { foreignKey: 'salesOrderId', as: 'salesOrder' });
      DeliveryNote.belongsTo(models.Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });
      DeliveryNote.hasMany(models.DeliveryNoteDetail, { foreignKey: 'deliveryNoteId', as: 'details' });
    }
  }

  DeliveryNote.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      deliveryNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      salesOrderId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      customerId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      warehouseId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      deliveryDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      reference: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('draft', 'delivered', 'cancelled'),
        defaultValue: 'draft',
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
      modelName: 'DeliveryNote',
      tableName: 'delivery_notes',
      paranoid: true,
      timestamps: true,
      indexes: [
        { unique: true, fields: ['tenant_id', 'delivery_number'], name: 'uk_tenant_delivery_number' },
      ],
    }
  );

  return DeliveryNote;
};