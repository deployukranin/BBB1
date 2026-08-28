export type PaymentMethod = 'PIX' | 'DINHEIRO' | 'DEBITO' | 'CREDITO' | 'OUTRO';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'operador';
  avatar?: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  categoryId: string;
  price: number;
  promoPrice?: number;
  stock: number;
  image: string;
  active: boolean;
  showInCatalog: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  saleNumber: number;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountReceived?: number;
  change?: number;
  userId: string;
  userName: string;
  cashSessionId?: string;
  notes?: string;
  createdAt: string;
}

export type StockMovementType = 'ENTRADA' | 'SAIDA' | 'VENDA' | 'AJUSTE';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: StockMovementType;
  quantity: number; // positive or negative
  previousStock: number;
  newStock: number;
  reason: string;
  saleId?: string;
  userId?: string;
  userName?: string;
  createdAt: string;
}

export interface CashTransaction {
  id: string;
  sessionId: string;
  type: 'ENTRADA' | 'SAIDA' | 'VENDA';
  amount: number;
  reason: string;
  saleId?: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface CashSession {
  id: string;
  openedAt: string;
  closedAt?: string;
  status: 'ABERTO' | 'FECHADO';
  initialBalance: number;
  totalSales: number;
  totalIn: number;
  totalOut: number;
  expectedBalance: number;
  countedBalance?: number;
  difference?: number;
  openedByUserId: string;
  openedByUserName: string;
  closedByUserId?: string;
  closedByUserName?: string;
  notes?: string;
}

export interface Settings {
  companyName: string;
  logoUrl?: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  address: string;
  receiptHeader: string;
  receiptFooter: string;
  printerWidth: '58mm' | '80mm';
  customWidthMm?: number; // Largura customizada em mm (ex: 48, 58, 72, 80)
  fontSizePx?: number; // Tamanho da fonte em pixels (ex: 10, 11, 12, 14)
  printerDensity?: number; // DPI da impressora (ex: 203 DPI para 58mm/80mm)
  printEngine?: 'html' | 'raw'; // Renderização HTML ou Comandos Diretos RAW ESC/POS
  cutPaper?: boolean; // Acionar corte automático do papel
  printerName?: string;
  printMode?: 'qz' | 'browser';
  lowStockThreshold: number;
  theme: 'light' | 'dark' | 'system';
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}
