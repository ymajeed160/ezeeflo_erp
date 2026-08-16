'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class CustomerPaymentAllocation extends Model {
    static associate(models) {
      CustomerPaymentAllocation.belongsTo(models.Tenant, { foreignKey: 'tenantId', targetKey: 'id' });
      CustomerPaymentAllocation.belongsTo(models.CustomerPayment, { foreignKey: 'customerPaymentId', as: 'payment' });
      CustomerPaymentAllocation.belongsTo(models.SalesInvoice, { foreignKey: 'salesInvoiceId', as: 'invoice' });
    }
  }

  CustomerPaymentAllocation.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      tenantId: { type: DataTypes.UUID, allowNull: false },
      customerPaymentId: { type: DataTypes.UUID, allowNull: false },
      salesInvoiceId: { type: DataTypes.UUID, allowNull: false },
      allocatedAmount: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
    },
    {
      sequelize,
      modelName: 'CustomerPaymentAllocation',
      tableName: 'customer_payment_allocations',
      timestamps: true,
      // InnoDB auto-creates indexes for FK columns; only explicit non-FK index needed
      indexes: [
        { fields: ['tenant_id'] },
      ],
    }
  );

  return CustomerPaymentAllocation;
};