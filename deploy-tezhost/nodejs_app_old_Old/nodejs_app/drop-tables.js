require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: console.log,
  }
);

async function dropAllTables() {
  try {
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    console.log('FK checks disabled');

    const [tables] = await sequelize.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = '${process.env.DB_NAME}' AND TABLE_TYPE = 'BASE TABLE'`
    );

    for (const { TABLE_NAME } of tables) {
      await sequelize.query(`DROP TABLE IF EXISTS \`${TABLE_NAME}\``);
      console.log(`Dropped table: ${TABLE_NAME}`);
    }

    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('FK checks enabled. All tables dropped.');

    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    await sequelize.close();
    process.exit(1);
  }
}

dropAllTables();