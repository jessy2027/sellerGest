// index.js - Production Mode with Socket.io
const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const { sequelize } = require('./config/db');
const User = require('./models/User');
const { initSocket } = require('./socket');

// Charger les associations
require('./models/index');

const path = require('path');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialiser Socket.io
initSocket(server);

app.use(cors());
app.use(express.json());

// Servir les fichiers uploadés
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', mode: 'production', websocket: true });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/managers', require('./routes/managers'));
app.use('/api/sellers', require('./routes/sellers'));
app.use('/api/products', require('./routes/products'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/chat', require('./routes/chat'));

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

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

    server.listen(PORT, () => {
      console.log(`🚀 API server listening on port ${PORT}`);
      console.log(`🔌 WebSocket server ready`);
    });
  } catch (err) {
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
      console.error('❌ Database Validation Error:');
      err.errors.forEach(e => {
        console.error(`  - ${e.path}: ${e.message} (value: ${e.value})`);
      });
    } else {
      console.error('Failed to initialize DB connection:', err.message);
    }
    process.exit(1);
  }
})();