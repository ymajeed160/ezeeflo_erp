const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ItemAttributeOption = sequelize.define('ItemAttributeOption', {
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
  attributeId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'attribute_id',
  },
  value: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'value',
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
}, {
  tableName: 'item_attribute_options',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  paranoid: false,
  indexes: [
    { fields: ['attribute_id'], name: 'idx_item_attr_options_attr' },
    { unique: true, fields: ['attribute_id', 'value'], name: 'unique_item_attr_option_value' },
  ],
});

ItemAttributeOption.associate = (models) => {
  ItemAttributeOption.belongsTo(models.ItemAttribute, { foreignKey: 'attributeId', as: 'attribute' });
  ItemAttributeOption.hasMany(models.ItemVariantAttributeValue, { foreignKey: 'optionId', as: 'variantValues' });
};

module.exports = ItemAttributeOption;
