const express = require('express');
const bcrypt = require('bcryptjs');
const { verifyToken, requireRole } = require('../middleware/auth');
const User = require('../models/User');
const Manager = require('../models/Manager');
const Seller = require('../models/Seller');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(verifyToken);

// GET /managers - Liste tous les managers (SUPER_ADMIN only)
router.get('/', requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const managers = await Manager.findAll({
      include: [{ model: User, attributes: ['id', 'email'] }]
    });

    // Ajouter le nombre de vendeurs pour chaque manager
    const managersWithStats = await Promise.all(managers.map(async (manager) => {
      const sellersCount = await Seller.count({ where: { manager_id: manager.id } });
      return {
        id: manager.id,
        user_id: manager.user_id,
        email: manager.User?.email,
        commission_rate: manager.commission_rate,
        active: manager.active,
        sellers_count: sellersCount,
        createdAt: manager.createdAt
      };
    }));

    return res.json(managersWithStats);
  } catch (err) {
    console.error('Get managers error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch managers' });
  }
});

// GET /managers/:id - Détails d'un manager (SUPER_ADMIN only)
router.get('/:id', requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const manager = await Manager.findByPk(req.params.id, {
      include: [{ model: User, attributes: ['id', 'email'] }]
    });

    if (!manager) {
      return res.status(404).json({ error: 'Manager not found' });
    }

    const sellers = await Seller.findAll({
      where: { manager_id: manager.id },
      include: [{ model: User, attributes: ['id', 'email'] }]
    });

    return res.json({
      id: manager.id,
      user_id: manager.user_id,
      email: manager.User?.email,
      commission_rate: manager.commission_rate,
      active: manager.active,
      createdAt: manager.createdAt,
      sellers: sellers.map(s => ({
        id: s.id,
        email: s.User?.email,
        vinted_profile: s.vinted_profile,
        commission_rate: s.commission_rate
      }))
    });
  } catch (err) {
    console.error('Get manager error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch manager' });
  }
});

// POST /managers - Créer un nouveau manager (SUPER_ADMIN only)
router.post('/', requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { email, password, commission_rate = 10.0 } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    // Vérifier si l'email existe déjà
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    }

    // Créer le user
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hash, role: 'MANAGER' });

    // Créer le manager
    const manager = await Manager.create({
      user_id: user.id,
      commission_rate: parseFloat(commission_rate) || 10.0,
      active: true
    });

    return res.status(201).json({
      id: manager.id,
      user_id: user.id,
      email: user.email,
      commission_rate: manager.commission_rate,
      active: manager.active
    });
  } catch (err) {
    console.error('Create manager error:', err.message);
    return res.status(500).json({ error: 'Échec de la création du manager' });
  }
});

// PUT /managers/:id - Modifier un manager (SUPER_ADMIN only)
router.put('/:id', requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const manager = await Manager.findByPk(req.params.id);
    if (!manager) {
      return res.status(404).json({ error: 'Manager not found' });
    }

    const { commission_rate, active } = req.body;

    if (commission_rate !== undefined) {
      manager.commission_rate = parseFloat(commission_rate);
    }
    if (active !== undefined) {
      manager.active = active;
    }

    await manager.save();

    const user = await User.findByPk(manager.user_id);

    return res.json({
      id: manager.id,
      user_id: manager.user_id,
      email: user?.email,
      commission_rate: manager.commission_rate,
      active: manager.active
    });
  } catch (err) {
    console.error('Update manager error:', err.message);
    return res.status(500).json({ error: 'Failed to update manager' });
  }
});

// DELETE /managers/:id - Supprimer un manager (SUPER_ADMIN only)
router.delete('/:id', requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const manager = await Manager.findByPk(req.params.id);
    if (!manager) {
      return res.status(404).json({ error: 'Manager not found' });
    }

    // Vérifier s'il a des vendeurs
    const sellersCount = await Seller.count({ where: { manager_id: manager.id } });
    if (sellersCount > 0) {
      return res.status(400).json({ 
        error: `Ce manager a ${sellersCount} vendeur(s) assigné(s). Supprimez ou réassignez-les d'abord.` 
      });
    }

    const userId = manager.user_id;
    await manager.destroy();
    await User.destroy({ where: { id: userId } });

    return res.json({ message: 'Manager supprimé' });
  } catch (err) {
    console.error('Delete manager error:', err.message);
    return res.status(500).json({ error: 'Failed to delete manager' });
  }
});

module.exports = router;
