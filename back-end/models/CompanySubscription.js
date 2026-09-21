const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CompanySubscription = sequelize.define('CompanySubscription', {
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
  planId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'plan_id',
  },
  subscriptionNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'subscription_number',
  },
  status: {
    type: DataTypes.ENUM('active', 'trial', 'expired', 'suspended', 'cancelled'),
    defaultValue: 'trial',
  },
  billingCycle: {
    type: DataTypes.ENUM('monthly', 'yearly'),
    defaultValue: 'monthly',
    field: 'billing_cycle',
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'start_date',
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'end_date',
  },
  trialEndDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'trial_end_date',
  },
  renewalDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'renewal_date',
  },
  gracePeriodEnd: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'grace_period_end',
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'cancelled_at',
  },
  cancellationReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'cancellation_reason',
  },
  autoRenew: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'auto_renew',
  },
  isTrial: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_trial',
  },
  priceAtSubscription: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
    field: 'price_at_subscription',
  },
  discountPercent: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    field: 'discount_percent',
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
  tableName: 'company_subscriptions',
  timestamps: true,
  paranoid: false,
});

module.exports = CompanySubscription;
