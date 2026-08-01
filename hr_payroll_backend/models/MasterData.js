const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MasterCountry = sequelize.define('MasterCountry', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  code: { type: DataTypes.STRING(5), allowNull: false },
  name: { type: DataTypes.STRING(150), allowNull: false },
  nameAr: { type: DataTypes.STRING(150), field: 'name_ar' },
  nationality: { type: DataTypes.STRING(100) },
  nationalityAr: { type: DataTypes.STRING(100), field: 'nationality_ar' },
  phoneCode: { type: DataTypes.STRING(10), field: 'phone_code' },
  currencyCode: { type: DataTypes.STRING(5), field: 'currency_code' },
  currencySymbol: { type: DataTypes.STRING(5), field: 'currency_symbol' },
  flagEmoji: { type: DataTypes.STRING(10), field: 'flag_emoji' },
  isSystem: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_system' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  sortOrder: { type: DataTypes.INTEGER, defaultValue: 0, field: 'sort_order' },
  createdBy: { type: DataTypes.UUID, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, field: 'updated_by' },
}, { tableName: 'master_countries', timestamps: true, underscored: true, paranoid: true });

const MasterState = sequelize.define('MasterState', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  countryId: { type: DataTypes.UUID, allowNull: false, field: 'country_id' },
  code: { type: DataTypes.STRING(10) },
  name: { type: DataTypes.STRING(150), allowNull: false },
  nameAr: { type: DataTypes.STRING(150), field: 'name_ar' },
  isSystem: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_system' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  sortOrder: { type: DataTypes.INTEGER, defaultValue: 0, field: 'sort_order' },
  createdBy: { type: DataTypes.UUID, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, field: 'updated_by' },
}, { tableName: 'master_states', timestamps: true, underscored: true, paranoid: true });

MasterState.belongsTo(MasterCountry, { as: 'country', foreignKey: 'country_id' });

const MasterData = sequelize.define('MasterData', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  type: { type: DataTypes.STRING(50), allowNull: false },
  code: { type: DataTypes.STRING(50) },
  name: { type: DataTypes.STRING(200), allowNull: false },
  nameAr: { type: DataTypes.STRING(200), field: 'name_ar' },
  description: { type: DataTypes.TEXT },
  parentId: { type: DataTypes.UUID, field: 'parent_id' },
  metadata: { type: DataTypes.JSON },
  isSystem: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_system' },
  isDefault: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_default' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  sortOrder: { type: DataTypes.INTEGER, defaultValue: 0, field: 'sort_order' },
  createdBy: { type: DataTypes.UUID, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, field: 'updated_by' },
  deletedBy: { type: DataTypes.UUID, field: 'deleted_by' },
}, { tableName: 'master_data', timestamps: true, underscored: true, paranoid: true });

const MasterDataAudit = sequelize.define('MasterDataAudit', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  recordId: { type: DataTypes.UUID, allowNull: false, field: 'record_id' },
  recordType: { type: DataTypes.STRING(50), allowNull: false, field: 'record_type' },
  userId: { type: DataTypes.UUID, field: 'user_id' },
  username: { type: DataTypes.STRING(100) },
  action: { type: DataTypes.ENUM('create', 'update', 'delete', 'restore', 'activate', 'deactivate'), allowNull: false },
  fieldName: { type: DataTypes.STRING(100), field: 'field_name' },
  oldValue: { type: DataTypes.TEXT, field: 'old_value' },
  newValue: { type: DataTypes.TEXT, field: 'new_value' },
  ipAddress: { type: DataTypes.STRING(45), field: 'ip_address' },
}, { tableName: 'master_data_audit', timestamps: true, underscored: true, updatedAt: false });


const MasterCity = sequelize.define('MasterCity', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  stateId: { type: DataTypes.UUID, field: 'state_id' },
  countryId: { type: DataTypes.UUID, allowNull: false, field: 'country_id' },
  name: { type: DataTypes.STRING(150), allowNull: false },
  nameAr: { type: DataTypes.STRING(150), field: 'name_ar' },
  isSystem: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_system' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  sortOrder: { type: DataTypes.INTEGER, defaultValue: 0, field: 'sort_order' },
  createdBy: { type: DataTypes.UUID, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, field: 'updated_by' },
}, { tableName: 'master_cities', timestamps: true, underscored: true, paranoid: true });

MasterCity.belongsTo(MasterCountry, { as: 'country', foreignKey: 'country_id' });
MasterCity.belongsTo(MasterState, { as: 'state', foreignKey: 'state_id' });

module.exports = { MasterCountry, MasterState, MasterCity, MasterData, MasterDataAudit };
