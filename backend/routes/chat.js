const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { Conversation, Message, User, Manager, Seller } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(verifyToken);

// GET /chat/conversations - Liste des conversations de l'utilisateur
router.get('/conversations', async (req, res) => {
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
        } else {
            return res.status(403).json({ error: 'Accès non autorisé' });
        }

        const conversations = await Conversation.findAll({
            where: whereClause,
            include: [
                { model: Manager, include: [{ model: User, attributes: ['id', 'email'] }] },
                { model: Seller, include: [{ model: User, attributes: ['id', 'email'] }] },
                {
                    model: Message,
                    limit: 1,
                    order: [['createdAt', 'DESC']],
                    include: [{ model: User, as: 'Sender', attributes: ['id', 'email'] }]
                }
            ],
            order: [['last_message_at', 'DESC']]
        });

        // Ajouter le compteur de messages non lus
        const conversationsWithUnread = await Promise.all(
            conversations.map(async (conv) => {
                const unreadCount = await Message.count({
                    where: {
                        conversation_id: conv.id,
                        sender_id: { [Op.ne]: userId },
                        read_at: null
                    }
                });
                return {
                    ...conv.toJSON(),
                    unread_count: unreadCount
                };
            })
        );

        return res.json(conversationsWithUnread);
    } catch (err) {
        console.error('Get conversations error:', err);
        return res.status(500).json({ error: 'Échec du chargement des conversations' });
    }
});

// POST /chat/conversations - Créer ou récupérer une conversation
router.post('/conversations', async (req, res) => {
    try {
        const { role, id: userId } = req.user;
        const { seller_id, manager_id } = req.body;

        let managerId, sellerId;

        if (role === 'MANAGER') {
            if (!seller_id) return res.status(400).json({ error: 'seller_id requis' });
            const manager = await Manager.findOne({ where: { user_id: userId } });
            if (!manager) return res.status(404).json({ error: 'Manager non trouvé' });
            const seller = await Seller.findByPk(seller_id);
            if (!seller || seller.manager_id !== manager.id) {
                return res.status(403).json({ error: 'Ce vendeur ne vous appartient pas' });
            }
            managerId = manager.id;
            sellerId = seller_id;
        } else if (role === 'SELLER') {
            const seller = await Seller.findOne({ where: { user_id: userId } });
            if (!seller) return res.status(404).json({ error: 'Vendeur non trouvé' });
            managerId = seller.manager_id;
            sellerId = seller.id;
        } else {
            return res.status(403).json({ error: 'Accès non autorisé' });
        }

        // Trouver ou créer la conversation
        let [conversation, created] = await Conversation.findOrCreate({
            where: { manager_id: managerId, seller_id: sellerId },
            defaults: { manager_id: managerId, seller_id: sellerId }
        });

        // Charger avec les associations
        conversation = await Conversation.findByPk(conversation.id, {
            include: [
                { model: Manager, include: [{ model: User, attributes: ['id', 'email'] }] },
                { model: Seller, include: [{ model: User, attributes: ['id', 'email'] }] }
            ]
        });

        return res.status(created ? 201 : 200).json(conversation);
    } catch (err) {
        console.error('Create conversation error:', err);
        return res.status(500).json({ error: 'Échec de la création de la conversation' });
    }
});

// GET /chat/conversations/:id/messages - Historique des messages
router.get('/conversations/:id/messages', async (req, res) => {
    try {
        const { id: conversationId } = req.params;
        const { limit = 50, before } = req.query;

        const conversation = await Conversation.findByPk(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation non trouvée' });
        }

        // Vérifier l'accès
        const { role, id: userId } = req.user;
        if (role === 'MANAGER') {
            const manager = await Manager.findOne({ where: { user_id: userId } });
            if (!manager || conversation.manager_id !== manager.id) {
                return res.status(403).json({ error: 'Accès non autorisé' });
            }
        } else if (role === 'SELLER') {
            const seller = await Seller.findOne({ where: { user_id: userId } });
            if (!seller || conversation.seller_id !== seller.id) {
                return res.status(403).json({ error: 'Accès non autorisé' });
            }
        }

        let whereClause = { conversation_id: conversationId };
        if (before) {
            whereClause.id = { [Op.lt]: parseInt(before) };
        }

        const messages = await Message.findAll({
            where: whereClause,
            include: [{ model: User, as: 'Sender', attributes: ['id', 'email'] }],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit)
        });

        // Marquer comme lus les messages reçus
        await Message.update(
            { read_at: new Date() },
            {
                where: {
                    conversation_id: conversationId,
                    sender_id: { [Op.ne]: userId },
                    read_at: null
                }
            }
        );

        return res.json(messages.reverse());
    } catch (err) {
        console.error('Get messages error:', err);
        return res.status(500).json({ error: 'Échec du chargement des messages' });
    }
});

// POST /chat/messages/:conversationId - Envoyer un message (fallback HTTP)
router.post('/messages/:conversationId', async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Contenu du message requis' });
        }

        const conversation = await Conversation.findByPk(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation non trouvée' });
        }

        const message = await Message.create({
            conversation_id: conversationId,
            sender_id: userId,
            content: content.trim()
        });

        conversation.last_message_at = new Date();
        await conversation.save();

        const fullMessage = await Message.findByPk(message.id, {
            include: [{ model: User, as: 'Sender', attributes: ['id', 'email'] }]
        });

        return res.status(201).json(fullMessage);
    } catch (err) {
        console.error('Send message error:', err);
        return res.status(500).json({ error: 'Échec de l\'envoi du message' });
    }
});

// GET /chat/unread - Nombre total de messages non lus
router.get('/unread', async (req, res) => {
    try {
        const userId = req.user.id;
        const { role } = req.user;

        let conversationIds = [];

        if (role === 'MANAGER') {
            const manager = await Manager.findOne({ where: { user_id: userId } });
            if (manager) {
                const convs = await Conversation.findAll({
                    where: { manager_id: manager.id },
                    attributes: ['id']
                });
                conversationIds = convs.map(c => c.id);
            }
        } else if (role === 'SELLER') {
            const seller = await Seller.findOne({ where: { user_id: userId } });
            if (seller) {
                const convs = await Conversation.findAll({
                    where: { seller_id: seller.id },
                    attributes: ['id']
                });
                conversationIds = convs.map(c => c.id);
            }
        }

        const unreadCount = await Message.count({
            where: {
                conversation_id: { [Op.in]: conversationIds },
                sender_id: { [Op.ne]: userId },
                read_at: null
            }
        });

        return res.json({ unread: unreadCount });
    } catch (err) {
        console.error('Get unread count error:', err);
        return res.status(500).json({ error: 'Erreur' });
    }
});

module.exports = router;
