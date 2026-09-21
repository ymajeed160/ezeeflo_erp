const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Employee Document Model
 * 
 * Stores uploaded documents for employees
 */
const EmployeeDocument = sequelize.define('EmployeeDocument', {
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
  employeeId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'employee_id',
  },
  documentType: {
    type: DataTypes.ENUM('Contract', 'Passport', 'Visa', 'EmiratesID', 'LaborCard', 'Certificate', 'OfferLetter', 'Warning', 'Other'),
    allowNull: false,
    field: 'document_type',
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  fileName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'file_name',
  },
  filePath: {
    type: DataTypes.STRING(500),
    allowNull: false,
    field: 'file_path',
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'file_size',
  },
  mimeType: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'mime_type',
  },
  issueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'issue_date',
  },
  expiryDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'expiry_date',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'created_by',
  },
}, {
  tableName: 'employee_documents',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['tenant_id'] },
    { fields: ['employee_id'] },
    { fields: ['document_type'] },
    { fields: ['expiry_date'] },
  ],
});

module.exports = EmployeeDocument;
