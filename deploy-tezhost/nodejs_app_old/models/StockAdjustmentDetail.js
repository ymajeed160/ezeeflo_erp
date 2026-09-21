const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StockAdjustmentDetail = sequelize.define('StockAdjustmentDetail', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  stockAdjustmentId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  itemId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  currentQuantity: {
    type: DataTypes.DECIMAL(18, 4),
    defaultValue: 0,
  },
  adjustedQuantity: {
    type: DataTypes.DECIMAL(18, 4),
    defaultValue: 0,
  },
  differenceQuantity: {
    type: DataTypes.DECIMAL(18, 4),
    defaultValue: 0,
  },
  unitCost: {
    type: DataTypes.DECIMAL(18, 4),
    defaultValue: 0,
  },
}, {
  tableName: 'stock_adjustment_details',
  underscored: true,
  timestamps: true,
  paranoid: false,
  indexes: [
    {
      fields: ['tenant_id'],
      name: 'idx_sa_details_tenant',
    },
    {
      fields: ['stock_adjustment_id'],
      name: 'idx_sa_details_header',
    },
    {
      fields: ['item_id'],
      name: 'idx_sa_details_item',
    },
  ],
});

module.exports = StockAdjustmentDetail;