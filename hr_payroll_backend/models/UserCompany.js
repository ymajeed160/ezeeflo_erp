const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserCompany = sequelize.define('UserCompany', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
  companyId: { type: DataTypes.UUID, allowNull: false, field: 'company_id' },
  isDefault: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_default' },
}, {
  tableName: 'user_companies',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['company_id'] },
    { fields: ['user_id', 'company_id'], unique: true },
  ],
});

module.exports = UserCompany;
