'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PosTerminalUser = sequelize.define('PosTerminalUser', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  terminalId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'terminal_id',
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
}, {
  tableName: 'pos_terminal_users',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['terminal_id', 'user_id'],
      name: 'uq_pos_tu_terminal_user',
    },
  ],
});

module.exports = PosTerminalUser;
