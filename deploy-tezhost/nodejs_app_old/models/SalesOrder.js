'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SalesOrder extends Model {
    static associate(models) {
      this.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
      this.belongsTo(models.Quotation, { foreignKey: 'quotationId', as: 'quotation' });
      this.belongsTo(models.Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });
      this.hasMany(models.SalesOrderDetail, { foreignKey: 'salesOrderId', as: 'details' });
    }
  }

  SalesOrder.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      orderNumber: { type: DataTypes.STRING(30), allowNull: false },
      tenantId: { type: DataTypes.UUID, allowNull: false },
      customerId: { type: DataTypes.UUID, allowNull: false },
      quotationId: { type: DataTypes.UUID, allowNull: true },
      warehouseId: { type: DataTypes.UUID, allowNull: true },
      orderDate: { type: DataTypes.DATEONLY, allowNull: false },
      deliveryDate: { type: DataTypes.DATEONLY, allowNull: true },
      reference: { type: DataTypes.STRING(100), allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      termsConditions: { type: DataTypes.TEXT, allowNull: true },
      subtotalAmount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      discountAmount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      taxAmount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      totalAmount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      status: { type: DataTypes.ENUM('draft', 'approved', 'partially_delivered', 'delivered', 'closed'), allowNull: false, defaultValue: 'draft' },
      approvedBy: { type: DataTypes.UUID, allowNull: true },
      approvedAt: { type: DataTypes.DATE, allowNull: true },
      createdBy: { type: DataTypes.UUID, allowNull: true },
      updatedBy: { type: DataTypes.UUID, allowNull: true },
    },
    {
      sequelize,
      modelName: 'SalesOrder',
      tableName: 'sales_orders',
      timestamps: true,
      paranoid: true,
      indexes: [
        { unique: true, fields: ['tenant_id', 'order_number'], name: 'uk_tenant_order_number' },
      ],
    }
  );

  return SalesOrder;
};