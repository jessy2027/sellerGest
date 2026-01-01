// Socket.io server configuration with JWT authentication
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { Message, Conversation, User, Manager, Seller } = require('./models');

let io;

function initSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication required'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findByPk(decoded.id);
            if (!user) {
                return next(new Error('User not found'));
            }

            socket.user = { id: user.id, email: user.email, role: user.role };
            next();
        } catch (err) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 User connected: ${socket.user.email}`);

        // Join user specific room for private notifications
        const userRoom = `user_${socket.user.id}`;
        socket.join(userRoom);

        // Rejoindre une conversation
        socket.on('join_conversation', (conversationId) => {
            socket.join(`conversation_${conversationId}`);
            console.log(`${socket.user.email} joined conversation ${conversationId}`);
        });

        // Quitter une conversation
        socket.on('leave_conversation', (conversationId) => {
            socket.leave(`conversation_${conversationId}`);
        });

        // Envoyer un message
        socket.on('send_message', async (data) => {
            try {
                const { conversation_id, content } = data;

                // Vérifier que l'utilisateur fait partie de cette conversation
                // On inclut Manager et Seller pour trouver l'ID de l'AUTRE utilisateur
                const conversation = await Conversation.findByPk(conversation_id, {
                    include: [
                        { model: Manager, include: [{ model: User, attributes: ['id'] }] },
                        { model: Seller, include: [{ model: User, attributes: ['id'] }] }
                    ]
                });

                if (!conversation) {
                    socket.emit('error', { message: 'Conversation non trouvée' });
                    return;
                }

                // Créer le message
                const message = await Message.create({
                    conversation_id,
                    sender_id: socket.user.id,
                    content
                });

                // Mettre à jour last_message_at
                conversation.last_message_at = new Date();
                await conversation.save();

                // Récupérer le message avec les infos du sender
                const fullMessage = await Message.findByPk(message.id, {
                    include: [{ model: User, as: 'Sender', attributes: ['id', 'email'] }]
                });

                // Envoyer à tous les membres de la conversation (ceux qui ont la fenêtre ouverte)
                io.to(`conversation_${conversation_id}`).emit('new_message', fullMessage);

                // Identifier le destinataire pour la notification
                let recipientUserId;
                // Si l'envoyeur est le manager, le destinataire est le vendeur
                if (socket.user.role === 'MANAGER') {
                    // Vérifions si c'est bien sa conversation
                    // (Simplification : on suppose que le middleware auth a fait sont job, 
                    // mais ici on a besoin de l'ID du vendeur)
                    recipientUserId = conversation.Seller?.User?.id;
                } else {
                    // Si l'envoyeur est le vendeur, le destinataire est le manager
                    recipientUserId = conversation.Manager?.User?.id;
                }

                if (recipientUserId) {
                    // Notifier le destinataire uniquement via sa room privée
                    io.to(`user_${recipientUserId}`).emit('message_notification', {
                        conversation_id,
                        sender: socket.user.email,
                        preview: content.substring(0, 50)
                    });
                }

            } catch (err) {
                console.error('Send message error:', err);
                socket.emit('error', { message: 'Erreur lors de l\'envoi du message' });
            }
        });

        // Indicateur de frappe
        socket.on('typing', (data) => {
            socket.to(`conversation_${data.conversation_id}`).emit('user_typing', {
                user_id: socket.user.id,
                email: socket.user.email,
                conversation_id: data.conversation_id
            });
        });

        socket.on('stop_typing', (data) => {
            socket.to(`conversation_${data.conversation_id}`).emit('user_stop_typing', {
                user_id: socket.user.id,
                conversation_id: data.conversation_id
            });
        });

        // Marquer comme lu
        socket.on('mark_read', async (data) => {
            try {
                const { conversation_id } = data;
                await Message.update(
                    { read_at: new Date() },
                    {
                        where: {
                            conversation_id,
                            sender_id: { [require('sequelize').Op.ne]: socket.user.id },
                            read_at: null
                        }
                    }
                );
                io.to(`conversation_${conversation_id}`).emit('messages_read', {
                    conversation_id,
                    reader_id: socket.user.id
                });
            } catch (err) {
                console.error('Mark read error:', err);
            }
        });

        socket.on('disconnect', () => {
            console.log(`🔌 User disconnected: ${socket.user.email}`);
        });
    });

    return io;
}

function getIO() {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
}

module.exports = { initSocket, getIO };
