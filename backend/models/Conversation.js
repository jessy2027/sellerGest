const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Conversation = sequelize.define(
    'Conversation',
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        manager_id: { type: DataTypes.INTEGER, allowNull: false },
        seller_id: { type: DataTypes.INTEGER, allowNull: false },
        last_message_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
        tableName: 'conversations',
        timestamps: true,
        indexes: [
            { unique: true, fields: ['manager_id', 'seller_id'] }
        ]
    }
);

module.exports = Conversation;
