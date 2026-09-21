const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AssetAcquisition = sequelize.define('AssetAcquisition', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  acquisitionNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'acquisition_number',
  },
  acquisitionDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'acquisition_date',
  },
  acquisitionType: {
    type: DataTypes.ENUM('manual', 'purchase_invoice', 'goods_receipt', 'bulk'),
    allowNull: false,
    defaultValue: 'manual',
    field: 'acquisition_type',
  },
  sourceDocumentId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'source_document_id',
  },
  sourceDocumentType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'source_document_type',
  },
  supplierId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'supplier_id',
  },
  totalCost: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'total_cost',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isPosted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'is_posted',
  },
  journalEntryId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'journal_entry_id',
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
  tableName: 'asset_acquisitions',
  underscored: true,
  timestamps: true,
  paranoid: false,
  indexes: [
    {
      unique: true,
      fields: ['acquisition_number', 'tenant_id'],
      name: 'unique_acquisition_number_tenant',
    },
    {
      fields: ['tenant_id'],
      name: 'idx_acquisitions_tenant',
    },
  ],
});

module.exports = AssetAcquisition;
