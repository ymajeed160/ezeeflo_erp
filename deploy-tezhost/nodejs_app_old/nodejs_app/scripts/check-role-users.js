const { Sequelize } = require('sequelize');
const path = require('path');
const config = require(path.join(__dirname, '..', 'config', 'config.json'));
(async () => {
  const s = new Sequelize(config.development.database, config.development.username, config.development.password, { host: config.development.host, port: config.development.port, dialect: config.development.dialect });
  const tid = '11111111-1111-1111-1111-111111111111';
  const [roles] = await s.query('SELECT id, name, code FROM roles WHERE tenant_id = ?', { replacements: [tid] });
  console.log('Roles:');
  roles.forEach(r => console.log(' ' + r.id.substring(0,8) + ' | ' + r.name + ' | ' + r.code));
  const [ur] = await s.query('SELECT ur.role_id, u.id as user_id, u.username FROM user_roles ur JOIN users u ON ur.user_id = u.id WHERE ur.tenant_id = ?', { replacements: [tid] });
  console.log('\nUser-Role:');
  ur.forEach(x => console.log(' role=' + x.role_id.substring(0,8) + ' user=' + x.user_id.substring(0,8) + ' ' + x.username));
  process.exit(0);
})();
