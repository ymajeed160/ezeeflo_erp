const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PurchaseRequest = sequelize.define('PurchaseRequest', {
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
  requestNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'request_number',
  },
  requestDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'request_date',
  },
  requestedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'requested_by',
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'department',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('draft', 'submitted', 'approved', 'rejected', 'converted'),
    allowNull: false,
    defaultValue: 'draft',
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
  deletedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'deleted_by',
  },
  deleteReason: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'delete_reason',
  },
  cancelReason: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'cancel_reason',
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'created_at',
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'updated_at',
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'deleted_at',
  },
}, {
  tableName: 'purchase_requests',
  timestamps: true,
  paranoid: true,
  indexes: [
    { unique: true, fields: ['request_number', 'tenant_id'] },
    { fields: ['tenant_id', 'status'] },
    { fields: ['tenant_id', 'request_date'] },
  ],
});

const PurchaseRequestDetail = sequelize.define('PurchaseRequestDetail', {
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
  purchaseRequestId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'purchase_request_id',
  },
  itemId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'item_id',
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  quantity: {
    type: DataTypes.DECIMAL(18, 4),
    allowNull: false,
    defaultValue: 0,
  },
  requiredDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'required_date',
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'sort_order',
  },
}, {
  tableName: 'purchase_request_details',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['purchase_request_id'] },
    { fields: ['item_id'] },
  ],
});

module.exports = { PurchaseRequest, PurchaseRequestDetail };