const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ItemAttributeTemplateAttribute = sequelize.define('ItemAttributeTemplateAttribute', {
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
  templateId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'template_id',
  },
  attributeId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'attribute_id',
  },
  isRequired: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_required',
  },
  isVariantDefining: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_variant_defining',
  },
  displayOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'display_order',
  },
}, {
  tableName: 'item_attribute_template_attributes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  paranoid: false,
  indexes: [
    { fields: ['template_id'], name: 'idx_item_attr_tpl_attrs_tpl' },
    { unique: true, fields: ['template_id', 'attribute_id'], name: 'unique_item_attr_tpl_attr' },
  ],
});

ItemAttributeTemplateAttribute.associate = (models) => {
  ItemAttributeTemplateAttribute.belongsTo(models.ItemAttributeTemplate, { foreignKey: 'templateId', as: 'template' });
  ItemAttributeTemplateAttribute.belongsTo(models.ItemAttribute, { foreignKey: 'attributeId', as: 'attribute' });
};

module.exports = ItemAttributeTemplateAttribute;
