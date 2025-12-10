// Page Assignments

import { store } from '../state';
import { api } from '../api';
import { showToast } from '../components/ui';

interface Assignment {
  id: number;
  product_id: number;
  seller_id: number;
  status: 'en_vente' | 'vendu' | 'probleme';
  assigned_at: string | null;
  sold_at: string | null;
  Product?: {
    id: number;
    title: string;
    base_price: number;
    category: string;
  };
  Seller?: {
    User?: { email: string };
  };
}

let assignmentsData: Assignment[] = [];

export function renderAssignments(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'assignments-page';

  const role = store.getRole();
  const isSeller = role === 'SELLER';

  container.innerHTML = `
    <header class="page-header">
      <div class="page-header-content">
        <h1>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 11 12 14 22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          ${isSeller ? 'Mes Assignations' : 'Assignations'}
        </h1>
        <p>${isSeller ? 'Produits qui vous ont été assignés' : 'Suivez les produits assignés aux vendeurs'}</p>
      </div>
    </header>
    
    <div class="filters-bar">
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" placeholder="Rechercher..." id="search-input">
      </div>
      <div class="filter-group">
        <select id="status-filter" class="form-select">
          <option value="">Tous les statuts</option>
          <option value="en_vente">En vente</option>
          <option value="vendu">Vendu</option>
          <option value="probleme">Problème</option>
        </select>
      </div>
    </div>
    
    <div class="assignments-table-wrapper" id="assignments-container">
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Chargement des assignations...</p>
      </div>
    </div>
  `;

  // Charger les données
  setTimeout(() => {
    loadAssignments();

    const statusFilter = document.getElementById('status-filter') as HTMLSelectElement;
    statusFilter?.addEventListener('change', () => filterAssignments());

    const searchInput = document.getElementById('search-input') as HTMLInputElement;
    searchInput?.addEventListener('input', () => filterAssignments());
  }, 0);

  return container;
}

async function loadAssignments() {
  const container = document.getElementById('assignments-container');
  if (!container) return;

  try {
    assignmentsData = await api.getAssignments();
    renderAssignmentsTable(container);
  } catch (error: any) {
    container.innerHTML = `
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

function renderAssignmentsTable(container: HTMLElement) {
  const role = store.getRole();
  const isSeller = role === 'SELLER';

  if (assignmentsData.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 11 12 14 22 4"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
        <h3>Aucune assignation</h3>
        <p>${isSeller ? 'Aucun produit ne vous a été assigné' : 'Assignez des produits à vos vendeurs'}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Produit</th>
          ${!isSeller ? '<th>Vendeur</th>' : ''}
          <th>Prix</th>
          <th>Statut</th>
          <th>Date d'assignation</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${assignmentsData.map(a => `
          <tr data-id="${a.id}" data-status="${a.status}">
            <td>
              <div class="product-cell">
                <div class="product-thumb"></div>
                <span>${a.Product?.title || 'Produit'}</span>
              </div>
            </td>
            ${!isSeller ? `
            <td>
              <div class="seller-cell">
                <div class="seller-mini-avatar">${(a.Seller?.User?.email || '?').charAt(0).toUpperCase()}</div>
                <span>${a.Seller?.User?.email || '-'}</span>
              </div>
            </td>
            ` : ''}
            <td><strong>${parseFloat(String(a.Product?.base_price || 0)).toFixed(2)}€</strong></td>
            <td>
              <span class="status-badge ${a.status}">${getStatusLabel(a.status)}</span>
            </td>
            <td>${a.assigned_at ? formatDate(a.assigned_at) : '-'}</td>
            <td>
              <div class="table-actions">
                ${isSeller && a.status === 'en_vente' ? `
                <button class="btn btn-success btn-sm" onclick="markAssignmentSold(${a.id})" title="Marquer comme vendu">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Vendu
                </button>
                ` : a.status === 'vendu' ? `
                <span class="sold-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Vendu ${a.sold_at ? 'le ' + formatDate(a.sold_at) : ''}
                </span>
                ` : ''}
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'en_vente': 'En vente',
    'vendu': 'Vendu',
    'probleme': 'Problème',
  };
  return labels[status] || status;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function filterAssignments() {
  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  const statusFilter = document.getElementById('status-filter') as HTMLSelectElement;
  const query = searchInput?.value.toLowerCase() || '';
  const status = statusFilter?.value || '';

  const rows = document.querySelectorAll('.data-table tbody tr');
  rows.forEach(row => {
    const text = row.textContent?.toLowerCase() || '';
    const rowStatus = row.getAttribute('data-status') || '';
    const matchesQuery = text.includes(query);
    const matchesStatus = !status || rowStatus === status;
    (row as HTMLElement).style.display = matchesQuery && matchesStatus ? '' : 'none';
  });
}

// Global functions
(window as any).markAssignmentSold = async (id: number) => {
  if (!confirm('Confirmez-vous avoir vendu ce produit ?')) return;

  try {
    const result = await api.markAsSold(id);
    showToast(result.message || 'Vente enregistrée !', 'success');
    // Rediriger vers la page des ventes pour effectuer le paiement
    window.location.hash = '/sales';
  } catch (error: any) {
    showToast(error.message || 'Erreur lors de l\'enregistrement', 'error');
  }
};
