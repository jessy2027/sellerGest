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
  photos_original: string[] | null;
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

    // Écouter les mises à jour de stock en temps réel
    window.addEventListener('stock-updated', (() => {
      console.log('📦 Reloading products due to stock update');
      loadProducts();
    }) as EventListener);
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

  grid.innerHTML = productsData.map(product => {
    const hasPhotos = product.photos_original && product.photos_original.length > 0;
    const firstPhoto = hasPhotos ? `http://localhost:4000${product.photos_original![0]}` : null;

    return `
    <div class="product-card" data-id="${product.id}" data-status="${product.status}" data-category="${product.category || ''}">
      <div class="product-image">
        ${firstPhoto ? `
          <img src="${firstPhoto}" alt="${product.title}" class="product-photo" />
        ` : `
          <div class="product-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </div>
        `}
        ${hasPhotos && product.photos_original!.length > 1 ? `
          <span class="photo-count">+${product.photos_original!.length - 1}</span>
        ` : ''}
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
          ${canEdit ? `
          <button class="btn btn-ghost btn-xs" onclick="restockProduct(${product.id})" title="Restock">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
              <path d="M23 4v6h-6"/>
              <path d="M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
          ` : ''}
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
          ` : isSeller && product.assignment_status === 'actif' ? `
          <button class="btn btn-success btn-sm" onclick="markAsSold(${product.assignment_id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Vendre
          </button>
          ` : `
          <span class="product-sold-label">
            ${product.assignment_status === 'retiré' ? 'Retiré' : 'Actif'}
          </span>
          `}
        </div>
      </div>
    </div>
  `}).join('');
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
  const existingPhotos = product?.photos_original || [];
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
        <textarea id="description" name="description" class="form-textarea" rows="3">${product?.description || ''}</textarea>
      </div>
      
      <!-- Section Photos -->
      <div class="form-group">
        <label>Photos du produit</label>
        ${existingPhotos.length > 0 ? `
          <div class="existing-photos" id="existing-photos">
            ${existingPhotos.map(photo => `
              <div class="photo-item" data-photo="${photo}">
                <img src="http://localhost:4000${photo}" alt="Photo produit">
                <button type="button" class="photo-delete-btn" data-filename="${photo.split('/').pop()}">&times;</button>
              </div>
            `).join('')}
          </div>
        ` : ''}
        <div class="upload-zone" id="upload-zone">
          <input type="file" id="photo-input" accept="image/jpeg,image/png,image/webp" multiple hidden>
          <div class="upload-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <p>Glissez des images ici ou <span class="upload-link">cliquez pour sélectionner</span></p>
            <small>JPEG, PNG, WebP - Max 5MB par image</small>
          </div>
        </div>
        <div class="upload-preview" id="upload-preview"></div>
      </div>
      
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">${product ? 'Modifier' : 'Créer'}</button>
      </div>
    </form>
  `;

  const modal = createModal(product ? 'Modifier le produit' : 'Nouveau produit', content);
  document.body.appendChild(modal);

  // Gérer la zone d'upload
  const uploadZone = document.getElementById('upload-zone')!;
  const photoInput = document.getElementById('photo-input') as HTMLInputElement;
  const uploadPreview = document.getElementById('upload-preview')!;
  let filesToUpload: File[] = [];

  uploadZone.addEventListener('click', () => photoInput.click());

  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
  });

  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    if (e.dataTransfer?.files) {
      handleFiles(e.dataTransfer.files);
    }
  });

  photoInput.addEventListener('change', () => {
    if (photoInput.files) {
      handleFiles(photoInput.files);
    }
  });

  function handleFiles(files: FileList) {
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        filesToUpload.push(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          const preview = document.createElement('div');
          preview.className = 'preview-item';
          preview.innerHTML = `
            <img src="${e.target?.result}" alt="Preview">
            <button type="button" class="preview-remove">&times;</button>
          `;
          preview.querySelector('.preview-remove')?.addEventListener('click', () => {
            const index = filesToUpload.indexOf(file);
            if (index > -1) filesToUpload.splice(index, 1);
            preview.remove();
          });
          uploadPreview.appendChild(preview);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Gérer la suppression des photos existantes
  if (product) {
    document.querySelectorAll('.photo-delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const filename = (btn as HTMLElement).dataset.filename!;
        if (confirm('Supprimer cette photo ?')) {
          try {
            await api.deleteProductPhoto(product.id, filename);
            (btn as HTMLElement).closest('.photo-item')?.remove();
            showToast('Photo supprimée', 'success');
          } catch (error: any) {
            showToast(error.message || 'Erreur', 'error');
          }
        }
      });
    });
  }

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
      let productId: number;
      if (product) {
        await api.updateProduct(product.id, data);
        productId = product.id;
        showToast('Produit modifié !', 'success');
      } else {
        const newProduct = await api.createProduct(data);
        productId = newProduct.id;
        showToast('Produit créé !', 'success');
      }

      // Upload des nouvelles photos
      if (filesToUpload.length > 0) {
        try {
          await api.uploadProductPhotos(productId, filesToUpload);
          showToast(`${filesToUpload.length} photo(s) uploadée(s) !`, 'success');
        } catch (uploadError: any) {
          showToast(uploadError.message || 'Erreur upload photos', 'error');
        }
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

(window as any).assignProduct = async (id: number) => {
  if (sellersData.length === 0) {
    showToast('Aucun vendeur disponible. Créez d\'abord un vendeur.', 'error');
    return;
  }

  try {
    // Récupérer les détails du produit pour connaître les assignations actuelles
    const fullProduct = await api.getProduct(id);
    const assignedSellerIds = (fullProduct.ProductAssignments || [])
      .filter((a: any) => a.status === 'actif')
      .map((a: any) => a.seller_id);

    const availableSellers = sellersData.filter(s => !assignedSellerIds.includes(s.id));

    if (availableSellers.length === 0) {
      showToast('Ce produit est déjà assigné à tous vos vendeurs actifs.', 'info');
      return;
    }

    const content = document.createElement('div');
    content.innerHTML = `
      <form id="assign-form" class="modal-form">
        <div class="form-group">
          <label for="seller">Sélectionner un vendeur</label>
          <select id="seller" name="seller" class="form-select" required>
            <option value="">Choisir un vendeur...</option>
            ${availableSellers.map(s => `<option value="${s.id}">${s.email}</option>`).join('')}
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
  } catch (error) {
    console.error('Failed to load product details:', error);
    showToast('Erreur lors du chargement des disponibilités.', 'error');
  }
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

(window as any).restockProduct = async (productId: number) => {
  const product = productsData.find(p => p.id === productId);
  if (!product) return;

  const content = document.createElement('div');
  content.innerHTML = `
    <form id="restock-form" class="modal-form">
      <div class="restock-info">
        <p>Stock actuel: <strong>${product.stock_quantity}</strong></p>
      </div>
      <div class="form-group">
        <label for="restock-qty">Quantité à ajouter</label>
        <input type="number" id="restock-qty" name="quantity" class="form-input" min="1" value="1" required>
      </div>
      <div class="form-group">
        <label>
          <input type="checkbox" id="restock-replace"> Remplacer le stock (au lieu d'ajouter)
        </label>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M23 4v6h-6"/>
            <path d="M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Mettre à jour le stock
        </button>
      </div>
    </form>
  `;

  const modal = createModal(`Restock: ${product.title}`, content);
  document.body.appendChild(modal);

  const form = document.getElementById('restock-form') as HTMLFormElement;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const quantity = parseInt((document.getElementById('restock-qty') as HTMLInputElement).value);
    const replace = (document.getElementById('restock-replace') as HTMLInputElement).checked;
    const mode = replace ? 'set' : 'add';

    const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-small"></span> Mise à jour...';

    try {
      const result = await api.restockProduct(productId, quantity, mode);
      showToast(`Stock mis à jour ! Nouveau stock: ${result.new_stock}`, 'success');
      modal.remove();
      loadProducts();
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de la mise à jour du stock', 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Mettre à jour le stock';
    }
  });
};
