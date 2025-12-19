const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Message = sequelize.define(
    'Message',
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        conversation_id: { type: DataTypes.INTEGER, allowNull: false },
        sender_id: { type: DataTypes.INTEGER, allowNull: false }, // User.id
        content: { type: DataTypes.TEXT, allowNull: false },
        read_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
        tableName: 'messages',
        timestamps: true
    }
);

module.exports = Message;
