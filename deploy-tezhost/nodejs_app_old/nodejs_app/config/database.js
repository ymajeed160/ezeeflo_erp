const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const sequelize = new Sequelize(
  process.env.DB_NAME || 'ezeefloc_erp',
  process.env.DB_USER || 'ezeefloc_erp',
  process.env.DB_PASSWORD || 'Memits@396',
  {
    host: process.env.DB_HOST || 'c28.eelserver.com',
    port: process.env.DB_PORT || 3306,
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