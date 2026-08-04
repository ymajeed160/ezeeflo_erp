const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StockTransfer = sequelize.define('StockTransfer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  transferNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Transfer number is required' },
    },
  },
  fromWarehouseId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  toWarehouseId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  transferDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('draft', 'approved', 'in_transit', 'completed', 'cancelled'),
    defaultValue: 'draft',
    validate: {
      isIn: [['draft', 'approved', 'in_transit', 'completed', 'cancelled']],
    },
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  tableName: 'stock_transfers',
  underscored: true,
  timestamps: true,
  paranoid: false,
  indexes: [
    {
      unique: true,
      fields: ['transfer_number', 'tenant_id'],
      name: 'unique_transfer_number_tenant',
    },
    {
      fields: ['tenant_id'],
      name: 'idx_stock_transfers_tenant',
    },
    {
      fields: ['from_warehouse_id'],
      name: 'idx_stock_transfers_from',
    },
    {
      fields: ['to_warehouse_id'],
      name: 'idx_stock_transfers_to',
    },
    {
      fields: ['status'],
      name: 'idx_stock_transfers_status',
    },
    {
      fields: ['transfer_date'],
      name: 'idx_stock_transfers_date',
    },
  ],
});

module.exports = StockTransfer;