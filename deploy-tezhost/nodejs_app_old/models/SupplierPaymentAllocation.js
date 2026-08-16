'use strict';

module.exports = (sequelize, DataTypes) => {
  const SupplierPaymentAllocation = sequelize.define('SupplierPaymentAllocation', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false },
    supplierPaymentId: { type: DataTypes.UUID, allowNull: false },
    purchaseInvoiceId: { type: DataTypes.UUID, allowNull: false },
    allocatedAmount: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0.00 },
  }, {
    tableName: 'supplier_payment_allocations',
    paranoid: true,
    timestamps: true,
  });

  SupplierPaymentAllocation.associate = (models) => {
    SupplierPaymentAllocation.belongsTo(models.Tenant, { foreignKey: 'tenantId' });
    SupplierPaymentAllocation.belongsTo(models.SupplierPayment, { foreignKey: 'supplierPaymentId', as: 'SupplierPayment' });
    SupplierPaymentAllocation.belongsTo(models.PurchaseInvoice, { foreignKey: 'purchaseInvoiceId', as: 'PurchaseInvoice' });
  };

  return SupplierPaymentAllocation;
};