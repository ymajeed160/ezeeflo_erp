const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VatCategoryCode = sequelize.define('VatCategoryCode', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'tenant_id',
  },
  code: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'created_by',
  },
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'updated_by',
  },
}, {
  tableName: 'vat_category_codes',
  timestamps: true,
  paranoid: false,
  indexes: [
    {
      unique: true,
      fields: ['tenant_id', 'code'],
    },
  ],
});

module.exports = VatCategoryCode;
