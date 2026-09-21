/**
 * Seed default Super Admin account
 * Run: node hr_payroll_backend/seeders/seedSuperAdmin.js
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const SuperAdmin = require('../models/SuperAdmin');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    // Create super_admins table if not exists
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS super_admins (
        id CHAR(36) NOT NULL PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(30),
        profile_picture VARCHAR(500),
        is_active TINYINT(1) DEFAULT 1,
        is_locked TINYINT(1) DEFAULT 0,
        locked_at DATETIME,
        login_attempts INT DEFAULT 0,
        last_login_at DATETIME,
        last_login_ip VARCHAR(45),
        password_changed_at DATETIME,
        must_change_password TINYINT(1) DEFAULT 0,
        refresh_token VARCHAR(500),
        created_by CHAR(36),
        updated_by CHAR(36),
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        deleted_at DATETIME
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('super_admins table ready.');

    // Create super_admin_companies table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS super_admin_companies (
        id CHAR(36) NOT NULL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        legal_name VARCHAR(300),
        trade_license_number VARCHAR(100),
        tax_registration_number VARCHAR(100),
        country VARCHAR(100),
        city VARCHAR(100),
        address TEXT,
        phone VARCHAR(30),
        email VARCHAR(150),
        website VARCHAR(255),
        logo_url VARCHAR(500),
        timezone VARCHAR(50) DEFAULT 'Asia/Dubai',
        currency VARCHAR(5) DEFAULT 'AED',
        language VARCHAR(10) DEFAULT 'en',
        working_days VARCHAR(50) DEFAULT 'Mon,Tue,Wed,Thu,Fri',
        financial_year_start VARCHAR(5) DEFAULT '01-01',
        status ENUM('active','inactive','suspended','expired','pending_activation','archived') DEFAULT 'pending_activation',
        subscription_plan VARCHAR(100),
        subscription_start_date DATE,
        subscription_expiry_date DATE,
        max_employees INT DEFAULT 50,
        max_users INT DEFAULT 10,
        max_branches INT DEFAULT 5,
        max_departments INT DEFAULT 10,
        max_payroll_runs INT DEFAULT 12,
        storage_limit_mb INT DEFAULT 1024,
        max_api_requests INT DEFAULT 10000,
        grace_period_days INT DEFAULT 15,
        notes TEXT,
        created_by CHAR(36),
        updated_by CHAR(36),
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        deleted_at DATETIME
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('super_admin_companies table ready.');

    // Create super_admin_login_history table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS super_admin_login_history (
        id CHAR(36) NOT NULL PRIMARY KEY,
        super_admin_id CHAR(36) NOT NULL,
        ip_address VARCHAR(45),
        user_agent VARCHAR(500),
        login_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        logout_at DATETIME,
        is_success TINYINT(1) DEFAULT 1,
        failure_reason VARCHAR(255),
        session_duration INT,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        FOREIGN KEY (super_admin_id) REFERENCES super_admins(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('super_admin_login_history table ready.');

    // Create super_admin_audit_logs table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS super_admin_audit_logs (
        id CHAR(36) NOT NULL PRIMARY KEY,
        super_admin_id CHAR(36) NOT NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100),
        entity_id CHAR(36),
        description TEXT,
        old_values JSON,
        new_values JSON,
        ip_address VARCHAR(45),
        user_agent VARCHAR(500),
        metadata JSON,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        FOREIGN KEY (super_admin_id) REFERENCES super_admins(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('super_admin_audit_logs table ready.');

    // Check if default super admin exists
    const existing = await SuperAdmin.findOne({ where: { email: 'admin@ezeeflo.com' } });
    if (existing) {
      console.log('Default Super Admin already exists. Skipping seed.');
      process.exit(0);
    }

    // Create default super admin
    const hashedPassword = await bcrypt.hash('Admin@123', 12);
    await SuperAdmin.create({
      username: 'superadmin',
      email: 'admin@ezeeflo.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      phone: '+971500000000',
      isActive: true,
      mustChangePassword: false,
    });

    console.log('Default Super Admin created successfully!');
    console.log('  Username: superadmin');
    console.log('  Email: admin@ezeeflo.com');
    console.log('  Password: Admin@123');

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
