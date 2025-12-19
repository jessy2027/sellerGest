/**
 * Script de reset partiel - Supprime tout SAUF les Users
 * 
 * Utilisation: node scripts/reset-data.js
 */

const dotenv = require('dotenv');
dotenv.config();

const { sequelize } = require('../config/db');
const { Product, ProductAssignment, Sale, Seller, Manager, Conversation, Message } = require('../models');

async function resetData() {
    console.log('🔄 Reset des données (Users conservés)...\n');

    try {
        // Ordre important: respecter les foreign keys
        console.log('Suppression des Messages...');
        await Message.destroy({ where: {}, truncate: true, cascade: true });

        console.log('Suppression des Conversations...');
        await Conversation.destroy({ where: {}, truncate: true, cascade: true });

        console.log('Suppression des Sales...');
        await Sale.destroy({ where: {}, truncate: true, cascade: true });

        console.log('Suppression des ProductAssignments...');
        await ProductAssignment.destroy({ where: {}, truncate: true, cascade: true });

        console.log('Suppression des Products...');
        await Product.destroy({ where: {}, truncate: true, cascade: true });

        console.log('Suppression des Sellers...');
        await Seller.destroy({ where: {}, truncate: true, cascade: true });

        console.log('Suppression des Managers...');
        await Manager.destroy({ where: {}, truncate: true, cascade: true });

        console.log('\n✅ Toutes les données ont été supprimées!');
        console.log('   Les Users ont été conservés.\n');

        process.exit(0);
    } catch (err) {
        console.error('❌ Erreur:', err.message);
        process.exit(1);
    }
}

resetData();
