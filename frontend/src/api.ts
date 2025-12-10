// Client API pour communiquer avec le backend

const API_URL = 'http://localhost:4000/api';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Une erreur est survenue');
    }

    return data;
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<{ token: string; user: { id: number; email: string; role: string } }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
  }

  // Products
  async getProducts() {
    return this.request<any[]>('/products');
  }

  async getProduct(id: number) {
    return this.request<any>(`/products/${id}`);
  }

  async createProduct(data: {
    title: string;
    description?: string;
    category?: string;
    base_price: number;
    stock_quantity?: number;
  }) {
    return this.request<any>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProduct(id: number, data: Partial<{
    title: string;
    description: string;
    category: string;
    base_price: number;
    stock_quantity: number;
    status: string;
  }>) {
    return this.request<any>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id: number) {
    return this.request<void>(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  async assignProduct(productId: number, sellerId: number) {
    return this.request<any>(`/products/${productId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ seller_id: sellerId }),
    });
  }

  async getAssignments() {
    return this.request<any[]>('/products/assignments/list');
  }

  async getProductStock(productId: number) {
    return this.request<{
      total_stock: number;
      sold: number;
      in_sale: number;
      available: number;
    }>(`/products/${productId}/stock`);
  }

  // Sellers - MANAGER crée ses vendeurs
  async getSellers() {
    return this.request<any[]>('/sellers');
  }

  async getSeller(id: number) {
    return this.request<any>(`/sellers/${id}`);
  }

  async createSeller(data: {
    email: string;
    password: string;
    vinted_profile?: string;
    commission_rate?: number;
  }) {
    return this.request<any>('/sellers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSeller(id: number, data: Partial<{
    vinted_profile: string;
    commission_rate: number;
  }>) {
    return this.request<any>(`/sellers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSeller(id: number) {
    return this.request<{ message: string }>(`/sellers/${id}`, {
      method: 'DELETE',
    });
  }

  // Managers - SUPER_ADMIN crée les managers
  async getManagers() {
    return this.request<any[]>('/managers');
  }

  async getManager(id: number) {
    return this.request<any>(`/managers/${id}`);
  }

  async createManager(data: {
    email: string;
    password: string;
    commission_rate?: number;
  }) {
    return this.request<any>('/managers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateManager(id: number, data: Partial<{
    commission_rate: number;
    active: boolean;
  }>) {
    return this.request<any>(`/managers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteManager(id: number) {
    return this.request<{ message: string }>(`/managers/${id}`, {
      method: 'DELETE',
    });
  }

  // Sales - Ventes et transactions
  async getSales() {
    return this.request<any[]>('/sales');
  }

  async markAsSold(assignmentId: number) {
    return this.request<any>('/sales', {
      method: 'POST',
      body: JSON.stringify({ assignment_id: assignmentId }),
    });
  }

  async payTransaction(saleId: number) {
    return this.request<any>(`/sales/${saleId}/pay`, {
      method: 'POST',
    });
  }

  // Stats
  async getStats() {
    return this.request<any>('/sales/stats/summary');
  }
}

export const api = new ApiClient();
