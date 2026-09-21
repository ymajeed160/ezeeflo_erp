const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StockAdjustment = sequelize.define('StockAdjustment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  adjustmentNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Adjustment number is required' },
    },
  },
  warehouseId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  adjustmentDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  reason: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('draft', 'approved', 'completed'),
    defaultValue: 'draft',
    validate: {
      isIn: [['draft', 'approved', 'completed']],
    },
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
  tableName: 'stock_adjustments',
  underscored: true,
  timestamps: true,
  paranoid: false,
  indexes: [
    {
      unique: true,
      fields: ['adjustment_number', 'tenant_id'],
      name: 'unique_adjustment_number_tenant',
    },
    {
      fields: ['tenant_id'],
      name: 'idx_stock_adjustments_tenant',
    },
    {
      fields: ['warehouse_id'],
      name: 'idx_stock_adjustments_warehouse',
    },
    {
      fields: ['status'],
      name: 'idx_stock_adjustments_status',
    },
    {
      fields: ['adjustment_date'],
      name: 'idx_stock_adjustments_date',
    },
  ],
});

module.exports = StockAdjustment;