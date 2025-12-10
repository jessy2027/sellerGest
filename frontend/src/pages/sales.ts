// Page Sales - Ventes et Transactions

import { store } from '../state';
import { api } from '../api';
import { showToast, createModal } from '../components/ui';

interface Sale {
    id: number;
    product_price: number;
    seller_commission: number;
    amount_to_manager: number;
    status: 'pending' | 'paid' | 'cancelled';
    sold_at: string | null;
    paid_at: string | null;
    ProductAssignment?: {
        Product?: {
            title: string;
            category: string;
        };
    };
    Seller?: {
        User?: { email: string };
    };
    Manager?: {
        User?: { email: string };
    };
}

let salesData: Sale[] = [];

export function renderSales(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'sales-page';

    const role = store.getRole();
    const isSeller = role === 'SELLER';

    container.innerHTML = `
    <header class="page-header">
      <div class="page-header-content">
        <h1>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          ${isSeller ? 'Mes Ventes' : 'Ventes'}
        </h1>
        <p>${isSeller ? 'Gérez vos ventes et paiements' : 'Suivez les ventes de vos vendeurs'}</p>
      </div>
      ${isSeller ? `
      <div class="balance-display">
        <span class="balance-label">Mon Solde</span>
        <span class="balance-value" id="balance-value">--€</span>
      </div>
      ` : ''}
    </header>
    
    <div class="filters-bar">
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" placeholder="Rechercher une vente..." id="search-input">
      </div>
      <div class="filter-group">
        <select id="status-filter" class="form-select">
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="paid">Payé</option>
          <option value="cancelled">Annulé</option>
        </select>
      </div>
    </div>
    
    <div class="sales-stats" id="sales-stats">
      <!-- Stats seront chargées ici -->
    </div>
    
    <div class="sales-list" id="sales-list">
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Chargement des ventes...</p>
      </div>
    </div>
  `;

    // Charger les données
    setTimeout(() => {
        loadSales();
        loadStats();

        const statusFilter = document.getElementById('status-filter') as HTMLSelectElement;
        statusFilter?.addEventListener('change', () => filterSales());

        const searchInput = document.getElementById('search-input') as HTMLInputElement;
        searchInput?.addEventListener('input', () => filterSales());
    }, 0);

    return container;
}

async function loadStats() {
    try {
        const stats = await api.getStats();
        const statsContainer = document.getElementById('sales-stats');
        const role = store.getRole();

        if (!statsContainer) return;

        if (role === 'SELLER') {
            // Mettre à jour le solde
            const balanceEl = document.getElementById('balance-value');
            if (balanceEl) {
                balanceEl.textContent = `${stats.balance?.toFixed(2) || '0.00'}€`;
            }

            statsContainer.innerHTML = `
        <div class="stat-card">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">${stats.products_assigned || 0}</span>
            <span class="stat-label">Produits assignés</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">${stats.products_sold || 0}</span>
            <span class="stat-label">Vendus</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon warning">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">${stats.pending_payments?.toFixed(2) || '0.00'}€</span>
            <span class="stat-label">À payer</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">${stats.total_earnings?.toFixed(2) || '0.00'}€</span>
            <span class="stat-label">Total gagné</span>
          </div>
        </div>
      `;
        } else if (role === 'MANAGER') {
            statsContainer.innerHTML = `
        <div class="stat-card">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">${stats.total_sales || 0}</span>
            <span class="stat-label">Ventes totales</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">${stats.total_revenue?.toFixed(2) || '0.00'}€</span>
            <span class="stat-label">Revenus reçus</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon warning">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">${stats.pending_revenue?.toFixed(2) || '0.00'}€</span>
            <span class="stat-label">En attente</span>
          </div>
        </div>
      `;
        }
    } catch (err) {
        console.error('Failed to load stats:', err);
    }
}

