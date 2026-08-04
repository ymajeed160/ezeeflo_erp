const sequelize = require('../config/database');
(async () => {
  await sequelize.authenticate();
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS announcements (
      id CHAR(36) PRIMARY KEY, title VARCHAR(300) NOT NULL, content TEXT NOT NULL,
      type ENUM('general','maintenance','feature','downtime','security','urgent') DEFAULT 'general',
      priority ENUM('low','normal','high','critical') DEFAULT 'normal',
      target_companies JSON, is_published TINYINT(1) DEFAULT 0,
      publish_at DATETIME, expires_at DATETIME,
      created_by CHAR(36), updated_by CHAR(36),
      created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, deleted_at DATETIME
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('announcements table created');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
