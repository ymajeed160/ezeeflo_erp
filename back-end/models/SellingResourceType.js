const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SellingResourceType = sequelize.define('SellingResourceType', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  typeCode: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Resource type code is required' },
    },
  },
  typeName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Resource type name is required' },
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
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
  tableName: 'selling_resource_types',
  underscored: true,
  timestamps: true,
  paranoid: true,
  indexes: [
    { unique: true, fields: ['type_code', 'tenant_id'], name: 'unique_srtype_code_tenant' },
    { fields: ['tenant_id', 'is_active'], name: 'idx_srtype_tenant_active' },
  ],
});

module.exports = SellingResourceType;
