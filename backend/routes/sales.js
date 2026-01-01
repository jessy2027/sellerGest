const express = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const { sequelize } = require('../config/db'); // Needed for transactions
const { Sale, ProductAssignment, Product, Seller, Manager, User } = require('../models');
const { Op } = require('sequelize');
const { getIO } = require('../socket');

const router = express.Router();

router.use(verifyToken);

// GET /sales - Liste des ventes
router.get('/', async (req, res) => {
    try {
        const { role, id: userId } = req.user;
        let whereClause = {};

        if (role === 'MANAGER') {
            const manager = await Manager.findOne({ where: { user_id: userId } });
            if (!manager) return res.status(404).json({ error: 'Manager non trouvé' });
            whereClause = { manager_id: manager.id };
        } else if (role === 'SELLER') {
            const seller = await Seller.findOne({ where: { user_id: userId } });
            if (!seller) return res.status(404).json({ error: 'Vendeur non trouvé' });
            whereClause = { seller_id: seller.id };
        }

        const sales = await Sale.findAll({
            where: whereClause,
            include: [
                {
                    model: ProductAssignment,
                    include: [{ model: Product }]
                },
                { model: Seller, include: [{ model: User, attributes: ['email'] }] },
                { model: Manager, include: [{ model: User, attributes: ['email'] }] }
            ],
            order: [['createdAt', 'DESC']]
        });

        return res.json(sales);
    } catch (err) {
        console.error('Get sales error:', err.message);
        return res.status(500).json({ error: 'Échec du chargement des ventes' });
    }
});

// POST /sales - Marquer un produit comme vendu (SELLER)
// Le vendeur marque sa vente, une transaction en attente est créée
// POST /sales - Marquer un produit comme vendu (SELLER)
// Le vendeur marque sa vente, une transaction en attente est créée
router.post('/', requireRole('SELLER'), async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const seller = await Seller.findOne({ where: { user_id: req.user.id }, transaction: t });
        if (!seller) {
            await t.rollback();
            return res.status(404).json({ error: 'Vendeur non trouvé' });
        }
        if (!seller.active) {
            await t.rollback();
            return res.status(403).json({ error: 'Compte vendeur désactivé' });
        }

        const { assignment_id } = req.body;
        if (!assignment_id) {
            await t.rollback();
            return res.status(400).json({ error: 'assignment_id requis' });
        }

        // Vérifier l'assignation
        const assignment = await ProductAssignment.findByPk(assignment_id, {
            include: [{ model: Product }],
            transaction: t
        });

        if (!assignment) {
            await t.rollback();
            return res.status(404).json({ error: 'Assignation non trouvée' });
        }
        if (assignment.seller_id !== seller.id) {
            await t.rollback();
            return res.status(403).json({ error: 'Ce produit ne vous est pas assigné' });
        }
        if (assignment.status !== 'actif') {
            await t.rollback();
            return res.status(400).json({ error: 'Ce produit n\'est plus disponible à la vente (statut: ' + assignment.status + ')' });
        }

        const product = assignment.Product;

        // LOCK: Verrouiller le produit pour être sûr du stock
        // On recharge le produit avec un lock pour empêcher les race conditions
        const lockedProduct = await Product.findByPk(product.id, {
            transaction: t,
            lock: true // Pessimistic lock
        });

        // Compter les ventes valides existantes (hors annulées)
        // Note: On peut aussi utiliser lockedProduct.stock_quantity si on décrémente directement le stock (mais ici on compte les ventes)
        // Pour être sûr, on recompte les ventes associées aux assignations de ce produit

        // Optimisation: On compte le nombre total de ventes 'pending' ou 'paid' liées à ce produit
        // 1. Trouver toutes les assignations de ce produit
        const productAssignments = await ProductAssignment.findAll({
            where: { product_id: lockedProduct.id },
            attributes: ['id'],
            transaction: t
        });
        const assignmentIds = productAssignments.map(a => a.id);

        // Check remaining stock directly
        if (lockedProduct.stock_quantity <= 0) {
            await t.rollback();
            return res.status(400).json({
                error: 'Stock épuisé ! Trop tard, le dernier article vient d\'être vendu.'
            });
        }

        // Récupérer le manager
        const manager = await Manager.findByPk(lockedProduct.manager_id, { transaction: t });

        // Calculer les montants
        const productPrice = parseFloat(lockedProduct.base_price);
        const commissionRate = parseFloat(seller.commission_rate) || 15;
        const sellerCommission = (productPrice * commissionRate) / 100;
        const amountToManager = productPrice - sellerCommission;

        // Créer la vente
        const sale = await Sale.create({
            assignment_id: assignment.id,
            seller_id: seller.id,
            manager_id: manager.id,
            product_price: productPrice,
            seller_commission: sellerCommission,
            amount_to_manager: amountToManager,
            status: 'pending',
            sold_at: new Date()
        }, { transaction: t });

        // Decrement actual stock in DB
        lockedProduct.stock_quantity = lockedProduct.stock_quantity - 1;

        if (lockedProduct.stock_quantity <= 0) {
            lockedProduct.stock_quantity = 0;
            lockedProduct.status = 'vendu';
        }

        await lockedProduct.save({ transaction: t });

        // Mettre à jour l'assignation
        assignment.sold_at = new Date();
        await assignment.save({ transaction: t });

        await t.commit();

        // Émettre l'événement WebSocket (hors transaction)
        try {
            const io = getIO();
            io.emit('stock_updated', {
                product_id: lockedProduct.id,
                new_stock: lockedProduct.stock_quantity,
                sold_count: null, // No longer tracked relative to total here
                product_status: lockedProduct.status
            });
        } catch (socketErr) {
            console.error('Socket emit error:', socketErr.message);
        }

        return res.status(201).json({
            ...sale.toJSON(),
            product_title: lockedProduct.title,
            message: `Vente enregistrée ! Vous devez payer ${amountToManager.toFixed(2)}€ au manager. Votre commission: ${sellerCommission.toFixed(2)}€`
        });
    } catch (err) {
        await t.rollback();
        console.error('Create sale error:', err.message);
        return res.status(500).json({ error: 'Échec de l\'enregistrement de la vente' });
    }
});

