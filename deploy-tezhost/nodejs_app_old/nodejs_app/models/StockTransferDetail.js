const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StockTransferDetail = sequelize.define('StockTransferDetail', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  stockTransferId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  itemId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.DECIMAL(18, 4),
    defaultValue: 0,
    validate: {
      min: { args: [0.0001], msg: 'Quantity must be greater than zero' },
    },
  },
  unitCost: {
    type: DataTypes.DECIMAL(18, 4),
    defaultValue: 0,
  },
}, {
  tableName: 'stock_transfer_details',
  underscored: true,
  timestamps: true,
  paranoid: false,
  indexes: [
    {
      fields: ['tenant_id'],
      name: 'idx_st_details_tenant',
    },
    {
      fields: ['stock_transfer_id'],
      name: 'idx_st_details_header',
    },
    {
      fields: ['item_id'],
      name: 'idx_st_details_item',
    },
  ],
});

module.exports = StockTransferDetail;