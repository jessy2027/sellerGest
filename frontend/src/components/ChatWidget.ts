// ChatWidget - Floating chat component with Socket.io integration
import { io, Socket } from 'socket.io-client';
import { api } from '../api';
import { store } from '../state';
import { showToast } from './ui';
import type { Conversation, Message } from '../types';

const SOCKET_URL = 'http://localhost:4000';

let socket: Socket | null = null;
let isOpen = false;
let currentConversationId: number | null = null;
let conversations: Conversation[] = [];
let messages: Message[] = [];
let unreadCount = 0;
let typingTimeout: any = null;

export function initChatWidget() {
    const user = store.getUser();
    if (!user || user.role === 'SUPER_ADMIN') return; // Chat only for MANAGER and SELLER

    createWidgetHTML();
    connectSocket();
    loadConversations();
    pollUnreadCount();
}

function createWidgetHTML() {
    // Remove existing widget if any
    document.getElementById('chat-widget')?.remove();

    const widget = document.createElement('div');
    widget.id = 'chat-widget';
    widget.innerHTML = `
    <button class="chat-fab" id="chat-fab">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <span class="chat-badge" id="chat-badge" style="display: none;">0</span>
    </button>
    <div class="chat-panel" id="chat-panel">
      <div class="chat-header">
        <h3 id="chat-title">Messages</h3>
        <button class="chat-close" id="chat-close">&times;</button>
      </div>
      <div class="chat-content">
        <div class="chat-conversations" id="chat-conversations">
          <div class="loading-state"><div class="spinner"></div></div>
        </div>
        <div class="chat-messages" id="chat-messages" style="display: none;">
          <button class="chat-back" id="chat-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Retour
          </button>
          <div class="messages-list" id="messages-list"></div>
          <div class="typing-indicator" id="typing-indicator" style="display: none;">
             <span class="dot"></span><span class="dot"></span><span class="dot"></span>
          </div>
          <form class="message-form" id="message-form">
            <input type="text" id="message-input" placeholder="Tapez votre message..." autocomplete="off">
            <button type="submit" class="btn btn-primary btn-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  `;
    document.body.appendChild(widget);

    // Event listeners
    document.getElementById('chat-fab')?.addEventListener('click', toggleChat);
    document.getElementById('chat-close')?.addEventListener('click', closeChat);
    document.getElementById('chat-back')?.addEventListener('click', showConversations);
    document.getElementById('message-form')?.addEventListener('submit', sendMessage);

    // Typing listener
    const input = document.getElementById('message-input') as HTMLInputElement;
    input?.addEventListener('input', handleTyping);
}

function handleTyping() {
    if (!currentConversationId) return;

    socket?.emit('typing', { conversation_id: currentConversationId });

    if (typingTimeout) clearTimeout(typingTimeout);

    typingTimeout = setTimeout(() => {
        socket?.emit('stop_typing', { conversation_id: currentConversationId });
    }, 2000);
}

function connectSocket() {
    const token = localStorage.getItem('token');
    if (!token) return;

    socket = io(SOCKET_URL, {
        auth: { token }
    });

    socket.on('connect', () => {
        console.log('🔌 Chat connected');
    });

    socket.on('new_message', (message: Message) => {
        if (currentConversationId === message.conversation_id) {
            messages.push(message);
            renderMessages();
            scrollToBottom();

            // Hide typing indicator when message received
            const indicator = document.getElementById('typing-indicator');
            if (indicator) indicator.style.display = 'none';
        }
        updateUnreadBadge();
    });

    socket.on('message_notification', (data) => {
        // Notifications are now private, so we can trust they are for us
        if (!isOpen || currentConversationId !== data.conversation_id) {
            unreadCount++;
            updateBadge();
            showToast(`Nouveau message de ${data.sender}`, 'info');
        }
    });

    socket.on('user_typing', (data) => {
        if (currentConversationId === data.conversation_id) {
            const indicator = document.getElementById('typing-indicator');
            if (indicator) {
                indicator.style.display = 'flex';
                indicator.title = `${data.email} écrit...`;
            }
            scrollToBottom();
        }
    });

    socket.on('user_stop_typing', (data) => {
        if (currentConversationId === data.conversation_id) {
            const indicator = document.getElementById('typing-indicator');
            if (indicator) indicator.style.display = 'none';
        }
    });

    socket.on('error', (err: any) => {
        console.error('Socket error:', err);
        showToast(err.message || 'Erreur de connexion chat', 'error');
    });



    socket.on('disconnect', () => {
        console.log('🔌 Chat disconnected');
    });
}

async function loadConversations() {
    const container = document.getElementById('chat-conversations');
    if (!container) return;

    try {
        conversations = await api.getConversations();
        renderConversations();
    } catch (error) {
        container.innerHTML = '<p class="chat-error">Erreur de chargement</p>';
    }
}