// POST /sales/:id/pay - Payer la transaction au manager (SELLER)
router.post('/:id/pay', requireRole('SELLER'), async (req, res) => {
    try {
        const seller = await Seller.findOne({ where: { user_id: req.user.id } });
        if (!seller) return res.status(404).json({ error: 'Vendeur non trouvé' });

        const sale = await Sale.findByPk(req.params.id, {
            include: [{ model: ProductAssignment, include: [{ model: Product }] }]
        });

        if (!sale) return res.status(404).json({ error: 'Vente non trouvée' });
        if (sale.seller_id !== seller.id) {
            return res.status(403).json({ error: 'Cette vente ne vous appartient pas' });
        }
        if (sale.status === 'paid') {
            return res.status(400).json({ error: 'Cette vente est déjà payée' });
        }
        if (sale.status === 'cancelled') {
            return res.status(400).json({ error: 'Cette vente a été annulée' });
        }

        // Marquer comme payé
        sale.status = 'paid';
        sale.paid_at = new Date();
        await sale.save();

        // Ajouter la commission au solde du vendeur
        seller.balance = parseFloat(seller.balance) + parseFloat(sale.seller_commission);
        await seller.save();

        return res.json({
            message: `Paiement effectué ! ${sale.amount_to_manager}€ versés au manager. Commission de ${sale.seller_commission}€ ajoutée à votre solde.`,
            sale: sale,
            new_balance: seller.balance
        });
    } catch (err) {
        console.error('Pay sale error:', err.message);
        return res.status(500).json({ error: 'Échec du paiement' });
    }
});

// GET /sales/stats - Statistiques
router.get('/stats/summary', async (req, res) => {
    try {
        const { role, id: userId } = req.user;
        let stats = {};

        if (role === 'SELLER') {
            const seller = await Seller.findOne({ where: { user_id: userId } });
            if (!seller) return res.status(404).json({ error: 'Vendeur non trouvé' });

            const totalAssigned = await ProductAssignment.count({ where: { seller_id: seller.id } });
            const totalSold = await Sale.count({ where: { seller_id: seller.id } });
            const paidSales = await Sale.findAll({
                where: { seller_id: seller.id, status: 'paid' },
                attributes: ['seller_commission']
            });
            const pendingSales = await Sale.findAll({
                where: { seller_id: seller.id, status: 'pending' },
                attributes: ['amount_to_manager']
            });

            const totalEarnings = paidSales.reduce((sum, s) => sum + parseFloat(s.seller_commission), 0);
            const pendingPayments = pendingSales.reduce((sum, s) => sum + parseFloat(s.amount_to_manager), 0);

            stats = {
                products_assigned: totalAssigned,
                products_sold: totalSold,
                total_earnings: totalEarnings,
                pending_payments: pendingPayments,
                balance: parseFloat(seller.balance)
            };
        } else if (role === 'MANAGER') {
            const manager = await Manager.findOne({ where: { user_id: userId } });
            if (!manager) return res.status(404).json({ error: 'Manager non trouvé' });

            const totalProducts = await Product.count({ where: { manager_id: manager.id } });
            const totalSellers = await Seller.count({ where: { manager_id: manager.id } });
            const totalSales = await Sale.count({ where: { manager_id: manager.id } });
            const paidSales = await Sale.findAll({
                where: { manager_id: manager.id, status: 'paid' },
                attributes: ['amount_to_manager']
            });
            const pendingSales = await Sale.findAll({
                where: { manager_id: manager.id, status: 'pending' },
                attributes: ['amount_to_manager']
            });

            const totalRevenue = paidSales.reduce((sum, s) => sum + parseFloat(s.amount_to_manager), 0);
            const pendingRevenue = pendingSales.reduce((sum, s) => sum + parseFloat(s.amount_to_manager), 0);

            stats = {
                total_products: totalProducts,
                total_sellers: totalSellers,
                total_sales: totalSales,
                total_revenue: totalRevenue,
                pending_revenue: pendingRevenue
            };
        } else if (role === 'SUPER_ADMIN') {
            const totalManagers = await Manager.count();
            const totalSellers = await Seller.count();
            const totalProducts = await Product.count();
            const totalSales = await Sale.count();
            const paidSales = await Sale.findAll({
                where: { status: 'paid' },
                attributes: ['product_price']
            });

            const totalVolume = paidSales.reduce((sum, s) => sum + parseFloat(s.product_price), 0);

            stats = {
                total_managers: totalManagers,
                total_sellers: totalSellers,
                total_products: totalProducts,
                total_sales: totalSales,
                total_volume: totalVolume
            };
        }

        return res.json(stats);
    } catch (err) {
        console.error('Get stats error:', err.message);
        return res.status(500).json({ error: 'Échec du chargement des statistiques' });
    }
});

module.exports = router;
