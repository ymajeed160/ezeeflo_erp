'use strict';

module.exports = (sequelize, DataTypes) => {
  const PurchaseInvoiceDetail = sequelize.define('PurchaseInvoiceDetail', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    purchaseInvoiceId: { type: DataTypes.UUID, allowNull: false },
    itemId: { type: DataTypes.UUID, allowNull: false },
    description: { type: DataTypes.STRING(500), allowNull: true },
    quantity: { type: DataTypes.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
    unitCost: { type: DataTypes.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
    taxPercent: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
    taxAmount: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
    discountPercent: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
    discountAmount: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
    lineTotal: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
  }, {
    tableName: 'purchaseinvoicedetails',
    timestamps: true,
  });

  PurchaseInvoiceDetail.associate = (models) => {
    PurchaseInvoiceDetail.belongsTo(models.PurchaseInvoice, { foreignKey: 'purchaseInvoiceId' });
    PurchaseInvoiceDetail.belongsTo(models.Item, { foreignKey: 'itemId', as: 'Item' });
  };

  return PurchaseInvoiceDetail;
};