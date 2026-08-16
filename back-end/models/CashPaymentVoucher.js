'use strict';

module.exports = (sequelize, DataTypes) => {
  const CashPaymentVoucher = sequelize.define('CashPaymentVoucher', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
    branchId: { type: DataTypes.UUID, allowNull: true, field: 'branch_id' },
    voucherNumber: { type: DataTypes.STRING(50), allowNull: false, field: 'voucher_number' },
    voucherDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'voucher_date' },
    cashAccountId: { type: DataTypes.UUID, allowNull: false, field: 'cash_account_id' },
    payeeType: { type: DataTypes.ENUM('supplier', 'employee', 'customer', 'other'), defaultValue: 'other', field: 'payee_type' },
    payeeId: { type: DataTypes.UUID, allowNull: true, field: 'payee_id' },
    payeeName: { type: DataTypes.STRING(200), allowNull: true, field: 'payee_name' },
    referenceNumber: { type: DataTypes.STRING(100), allowNull: true, field: 'reference_number' },
    paymentMethod: { type: DataTypes.ENUM('cash', 'bank'), defaultValue: 'cash', field: 'payment_method' },
    currency: { type: DataTypes.STRING(10), defaultValue: 'AED' },
    exchangeRate: { type: DataTypes.DECIMAL(10, 4), defaultValue: 1.0000, field: 'exchange_rate' },
    description: { type: DataTypes.TEXT, allowNull: true },
    subtotal: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
    taxAmount: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0, field: 'tax_amount' },
    totalAmount: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0, field: 'total_amount' },
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
    tableName: 'cash_payment_vouchers',
    timestamps: true,
    underscored: true,
  });

  CashPaymentVoucher.associate = (models) => {
    CashPaymentVoucher.belongsTo(models.Tenant, { foreignKey: 'tenantId' });
    CashPaymentVoucher.belongsTo(models.Account, { foreignKey: 'cashAccountId', as: 'cashAccount' });
    CashPaymentVoucher.belongsTo(models.JournalEntry, { foreignKey: 'journalEntryId', as: 'journalEntry' });
    CashPaymentVoucher.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
    CashPaymentVoucher.belongsTo(models.User, { foreignKey: 'postedBy', as: 'poster' });
    CashPaymentVoucher.hasMany(models.CashPaymentVoucherLine, { foreignKey: 'voucherId', as: 'lines' });
  };

  return CashPaymentVoucher;
};
