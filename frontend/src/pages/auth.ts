// Page d'authentification (Login uniquement)

import { api } from '../api';
import { store } from '../state';
import { router } from '../router';
import { showToast } from '../components/ui';

export function renderLogin(container: HTMLElement) {
  container.innerHTML = '';
  
  const wrapper = document.createElement('div');
  wrapper.className = 'auth-wrapper';
  
  wrapper.innerHTML = `
    <div class="auth-background">
      <div class="auth-shape auth-shape-1"></div>
      <div class="auth-shape auth-shape-2"></div>
      <div class="auth-shape auth-shape-3"></div>
    </div>
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 7h-9m9 10h-9m4-5h-4m-6 5V7l-4 3 4 3v4"/>
            </svg>
          </div>
          <h1>Seller<span>Gest</span></h1>
          <p>Connectez-vous à votre espace</p>
        </div>
        <form id="login-form" class="auth-form">
          <div class="form-group">
            <label for="email">Email</label>
            <div class="input-wrapper">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <input type="email" id="email" name="email" placeholder="votre@email.com" required>
            </div>
          </div>
          <div class="form-group">
            <label for="password">Mot de passe</label>
            <div class="input-wrapper">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input type="password" id="password" name="password" placeholder="••••••••" required>
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-lg btn-full">
            <span>Se connecter</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
        </form>
        <div class="auth-footer">
          <p>Contactez votre administrateur pour obtenir un compte</p>
        </div>
      </div>
    </div>
  `;
  
  container.appendChild(wrapper);
  
  const form = document.getElementById('login-form') as HTMLFormElement;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(form);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-small"></span> Connexion...';
    
    try {
      const response = await api.login(email, password);
      store.login(response.token, response.user as any);
      showToast('Connexion réussie !', 'success');
      router.navigate('/dashboard');
    } catch (error: any) {
      showToast(error.message || 'Erreur de connexion', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <span>Se connecter</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="5" y1="12" x2="19" y2="12"/>
          <polyline points="12 5 19 12 12 19"/>
        </svg>
      `;
    }
  });
}
