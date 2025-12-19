const User = require('./User');
const Manager = require('./Manager');
const Seller = require('./Seller');
const Product = require('./Product');
const ProductAssignment = require('./ProductAssignment');
const Sale = require('./Sale');
const Conversation = require('./Conversation');
const Message = require('./Message');

// Associations User
Manager.belongsTo(User, { foreignKey: 'user_id' });
User.hasOne(Manager, { foreignKey: 'user_id' });

Seller.belongsTo(User, { foreignKey: 'user_id' });
User.hasOne(Seller, { foreignKey: 'user_id' });

// Manager - Seller
Seller.belongsTo(Manager, { foreignKey: 'manager_id' });
Manager.hasMany(Seller, { foreignKey: 'manager_id' });

// Manager - Product
Product.belongsTo(Manager, { foreignKey: 'manager_id' });
Manager.hasMany(Product, { foreignKey: 'manager_id' });

// ProductAssignment
ProductAssignment.belongsTo(Product, { foreignKey: 'product_id' });
Product.hasMany(ProductAssignment, { foreignKey: 'product_id' });

ProductAssignment.belongsTo(Seller, { foreignKey: 'seller_id' });
Seller.hasMany(ProductAssignment, { foreignKey: 'seller_id' });

// Sale associations
Sale.belongsTo(ProductAssignment, { foreignKey: 'assignment_id' });
ProductAssignment.hasMany(Sale, { foreignKey: 'assignment_id' });

Sale.belongsTo(Seller, { foreignKey: 'seller_id' });
Seller.hasMany(Sale, { foreignKey: 'seller_id' });

Sale.belongsTo(Manager, { foreignKey: 'manager_id' });
Manager.hasMany(Sale, { foreignKey: 'manager_id' });

// Conversation associations
Conversation.belongsTo(Manager, { foreignKey: 'manager_id' });
Manager.hasMany(Conversation, { foreignKey: 'manager_id' });

Conversation.belongsTo(Seller, { foreignKey: 'seller_id' });
Seller.hasMany(Conversation, { foreignKey: 'seller_id' });

// Message associations
Message.belongsTo(Conversation, { foreignKey: 'conversation_id' });
Conversation.hasMany(Message, { foreignKey: 'conversation_id' });

Message.belongsTo(User, { foreignKey: 'sender_id', as: 'Sender' });

module.exports = { User, Manager, Seller, Product, ProductAssignment, Sale, Conversation, Message };