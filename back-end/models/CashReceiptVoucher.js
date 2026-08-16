'use strict';

module.exports = (sequelize, DataTypes) => {
  const CashReceiptVoucher = sequelize.define('CashReceiptVoucher', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    branchId: { type: DataTypes.UUID, allowNull: true, field: 'branch_id' },
    voucherNumber: { type: DataTypes.STRING(50), allowNull: false, field: 'voucher_number' },
    voucherDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'voucher_date' },
    cashAccountId: { type: DataTypes.UUID, allowNull: false, field: 'cash_account_id' },
    payerType: { type: DataTypes.ENUM('customer', 'supplier', 'employee', 'other'), defaultValue: 'other', field: 'payer_type' },
    payerId: { type: DataTypes.UUID, allowNull: true, field: 'payer_id' },
    payerName: { type: DataTypes.STRING(200), allowNull: true, field: 'payer_name' },
    referenceNumber: { type: DataTypes.STRING(100), allowNull: true, field: 'reference_number' },
    paymentMethod: { type: DataTypes.ENUM('cash', 'bank'), defaultValue: 'cash', field: 'payment_method' },
    currency: { type: DataTypes.STRING(10), defaultValue: 'AED' },
    exchangeRate: { type: DataTypes.DECIMAL(10, 4), defaultValue: 1.0000, field: 'exchange_rate' },
    description: { type: DataTypes.TEXT, allowNull: true },
    subtotal: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
    taxAmount: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0, field: 'tax_amount' },
    totalAmount: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0, field: 'total_amount' },
    allocatedAmount: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0, field: 'allocated_amount' },
    unallocatedAmount: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0, field: 'unallocated_amount' },
    status: { type: DataTypes.ENUM('draft', 'submitted', 'approved', 'posted', 'cancelled', 'reversed'), defaultValue: 'draft' },
    journalEntryId: { type: DataTypes.UUID, allowNull: true, field: 'journal_entry_id' },
    isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_deleted' },
    createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
    updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
    postedBy: { type: DataTypes.UUID, allowNull: true, field: 'posted_by' },
    postedAt: { type: DataTypes.DATE, allowNull: true, field: 'posted_at' },
    reversedBy: { type: DataTypes.UUID, allowNull: true, field: 'reversed_by' },
    reversedAt: { type: DataTypes.DATE, allowNull: true, field: 'reversed_at' },
  }, {
    tableName: 'cash_receipt_vouchers',
    timestamps: true,
    underscored: true,
  });

  CashReceiptVoucher.associate = (models) => {
    CashReceiptVoucher.belongsTo(models.Tenant, { foreignKey: 'tenantId' });
    CashReceiptVoucher.belongsTo(models.Account, { foreignKey: 'cashAccountId', as: 'cashAccount' });
    CashReceiptVoucher.belongsTo(models.JournalEntry, { foreignKey: 'journalEntryId', as: 'journalEntry' });
    CashReceiptVoucher.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
    CashReceiptVoucher.belongsTo(models.User, { foreignKey: 'postedBy', as: 'poster' });
    CashReceiptVoucher.hasMany(models.CashReceiptVoucherLine, { foreignKey: 'voucherId', as: 'lines' });
  };

  return CashReceiptVoucher;
};
