const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EosbCalculation = sequelize.define('EosbCalculation', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  employeeId: { type: DataTypes.UUID, allowNull: false, field: 'employee_id' },
  calculationDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'calculation_date' },
  joiningDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'joining_date' },
  lastWorkingDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'last_working_date' },
  yearsOfService: { type: DataTypes.DECIMAL(5, 2), allowNull: false, field: 'years_of_service' },
  basicSalary: { type: DataTypes.DECIMAL(12, 2), allowNull: false, field: 'basic_salary' },
  terminationType: { type: DataTypes.ENUM('Resignation', 'Termination', 'Retirement', 'Death', 'ContractEnd'), allowNull: false, field: 'termination_type' },
  dailyWage: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'daily_wage' },
  first5YearsAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'first_5_years_amount' },
  after5YearsAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'after_5_years_amount' },
  totalEosbAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'total_eosb_amount' },
  maxCapAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'max_cap_amount', comment: '2 years salary cap per UAE law' },
  notes: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
}, { tableName: 'eosb_calculations', timestamps: true, paranoid: true, indexes: [{ fields: ['tenant_id'] }, { fields: ['employee_id'] }] });

const EosbSettlement = sequelize.define('EosbSettlement', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, field: 'tenant_id' },
  settlementNumber: { type: DataTypes.STRING(30), allowNull: false, field: 'settlement_number' },
  employeeId: { type: DataTypes.UUID, allowNull: false, field: 'employee_id' },
  calculationId: { type: DataTypes.UUID, allowNull: true, field: 'calculation_id' },
  settlementDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'settlement_date' },
  eosbAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'eosb_amount' },
  leaveEncashment: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'leave_encashment' },
  gratuityAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'gratuity_amount' },
  otherDues: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'other_dues' },
  deductions: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  netSettlement: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'net_settlement' },
  paymentMode: { type: DataTypes.ENUM('Bank Transfer', 'Cash', 'Cheque'), defaultValue: 'Bank Transfer', field: 'payment_mode' },
  status: { type: DataTypes.ENUM('Draft', 'Calculated', 'Approved', 'Paid'), defaultValue: 'Draft' },
  approvedBy: { type: DataTypes.UUID, allowNull: true, field: 'approved_by' },
  paidDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'paid_date' },
  notes: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, { tableName: 'eosb_settlements', timestamps: true, paranoid: true, indexes: [{ fields: ['tenant_id'] }, { fields: ['employee_id'] }, { fields: ['status'] }] });

module.exports = { EosbCalculation, EosbSettlement };
