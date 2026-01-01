// Page Sellers

import { store } from '../state';
import { api } from '../api';
import { showToast, createModal } from '../components/ui';

interface Seller {
  id: number;
  user_id: number;
  email: string;
  manager_id: number;
  manager_email?: string;
  vinted_profile: string | null;
  commission_rate: number;
  createdAt: string;
}

let sellersData: Seller[] = [];

export function renderSellers(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'sellers-page';

  const role = store.getRole();
  const isManager = role === 'MANAGER';

  container.innerHTML = `
    <header class="page-header">
      <div class="page-header-content">
        <h1>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          ${isManager ? 'Mes Vendeurs' : 'Vendeurs'}
        </h1>
        <p>${isManager ? 'Gérez vos vendeurs et leurs commissions' : 'Tous les vendeurs de la plateforme'}</p>
      </div>
      ${isManager ? `
      <button class="btn btn-primary" id="add-seller-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Nouveau Vendeur
      </button>
      ` : ''}
    </header>
    
    <div class="filters-bar">
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" placeholder="Rechercher un vendeur..." id="search-input">
      </div>
    </div>
    
    <div class="sellers-grid" id="sellers-grid">
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Chargement des vendeurs...</p>
      </div>
    </div>
  `;

  // Charger les vendeurs
  setTimeout(() => loadSellers(), 0);

  // Event listeners
  setTimeout(() => {
    const searchInput = document.getElementById('search-input') as HTMLInputElement;
    searchInput?.addEventListener('input', (e) => {
      filterSellers((e.target as HTMLInputElement).value);
    });

    const addBtn = document.getElementById('add-seller-btn');
    addBtn?.addEventListener('click', () => openCreateSellerModal());
  }, 0);

  return container;
}