async function loadSales() {
    const listContainer = document.getElementById('sales-list');
    if (!listContainer) return;

    try {
        salesData = await api.getSales();
        renderSalesList(listContainer);
    } catch (error: any) {
        listContainer.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h3>Erreur de chargement</h3>
        <p>${error.message}</p>
      </div>
    `;
    }
}

function renderSalesList(container: HTMLElement) {
    const role = store.getRole();
    const isSeller = role === 'SELLER';

    if (salesData.length === 0) {
        container.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
        <h3>Aucune vente</h3>
        <p>${isSeller ? 'Vendez des produits pour voir vos transactions ici' : 'Aucune vente enregistrée'}</p>
      </div>
    `;
        return;
    }

    container.innerHTML = `
    <div class="sales-grid">
      ${salesData.map(sale => `
        <div class="sale-card ${sale.status}" data-id="${sale.id}" data-status="${sale.status}">
          <div class="sale-header">
            <h3>${sale.ProductAssignment?.Product?.title || 'Produit'}</h3>
            <span class="sale-status ${sale.status}">${getStatusLabel(sale.status)}</span>
          </div>
          <div class="sale-details">
            <div class="sale-row">
              <span class="label">Prix de vente</span>
              <span class="value">${parseFloat(String(sale.product_price)).toFixed(2)}€</span>
            </div>
            <div class="sale-row highlight">
              <span class="label">Votre commission (${isSeller ? 'à recevoir' : 'vendeur'})</span>
              <span class="value success">+${parseFloat(String(sale.seller_commission)).toFixed(2)}€</span>
            </div>
            <div class="sale-row ${isSeller ? 'warning' : 'success'}">
              <span class="label">${isSeller ? 'À payer au manager' : 'À recevoir'}</span>
              <span class="value">${parseFloat(String(sale.amount_to_manager)).toFixed(2)}€</span>
            </div>
          </div>
          <div class="sale-meta">
            ${!isSeller && sale.Seller?.User?.email ? `
            <span class="seller-info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              ${sale.Seller.User.email}
            </span>
            ` : ''}
            <span class="sale-date">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              ${sale.sold_at ? new Date(sale.sold_at).toLocaleDateString('fr-FR') : '-'}
            </span>
          </div>
          ${isSeller && sale.status === 'pending' ? `
          <div class="sale-actions">
            <button class="btn btn-primary" onclick="paySale(${sale.id})">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              Payer ${parseFloat(String(sale.amount_to_manager)).toFixed(2)}€
            </button>
          </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        'pending': 'En attente',
        'paid': 'Payé',
        'cancelled': 'Annulé',
    };
    return labels[status] || status;
}

function filterSales() {
    const searchInput = document.getElementById('search-input') as HTMLInputElement;
    const statusFilter = document.getElementById('status-filter') as HTMLSelectElement;
    const query = searchInput?.value.toLowerCase() || '';
    const status = statusFilter?.value || '';

    const cards = document.querySelectorAll('.sale-card');
    cards.forEach(card => {
        const title = card.querySelector('h3')?.textContent?.toLowerCase() || '';
        const cardStatus = card.getAttribute('data-status') || '';
        const matchesQuery = title.includes(query);
        const matchesStatus = !status || cardStatus === status;
        (card as HTMLElement).style.display = matchesQuery && matchesStatus ? '' : 'none';
    });
}

// Global function
(window as any).paySale = async (id: number) => {
    const sale = salesData.find(s => s.id === id);
    if (!sale) return;

    const confirmMsg = `Confirmez le paiement de ${parseFloat(String(sale.amount_to_manager)).toFixed(2)}€ au manager?\n\nVotre commission de ${parseFloat(String(sale.seller_commission)).toFixed(2)}€ sera ajoutée à votre solde.`;

    if (!confirm(confirmMsg)) return;

    try {
        const result = await api.payTransaction(id);
        showToast(result.message || 'Paiement effectué !', 'success');

        // Mettre à jour le solde affiché
        const balanceEl = document.getElementById('balance-value');
        if (balanceEl && result.new_balance !== undefined) {
            balanceEl.textContent = `${parseFloat(result.new_balance).toFixed(2)}€`;
        }

        // Recharger les données
        loadSales();
        loadStats();
    } catch (error: any) {
        showToast(error.message || 'Erreur lors du paiement', 'error');
    }
};
