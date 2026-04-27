export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string;
  active: boolean;
  createdAt?: string;
}

export type Role = 'ADMIN' | 'MANAGER' | 'WAITER' | 'KITCHEN' | 'CASHIER' | 'DELIVERY';

export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  section?: string;
  mergedWith?: string;
  orders?: Order[];
}

export type TableStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED';

export interface Category {
  id: string;
  name: string;
  menuItems?: MenuItem[];
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  category?: Category;
  available: boolean;
  imageUrl?: string;
}

export interface Order {
  id: string;
  tableId: string;
  waiterId: string;
  status: OrderStatus;
  type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  notes?: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  table?: Table;
  waiter?: { id: string; name: string };
  items?: OrderItem[];
  billing?: Billing;
  delivery?: Delivery;
}

export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'SERVED' | 'BILLED' | 'COMPLETED';

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  price: number;
  notes?: string;
  status: 'PENDING' | 'PREPARING' | 'READY' | 'SERVED';
  menuItem?: MenuItem;
}

export interface Billing {
  id: string;
  orderId: string;
  cashierId: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod?: string;
  paymentStatus: 'PENDING' | 'PAID';
  paidAt?: string;
  order?: Order;
  cashier?: { id: string; name: string };
}

export interface InventoryItem {
  id: string;
  menuItemId?: string;
  name: string;
  quantity: number;
  unit: string;
  minStock: number;
  costPerUnit: number;
  supplier?: string;
  menuItem?: MenuItem;
}

export interface Reservation {
  id: string;
  tableId: string;
  customerName: string;
  customerPhone?: string;
  partySize: number;
  date: string;
  time: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  notes?: string;
  table?: Table;
}

export interface Delivery {
  id: string;
  orderId: string;
  driverId?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  status: 'PENDING' | 'ASSIGNED' | 'PICKED_UP' | 'DELIVERED';
  estimatedTime?: string;
  deliveredAt?: string;
  order?: Order;
  driver?: { id: string; name: string; phone?: string };
}

export interface DashboardData {
  tables: { total: number; occupied: number; reserved: number; available: number };
  orders: { active: number; pendingKitchen: number; readyToServe: number };
  revenue: { today: number };
  menu: { totalItems: number };
  inventory: { lowStock: number };
  deliveries: { pending: number };
  reservations: { today: number };
  recentOrders: Order[];
}

export interface ReportSummary {
  totalOrders: number;
  completedOrders: number;
  totalRevenue: number;
  ordersByStatus: { status: string; count: number }[];
}
