'use strict';

module.exports = (sequelize, DataTypes) => {
  const CashReceiptVoucherLine = sequelize.define('CashReceiptVoucherLine', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    voucherId: { type: DataTypes.UUID, allowNull: false, field: 'voucher_id' },
    accountId: { type: DataTypes.UUID, allowNull: false, field: 'account_id' },
    partyId: { type: DataTypes.UUID, allowNull: true, field: 'party_id' },
    description: { type: DataTypes.STRING(255), allowNull: true },
    amount: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
    taxId: { type: DataTypes.UUID, allowNull: true, field: 'tax_id' },
    taxRate: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0, field: 'tax_rate' },
    taxAmount: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0, field: 'tax_amount' },
    totalAmount: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0, field: 'total_amount' },
    costCenterId: { type: DataTypes.UUID, allowNull: true, field: 'cost_center_id' },
    departmentId: { type: DataTypes.UUID, allowNull: true, field: 'department_id' },
    projectId: { type: DataTypes.UUID, allowNull: true, field: 'project_id' },
    lineNumber: { type: DataTypes.INTEGER, defaultValue: 1, field: 'line_number' },
  }, {
    tableName: 'cash_receipt_voucher_lines',
    timestamps: true,
    underscored: true,
  });

  CashReceiptVoucherLine.associate = (models) => {
    CashReceiptVoucherLine.belongsTo(models.CashReceiptVoucher, { foreignKey: 'voucherId', as: 'voucher' });
    CashReceiptVoucherLine.belongsTo(models.Account, { foreignKey: 'accountId', as: 'account' });
  };

  return CashReceiptVoucherLine;
};
