const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ItemAttribute = sequelize.define('ItemAttribute', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'tenant_id',
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'name',
  },
  code: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'code',
  },
  dataType: {
    type: DataTypes.ENUM('dropdown', 'text', 'number'),
    allowNull: false,
    defaultValue: 'dropdown',
    field: 'data_type',
  },
  isVariantDefining: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_variant_defining',
  },
  isRequired: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_required',
  },
  displayOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'display_order',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
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
  tableName: 'item_attributes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  paranoid: false,
  indexes: [
    { unique: true, fields: ['tenant_id', 'code'], name: 'unique_item_attr_code_tenant' },
    { fields: ['tenant_id'], name: 'idx_item_attrs_tenant' },
    { fields: ['is_active'], name: 'idx_item_attrs_active' },
  ],
});

ItemAttribute.associate = (models) => {
  ItemAttribute.hasMany(models.ItemAttributeOption, { foreignKey: 'attributeId', as: 'options' });
  ItemAttribute.hasMany(models.ItemAttributeTemplateAttribute, { foreignKey: 'attributeId', as: 'templateLinks' });
  ItemAttribute.hasMany(models.ItemVariantAttributeValue, { foreignKey: 'attributeId', as: 'variantValues' });
};

module.exports = ItemAttribute;
