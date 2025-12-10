const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define(
  'User',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
    password: { type: DataTypes.STRING, allowNull: false },
    role: {
      type: DataTypes.ENUM('SUPER_ADMIN', 'MANAGER', 'SELLER'),
      allowNull: false,
      defaultValue: 'SELLER',
    },
  },
  {
    tableName: 'users',
    timestamps: true,
    underscored: false,
  }
);

module.exports = User;