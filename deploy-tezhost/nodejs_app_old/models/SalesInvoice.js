'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SalesInvoice extends Model {
    static associate(models) {
      SalesInvoice.belongsTo(models.Tenant, { foreignKey: 'tenantId', as: 'tenant' });
      SalesInvoice.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
      SalesInvoice.belongsTo(models.SalesOrder, { foreignKey: 'salesOrderId', as: 'salesOrder' });
      SalesInvoice.belongsTo(models.DeliveryNote, { foreignKey: 'deliveryNoteId', as: 'deliveryNote' });
      SalesInvoice.belongsTo(models.Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });
      SalesInvoice.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
      SalesInvoice.belongsTo(models.User, { foreignKey: 'updatedBy', as: 'updater' });
      SalesInvoice.belongsTo(models.JournalEntry, { foreignKey: 'journalEntryId', as: 'journalEntry' });
      SalesInvoice.belongsTo(models.Account, { foreignKey: 'customerAccountId', as: 'customerAccount' });
      SalesInvoice.belongsTo(models.Account, { foreignKey: 'revenueAccountId', as: 'revenueAccount' });
      SalesInvoice.belongsTo(models.Account, { foreignKey: 'taxAccountId', as: 'taxAccount' });
      SalesInvoice.hasMany(models.SalesInvoiceDetail, { foreignKey: 'salesInvoiceId', as: 'details' });
      SalesInvoice.hasMany(models.CustomerPaymentAllocation, { foreignKey: 'salesInvoiceId', as: 'paymentAllocations' });
    }
  }

  SalesInvoice.init(
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
      invoiceNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      customerId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      salesOrderId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      deliveryNoteId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      warehouseId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      invoiceDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      journalEntryId: {
        type: DataTypes.UUID,
        allowNull: true,
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
        type: DataTypes.ENUM('draft', 'posted', 'paid', 'partially_paid', 'overdue', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft',
      },
      isInventoryImpact: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
      modelName: 'SalesInvoice',
      tableName: 'sales_invoices',
      timestamps: true,
      paranoid: true,
    }
  );

  return SalesInvoice;
};