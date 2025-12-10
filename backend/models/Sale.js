const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Sale = sequelize.define(
    'Sale',
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        assignment_id: { type: DataTypes.INTEGER, allowNull: false },
        seller_id: { type: DataTypes.INTEGER, allowNull: false },
        manager_id: { type: DataTypes.INTEGER, allowNull: false },
        product_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        seller_commission: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        amount_to_manager: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        status: {
            type: DataTypes.ENUM('pending', 'paid', 'cancelled'),
            allowNull: false,
            defaultValue: 'pending',
        },
        sold_at: { type: DataTypes.DATE, allowNull: true },
        paid_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'sales', timestamps: true }
);

module.exports = Sale;
