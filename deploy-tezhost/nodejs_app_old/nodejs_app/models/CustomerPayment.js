'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CustomerPayment extends Model {
    static associate(models) {
      CustomerPayment.belongsTo(models.Tenant, { foreignKey: 'tenantId', as: 'tenant' });
      CustomerPayment.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
      CustomerPayment.belongsTo(models.Account, { foreignKey: 'bankAccountId', as: 'bankAccount' });
      CustomerPayment.belongsTo(models.Account, { foreignKey: 'paymentAccountId', as: 'paymentAccount' });
      CustomerPayment.belongsTo(models.Account, { foreignKey: 'customerAccountId', as: 'customerAccount' });
      CustomerPayment.belongsTo(models.JournalEntry, { foreignKey: 'journalEntryId', as: 'journalEntry' });
      CustomerPayment.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
      CustomerPayment.belongsTo(models.User, { foreignKey: 'updatedBy', as: 'updater' });
      CustomerPayment.hasMany(models.CustomerPaymentAllocation, { foreignKey: 'customerPaymentId', as: 'allocations' });
    }
  }

  CustomerPayment.init(
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
      paymentNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      customerId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      paymentDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      paymentMethod: {
        type: DataTypes.ENUM('cash', 'bank_transfer', 'cheque', 'credit_card', 'other'),
        allowNull: false,
        defaultValue: 'bank_transfer',
      },
      amount: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0,
      },
      reference: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      bankAccountId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      paymentAccountId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      customerAccountId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      journalEntryId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('draft', 'posted', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft',
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
      modelName: 'CustomerPayment',
      tableName: 'customer_payments',
      timestamps: true,
      paranoid: false,
    }
  );

  return CustomerPayment;
};