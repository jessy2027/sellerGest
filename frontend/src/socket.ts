import { io, Socket } from 'socket.io-client';
import { showToast } from './components/ui';

const SOCKET_URL = 'http://localhost:4000';

let socket: Socket | null = null;

export function initSocket() {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (socket?.connected) return;

    socket = io(SOCKET_URL, {
        auth: { token }
    });

    socket.on('connect', () => {
        console.log('🔌 Global Socket connected');
    });

    // Global listener for stock updates
    socket.on('stock_updated', (data: any) => {
        console.log('📦 Global Stock updated:', data);

        // Show toast notification
        const action = data.action === 'restock' ? 'restocké' : 'vendu';
        showToast(`Stock mis à jour (${action}) - ${data.new_stock} restant(s)`, 'info');

        // Dispatch DOM event for pages to react
        window.dispatchEvent(new CustomEvent('stock-updated', { detail: data }));
    });

    socket.on('disconnect', () => {
        console.log('🔌 Global Socket disconnected');
    });
}

export function getSocket() {
    return socket;
}

export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}
