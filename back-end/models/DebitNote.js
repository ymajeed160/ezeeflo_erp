'use strict';

module.exports = (sequelize, DataTypes) => {
  const DebitNote = sequelize.define('DebitNote', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false },
    debitNoteNumber: { type: DataTypes.STRING(50), allowNull: false },
    debitNoteDate: { type: DataTypes.DATEONLY, allowNull: false },
    supplierId: { type: DataTypes.UUID, allowNull: false },
    purchaseReturnId: { type: DataTypes.UUID, allowNull: true },
    referenceType: { type: DataTypes.ENUM('PurchaseReturn', 'Manual'), defaultValue: 'Manual' },
    amount: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0.00 },
    notes: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('draft', 'approved', 'cancelled'), defaultValue: 'draft' },
    journalEntryId: { type: DataTypes.UUID, allowNull: true },
    createdBy: { type: DataTypes.UUID, allowNull: true },
    updatedBy: { type: DataTypes.UUID, allowNull: true },
    approvedBy: { type: DataTypes.UUID, allowNull: true },
    approvedAt: { type: DataTypes.DATE, allowNull: true },
  }, {
    tableName: 'debit_notes',
    paranoid: true,
    timestamps: true,
  });

  DebitNote.associate = (models) => {
    DebitNote.belongsTo(models.Tenant, { foreignKey: 'tenantId' });
    DebitNote.belongsTo(models.Supplier, { foreignKey: 'supplierId', as: 'supplier' });
    DebitNote.belongsTo(models.PurchaseReturn, { foreignKey: 'purchaseReturnId', as: 'purchaseReturn' });
    DebitNote.belongsTo(models.JournalEntry, { foreignKey: 'journalEntryId', as: 'journalEntry' });
    DebitNote.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
    DebitNote.belongsTo(models.User, { foreignKey: 'updatedBy', as: 'updater' });
    DebitNote.belongsTo(models.User, { foreignKey: 'approvedBy', as: 'approver' });
  };

  return DebitNote;
};