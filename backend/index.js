// index.js - Production Mode
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { sequelize } = require('./config/db');
const User = require('./models/User');

// Charger les associations
require('./models/index');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', mode: 'production' });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/managers', require('./routes/managers'));
app.use('/api/sellers', require('./routes/sellers'));
app.use('/api/products', require('./routes/products'));
app.use('/api/sales', require('./routes/sales'));

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true }); // alter: true pour mettre à jour les tables existantes

    // Créer le SUPER_ADMIN s'il n'existe pas (via variables d'environnement)
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminEmail && adminPassword) {
      const exists = await User.findOne({ where: { email: adminEmail } });
      if (!exists) {
        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash(adminPassword, 10);
        await User.create({ email: adminEmail, password: hash, role: 'SUPER_ADMIN' });
        console.log(`✅ SUPER_ADMIN créé: ${adminEmail}`);
      }
    }

    app.listen(PORT, () => {
      console.log(`🚀 API server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize DB connection:', err.message);
    process.exit(1);
  }
})();