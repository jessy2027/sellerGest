const User = require('./User');
const Manager = require('./Manager');
const Seller = require('./Seller');
const Product = require('./Product');
const ProductAssignment = require('./ProductAssignment');
const Sale = require('./Sale');

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
ProductAssignment.hasOne(Sale, { foreignKey: 'assignment_id' });

Sale.belongsTo(Seller, { foreignKey: 'seller_id' });
Seller.hasMany(Sale, { foreignKey: 'seller_id' });

Sale.belongsTo(Manager, { foreignKey: 'manager_id' });
Manager.hasMany(Sale, { foreignKey: 'manager_id' });

module.exports = { User, Manager, Seller, Product, ProductAssignment, Sale };