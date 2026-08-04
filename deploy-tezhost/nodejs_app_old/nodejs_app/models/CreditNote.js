'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CreditNote extends Model {
    static associate(models) {
      CreditNote.belongsTo(models.Tenant, { foreignKey: 'tenantId', as: 'tenant' });
      CreditNote.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
      CreditNote.belongsTo(models.SalesInvoice, { foreignKey: 'salesInvoiceId', as: 'salesInvoice' });
      CreditNote.belongsTo(models.SalesReturn, { foreignKey: 'salesReturnId', as: 'salesReturn' });
      CreditNote.belongsTo(models.Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });
      CreditNote.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
      CreditNote.belongsTo(models.User, { foreignKey: 'updatedBy', as: 'updater' });
      CreditNote.belongsTo(models.JournalEntry, { foreignKey: 'journalEntryId', as: 'journalEntry' });
      CreditNote.hasMany(models.CreditNoteDetail, { foreignKey: 'creditNoteId', as: 'details' });
    }
  }

  CreditNote.init(
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
      creditNoteNumber: {
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
      salesReturnId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      warehouseId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      creditNoteDate: {
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
        type: DataTypes.ENUM('draft', 'posted', 'cancelled'),
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
      modelName: 'CreditNote',
      tableName: 'credit_notes',
      timestamps: true,
      paranoid: false,
    }
  );

  return CreditNote;
};