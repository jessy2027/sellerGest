// Gestion de l'état de l'application

import type { User, AppState } from './types';

class Store {
  private state: AppState;
  private listeners: (() => void)[] = [];

  constructor() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    this.state = {
      token,
      user: userStr ? JSON.parse(userStr) : null,
      isAuthenticated: !!token,
    };
  }

  getState(): AppState {
    return this.state;
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  login(token: string, user: User) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    this.state = {
      token,
      user,
      isAuthenticated: true,
    };
    
    this.notify();
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    this.state = {
      token: null,
      user: null,
      isAuthenticated: false,
    };
    
    this.notify();
  }

  isAuthenticated(): boolean {
    return this.state.isAuthenticated;
  }

  getUser(): User | null {
    return this.state.user;
  }

  getRole(): string | null {
    return this.state.user?.role || null;
  }

  hasRole(...roles: string[]): boolean {
    const userRole = this.getRole();
    return userRole ? roles.includes(userRole) : false;
  }
}

export const store = new Store();

