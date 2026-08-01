'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ── Branches ──
    await queryInterface.createTable('branches', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      code: { type: Sequelize.STRING(20), allowNull: false },
      name: { type: Sequelize.STRING(150), allowNull: false },
      name_ar: { type: Sequelize.STRING(150), allowNull: true },
      address: { type: Sequelize.TEXT, allowNull: true },
      city: { type: Sequelize.STRING(100), allowNull: true },
      state: { type: Sequelize.STRING(100), allowNull: true },
      country: { type: Sequelize.STRING(100), allowNull: true },
      phone: { type: Sequelize.STRING(30), allowNull: true },
      email: { type: Sequelize.STRING(150), allowNull: true },
      is_head_office: { type: Sequelize.BOOLEAN, defaultValue: false },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('branches', ['tenant_id']);
    await queryInterface.addIndex('branches', ['tenant_id', 'code'], { unique: true });

    // ── Departments ──
    await queryInterface.createTable('departments', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      code: { type: Sequelize.STRING(20), allowNull: false },
      name: { type: Sequelize.STRING(150), allowNull: false },
      name_ar: { type: Sequelize.STRING(150), allowNull: true },
      parent_id: { type: Sequelize.UUID, allowNull: true },
      branch_id: { type: Sequelize.UUID, allowNull: true },
      manager_id: { type: Sequelize.UUID, allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      sort_order: { type: Sequelize.INTEGER, defaultValue: 0 },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('departments', ['tenant_id']);
    await queryInterface.addIndex('departments', ['tenant_id', 'code'], { unique: true });
    await queryInterface.addIndex('departments', ['branch_id']);
    await queryInterface.addIndex('departments', ['parent_id']);

    // ── Designations ──
    await queryInterface.createTable('designations', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      code: { type: Sequelize.STRING(20), allowNull: false },
      name: { type: Sequelize.STRING(150), allowNull: false },
      name_ar: { type: Sequelize.STRING(150), allowNull: true },
      department_id: { type: Sequelize.UUID, allowNull: true },
      grade: { type: Sequelize.STRING(20), allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      sort_order: { type: Sequelize.INTEGER, defaultValue: 0 },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('designations', ['tenant_id']);
    await queryInterface.addIndex('designations', ['tenant_id', 'code'], { unique: true });
    await queryInterface.addIndex('designations', ['department_id']);

    // ── Cost Centers ──
    await queryInterface.createTable('cost_centers', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      code: { type: Sequelize.STRING(20), allowNull: false },
      name: { type: Sequelize.STRING(150), allowNull: false },
      name_ar: { type: Sequelize.STRING(150), allowNull: true },
      department_id: { type: Sequelize.UUID, allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('cost_centers', ['tenant_id']);
    await queryInterface.addIndex('cost_centers', ['tenant_id', 'code'], { unique: true });
    await queryInterface.addIndex('cost_centers', ['department_id']);

    // ── Employees ──
    await queryInterface.createTable('employees', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      employee_code: { type: Sequelize.STRING(30), allowNull: false },
      first_name: { type: Sequelize.STRING(100), allowNull: false },
      middle_name: { type: Sequelize.STRING(100), allowNull: true },
      last_name: { type: Sequelize.STRING(100), allowNull: false },
      full_name_ar: { type: Sequelize.STRING(300), allowNull: true },
      gender: { type: Sequelize.ENUM('Male', 'Female', 'Other'), allowNull: true },
      date_of_birth: { type: Sequelize.DATEONLY, allowNull: true },
      place_of_birth: { type: Sequelize.STRING(150), allowNull: true },
      nationality: { type: Sequelize.STRING(100), allowNull: true },
      religion: { type: Sequelize.STRING(50), allowNull: true },
      marital_status: { type: Sequelize.ENUM('Single', 'Married', 'Divorced', 'Widowed'), allowNull: true },
      blood_group: { type: Sequelize.STRING(5), allowNull: true },
      personal_email: { type: Sequelize.STRING(150), allowNull: true },
      work_email: { type: Sequelize.STRING(150), allowNull: true },
      mobile_number: { type: Sequelize.STRING(30), allowNull: true },
      work_phone: { type: Sequelize.STRING(30), allowNull: true },
      emergency_contact_name: { type: Sequelize.STRING(150), allowNull: true },
      emergency_contact_number: { type: Sequelize.STRING(30), allowNull: true },
      emergency_contact_relation: { type: Sequelize.STRING(50), allowNull: true },
      address_line1: { type: Sequelize.STRING(255), allowNull: true },
      address_line2: { type: Sequelize.STRING(255), allowNull: true },
      city: { type: Sequelize.STRING(100), allowNull: true },
      state: { type: Sequelize.STRING(100), allowNull: true },
      country: { type: Sequelize.STRING(100), allowNull: true },
      postal_code: { type: Sequelize.STRING(20), allowNull: true },
      passport_number: { type: Sequelize.STRING(50), allowNull: true },
      passport_issue_date: { type: Sequelize.DATEONLY, allowNull: true },
      passport_expiry_date: { type: Sequelize.DATEONLY, allowNull: true },
      passport_issue_country: { type: Sequelize.STRING(100), allowNull: true },
      visa_number: { type: Sequelize.STRING(50), allowNull: true },
      visa_type: { type: Sequelize.STRING(50), allowNull: true },
      visa_issue_date: { type: Sequelize.DATEONLY, allowNull: true },
      visa_expiry_date: { type: Sequelize.DATEONLY, allowNull: true },
      visa_issue_place: { type: Sequelize.STRING(100), allowNull: true },
      emirates_id: { type: Sequelize.STRING(50), allowNull: true },
      emirates_id_expiry_date: { type: Sequelize.DATEONLY, allowNull: true },
      labor_card_number: { type: Sequelize.STRING(50), allowNull: true },
      labor_card_expiry_date: { type: Sequelize.DATEONLY, allowNull: true },
      joining_date: { type: Sequelize.DATEONLY, allowNull: true },
      confirmation_date: { type: Sequelize.DATEONLY, allowNull: true },
      contract_start_date: { type: Sequelize.DATEONLY, allowNull: true },
      contract_end_date: { type: Sequelize.DATEONLY, allowNull: true },
      contract_type: { type: Sequelize.ENUM('Limited', 'Unlimited', 'Part-Time', 'Contractor', 'Intern', 'Probation'), allowNull: true },
      employment_type: { type: Sequelize.ENUM('Full-Time', 'Part-Time', 'Contract', 'Temporary', 'Intern', 'Consultant'), allowNull: true },
      probation_end_date: { type: Sequelize.DATEONLY, allowNull: true },
      resignation_date: { type: Sequelize.DATEONLY, allowNull: true },
      last_working_date: { type: Sequelize.DATEONLY, allowNull: true },
      termination_date: { type: Sequelize.DATEONLY, allowNull: true },
      termination_reason: { type: Sequelize.TEXT, allowNull: true },
      department_id: { type: Sequelize.UUID, allowNull: true },
      designation_id: { type: Sequelize.UUID, allowNull: true },
      branch_id: { type: Sequelize.UUID, allowNull: true },
      cost_center_id: { type: Sequelize.UUID, allowNull: true },
      reporting_manager_id: { type: Sequelize.UUID, allowNull: true },
      basic_salary: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      housing_allowance: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      transport_allowance: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      other_allowances: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      total_salary: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      salary_currency: { type: Sequelize.STRING(3), defaultValue: 'AED' },
      bank_name: { type: Sequelize.STRING(150), allowNull: true },
      bank_account_number: { type: Sequelize.STRING(50), allowNull: true },
      iban: { type: Sequelize.STRING(50), allowNull: true },
      swift_code: { type: Sequelize.STRING(20), allowNull: true },
      wps_agent_code: { type: Sequelize.STRING(50), allowNull: true },
      status: { type: Sequelize.ENUM('Active', 'Inactive', 'On Leave', 'Suspended', 'Terminated', 'Resigned', 'Retired'), defaultValue: 'Active' },
      photo: { type: Sequelize.STRING(255), allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('employees', ['tenant_id']);
    await queryInterface.addIndex('employees', ['tenant_id', 'employee_code'], { unique: true });
    await queryInterface.addIndex('employees', ['department_id']);
    await queryInterface.addIndex('employees', ['designation_id']);
    await queryInterface.addIndex('employees', ['branch_id']);
    await queryInterface.addIndex('employees', ['cost_center_id']);
    await queryInterface.addIndex('employees', ['reporting_manager_id']);
    await queryInterface.addIndex('employees', ['status']);
    await queryInterface.addIndex('employees', ['joining_date']);
    await queryInterface.addIndex('employees', ['contract_end_date']);

    // ── Employee Documents ──
    await queryInterface.createTable('employee_documents', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      employee_id: { type: Sequelize.UUID, allowNull: false },
      document_type: { type: Sequelize.ENUM('Contract', 'Passport', 'Visa', 'EmiratesID', 'LaborCard', 'Certificate', 'OfferLetter', 'Warning', 'Other'), allowNull: false },
      title: { type: Sequelize.STRING(200), allowNull: false },
      file_name: { type: Sequelize.STRING(255), allowNull: false },
      file_path: { type: Sequelize.STRING(500), allowNull: false },
      file_size: { type: Sequelize.INTEGER, allowNull: true },
      mime_type: { type: Sequelize.STRING(100), allowNull: true },
      issue_date: { type: Sequelize.DATEONLY, allowNull: true },
      expiry_date: { type: Sequelize.DATEONLY, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('employee_documents', ['tenant_id']);
    await queryInterface.addIndex('employee_documents', ['employee_id']);
    await queryInterface.addIndex('employee_documents', ['document_type']);
    await queryInterface.addIndex('employee_documents', ['expiry_date']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('employee_documents');
    await queryInterface.dropTable('employees');
    await queryInterface.dropTable('cost_centers');
    await queryInterface.dropTable('designations');
    await queryInterface.dropTable('departments');
    await queryInterface.dropTable('branches');
  }
};
