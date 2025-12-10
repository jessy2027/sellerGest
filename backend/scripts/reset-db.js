/**
 * Script de réinitialisation de la base de données
 * 
 * Utilisation: node scripts/reset-db.js
 * 
 * Ce script:
 * 1. Supprime toutes les tables existantes
 * 2. Recrée les tables avec le schéma actuel
 * 3. Crée un SUPER_ADMIN si ADMIN_EMAIL et ADMIN_PASSWORD sont définis
 */

const dotenv = require('dotenv');
dotenv.config();

const { sequelize } = require('../config/db');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Charger les associations
require('../models/index');

async function resetDatabase() {
  console.log('🔄 Réinitialisation de la base de données...\n');

  try {
    // Supprimer et recréer toutes les tables
    await sequelize.sync({ force: true });
    console.log('✅ Tables recréées avec succès\n');

    // Créer le SUPER_ADMIN
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (adminEmail && adminPassword) {
      const hash = await bcrypt.hash(adminPassword, 10);
      await User.create({ 
        email: adminEmail, 
        password: hash, 
        role: 'SUPER_ADMIN' 
      });
      console.log(`✅ SUPER_ADMIN créé: ${adminEmail}`);
      console.log('   Vous pouvez maintenant vous connecter avec ces identifiants.\n');
    } else {
      console.log('⚠️  Aucun SUPER_ADMIN créé.');
      console.log('   Définissez ADMIN_EMAIL et ADMIN_PASSWORD dans le fichier .env\n');
    }

    console.log('🎉 Base de données prête pour la production!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur lors de la réinitialisation:', err.message);
    process.exit(1);
  }
}

resetDatabase();
