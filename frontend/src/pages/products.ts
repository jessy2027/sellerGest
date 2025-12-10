// Page Products

import { store } from '../state';
import { api } from '../api';
import { showToast, createModal } from '../components/ui';

interface Product {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  base_price: number;
  stock_quantity: number;
  status: 'disponible' | 'assigne' | 'vendu';
  createdAt?: string;
  // Pour vendeurs
  assignment_id?: number;
  assignment_status?: string;
}

interface Seller {
  id: number;
  email: string;
}

let productsData: Product[] = [];
let sellersData: Seller[] = [];

export function renderProducts(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'products-page';

  const role = store.getRole();
  const canEdit = role === 'MANAGER';
  const isSeller = role === 'SELLER';

  container.innerHTML = `
    <header class="page-header">
      <div class="page-header-content">
        <h1>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          ${isSeller ? 'Mes Produits Assignés' : 'Produits'}
        </h1>
        <p>${isSeller ? 'Produits à vendre pour votre manager' : 'Gérez votre catalogue de produits'}</p>
      </div>
      ${canEdit ? `
      <div class="page-header-actions">
        <button class="btn btn-primary" id="add-product-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nouveau produit
        </button>
      </div>
      ` : ''}
    </header>
    
    <div class="filters-bar">
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" placeholder="Rechercher un produit..." id="search-input">
      </div>
      <div class="filter-group">
        <select id="status-filter" class="form-select">
          <option value="">Tous les statuts</option>
          <option value="disponible">Disponible</option>
          <option value="assigne">Assigné</option>
          <option value="vendu">Vendu</option>
        </select>
        <select id="category-filter" class="form-select">
          <option value="">Toutes les catégories</option>
          <option value="vetements">Vêtements</option>
          <option value="chaussures">Chaussures</option>
          <option value="accessoires">Accessoires</option>
          <option value="electronique">Électronique</option>
        </select>
      </div>
    </div>
    
    <div class="products-grid" id="products-grid">
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Chargement des produits...</p>
      </div>
    </div>
  `;

  // Charger les données
  setTimeout(() => {
    loadProducts();
    if (canEdit) loadSellers();

    const addBtn = document.getElementById('add-product-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => openProductModal());
    }

    const searchInput = document.getElementById('search-input') as HTMLInputElement;
    searchInput?.addEventListener('input', () => filterProducts());

    const statusFilter = document.getElementById('status-filter') as HTMLSelectElement;
    statusFilter?.addEventListener('change', () => filterProducts());

    const categoryFilter = document.getElementById('category-filter') as HTMLSelectElement;
    categoryFilter?.addEventListener('change', () => filterProducts());
  }, 0);

  return container;
}

