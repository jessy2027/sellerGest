const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Seller = sequelize.define(
  'Seller',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    manager_id: { type: DataTypes.INTEGER, allowNull: true },
    vinted_profile: { type: DataTypes.STRING, allowNull: true },
    commission_rate: { type: DataTypes.DECIMAL(5, 2), allowNull: true, defaultValue: 15.0 },
    balance: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { tableName: 'sellers', timestamps: true }
);

module.exports = Seller;