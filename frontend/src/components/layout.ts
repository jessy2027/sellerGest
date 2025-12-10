// Layout principal avec sidebar et navigation

import { store } from '../state';
import { router } from '../router';

export function renderLayout(container: HTMLElement, content: HTMLElement) {
  container.innerHTML = '';

  const user = store.getUser();
  const role = user?.role || 'SELLER';

  const layout = document.createElement('div');
  layout.className = 'app-layout';

  // Sidebar
  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar';

  sidebar.innerHTML = `
    <div class="sidebar-header">
      <div class="sidebar-logo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 7h-9m9 10h-9m4-5h-4m-6 5V7l-4 3 4 3v4"/>
        </svg>
        <span>Seller<strong>Gest</strong></span>
      </div>
    </div>
    
    <nav class="sidebar-nav">
      <div class="nav-section">
        <span class="nav-section-title">Menu principal</span>
        <a href="#/dashboard" class="nav-item ${isActive('/dashboard')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
          <span>Tableau de bord</span>
        </a>
        <a href="#/products" class="nav-item ${isActive('/products')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <span>Produits</span>
        </a>
        ${role !== 'SELLER' ? `
        <a href="#/sellers" class="nav-item ${isActive('/sellers')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span>Vendeurs</span>
        </a>
        ` : ''}
        ${role === 'SUPER_ADMIN' ? `
        <a href="#/managers" class="nav-item ${isActive('/managers')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span>Managers</span>
        </a>
        ` : ''}
        <a href="#/assignments" class="nav-item ${isActive('/assignments')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 11 12 14 22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          <span>Assignations</span>
        </a>
        <a href="#/sales" class="nav-item ${isActive('/sales')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          <span>Ventes</span>
        </a>
      </div>
    </nav>
    
    <div class="sidebar-footer">
      <div class="user-info">
        <div class="user-avatar">
          ${user?.email?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div class="user-details">
          <span class="user-email">${user?.email || 'Utilisateur'}</span>
          <span class="user-role">${getRoleLabel(role)}</span>
        </div>
      </div>
      <button id="logout-btn" class="btn-logout" title="Déconnexion">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </button>
    </div>
  `;

  // Main content area
  const main = document.createElement('main');
  main.className = 'main-content';
  main.appendChild(content);

  layout.appendChild(sidebar);
  layout.appendChild(main);
  container.appendChild(layout);

  // Logout handler
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    store.logout();
    router.navigate('/login');
  });
}

function isActive(path: string): string {
  return router.getCurrentPath() === path ? 'active' : '';
}

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    'SUPER_ADMIN': 'Super Admin',
    'MANAGER': 'Manager',
    'SELLER': 'Vendeur',
  };
  return labels[role] || role;
}

