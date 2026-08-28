import {
  CashSession,
  CashTransaction,
  Category,
  PaymentMethod,
  Product,
  Sale,
  SaleItem,
  Settings,
  StockMovement,
  User
} from '../types';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS, INITIAL_SETTINGS, INITIAL_USER } from './seedData';
import { storage } from './storage';
import { supabaseService } from './supabaseService';

export const db = {
  // --- USERS / AUTH ---
  getUser(): User | null {
    return storage.get<User | null>('currentUser', INITIAL_USER);
  },

  setUser(user: User | null): void {
    storage.set('currentUser', user);
  },

  // --- SETTINGS ---
  getSettings(): Settings {
    return storage.get<Settings>('settings', INITIAL_SETTINGS);
  },

  saveSettings(settings: Settings): Settings {
    storage.set('settings', settings);
    supabaseService.saveSettings(settings);
    return settings;
  },

  // --- CATEGORIES ---
  getCategories(): Category[] {
    return storage.get<Category[]>('categories', INITIAL_CATEGORIES);
  },

  saveCategories(categories: Category[]): void {
    storage.set('categories', categories);
  },

  addCategory(category: Category): Category {
    const categories = this.getCategories();
    categories.push(category);
    this.saveCategories(categories);
    supabaseService.saveCategory(category);
    return category;
  },

  deleteCategory(id: string): boolean {
    const categories = this.getCategories().filter(c => c.id !== id);
    this.saveCategories(categories);
    supabaseService.deleteCategory(id);
    return true;
  },

  // --- PRODUCTS ---
  getProducts(): Product[] {
    return storage.get<Product[]>('products', INITIAL_PRODUCTS);
  },

  saveProducts(products: Product[]): void {
    storage.set('products', products);
  },

  getProductById(id: string): Product | undefined {
    return this.getProducts().find(p => p.id === id);
  },

  addProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    const products = this.getProducts();
    const newProduct: Product = {
      ...productData,
      id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    products.unshift(newProduct);
    this.saveProducts(products);
    supabaseService.saveProduct(newProduct);

    // Registra entrada inicial de estoque se > 0
    if (newProduct.stock > 0) {
      this.recordStockMovement({
        productId: newProduct.id,
        productName: newProduct.name,
        type: 'ENTRADA',
        quantity: newProduct.stock,
        previousStock: 0,
        newStock: newProduct.stock,
        reason: 'Cadastro inicial de produto'
      });
    }

    return newProduct;
  },

  updateProduct(id: string, productData: Partial<Product>): Product | null {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;

    const oldProduct = products[index];
    const updatedProduct: Product = {
      ...oldProduct,
      ...productData,
      id,
      updatedAt: new Date().toISOString()
    };

    products[index] = updatedProduct;
    this.saveProducts(products);
    supabaseService.saveProduct(updatedProduct);
    return updatedProduct;
  },

  deleteProduct(id: string): boolean {
    const products = this.getProducts().filter(p => p.id !== id);
    this.saveProducts(products);
    supabaseService.deleteProduct(id);
    return true;
  },

  // --- STOCK MOVEMENTS ---
  getStockMovements(): StockMovement[] {
    return storage.get<StockMovement[]>('stock_movements', []);
  },

  recordStockMovement(data: Omit<StockMovement, 'id' | 'createdAt'>): StockMovement {
    const movements = this.getStockMovements();
    const newMovement: StockMovement = {
      ...data,
      id: 'mov_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString()
    };
    movements.unshift(newMovement);
    storage.set('stock_movements', movements);
    supabaseService.saveStockMovement(newMovement);
    return newMovement;
  },

  adjustStock(productId: string, quantityChange: number, reason: string, user?: User): { product: Product; movement: StockMovement } | null {
    const products = this.getProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return null;

    const previousStock = product.stock;
    const newStock = Math.max(0, previousStock + quantityChange);
    product.stock = newStock;
    product.updatedAt = new Date().toISOString();
    this.saveProducts(products);
    supabaseService.saveProduct(product);

    const movement = this.recordStockMovement({
      productId: product.id,
      productName: product.name,
      type: quantityChange > 0 ? 'ENTRADA' : 'SAIDA',
      quantity: quantityChange,
      previousStock,
      newStock,
      reason,
      userId: user?.id,
      userName: user?.name
    });

    return { product, movement };
  },

  // --- CASH SESSIONS & TRANSACTIONS ---
  getCashSessions(): CashSession[] {
    return storage.get<CashSession[]>('cash_sessions', []);
  },

  getActiveCashSession(): CashSession | null {
    const sessions = this.getCashSessions();
    return sessions.find(s => s.status === 'ABERTO') || null;
  },

  openCashSession(initialBalance: number, user: User, notes?: string): CashSession {
    const sessions = this.getCashSessions();
    sessions.forEach(s => {
      if (s.status === 'ABERTO') {
        s.status = 'FECHADO';
        s.closedAt = new Date().toISOString();
        supabaseService.saveCashSession(s);
      }
    });

    const newSession: CashSession = {
      id: 'cash_' + Date.now(),
      openedAt: new Date().toISOString(),
      status: 'ABERTO',
      initialBalance: Number(initialBalance) || 0,
      totalSales: 0,
      totalIn: 0,
      totalOut: 0,
      expectedBalance: Number(initialBalance) || 0,
      openedByUserId: user.id,
      openedByUserName: user.name,
      notes
    };

    sessions.unshift(newSession);
    storage.set('cash_sessions', sessions);
    supabaseService.saveCashSession(newSession);
    return newSession;
  },

  closeCashSession(sessionId: string, countedBalance: number, user: User, notes?: string): CashSession | null {
    const sessions = this.getCashSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return null;

    const expected = session.initialBalance + session.totalSales + session.totalIn - session.totalOut;
    const diff = Number(countedBalance) - expected;

    session.status = 'FECHADO';
    session.closedAt = new Date().toISOString();
    session.expectedBalance = expected;
    session.countedBalance = Number(countedBalance);
    session.difference = diff;
    session.closedByUserId = user.id;
    session.closedByUserName = user.name;
    if (notes) session.notes = notes;

    storage.set('cash_sessions', sessions);
    supabaseService.saveCashSession(session);
    return session;
  },

  getCashTransactions(sessionId?: string): CashTransaction[] {
    const list = storage.get<CashTransaction[]>('cash_transactions', []);
    if (sessionId) {
      return list.filter(t => t.sessionId === sessionId);
    }
    return list;
  },

  addCashTransaction(
    type: 'ENTRADA' | 'SAIDA' | 'VENDA',
    amount: number,
    reason: string,
    user: User,
    saleId?: string
  ): CashTransaction | null {
    const activeSession = this.getActiveCashSession();
    if (!activeSession) return null;

    const transactions = this.getCashTransactions();
    const newTx: CashTransaction = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      sessionId: activeSession.id,
      type,
      amount: Number(amount),
      reason,
      saleId,
      userId: user.id,
      userName: user.name,
      createdAt: new Date().toISOString()
    };
    transactions.unshift(newTx);
    storage.set('cash_transactions', transactions);
    supabaseService.saveCashTransaction(newTx);

    // Atualiza totais da sessão de caixa
    const sessions = this.getCashSessions();
    const currentSession = sessions.find(s => s.id === activeSession.id);
    if (currentSession) {
      if (type === 'VENDA') {
        currentSession.totalSales += Number(amount);
      } else if (type === 'ENTRADA') {
        currentSession.totalIn += Number(amount);
      } else if (type === 'SAIDA') {
        currentSession.totalOut += Number(amount);
      }
      currentSession.expectedBalance =
        currentSession.initialBalance +
        currentSession.totalSales +
        currentSession.totalIn -
        currentSession.totalOut;
      storage.set('cash_sessions', sessions);
      supabaseService.saveCashSession(currentSession);
    }

    return newTx;
  },

  // --- SALES ---
  getSales(): Sale[] {
    return storage.get<Sale[]>('sales', []);
  },

  getNextSaleNumber(): number {
    const sales = this.getSales();
    if (sales.length === 0) return 1001;
    const maxNum = Math.max(...sales.map(s => s.saleNumber || 0));
    return maxNum + 1;
  },

  finalizeSale(data: {
    items: { product: Product; quantity: number; unitPrice: number; subtotal: number }[];
    total: number;
    subtotal: number;
    discount?: number;
    paymentMethod: PaymentMethod;
    amountReceived?: number;
    change?: number;
    user: User;
    notes?: string;
  }): { success: boolean; sale?: Sale; error?: string } {
    const products = this.getProducts();

    // 1. Validação estrita de estoque antes de qualquer alteração
    for (const item of data.items) {
      const p = products.find(prod => prod.id === item.product.id);
      if (!p) {
        return { success: false, error: `Produto "${item.product.name}" não encontrado.` };
      }
      if (p.stock < item.quantity) {
        return {
          success: false,
          error: `Estoque insuficiente para "${p.name}". Existem apenas ${p.stock} unidades disponíveis.`
        };
      }
    }

    const saleNumber = this.getNextSaleNumber();
    const activeSession = this.getActiveCashSession();

    // 2. Abate do estoque e gera histórico de movimentação
    const saleItems: SaleItem[] = data.items.map(item => ({
      id: 'sitem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      productId: item.product.id,
      productName: item.product.name,
      productImage: item.product.image,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal
    }));

    const saleId = 'sale_' + Date.now();

    for (const item of data.items) {
      const p = products.find(prod => prod.id === item.product.id)!;
      const prev = p.stock;
      p.stock -= item.quantity;
      p.updatedAt = new Date().toISOString();
      supabaseService.saveProduct(p);

      this.recordStockMovement({
        productId: p.id,
        productName: p.name,
        type: 'VENDA',
        quantity: -item.quantity,
        previousStock: prev,
        newStock: p.stock,
        reason: `Venda #${saleNumber}`,
        saleId,
        userId: data.user.id,
        userName: data.user.name
      });
    }
    this.saveProducts(products);

    // 3. Registra a Venda
    const newSale: Sale = {
      id: saleId,
      saleNumber,
      items: saleItems,
      subtotal: data.subtotal,
      discount: data.discount || 0,
      total: data.total,
      paymentMethod: data.paymentMethod,
      amountReceived: data.amountReceived,
      change: data.change,
      userId: data.user.id,
      userName: data.user.name,
      cashSessionId: activeSession?.id,
      notes: data.notes,
      createdAt: new Date().toISOString()
    };

    const sales = this.getSales();
    sales.unshift(newSale);
    storage.set('sales', sales);
    supabaseService.saveSale(newSale);

    // 4. Se houver caixa aberto, registra a entrada no caixa
    if (activeSession) {
      this.addCashTransaction(
        'VENDA',
        data.total,
        `Venda PDV #${saleNumber} (${data.paymentMethod})`,
        data.user,
        saleId
      );
    }

    return { success: true, sale: newSale };
  },

  // --- RESET & SEED DATA ---
  resetToDefaults(): void {
    storage.clearAll();
    storage.set('currentUser', INITIAL_USER);
    storage.set('settings', INITIAL_SETTINGS);
    storage.set('categories', INITIAL_CATEGORIES);
    storage.set('products', INITIAL_PRODUCTS);
    storage.set('sales', []);
    storage.set('stock_movements', []);
    storage.set('cash_sessions', []);
    storage.set('cash_transactions', []);
  }
};