async function loadSellers() {
  const grid = document.getElementById('sellers-grid');
  if (!grid) return;

  try {
    sellersData = await api.getSellers();
    renderSellersGrid(grid);
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

function renderSellersGrid(grid: HTMLElement) {
  const role = store.getRole();
  const isManager = role === 'MANAGER';

  if (sellersData.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
        </svg>
        <h3>Aucun vendeur</h3>
        <p>${isManager ? 'Créez votre premier vendeur pour commencer' : 'Aucun vendeur sur la plateforme'}</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = sellersData.map(seller => `
    <div class="seller-card" data-id="${seller.id}">
      <div class="seller-header">
        <div class="seller-avatar">
          ${seller.email.charAt(0).toUpperCase()}
        </div>
        <div class="seller-status active">Actif</div>
      </div>
      <div class="seller-info">
        <h3 class="seller-email">${seller.email}</h3>
        ${seller.vinted_profile ? `
        <a href="https://vinted.fr/member/${seller.vinted_profile.replace('@', '')}" target="_blank" class="seller-vinted">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          ${seller.vinted_profile}
        </a>
        ` : `<span class="seller-vinted-empty">Pas de profil Vinted</span>`}
      </div>
      <div class="seller-stats">
        <div class="stat">
          <span class="stat-value">${seller.commission_rate}%</span>
          <span class="stat-label">Commission</span>
        </div>
        ${!isManager && seller.manager_email ? `
        <div class="stat">
          <span class="stat-value" style="font-size: 0.75rem;">${seller.manager_email}</span>
          <span class="stat-label">Manager</span>
        </div>
        ` : ''}
      </div>
      <div class="seller-actions">
        <button class="btn btn-ghost btn-sm" onclick="startSellerChat(${seller.id})">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
           </svg>
           Message
        </button>
        <button class="btn btn-ghost btn-sm" onclick="editSeller(${seller.id})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Modifier
        </button>
        ${isManager ? `
        <button class="btn btn-ghost btn-danger btn-sm" onclick="deleteSeller(${seller.id})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          Supprimer
        </button>
        ` : ''}
      </div>
    </div>
  `).join('');
}

function filterSellers(query: string) {
  const cards = document.querySelectorAll('.seller-card');
  cards.forEach(card => {
    const email = card.querySelector('.seller-email')?.textContent?.toLowerCase() || '';
    const vinted = card.querySelector('.seller-vinted')?.textContent?.toLowerCase() || '';
    const matches = email.includes(query.toLowerCase()) || vinted.includes(query.toLowerCase());
    (card as HTMLElement).style.display = matches ? '' : 'none';
  });
}

function openCreateSellerModal() {
  const content = document.createElement('div');
  content.innerHTML = `
    <form id="create-seller-form" class="modal-form">
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" class="form-input" placeholder="vendeur@exemple.com" required>
      </div>
      <div class="form-group">
        <label for="password">Mot de passe</label>
        <input type="password" id="password" name="password" class="form-input" placeholder="••••••••" required minlength="6">
      </div>
      <div class="form-group">
        <label for="vinted">Profil Vinted (optionnel)</label>
        <input type="text" id="vinted" name="vinted" class="form-input" placeholder="@nom_vinted">
      </div>
      <div class="form-group">
        <label for="commission">Taux de commission (%)</label>
        <input type="number" id="commission" name="commission" class="form-input" step="0.5" min="0" max="100" value="15">
        <small class="form-hint">Commission que ce vendeur recevra sur ses ventes</small>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Créer le vendeur</button>
      </div>
    </form>
  `;

  const modal = createModal('Nouveau Vendeur', content);
  document.body.appendChild(modal);

  const form = document.getElementById('create-seller-form') as HTMLFormElement;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const vinted_profile = formData.get('vinted') as string || undefined;
    const commission_rate = parseFloat(formData.get('commission') as string) || 15;

    const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-small"></span> Création...';

    try {
      await api.createSeller({ email, password, vinted_profile, commission_rate });
      showToast('Vendeur créé avec succès !', 'success');
      modal.remove();
      loadSellers();
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de la création', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Créer le vendeur';
    }
  });
}

// Global functions
(window as any).startSellerChat = async (id: number) => {
  // Dynamically import to avoid circular dependencies if any, or just use the imported function
  const { startChatWithSeller } = await import('../components/ChatWidget');
  startChatWithSeller(id);
};

(window as any).editSeller = (id: number) => {
  const seller = sellersData.find(s => s.id === id);
  if (!seller) return;

  const content = document.createElement('div');
  content.innerHTML = `
    <form id="seller-form" class="modal-form">
      <div class="form-group">
        <label for="vinted">Profil Vinted</label>
        <input type="text" id="vinted" name="vinted" class="form-input" value="${seller.vinted_profile || ''}">
      </div>
      <div class="form-group">
        <label for="commission">Taux de commission (%)</label>
        <input type="number" id="commission" name="commission" class="form-input" step="0.5" min="0" max="100" value="${seller.commission_rate}">
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Sauvegarder</button>
      </div>
    </form>
  `;

  const modal = createModal('Modifier le vendeur', content);
  document.body.appendChild(modal);

  const form = document.getElementById('seller-form') as HTMLFormElement;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const vinted_profile = formData.get('vinted') as string;
    const commission_rate = parseFloat(formData.get('commission') as string);

    try {
      await api.updateSeller(id, { vinted_profile, commission_rate });
      showToast('Vendeur mis à jour !', 'success');
      modal.remove();
      loadSellers();
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de la mise à jour', 'error');
    }
  });
};

(window as any).deleteSeller = async (id: number) => {
  const seller = sellersData.find(s => s.id === id);
  if (!seller) return;

  if (!confirm(`Êtes-vous sûr de vouloir supprimer le vendeur ${seller.email} ?`)) {
    return;
  }

  try {
    await api.deleteSeller(id);
    showToast('Vendeur supprimé !', 'success');
    loadSellers();
  } catch (error: any) {
    showToast(error.message || 'Erreur lors de la suppression', 'error');
  }
};
