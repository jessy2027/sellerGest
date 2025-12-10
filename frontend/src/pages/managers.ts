// Page Managers (Super Admin only)

import { api } from '../api';
import { showToast, createModal } from '../components/ui';

interface Manager {
  id: number;
  user_id: number;
  email: string;
  commission_rate: number;
  active: boolean;
  sellers_count: number;
  createdAt: string;
}

let managersData: Manager[] = [];

export function renderManagers(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'managers-page';
  
  container.innerHTML = `
    <header class="page-header">
      <div class="page-header-content">
        <h1>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          Managers
        </h1>
        <p>Gérez les managers de votre plateforme</p>
      </div>
      <button class="btn btn-primary" id="add-manager-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Nouveau Manager
      </button>
    </header>
    
    <div class="managers-grid" id="managers-grid">
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Chargement des managers...</p>
      </div>
    </div>
  `;
  
  // Charger les managers
  setTimeout(() => loadManagers(), 0);
  
  // Event listener pour le bouton d'ajout
  setTimeout(() => {
    const addBtn = document.getElementById('add-manager-btn');
    addBtn?.addEventListener('click', () => openCreateManagerModal());
  }, 0);
  
  return container;
}

async function loadManagers() {
  const grid = document.getElementById('managers-grid');
  if (!grid) return;

  try {
    managersData = await api.getManagers();
    renderManagersGrid(grid);
  } catch (error: any) {
    grid.innerHTML = `
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

function renderManagersGrid(grid: HTMLElement) {
  if (managersData.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <h3>Aucun manager</h3>
        <p>Créez votre premier manager pour commencer</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = managersData.map(manager => `
    <div class="manager-card ${manager.active ? '' : 'inactive'}" data-id="${manager.id}">
      <div class="manager-header">
        <div class="manager-avatar">
          ${manager.email.charAt(0).toUpperCase()}
        </div>
        <div class="manager-badge ${manager.active ? 'active' : 'inactive'}">
          ${manager.active ? 'Actif' : 'Inactif'}
        </div>
      </div>
      
      <div class="manager-info">
        <h3>${manager.email}</h3>
        <span class="manager-commission">Commission: ${manager.commission_rate}%</span>
      </div>
      
      <div class="manager-metrics">
        <div class="metric">
          <div class="metric-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
            </svg>
          </div>
          <div class="metric-content">
            <span class="metric-value">${manager.sellers_count}</span>
            <span class="metric-label">Vendeurs</span>
          </div>
        </div>
      </div>
      
      <div class="manager-actions">
        <button class="btn btn-ghost" onclick="editManager(${manager.id})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Modifier
        </button>
        <button class="btn btn-ghost ${manager.active ? 'btn-warning' : 'btn-success'}" onclick="toggleManager(${manager.id}, ${manager.active})">
          ${manager.active ? `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          Désactiver
          ` : `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          Activer
          `}
        </button>
        <button class="btn btn-ghost btn-danger" onclick="deleteManager(${manager.id})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          Supprimer
        </button>
      </div>
    </div>
  `).join('');
}

function openCreateManagerModal() {
  const content = document.createElement('div');
  content.innerHTML = `
    <form id="create-manager-form" class="modal-form">
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" class="form-input" placeholder="manager@exemple.com" required>
      </div>
      <div class="form-group">
        <label for="password">Mot de passe</label>
        <input type="password" id="password" name="password" class="form-input" placeholder="••••••••" required minlength="6">
      </div>
      <div class="form-group">
        <label for="commission">Taux de commission (%)</label>
        <input type="number" id="commission" name="commission" class="form-input" step="0.5" min="0" max="100" value="10">
        <small class="form-hint">Commission que le manager prendra sur les ventes de ses vendeurs</small>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Créer le manager</button>
      </div>
    </form>
  `;
  
  const modal = createModal('Nouveau Manager', content);
  document.body.appendChild(modal);
  
  const form = document.getElementById('create-manager-form') as HTMLFormElement;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(form);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const commission_rate = parseFloat(formData.get('commission') as string) || 10;
    
    const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-small"></span> Création...';
    
    try {
      await api.createManager({ email, password, commission_rate });
      showToast('Manager créé avec succès !', 'success');
      modal.remove();
      loadManagers();
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de la création', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Créer le manager';
    }
  });
}

// Global functions
(window as any).editManager = (id: number) => {
  const manager = managersData.find(m => m.id === id);
  if (!manager) return;

  const content = document.createElement('div');
  content.innerHTML = `
    <form id="manager-form" class="modal-form">
      <div class="form-group">
        <label for="commission">Taux de commission (%)</label>
        <input type="number" id="commission" name="commission" class="form-input" step="0.5" min="0" max="100" value="${manager.commission_rate}">
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Sauvegarder</button>
      </div>
    </form>
  `;
  
  const modal = createModal('Modifier le manager', content);
  document.body.appendChild(modal);
  
  const form = document.getElementById('manager-form') as HTMLFormElement;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(form);
    const commission_rate = parseFloat(formData.get('commission') as string);
    
    try {
      await api.updateManager(id, { commission_rate });
      showToast('Manager mis à jour !', 'success');
      modal.remove();
      loadManagers();
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de la mise à jour', 'error');
    }
  });
};

(window as any).toggleManager = async (id: number, isActive: boolean) => {
  try {
    await api.updateManager(id, { active: !isActive });
    showToast(`Manager ${isActive ? 'désactivé' : 'activé'} !`, 'success');
    loadManagers();
  } catch (error: any) {
    showToast(error.message || 'Erreur', 'error');
  }
};

(window as any).deleteManager = async (id: number) => {
  const manager = managersData.find(m => m.id === id);
  if (!manager) return;

  if (!confirm(`Êtes-vous sûr de vouloir supprimer le manager ${manager.email} ?`)) {
    return;
  }

  try {
    await api.deleteManager(id);
    showToast('Manager supprimé !', 'success');
    loadManagers();
  } catch (error: any) {
    showToast(error.message || 'Erreur lors de la suppression', 'error');
  }
};
