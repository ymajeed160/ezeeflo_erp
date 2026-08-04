'use strict';

module.exports = (sequelize, DataTypes) => {
  const SupplierPayment = sequelize.define('SupplierPayment', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false },
    paymentNumber: { type: DataTypes.STRING(50), allowNull: false },
    paymentDate: { type: DataTypes.DATEONLY, allowNull: false },
    supplierId: { type: DataTypes.UUID, allowNull: false },
    paymentMethod: { type: DataTypes.ENUM('Cash', 'BankTransfer', 'Cheque'), defaultValue: 'BankTransfer' },
    amount: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0.00 },
    referenceNumber: { type: DataTypes.STRING(100), allowNull: true },
    bankAccountId: { type: DataTypes.UUID, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('draft', 'confirmed', 'approved', 'cancelled'), defaultValue: 'draft' },
    journalEntryId: { type: DataTypes.UUID, allowNull: true },
    createdBy: { type: DataTypes.UUID, allowNull: true },
    updatedBy: { type: DataTypes.UUID, allowNull: true },
    approvedBy: { type: DataTypes.UUID, allowNull: true },
    approvedAt: { type: DataTypes.DATE, allowNull: true },
  }, {
    tableName: 'supplier_payments',
    paranoid: true,
    timestamps: true,
  });

  SupplierPayment.associate = (models) => {
    SupplierPayment.belongsTo(models.Tenant, { foreignKey: 'tenantId' });
    SupplierPayment.belongsTo(models.Supplier, { foreignKey: 'supplierId', as: 'supplier' });
    SupplierPayment.belongsTo(models.Account, { foreignKey: 'bankAccountId', as: 'bankAccount' });
    SupplierPayment.belongsTo(models.JournalEntry, { foreignKey: 'journalEntryId', as: 'journalEntry' });
    SupplierPayment.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
    SupplierPayment.belongsTo(models.User, { foreignKey: 'updatedBy', as: 'updater' });
    SupplierPayment.belongsTo(models.User, { foreignKey: 'approvedBy', as: 'approver' });
    SupplierPayment.hasMany(models.SupplierPaymentAllocation, { foreignKey: 'supplierPaymentId', as: 'allocations' });
  };

  return SupplierPayment;
};