'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('audit_logs');

    const addCol = async (name, definition) => {
      if (!tableInfo[name]) {
        await queryInterface.addColumn('audit_logs', name, definition);
      }
    };

    await addCol('user_email', {
      type: Sequelize.STRING(150),
      allowNull: true,
    });

    await addCol('user_role', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    await addCol('module', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });

    await addCol('entity_reference_number', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    await addCol('request_id', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    await addCol('session_id', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    await addCol('source', {
      type: Sequelize.ENUM('USER', 'SYSTEM', 'SCHEDULED_JOB', 'API', 'INTEGRATION'),
      defaultValue: 'USER',
      allowNull: false,
    });

    await addCol('status', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });

    await addCol('error_message', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await addCol('changed_fields', {
      type: Sequelize.JSON,
      allowNull: true,
    });

    await addCol('metadata', {
      type: Sequelize.JSON,
      allowNull: true,
    });

    // Add indexes for performance
    const indexes = await queryInterface.showIndex('audit_logs');
    const indexExists = (name) => indexes.some(i => i.name === name);

    if (!indexExists('idx_audit_logs_tenant_id')) {
      await queryInterface.addIndex('audit_logs', ['tenant_id'], { name: 'idx_audit_logs_tenant_id' });
    }
    if (!indexExists('idx_audit_logs_user_id')) {
      await queryInterface.addIndex('audit_logs', ['user_id'], { name: 'idx_audit_logs_user_id' });
    }
    if (!indexExists('idx_audit_logs_action')) {
      await queryInterface.addIndex('audit_logs', ['action'], { name: 'idx_audit_logs_action' });
    }
    if (!indexExists('idx_audit_logs_module')) {
      await queryInterface.addIndex('audit_logs', ['module'], { name: 'idx_audit_logs_module' });
    }
    if (!indexExists('idx_audit_logs_entity')) {
      await queryInterface.addIndex('audit_logs', ['entity', 'entity_id'], { name: 'idx_audit_logs_entity' });
    }
    if (!indexExists('idx_audit_logs_created_at')) {
      await queryInterface.addIndex('audit_logs', ['created_at'], { name: 'idx_audit_logs_created_at' });
    }
    if (!indexExists('idx_audit_logs_request_id')) {
      await queryInterface.addIndex('audit_logs', ['request_id'], { name: 'idx_audit_logs_request_id' });
    }
    if (!indexExists('idx_audit_logs_tenant_created')) {
      await queryInterface.addIndex('audit_logs', ['tenant_id', 'created_at'], { name: 'idx_audit_logs_tenant_created' });
    }
    if (!indexExists('idx_audit_logs_entity_history')) {
      await queryInterface.addIndex('audit_logs', ['tenant_id', 'entity', 'entity_id', 'created_at'], { name: 'idx_audit_logs_entity_history' });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const cols = [
      'user_email', 'user_role', 'module', 'entity_reference_number',
      'request_id', 'session_id', 'source', 'status', 'error_message',
      'changed_fields', 'metadata'
    ];
    for (const col of cols) {
      await queryInterface.removeColumn('audit_logs', col).catch(() => {});
    }
  }
};