async function loadProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  try {
    productsData = await api.getProducts();
    renderProductsGrid(grid);
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

async function loadSellers() {
  try {
    const sellers = await api.getSellers();
    sellersData = sellers.map((s: any) => ({ id: s.id, email: s.email }));
  } catch (error) {
    console.error('Failed to load sellers:', error);
  }
}

function renderProductsGrid(grid: HTMLElement) {
  const role = store.getRole();
  const canEdit = role === 'MANAGER';
  const isSeller = role === 'SELLER';

  if (productsData.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
        </svg>
        <h3>Aucun produit</h3>
        <p>${canEdit ? 'Créez votre premier produit pour commencer' : isSeller ? 'Aucun produit ne vous est assigné' : 'Aucun produit disponible'}</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = productsData.map(product => `
    <div class="product-card" data-id="${product.id}" data-status="${product.status}" data-category="${product.category || ''}">
      <div class="product-image">
        <div class="product-placeholder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        </div>
        <div class="product-status ${product.status}">${getStatusLabel(product.status)}</div>
      </div>
      <div class="product-content">
        <span class="product-category">${product.category || 'Non catégorisé'}</span>
        <h3 class="product-title">${product.title}</h3>
        <p class="product-price">${parseFloat(String(product.base_price)).toFixed(2)} €</p>
        <div class="product-stock-info">
          <span class="stock-badge ${product.stock_quantity > 0 ? 'in-stock' : 'out-of-stock'}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
            </svg>
            Stock: ${product.stock_quantity}
          </span>
        </div>
        <div class="product-actions">
          ${canEdit ? `
          <button class="btn btn-ghost btn-sm" onclick="editProduct(${product.id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          ${product.status !== 'vendu' ? `
          <button class="btn btn-primary btn-sm" onclick="assignProduct(${product.id})">Assigner</button>
          ` : ''}
          ${product.status === 'disponible' ? `
          <button class="btn btn-ghost btn-sm btn-danger" onclick="deleteProduct(${product.id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
          ` : ''}
          ` : isSeller && product.assignment_status === 'en_vente' ? `
          <button class="btn btn-success btn-sm" onclick="markAsSold(${product.assignment_id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Marquer vendu
          </button>
          ` : `
          <span class="product-sold-label">
            ${product.assignment_status === 'vendu' ? '✓ Vendu' : 'En attente'}
          </span>
          `}
        </div>
      </div>
    </div>
  `).join('');
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'disponible': 'Disponible',
    'assigne': 'Assigné',
    'vendu': 'Vendu',
  };
  return labels[status] || status;
}

function filterProducts() {
  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  const statusFilter = document.getElementById('status-filter') as HTMLSelectElement;
  const categoryFilter = document.getElementById('category-filter') as HTMLSelectElement;

  const query = searchInput?.value.toLowerCase() || '';
  const status = statusFilter?.value || '';
  const category = categoryFilter?.value || '';

  const cards = document.querySelectorAll('.product-card');
  cards.forEach(card => {
    const title = card.querySelector('.product-title')?.textContent?.toLowerCase() || '';
    const cardStatus = card.getAttribute('data-status') || '';
    const cardCategory = card.getAttribute('data-category') || '';

    const matchesQuery = title.includes(query);
    const matchesStatus = !status || cardStatus === status;
    const matchesCategory = !category || cardCategory === category;

    (card as HTMLElement).style.display = matchesQuery && matchesStatus && matchesCategory ? '' : 'none';
  });
}

function openProductModal(product?: Product) {
  const content = document.createElement('div');
  content.innerHTML = `
    <form id="product-form" class="modal-form">
      <div class="form-group">
        <label for="title">Titre du produit</label>
        <input type="text" id="title" name="title" class="form-input" required value="${product?.title || ''}">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="category">Catégorie</label>
          <select id="category" name="category" class="form-select">
            <option value="">Sélectionner...</option>
            <option value="vetements" ${product?.category === 'vetements' ? 'selected' : ''}>Vêtements</option>
            <option value="chaussures" ${product?.category === 'chaussures' ? 'selected' : ''}>Chaussures</option>
            <option value="accessoires" ${product?.category === 'accessoires' ? 'selected' : ''}>Accessoires</option>
            <option value="electronique" ${product?.category === 'electronique' ? 'selected' : ''}>Électronique</option>
          </select>
        </div>
        <div class="form-group">
          <label for="price">Prix (€)</label>
          <input type="number" id="price" name="price" class="form-input" step="0.01" min="0" required value="${product?.base_price || ''}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="stock">Quantité en stock</label>
          <input type="number" id="stock" name="stock" class="form-input" min="1" required value="${product?.stock_quantity || 1}">
          <small class="form-hint">Nombre d'articles disponibles à la vente</small>
        </div>
      </div>
      <div class="form-group">
        <label for="description">Description</label>
        <textarea id="description" name="description" class="form-textarea" rows="4">${product?.description || ''}</textarea>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">${product ? 'Modifier' : 'Créer'}</button>
      </div>
    </form>
  `;

  const modal = createModal(product ? 'Modifier le produit' : 'Nouveau produit', content);
  document.body.appendChild(modal);

  const form = document.getElementById('product-form') as HTMLFormElement;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string || undefined,
      category: formData.get('category') as string || undefined,
      base_price: parseFloat(formData.get('price') as string),
      stock_quantity: parseInt(formData.get('stock') as string) || 1,
    };

    const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-small"></span> Sauvegarde...';

    try {
      if (product) {
        await api.updateProduct(product.id, data);
        showToast('Produit modifié !', 'success');
      } else {
        await api.createProduct(data);
        showToast('Produit créé !', 'success');
      }
      modal.remove();
      loadProducts();
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de la sauvegarde', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = product ? 'Modifier' : 'Créer';
    }
  });
}

// Global functions for onclick handlers
(window as any).editProduct = (id: number) => {
  const product = productsData.find(p => p.id === id);
  if (product) {
    openProductModal(product);
  }
};

(window as any).deleteProduct = async (id: number) => {
  const product = productsData.find(p => p.id === id);
  if (!product) return;

  if (!confirm(`Êtes-vous sûr de vouloir supprimer "${product.title}" ?`)) return;

  try {
    await api.deleteProduct(id);
    showToast('Produit supprimé !', 'success');
    loadProducts();
  } catch (error: any) {
    showToast(error.message || 'Erreur lors de la suppression', 'error');
  }
};

(window as any).assignProduct = (id: number) => {
  if (sellersData.length === 0) {
    showToast('Aucun vendeur disponible. Créez d\'abord un vendeur.', 'error');
    return;
  }

  const content = document.createElement('div');
  content.innerHTML = `
    <form id="assign-form" class="modal-form">
      <div class="form-group">
        <label for="seller">Sélectionner un vendeur</label>
        <select id="seller" name="seller" class="form-select" required>
          <option value="">Choisir un vendeur...</option>
          ${sellersData.map(s => `<option value="${s.id}">${s.email}</option>`).join('')}
        </select>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Assigner</button>
      </div>
    </form>
  `;

  const modal = createModal('Assigner le produit', content);
  document.body.appendChild(modal);

  const form = document.getElementById('assign-form') as HTMLFormElement;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const sellerId = parseInt((document.getElementById('seller') as HTMLSelectElement).value);

    const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-small"></span> Assignation...';

    try {
      await api.assignProduct(id, sellerId);
      showToast('Produit assigné avec succès !', 'success');
      modal.remove();
      loadProducts();
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de l\'assignation', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Assigner';
    }
  });
};

(window as any).markAsSold = async (assignmentId: number) => {
  if (!confirm('Confirmez-vous avoir vendu ce produit ?')) return;

  try {
    const result = await api.markAsSold(assignmentId);
    showToast(result.message || 'Vente enregistrée !', 'success');
    // Rediriger vers la page des ventes
    window.location.hash = '/sales';
  } catch (error: any) {
    showToast(error.message || 'Erreur lors de l\'enregistrement de la vente', 'error');
  }
};
