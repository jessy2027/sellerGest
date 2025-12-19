// Main entry point - Seller Gest Application (Production)

import './style.css';
import { router } from './router';
import { store } from './state';
import { renderLogin } from './pages/auth';
import { renderDashboard } from './pages/dashboard';
import { renderProducts } from './pages/products';
import { renderSellers } from './pages/sellers';
import { renderManagers } from './pages/managers';
import { renderAssignments } from './pages/assignments';
import { renderSales } from './pages/sales';
import { renderLayout } from './components/layout';
import { initChatWidget, destroyChatWidget } from './components/ChatWidget';

const app = document.querySelector<HTMLDivElement>('#app')!;

// Protected route wrapper
function protectedRoute(handler: () => HTMLElement) {
  return () => {
    if (!store.isAuthenticated()) {
      router.navigate('/login');
      return;
    }
    const content = handler();
    renderLayout(app, content);
    // Initialize chat widget for authenticated users (except SUPER_ADMIN)
    setTimeout(() => initChatWidget(), 100);
  };
}

// Role-based route wrapper
function roleRoute(roles: string[], handler: () => HTMLElement) {
  return () => {
    if (!store.isAuthenticated()) {
      router.navigate('/login');
      return;
    }
    if (!store.hasRole(...roles)) {
      router.navigate('/dashboard');
      return;
    }
    const content = handler();
    renderLayout(app, content);
    // Initialize chat widget for authenticated users (except SUPER_ADMIN)
    setTimeout(() => initChatWidget(), 100);
  };
}

// Setup routes - Pas d'inscription publique
router
  .addRoute('/', () => {
    if (store.isAuthenticated()) {
      router.navigate('/dashboard');
    } else {
      router.navigate('/login');
    }
  })
  .addRoute('/login', () => {
    if (store.isAuthenticated()) {
      router.navigate('/dashboard');
      return;
    }
    renderLogin(app);
  })
  .addRoute('/dashboard', protectedRoute(renderDashboard))
  .addRoute('/products', protectedRoute(renderProducts))
  .addRoute('/sellers', roleRoute(['SUPER_ADMIN', 'MANAGER'], renderSellers))
  .addRoute('/managers', roleRoute(['SUPER_ADMIN'], renderManagers))
  .addRoute('/assignments', protectedRoute(renderAssignments))
  .addRoute('/sales', protectedRoute(renderSales))
  .setNotFound(() => {
    app.innerHTML = `
      <div class="not-found">
        <h1>404</h1>
        <p>Page non trouvée</p>
        <a href="#/dashboard" class="btn btn-primary">Retour au tableau de bord</a>
      </div>
    `;
  })
  .start();

// Listen for auth state changes
store.subscribe(() => {
  // Destroy chat widget on logout
  if (!store.isAuthenticated()) {
    destroyChatWidget();
  }
  router.handleRoute();
});

console.log('🚀 Seller Gest App initialized');
