const express = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const { Product, Manager, Seller, ProductAssignment, User } = require('../models');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(verifyToken);

// GET /products - Liste des produits
// SUPER_ADMIN voit tous, MANAGER voit les siens, SELLER voit ses assignés
router.get('/', async (req, res) => {
    try {
        const { role, id: userId } = req.user;

        if (role === 'SUPER_ADMIN') {
            const products = await Product.findAll({
                include: [{ model: Manager, include: [{ model: User, attributes: ['email'] }] }],
                order: [['createdAt', 'DESC']]
            });
            return res.json(products);
        }

        if (role === 'MANAGER') {
            const manager = await Manager.findOne({ where: { user_id: userId } });
            if (!manager) return res.status(404).json({ error: 'Manager non trouvé' });

            const products = await Product.findAll({
                where: { manager_id: manager.id },
                order: [['createdAt', 'DESC']]
            });
            return res.json(products);
        }

        if (role === 'SELLER') {
            const seller = await Seller.findOne({ where: { user_id: userId } });
            if (!seller) return res.status(404).json({ error: 'Vendeur non trouvé' });

            const assignments = await ProductAssignment.findAll({
                where: { seller_id: seller.id },
                include: [{ model: Product }]
            });

            const products = assignments.map(a => ({
                ...a.Product.toJSON(),
                assignment_id: a.id,
                assignment_status: a.status
            }));
            return res.json(products);
        }

        return res.status(403).json({ error: 'Accès non autorisé' });
    } catch (err) {
        console.error('Get products error:', err.message);
        return res.status(500).json({ error: 'Échec du chargement des produits' });
    }
});

// GET /products/:id - Détails d'un produit
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id, {
            include: [
                { model: Manager, include: [{ model: User, attributes: ['email'] }] },
                { model: ProductAssignment, include: [{ model: Seller, include: [{ model: User, attributes: ['email'] }] }] }
            ]
        });

        if (!product) return res.status(404).json({ error: 'Produit non trouvé' });
        return res.json(product);
    } catch (err) {
        console.error('Get product error:', err.message);
        return res.status(500).json({ error: 'Échec du chargement du produit' });
    }
});

// POST /products - Créer un produit (MANAGER only)
router.post('/', requireRole('MANAGER'), async (req, res) => {
    try {
        const manager = await Manager.findOne({ where: { user_id: req.user.id } });
        if (!manager) return res.status(404).json({ error: 'Manager non trouvé' });
        if (!manager.active) return res.status(403).json({ error: 'Compte manager désactivé' });

        const { title, description, category, base_price, stock_quantity } = req.body;
        if (!title || base_price === undefined) {
            return res.status(400).json({ error: 'Titre et prix requis' });
        }

        const product = await Product.create({
            manager_id: manager.id,
            title,
            description: description || null,
            category: category || null,
            base_price: parseFloat(base_price) || 0,
            stock_quantity: parseInt(stock_quantity) || 1,
            status: 'disponible'
        });

        return res.status(201).json(product);
    } catch (err) {
        console.error('Create product error:', err.message);
        return res.status(500).json({ error: 'Échec de la création du produit' });
    }
});

// PUT /products/:id - Modifier un produit (MANAGER only)
router.put('/:id', requireRole('MANAGER'), async (req, res) => {
    try {
        const manager = await Manager.findOne({ where: { user_id: req.user.id } });
        if (!manager) return res.status(404).json({ error: 'Manager non trouvé' });

        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ error: 'Produit non trouvé' });
        if (product.manager_id !== manager.id) {
            return res.status(403).json({ error: 'Vous ne pouvez modifier que vos produits' });
        }

        const { title, description, category, base_price, stock_quantity, status } = req.body;
        if (title) product.title = title;
        if (description !== undefined) product.description = description;
        if (category !== undefined) product.category = category;
        if (base_price !== undefined) product.base_price = parseFloat(base_price);
        if (stock_quantity !== undefined) product.stock_quantity = parseInt(stock_quantity);
        if (status) product.status = status;

        await product.save();
        return res.json(product);
    } catch (err) {
        console.error('Update product error:', err.message);
        return res.status(500).json({ error: 'Échec de la mise à jour du produit' });
    }
});

