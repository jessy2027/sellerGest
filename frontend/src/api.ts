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

  async unassignProduct(assignmentId: number) {
    return this.request<void>(`/products/assignments/${assignmentId}`, {
      method: 'DELETE',
    });
  }

  async getProductStock(productId: number) {
    return this.request<{
      total_stock: number;
      sold: number;
      in_sale: number;
      available: number;
    }>(`/products/${productId}/stock`);
  }

  async restockProduct(productId: number, quantity: number, mode: 'add' | 'set' = 'add') {
    return this.request<{ message: string; new_stock: number }>(`/products/${productId}/restock`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity, mode }),
    });
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

  // Photos - Upload (multipart/form-data, pas de JSON)
  async uploadProductPhotos(productId: number, files: FileList | File[]) {
    const token = this.getToken();
    const formData = new FormData();

    Array.from(files).forEach(file => {
      formData.append('photos', file);
    });

    const response = await fetch(`${API_URL}/products/${productId}/photos`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de l\'upload');
    }
    return data;
  }

  async deleteProductPhoto(productId: number, filename: string) {
    return this.request<{ message: string; photos: string[] }>(`/products/${productId}/photos/${filename}`, {
      method: 'DELETE',
    });
  }

  // Chat API
  async getConversations() {
    return this.request<any[]>('/chat/conversations');
  }

  async createConversation(sellerId?: number) {
    return this.request<any>('/chat/conversations', {
      method: 'POST',
      body: JSON.stringify({ seller_id: sellerId }),
    });
  }

  async getMessages(conversationId: number, limit = 50) {
    return this.request<any[]>(`/chat/conversations/${conversationId}/messages?limit=${limit}`);
  }

  async sendMessage(conversationId: number, content: string) {
    return this.request<any>(`/chat/messages/${conversationId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async getUnreadCount() {
    return this.request<{ unread: number }>('/chat/unread');
  }
}

export const api = new ApiClient();

