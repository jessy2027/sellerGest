const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Manager = sequelize.define(
  'Manager',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    commission_rate: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 10.0 },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { tableName: 'managers', timestamps: true }
);

module.exports = Manager;