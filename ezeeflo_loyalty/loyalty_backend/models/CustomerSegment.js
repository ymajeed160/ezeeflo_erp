const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CustomerSegment = sequelize.define('CustomerSegment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING(200), allowNull: false },
  code: { type: DataTypes.STRING(50), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  segmentType: {
    type: DataTypes.ENUM('dynamic', 'static', 'ai_generated'),
    defaultValue: 'dynamic',
  },
  // JSON: filter rules like { field, operator, value }[]
  filters: { type: DataTypes.JSON, allowNull: true },
  // JSON: customer IDs for static segments
  customerIds: { type: DataTypes.JSON, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  refreshInterval: { type: DataTypes.INTEGER, defaultValue: 1440 },
  lastRefreshedAt: { type: DataTypes.DATE, allowNull: true },
  customerCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  createdBy: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'customer_segments',
  paranoid: true,
  timestamps: true,
});

CustomerSegment.associate = (models) => {
  CustomerSegment.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' });
};

module.exports = CustomerSegment;
