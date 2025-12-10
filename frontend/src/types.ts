// Types pour l'application Seller-Gest

export type UserRole = 'SUPER_ADMIN' | 'MANAGER' | 'SELLER';

export interface User {
  id: number;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Manager {
  id: number;
  user_id: number;
  commission_rate: number;
  active: boolean;
  User?: User;
  createdAt?: string;
}

export interface Seller {
  id: number;
  user_id: number;
  manager_id: number | null;
  vinted_profile: string | null;
  commission_rate: number;
  balance: number;
  active: boolean;
  User?: User;
  Manager?: Manager;
  createdAt?: string;
}

export type ProductStatus = 'disponible' | 'assigne' | 'vendu';

export interface Product {
  id: number;
  manager_id: number;
  title: string;
  description: string | null;
  category: string | null;
  base_price: number;
  photos_original: string[] | null;
  status: ProductStatus;
  Manager?: Manager;
  createdAt?: string;
  // Pour les vendeurs - infos d'assignation
  assignment_id?: number;
  assignment_status?: AssignmentStatus;
}

export type AssignmentStatus = 'en_vente' | 'vendu' | 'probleme';

export interface ProductAssignment {
  id: number;
  product_id: number;
  seller_id: number;
  status: AssignmentStatus;
  assigned_at: string | null;
  sold_at: string | null;
  Product?: Product;
  Seller?: Seller;
}

export type SaleStatus = 'pending' | 'paid' | 'cancelled';

export interface Sale {
  id: number;
  assignment_id: number;
  seller_id: number;
  manager_id: number;
  product_price: number;
  seller_commission: number;
  amount_to_manager: number;
  status: SaleStatus;
  sold_at: string | null;
  paid_at: string | null;
  ProductAssignment?: ProductAssignment;
  Seller?: Seller;
  Manager?: Manager;
}

export interface SellerStats {
  products_assigned: number;
  products_sold: number;
  total_earnings: number;
  pending_payments: number;
  balance: number;
}

export interface ManagerStats {
  total_products: number;
  total_sellers: number;
  total_sales: number;
  total_revenue: number;
  pending_revenue: number;
}

export interface AdminStats {
  total_managers: number;
  total_sellers: number;
  total_products: number;
  total_sales: number;
  total_volume: number;
}

export interface AppState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
