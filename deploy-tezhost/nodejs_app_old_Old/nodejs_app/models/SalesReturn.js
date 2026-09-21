'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SalesReturn extends Model {
    static associate(models) {
      SalesReturn.belongsTo(models.Tenant, { foreignKey: 'tenantId', as: 'tenant' });
      SalesReturn.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
      SalesReturn.belongsTo(models.SalesInvoice, { foreignKey: 'salesInvoiceId', as: 'salesInvoice' });
      SalesReturn.belongsTo(models.Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });
      SalesReturn.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
      SalesReturn.belongsTo(models.User, { foreignKey: 'updatedBy', as: 'updater' });
      SalesReturn.belongsTo(models.JournalEntry, { foreignKey: 'journalEntryId', as: 'journalEntry' });
      SalesReturn.belongsTo(models.Account, { foreignKey: 'customerAccountId', as: 'customerAccount' });
      SalesReturn.belongsTo(models.Account, { foreignKey: 'revenueAccountId', as: 'revenueAccount' });
      SalesReturn.belongsTo(models.Account, { foreignKey: 'taxAccountId', as: 'taxAccount' });
      SalesReturn.hasMany(models.SalesReturnDetail, { foreignKey: 'salesReturnId', as: 'details' });
    }
  }

  SalesReturn.init(
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
      returnNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      customerId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      salesInvoiceId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      warehouseId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      returnDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      journalEntryId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      reference: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      subTotal: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0,
      },
      taxTotal: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0,
      },
      discountTotal: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0,
      },
      grandTotal: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.ENUM('draft', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'draft',
      },
      isInventoryImpact: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      customerAccountId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      revenueAccountId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      taxAccountId: {
        type: DataTypes.UUID,
        allowNull: true,
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
      modelName: 'SalesReturn',
      tableName: 'sales_returns',
      timestamps: true,
      paranoid: false,
    }
  );

  return SalesReturn;
};