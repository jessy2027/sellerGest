const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Product = sequelize.define(
  'Product',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    manager_id: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    category: { type: DataTypes.STRING, allowNull: true },
    base_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    stock_quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    photos_original: { type: DataTypes.JSON, allowNull: true },
    status: { type: DataTypes.ENUM('disponible', 'assigne', 'vendu'), allowNull: false, defaultValue: 'disponible' },
  },
  { tableName: 'products', timestamps: true }
);

module.exports = Product;