function renderConversations() {
    const container = document.getElementById('chat-conversations');
    if (!container) return;

    const user = store.getUser();
    const isManager = user?.role === 'MANAGER';

    if (conversations.length === 0) {
        container.innerHTML = `
      <div class="chat-empty">
        <p>${isManager ? 'Sélectionnez un vendeur pour démarrer une conversation' : 'Aucune conversation'}</p>
        ${isManager ? '<button class="btn btn-primary btn-sm" id="new-chat-btn">Nouvelle conversation</button>' : ''}
        ${!isManager && user?.role === 'SELLER' ? '<button class="btn btn-primary btn-sm" id="contact-manager-btn">Contacter mon Manager</button>' : ''}
      </div>
    `;
        document.getElementById('new-chat-btn')?.addEventListener('click', showNewChatModal);
        document.getElementById('contact-manager-btn')?.addEventListener('click', startChatWithManager);
        return;
    }

    container.innerHTML = conversations.map(conv => {
        const otherUser = isManager ? conv.Seller?.User?.email : conv.Manager?.User?.email;
        const lastMessage = conv.Messages?.[0];
        const unread = conv.unread_count || 0;

        return `
      <div class="conversation-item ${unread > 0 ? 'unread' : ''}" data-id="${conv.id}">
        <div class="conversation-avatar">${otherUser?.charAt(0).toUpperCase() || '?'}</div>
        <div class="conversation-info">
          <span class="conversation-name">${otherUser || 'Manager'}</span>
          <span class="conversation-preview">${lastMessage?.content?.substring(0, 30) || 'Pas de message'}...</span>
        </div>
        ${unread > 0 ? `<span class="conversation-badge">${unread}</span>` : ''}
      </div>
    `;
    }).join('');

    // Add click listeners
    container.querySelectorAll('.conversation-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = parseInt(item.getAttribute('data-id') || '0');
            openConversation(id);
        });
    });
}

async function startChatWithManager() {
    try {
        const conversation = await api.createConversation();
        await loadConversations();
        openConversation(conversation.id);
    } catch (error: any) {
        showToast(error.message || 'Erreur', 'error');
    }
}

async function openConversation(conversationId: number) {
    currentConversationId = conversationId;

    // Join socket room
    socket?.emit('join_conversation', conversationId);

    // Update UI
    document.getElementById('chat-conversations')!.style.display = 'none';
    document.getElementById('chat-messages')!.style.display = 'flex';

    const conv = conversations.find(c => c.id === conversationId);
    const user = store.getUser();
    const isManager = user?.role === 'MANAGER';
    const otherUser = isManager ? conv?.Seller?.User?.email : conv?.Manager?.User?.email;
    document.getElementById('chat-title')!.textContent = otherUser || 'Conversation';

    // Load messages
    const messagesList = document.getElementById('messages-list')!;
    messagesList.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';

    try {
        messages = await api.getMessages(conversationId);
        renderMessages();
        scrollToBottom();
        socket?.emit('mark_read', { conversation_id: conversationId });
        await updateUnreadBadge();
    } catch (error) {
        messagesList.innerHTML = '<p class="chat-error">Erreur de chargement</p>';
    }
}

function renderMessages() {
    const container = document.getElementById('messages-list');
    if (!container) return;

    const userId = store.getUser()?.id;

    container.innerHTML = messages.map(msg => `
    <div class="message ${msg.sender_id === userId ? 'sent' : 'received'}">
      <div class="message-content">${escapeHtml(msg.content)}</div>
      <div class="message-time">${formatTime(msg.createdAt)}</div>
    </div>
  `).join('');
}

function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function scrollToBottom() {
    const container = document.getElementById('messages-list');
    if (container) {
        container.scrollTop = container.scrollHeight;
    }
}

async function sendMessage(e: Event) {
    e.preventDefault();
    const input = document.getElementById('message-input') as HTMLInputElement;
    const content = input.value.trim();

    if (!content || !currentConversationId) return;

    input.value = '';

    // Stop typing immediately
    socket?.emit('stop_typing', { conversation_id: currentConversationId });
    if (typingTimeout) clearTimeout(typingTimeout);

    // Send via socket for real-time
    socket?.emit('send_message', {
        conversation_id: currentConversationId,
        content
    });
}

function showConversations() {
    if (currentConversationId) {
        socket?.emit('leave_conversation', currentConversationId);
    }
    currentConversationId = null;
    document.getElementById('chat-messages')!.style.display = 'none';
    document.getElementById('chat-conversations')!.style.display = 'block';
    document.getElementById('chat-title')!.textContent = 'Messages';

    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.style.display = 'none';

    loadConversations();
}

function showNewChatModal() {
    // Simple prompt for now - could be enhanced with a proper modal
    showToast('Sélectionnez un vendeur depuis la page Vendeurs', 'info');
}

function toggleChat() {
    isOpen = !isOpen;
    document.getElementById('chat-panel')?.classList.toggle('open', isOpen);
    if (isOpen) {
        loadConversations();
    }
}

function closeChat() {
    isOpen = false;
    document.getElementById('chat-panel')?.classList.remove('open');
}

function updateBadge() {
    const badge = document.getElementById('chat-badge');
    if (badge) {
        badge.textContent = unreadCount.toString();
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
}

async function updateUnreadBadge() {
    try {
        const result = await api.getUnreadCount();
        unreadCount = result.unread;
        updateBadge();
    } catch (error) {
        console.error('Failed to get unread count');
    }
}

function pollUnreadCount() {
    setInterval(updateUnreadBadge, 30000); // Every 30 seconds
    updateUnreadBadge();
}

export function destroyChatWidget() {
    socket?.disconnect();
    socket = null;
    document.getElementById('chat-widget')?.remove();
}

// Allow starting chat with a specific seller (for manager)
export async function startChatWithSeller(sellerId: number) {
    try {
        const conversation = await api.createConversation(sellerId);
        await loadConversations();
        openConversation(conversation.id);
        if (!isOpen) toggleChat();
    } catch (error: any) {
        showToast(error.message || 'Erreur', 'error');
    }
}
