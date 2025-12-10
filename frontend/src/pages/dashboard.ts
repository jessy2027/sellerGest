// Page Dashboard

import { store } from '../state';
import { api } from '../api';
import { createStatsCard } from '../components/ui';

export function renderDashboard(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'dashboard-page';

  const user = store.getUser();
  const role = user?.role || 'SELLER';

  container.innerHTML = `
    <header class="page-header">
      <div class="page-header-content">
        <h1>Bonjour, ${user?.email?.split('@')[0] || 'Utilisateur'} 👋</h1>
        <p>Voici un aperçu de votre activité</p>
      </div>
      <div class="page-header-actions">
        <div class="date-display">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>
    </header>
    
    <div class="stats-grid" id="stats-grid">
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Chargement des statistiques...</p>
      </div>
    </div>
    
    <div class="dashboard-grid">
      <section class="dashboard-section recent-activity">
        <div class="section-header">
          <h2>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            Actions rapides
          </h2>
        </div>
        <div class="quick-actions-grid">
          ${role === 'SUPER_ADMIN' ? `
          <a href="#/managers" class="quick-action-card">
            <div class="quick-action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <span>Gérer les managers</span>
          </a>
          ` : ''}
          ${role !== 'SELLER' ? `
          <a href="#/products" class="quick-action-card">
            <div class="quick-action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
            <span>Ajouter un produit</span>
          </a>
          <a href="#/sellers" class="quick-action-card">
            <div class="quick-action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <line x1="23" y1="11" x2="17" y2="11"/>
                <line x1="20" y1="8" x2="20" y2="14"/>
              </svg>
            </div>
            <span>Ajouter un vendeur</span>
          </a>
          ` : ''}
          <a href="#/products" class="quick-action-card">
            <div class="quick-action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
              </svg>
            </div>
            <span>${role === 'SELLER' ? 'Mes produits' : 'Voir les produits'}</span>
          </a>
          ${role === 'SELLER' ? `
          <a href="#/sales" class="quick-action-card">
            <div class="quick-action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <span>Mes ventes</span>
          </a>
          ` : ''}
          <a href="#/assignments" class="quick-action-card">
            <div class="quick-action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 11 12 14 22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </div>
            <span>Assignations</span>
          </a>
        </div>
      </section>
      
      <section class="dashboard-section role-info">
        <div class="section-header">
          <h2>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            Votre rôle
          </h2>
        </div>
        <div class="role-card ${role.toLowerCase()}">
          <div class="role-badge">${getRoleLabel(role)}</div>
          <p class="role-description">${getRoleDescription(role)}</p>
        </div>
      </section>
    </div>
  `;

  // Charger les stats dynamiques
  setTimeout(() => loadDashboardStats(), 0);

  return container;
}

async function loadDashboardStats() {
  const statsGrid = document.getElementById('stats-grid');
  if (!statsGrid) return;

  const role = store.getRole();

  try {
    const stats = await api.getStats();
    statsGrid.innerHTML = '';

    if (role === 'SUPER_ADMIN') {
      statsGrid.appendChild(createStatsCard('Managers', String(stats.total_managers || 0), `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      `));

      statsGrid.appendChild(createStatsCard('Vendeurs', String(stats.total_sellers || 0), `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
        </svg>
      `));

      statsGrid.appendChild(createStatsCard('Produits', String(stats.total_products || 0), `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
        </svg>
      `));

      statsGrid.appendChild(createStatsCard('Volume total', `${(stats.total_volume || 0).toFixed(2)}€`, `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      `));
    } else if (role === 'MANAGER') {
      statsGrid.appendChild(createStatsCard('Mes produits', String(stats.total_products || 0), `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
        </svg>
      `));

      statsGrid.appendChild(createStatsCard('Mes vendeurs', String(stats.total_sellers || 0), `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
        </svg>
      `));

      statsGrid.appendChild(createStatsCard('Ventes', String(stats.total_sales || 0), `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      `));

      statsGrid.appendChild(createStatsCard('Revenus', `${(stats.total_revenue || 0).toFixed(2)}€`, `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      `));
    } else {
      statsGrid.appendChild(createStatsCard('Produits assignés', String(stats.products_assigned || 0), `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
        </svg>
      `));

      statsGrid.appendChild(createStatsCard('Vendus', String(stats.products_sold || 0), `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      `));

      statsGrid.appendChild(createStatsCard('À payer', `${(stats.pending_payments || 0).toFixed(2)}€`, `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      `));

      statsGrid.appendChild(createStatsCard('Mon solde', `${(stats.balance || 0).toFixed(2)}€`, `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      `));
    }
  } catch (error) {
    console.error('Failed to load stats:', error);
    // Afficher des stats par défaut
    statsGrid.innerHTML = `
      <div class="empty-state small">
        <p>Impossible de charger les statistiques</p>
      </div>
    `;
  }
}

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    'SUPER_ADMIN': 'Administrateur',
    'MANAGER': 'Manager',
    'SELLER': 'Vendeur',
  };
  return labels[role] || role;
}

function getRoleDescription(role: string): string {
  const descriptions: Record<string, string> = {
    'SUPER_ADMIN': 'Vous pouvez créer et gérer des managers qui superviseront les vendeurs.',
    'MANAGER': 'Vous pouvez créer des produits, recruter des vendeurs et suivre les ventes.',
    'SELLER': 'Vous vendez les produits assignés par votre manager et recevez des commissions.',
  };
  return descriptions[role] || '';
}
