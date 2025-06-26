const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const User = require('./User');

const Issue = sequelize.define('Issue', {
  description: DataTypes.STRING,
  status: {
    type: DataTypes.ENUM('unassigned', 'assigned', 'resolved'),
    defaultValue: 'unassigned'
  },
  assignedAgentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: User, key: 'id' }
  }
});

User.hasMany(Issue, { foreignKey: 'assignedAgentId' });
Issue.belongsTo(User, { foreignKey: 'assignedAgentId', as: 'assignedAgent' });

module.exports = Issue;