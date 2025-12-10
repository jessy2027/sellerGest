const express = require('express');
const bcrypt = require('bcryptjs');
const { verifyToken, requireRole } = require('../middleware/auth');
const User = require('../models/User');
const Manager = require('../models/Manager');
const Seller = require('../models/Seller');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(verifyToken);

// GET /sellers - Liste les vendeurs
// SUPER_ADMIN voit tous les vendeurs
// MANAGER voit uniquement ses vendeurs
router.get('/', requireRole('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  try {
    let whereClause = {};

    // Si c'est un manager, filtrer par son ID
    if (req.user.role === 'MANAGER') {
      const manager = await Manager.findOne({ where: { user_id: req.user.id } });
      if (!manager) {
        return res.status(404).json({ error: 'Manager profile not found' });
      }
      whereClause = { manager_id: manager.id };
    }

    const sellers = await Seller.findAll({
      where: whereClause,
      include: [
        { model: User, attributes: ['id', 'email'] },
        { model: Manager, include: [{ model: User, attributes: ['email'] }] }
      ]
    });

    const result = sellers.map(seller => ({
      id: seller.id,
      user_id: seller.user_id,
      email: seller.User?.email,
      manager_id: seller.manager_id,
      manager_email: seller.Manager?.User?.email,
      vinted_profile: seller.vinted_profile,
      commission_rate: seller.commission_rate,
      createdAt: seller.createdAt
    }));

    return res.json(result);
  } catch (err) {
    console.error('Get sellers error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch sellers' });
  }
});

// GET /sellers/:id - Détails d'un vendeur
router.get('/:id', requireRole('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const seller = await Seller.findByPk(req.params.id, {
      include: [
        { model: User, attributes: ['id', 'email'] },
        { model: Manager, include: [{ model: User, attributes: ['email'] }] }
      ]
    });

    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    // Vérifier que le manager peut voir ce vendeur
    if (req.user.role === 'MANAGER') {
      const manager = await Manager.findOne({ where: { user_id: req.user.id } });
      if (!manager || seller.manager_id !== manager.id) {
        return res.status(403).json({ error: 'Accès non autorisé à ce vendeur' });
      }
    }

    return res.json({
      id: seller.id,
      user_id: seller.user_id,
      email: seller.User?.email,
      manager_id: seller.manager_id,
      manager_email: seller.Manager?.User?.email,
      vinted_profile: seller.vinted_profile,
      commission_rate: seller.commission_rate,
      createdAt: seller.createdAt
    });
  } catch (err) {
    console.error('Get seller error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch seller' });
  }
});

// POST /sellers - Créer un nouveau vendeur (MANAGER only)
// Le vendeur est automatiquement lié au manager qui le crée
router.post('/', requireRole('MANAGER'), async (req, res) => {
  try {
    const { email, password, vinted_profile, commission_rate = 15.0 } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    // Récupérer le manager connecté
    const manager = await Manager.findOne({ where: { user_id: req.user.id } });
    if (!manager) {
      return res.status(404).json({ error: 'Profil manager non trouvé' });
    }

    if (!manager.active) {
      return res.status(403).json({ error: 'Votre compte manager est désactivé' });
    }

    // Vérifier si l'email existe déjà
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    }

    // Créer le user
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hash, role: 'SELLER' });

    // Créer le seller lié au manager
    const seller = await Seller.create({
      user_id: user.id,
      manager_id: manager.id,
      vinted_profile: vinted_profile || null,
      commission_rate: parseFloat(commission_rate) || 15.0
    });

    return res.status(201).json({
      id: seller.id,
      user_id: user.id,
      email: user.email,
      manager_id: manager.id,
      vinted_profile: seller.vinted_profile,
      commission_rate: seller.commission_rate
    });
  } catch (err) {
    console.error('Create seller error:', err.message);
    return res.status(500).json({ error: 'Échec de la création du vendeur' });
  }
});

// PUT /sellers/:id - Modifier un vendeur (MANAGER only pour ses vendeurs)
router.put('/:id', requireRole('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const seller = await Seller.findByPk(req.params.id);
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    // Vérifier que le manager peut modifier ce vendeur
    if (req.user.role === 'MANAGER') {
      const manager = await Manager.findOne({ where: { user_id: req.user.id } });
      if (!manager || seller.manager_id !== manager.id) {
        return res.status(403).json({ error: 'Vous ne pouvez modifier que vos propres vendeurs' });
      }
    }

    const { vinted_profile, commission_rate } = req.body;

    if (vinted_profile !== undefined) {
      seller.vinted_profile = vinted_profile;
    }
    if (commission_rate !== undefined) {
      seller.commission_rate = parseFloat(commission_rate);
    }

    await seller.save();

    const user = await User.findByPk(seller.user_id);

    return res.json({
      id: seller.id,
      user_id: seller.user_id,
      email: user?.email,
      manager_id: seller.manager_id,
      vinted_profile: seller.vinted_profile,
      commission_rate: seller.commission_rate
    });
  } catch (err) {
    console.error('Update seller error:', err.message);
    return res.status(500).json({ error: 'Failed to update seller' });
  }
});

// DELETE /sellers/:id - Supprimer un vendeur (MANAGER only pour ses vendeurs)
router.delete('/:id', requireRole('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const seller = await Seller.findByPk(req.params.id);
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    // Vérifier que le manager peut supprimer ce vendeur
    if (req.user.role === 'MANAGER') {
      const manager = await Manager.findOne({ where: { user_id: req.user.id } });
      if (!manager || seller.manager_id !== manager.id) {
        return res.status(403).json({ error: 'Vous ne pouvez supprimer que vos propres vendeurs' });
      }
    }

    const userId = seller.user_id;
    await seller.destroy();
    await User.destroy({ where: { id: userId } });

    return res.json({ message: 'Vendeur supprimé' });
  } catch (err) {
    console.error('Delete seller error:', err.message);
    return res.status(500).json({ error: 'Failed to delete seller' });
  }
});

module.exports = router;
