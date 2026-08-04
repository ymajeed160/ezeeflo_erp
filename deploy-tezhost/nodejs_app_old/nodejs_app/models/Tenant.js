const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tenant = sequelize.define('Tenant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  subdomain: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: { isEmail: true },
  },
  phone: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  postalCode: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  trnTin: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'trn_tin',
  },
  electronicIdentifier: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'electronic_identifier',
  },
  legalRegistrationIdentifier: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'legal_registration_identifier',
  },
  legalRegistrationIdentifierType: {
    type: DataTypes.ENUM('TL', 'EID', 'PAS', 'CD'),
    allowNull: true,
    field: 'legal_registration_identifier_type',
  },
  logo: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  subscriptionPlan: {
    type: DataTypes.ENUM('trial', 'basic', 'standard', 'premium', 'enterprise'),
    defaultValue: 'trial',
  },
  subscriptionExpiry: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  maxUsers: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
  },
  timezone: {
    type: DataTypes.STRING(50),
    defaultValue: '+04:00',
  },
  currencyCode: {
    type: DataTypes.STRING(3),
    defaultValue: 'AED',
  },
  dateFormat: {
    type: DataTypes.STRING(20),
    defaultValue: 'DD/MM/YYYY',
  },
  fiscalYearStart: {
    type: DataTypes.STRING(5),
    defaultValue: '01-01',
    field: 'fiscal_year_start',
  },
  fiscalYearEnd: {
    type: DataTypes.STRING(5),
    defaultValue: '12-31',
    field: 'fiscal_year_end',
  },
  tenantId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
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
  tableName: 'tenants',
  timestamps: true,
  paranoid: false,
  hooks: {
    beforeCreate: (tenant) => {
      if (!tenant.tenantId) {
        tenant.tenantId = tenant.id;
      }
    },
  },
});

module.exports = Tenant;