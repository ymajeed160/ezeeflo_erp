const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ItemVariant = sequelize.define('ItemVariant', {
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
  itemId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'item_id',
  },
  sku: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'sku',
  },
  configurationKey: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'configuration_key',
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'description',
  },
  costPrice: {
    type: DataTypes.DECIMAL(18, 4),
    allowNull: true,
    defaultValue: 0,
    field: 'cost_price',
  },
  sellingPrice: {
    type: DataTypes.DECIMAL(18, 4),
    allowNull: true,
    defaultValue: 0,
    field: 'selling_price',
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
  tableName: 'item_variants',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  paranoid: true,
  indexes: [
    { fields: ['tenant_id'], name: 'idx_item_variants_tenant' },
    { fields: ['item_id'], name: 'idx_item_variants_item' },
    { unique: true, fields: ['tenant_id', 'sku'], name: 'unique_item_variant_sku_tenant' },
    { unique: true, fields: ['tenant_id', 'item_id', 'configuration_key'], name: 'unique_item_variant_config_tenant_item' },
    { fields: ['item_id', 'is_active'], name: 'idx_item_variants_item_active' },
  ],
});

ItemVariant.associate = (models) => {
  ItemVariant.belongsTo(models.Item, { foreignKey: 'itemId', as: 'item' });
  ItemVariant.hasMany(models.ItemVariantAttributeValue, { foreignKey: 'variantId', as: 'attributeValues' });
};

module.exports = ItemVariant;