// DELETE /products/:id - Supprimer un produit (MANAGER only)
router.delete('/:id', requireRole('MANAGER'), async (req, res) => {
    try {
        const manager = await Manager.findOne({ where: { user_id: req.user.id } });
        if (!manager) return res.status(404).json({ error: 'Manager non trouvé' });

        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ error: 'Produit non trouvé' });
        if (product.manager_id !== manager.id) {
            return res.status(403).json({ error: 'Vous ne pouvez supprimer que vos produits' });
        }

        if (product.status !== 'disponible') {
            return res.status(400).json({ error: 'Impossible de supprimer un produit assigné ou vendu' });
        }

        await product.destroy();
        return res.json({ message: 'Produit supprimé' });
    } catch (err) {
        console.error('Delete product error:', err.message);
        return res.status(500).json({ error: 'Échec de la suppression du produit' });
    }
});

// POST /products/:id/assign - Assigner un produit à un vendeur (MANAGER only)
router.post('/:id/assign', requireRole('MANAGER'), async (req, res) => {
    try {
        const manager = await Manager.findOne({ where: { user_id: req.user.id } });
        if (!manager) return res.status(404).json({ error: 'Manager non trouvé' });

        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ error: 'Produit non trouvé' });
        if (product.manager_id !== manager.id) {
            return res.status(403).json({ error: 'Vous ne pouvez assigner que vos produits' });
        }
        // Vérifier le stock disponible
        const soldCount = await ProductAssignment.count({
            where: { product_id: product.id, status: 'vendu' }
        });

        if (soldCount >= product.stock_quantity) {
            return res.status(400).json({ error: 'Stock épuisé, impossible d\'assigner de nouveaux vendeurs' });
        }

        // Vérifier le vendeur
        const { seller_id } = req.body;
        if (!seller_id) return res.status(400).json({ error: 'seller_id requis' });


        const seller = await Seller.findByPk(seller_id);
        if (!seller) return res.status(404).json({ error: 'Vendeur non trouvé' });
        if (seller.manager_id !== manager.id) {
            return res.status(403).json({ error: 'Ce vendeur ne vous appartient pas' });
        }

        // Créer l'assignation
        const assignment = await ProductAssignment.create({
            product_id: product.id,
            seller_id: seller.id,
            status: 'en_vente',
            assigned_at: new Date()
        });

        // Mettre à jour le statut du produit si c'est la première assignation
        if (product.status === 'disponible') {
            product.status = 'assigne';
            await product.save();
        }

        return res.status(201).json(assignment);
    } catch (err) {
        console.error('Assign product error:', err.message);
        return res.status(500).json({ error: 'Échec de l\'assignation du produit' });
    }
});

// GET /products/assignments - Liste des assignations
router.get('/assignments/list', async (req, res) => {
    try {
        const { role, id: userId } = req.user;
        let whereClause = {};

        if (role === 'MANAGER') {
            const manager = await Manager.findOne({ where: { user_id: userId } });
            if (!manager) return res.status(404).json({ error: 'Manager non trouvé' });

            // Récupérer les IDs des vendeurs du manager
            const sellers = await Seller.findAll({ where: { manager_id: manager.id }, attributes: ['id'] });
            const sellerIds = sellers.map(s => s.id);
            whereClause = { seller_id: sellerIds };
        } else if (role === 'SELLER') {
            const seller = await Seller.findOne({ where: { user_id: userId } });
            if (!seller) return res.status(404).json({ error: 'Vendeur non trouvé' });
            whereClause = { seller_id: seller.id };
        }

        const assignments = await ProductAssignment.findAll({
            where: whereClause,
            include: [
                { model: Product },
                { model: Seller, include: [{ model: User, attributes: ['email'] }] }
            ],
            order: [['createdAt', 'DESC']]
        });

        return res.json(assignments);
    } catch (err) {
        console.error('Get assignments error:', err.message);
        return res.status(500).json({ error: 'Échec du chargement des assignations' });
    }
});

// GET /products/:id/stock - Statistiques de stock d'un produit
router.get('/:id/stock', async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ error: 'Produit non trouvé' });

        const assignments = await ProductAssignment.findAll({
            where: { product_id: product.id }
        });

        const sold = assignments.filter(a => a.status === 'vendu').length;
        const inSale = assignments.filter(a => a.status === 'en_vente').length;

        return res.json({
            total_stock: product.stock_quantity,
            sold: sold,
            in_sale: inSale,
            available: product.stock_quantity - sold
        });
    } catch (err) {
        console.error('Get product stock error:', err.message);
        return res.status(500).json({ error: 'Échec du chargement des statistiques de stock' });
    }
});

module.exports = router;
