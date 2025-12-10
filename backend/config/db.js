const { Sequelize } = require('sequelize');

const hasDbUrl = !!process.env.DATABASE_URL;

let sequelize;

if (hasDbUrl) {
  // Production/remote Postgres via DATABASE_URL
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false,
    dialectOptions: {},
  });
} else {
  // Default to SQLite (dev) to be runnable out-of-the-box
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'database.sqlite',
    logging: false,
  });
}

module.exports = { sequelize };