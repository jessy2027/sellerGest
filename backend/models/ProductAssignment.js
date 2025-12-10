const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ProductAssignment = sequelize.define(
  'ProductAssignment',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    product_id: { type: DataTypes.INTEGER, allowNull: false },
    seller_id: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM('en_vente', 'vendu', 'probleme'),
      allowNull: false,
      defaultValue: 'en_vente',
    },
    assigned_at: { type: DataTypes.DATE, allowNull: true },
    sold_at: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: 'product_assignments', timestamps: true }
);

module.exports = ProductAssignment;