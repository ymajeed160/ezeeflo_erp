'use strict';

module.exports = (sequelize, DataTypes) => {
  const PurchaseReturnDetail = sequelize.define('PurchaseReturnDetail', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    purchaseReturnId: { type: DataTypes.UUID, allowNull: false },
    itemId: { type: DataTypes.UUID, allowNull: false },
    description: { type: DataTypes.STRING(500), allowNull: true },
    quantity: { type: DataTypes.DECIMAL(18, 4), allowNull: false },
    unitCost: { type: DataTypes.DECIMAL(18, 4), allowNull: false },
    taxPercent: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
    taxAmount: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
    discountAmount: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
    lineTotal: { type: DataTypes.DECIMAL(18, 2), allowNull: false },
    warehouseId: { type: DataTypes.UUID, allowNull: true },
  }, {
    tableName: 'purchasereturndetails',
    timestamps: true,
  });

  PurchaseReturnDetail.associate = (models) => {
    PurchaseReturnDetail.belongsTo(models.PurchaseReturn, { foreignKey: 'purchaseReturnId' });
    PurchaseReturnDetail.belongsTo(models.Item, { foreignKey: 'itemId', as: 'Item' });
    PurchaseReturnDetail.belongsTo(models.Warehouse, { foreignKey: 'warehouseId', as: 'Warehouse' });
  };

  return PurchaseReturnDetail;
};