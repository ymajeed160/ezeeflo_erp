const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const License = sequelize.define('License', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'company_id',
  },
  subscriptionId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'subscription_id',
  },
  licenseNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'license_number',
  },
  licenseKey: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'license_key',
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'start_date',
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'end_date',
  },
  renewalDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'renewal_date',
  },
  status: {
    type: DataTypes.ENUM('active', 'expired', 'suspended', 'cancelled'),
    defaultValue: 'active',
  },
  gracePeriodDays: {
    type: DataTypes.INTEGER,
    defaultValue: 7,
    field: 'grace_period_days',
  },
  gracePeriodEnd: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'grace_period_end',
  },
  suspendedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'suspended_at',
  },
  suspendedReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'suspended_reason',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
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
  tableName: 'licenses',
  timestamps: true,
  paranoid: false,
});

module.exports = License;
