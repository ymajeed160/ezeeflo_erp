const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Store = sequelize.define('Store', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING(200), allowNull: false },
  code: { type: DataTypes.STRING(50), allowNull: false },
  storeType: { type: DataTypes.ENUM('main', 'branch', 'franchise', 'kiosk', 'popup', 'warehouse'), defaultValue: 'branch' },
  region: { type: DataTypes.STRING(100), allowNull: true },
  country: { type: DataTypes.STRING(100), defaultValue: 'UAE' },
  city: { type: DataTypes.STRING(100), allowNull: true },
  address: { type: DataTypes.STRING(255), allowNull: true },
  phone: { type: DataTypes.STRING(30), allowNull: true },
  email: { type: DataTypes.STRING(150), allowNull: true },
  managerName: { type: DataTypes.STRING(200), allowNull: true },
  timezone: { type: DataTypes.STRING(50), defaultValue: 'Asia/Dubai' },
  openingHours: { type: DataTypes.JSON, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  parentStoreId: { type: DataTypes.UUID, allowNull: true },
  storeGroup: { type: DataTypes.STRING(100), allowNull: true },
  settings: { type: DataTypes.JSON, allowNull: true },
  createdBy: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'stores',
  paranoid: true,
  timestamps: true,
});

Store.associate = (models) => {
  Store.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' });
  Store.belongsTo(models.Store, { foreignKey: 'parentStoreId', as: 'parentStore' });
  Store.hasMany(models.Store, { foreignKey: 'parentStoreId', as: 'childStores' });
};

module.exports = Store;
