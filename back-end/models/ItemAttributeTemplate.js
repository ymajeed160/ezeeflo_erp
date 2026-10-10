const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ItemAttributeTemplate = sequelize.define('ItemAttributeTemplate', {
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
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'description',
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
  tableName: 'item_attribute_templates',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  paranoid: false,
  indexes: [
    { fields: ['tenant_id'], name: 'idx_item_attr_templates_tenant' },
  ],
});

ItemAttributeTemplate.associate = (models) => {
  ItemAttributeTemplate.hasMany(models.ItemAttributeTemplateAttribute, { foreignKey: 'templateId', as: 'templateAttributes' });
  ItemAttributeTemplate.hasMany(models.Item, { foreignKey: 'attributeTemplateId', as: 'items' });
};

module.exports = ItemAttributeTemplate;
