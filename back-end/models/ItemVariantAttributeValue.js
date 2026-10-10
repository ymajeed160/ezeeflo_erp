const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ItemVariantAttributeValue = sequelize.define('ItemVariantAttributeValue', {
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
  variantId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'variant_id',
  },
  attributeId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'attribute_id',
  },
  optionId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'option_id',
  },
  value: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'value',
  },
  displayValue: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'display_value',
  },
}, {
  tableName: 'item_variant_attribute_values',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  paranoid: false,
  indexes: [
    { fields: ['variant_id'], name: 'idx_item_var_attr_values_variant' },
    { unique: true, fields: ['variant_id', 'attribute_id'], name: 'unique_item_var_attr_value' },
  ],
});

ItemVariantAttributeValue.associate = (models) => {
  ItemVariantAttributeValue.belongsTo(models.ItemVariant, { foreignKey: 'variantId', as: 'variant' });
  ItemVariantAttributeValue.belongsTo(models.ItemAttribute, { foreignKey: 'attributeId', as: 'attribute' });
  ItemVariantAttributeValue.belongsTo(models.ItemAttributeOption, { foreignKey: 'optionId', as: 'option' });
};

module.exports = ItemVariantAttributeValue;
