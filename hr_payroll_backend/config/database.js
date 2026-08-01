const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const sequelize = new Sequelize(
  process.env.HR_DB_NAME || 'ezeeflo_hr_payroll',
  process.env.HR_DB_USER || 'root',
  process.env.HR_DB_PASSWORD || 'Memits@396',
  {
    host: process.env.HR_DB_HOST || '127.0.0.1',
    port: process.env.HR_DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      underscored: true,
      freezeTableName: false,
    },
    timezone: '+04:00',
  }
);

module.exports = sequelize;
