import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  CartItem,
  CashSession,
  CashTransaction,
  Category,
  PaymentMethod,
  Product,
  Sale,
  Settings,
  StockMovement,
  ToastMessage
} from '../types';
import { db } from '../services/db';
import { supabaseService } from '../services/supabaseService';
import { storage } from '../services/storage';
import { useAuth } from './AuthContext';
import confetti from 'canvas-confetti';

interface AppContextType {
  // Products & Categories
  products: Product[];
  categories: Category[];
  refreshProducts: () => void;
  addProduct: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, productData: Partial<Product>) => Product | null;
  deleteProduct: (id: string) => boolean;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => boolean;
  updateCartQuantity: (productId: string, quantity: number) => boolean;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartItemCount: number;

  // Sales
  sales: Sale[];
  refreshSales: () => void;
  clearSales: () => void;
  finalizeCurrentSale: (options: {
    paymentMethod: PaymentMethod;
    amountReceived?: number;
    change?: number;
    discount?: number;
    notes?: string;
  }) => { success: boolean; sale?: Sale; error?: string };
  receiptToPrint: Sale | null;
  setReceiptToPrint: (sale: Sale | null) => void;

  // Stock
  stockMovements: StockMovement[];
  adjustStock: (productId: string, qty: number, reason: string) => boolean;

  // Cash Register
  activeCashSession: CashSession | null;
  cashTransactions: CashTransaction[];
  openCash: (initialBalance: number, notes?: string) => void;
  closeCash: (countedBalance: number, notes?: string) => void;
  addCashEntry: (amount: number, reason: string) => void;
  addCashExit: (amount: number, reason: string) => void;

  // Settings
  settings: Settings;
  updateSettings: (newSettings: Settings) => void;
  resetAllData: () => void;

  // Toasts
  toasts: ToastMessage[];
  addToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // State
  const [products, setProducts] = useState<Product[]>(() => db.getProducts());
  const [categories, setCategories] = useState<Category[]>(() => db.getCategories());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sales, setSales] = useState<Sale[]>(() => db.getSales());
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => db.getStockMovements());
  const [activeCashSession, setActiveCashSession] = useState<CashSession | null>(() => db.getActiveCashSession());
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>(() => db.getCashTransactions());
  const [settings, setSettingsState] = useState<Settings>(() => db.getSettings());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [receiptToPrint, setReceiptToPrint] = useState<Sale | null>(null);

  // Toast helper
  const addToast = useCallback((type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Supabase Initial Sync
  useEffect(() => {
    let isMounted = true;

    async function loadFromSupabase() {
      try {
        const [
          remoteCats,
          remoteProds,
          remoteSettings,
          remoteSales,
          remoteSessions,
          remoteTxs,
          remoteMovs
        ] = await Promise.all([
          supabaseService.fetchCategories(),
          supabaseService.fetchProducts(),
          supabaseService.fetchSettings(),
          supabaseService.fetchSales(),
          supabaseService.fetchCashSessions(),
          supabaseService.fetchCashTransactions(),
          supabaseService.fetchStockMovements()
        ]);

        if (!isMounted) return;

        if (remoteCats && remoteCats.length > 0) {
          db.saveCategories(remoteCats);
          setCategories(remoteCats);
        }
        if (remoteProds && remoteProds.length > 0) {
          db.saveProducts(remoteProds);
          setProducts(remoteProds);
        }
        if (remoteSettings) {
          storage.set('settings', remoteSettings);
          setSettingsState(remoteSettings);
        }
        if (remoteSales && remoteSales.length > 0) {
          storage.set('sales', remoteSales);
          setSales(remoteSales);
        }
        if (remoteSessions && remoteSessions.length > 0) {
          storage.set('cash_sessions', remoteSessions);
          const active = remoteSessions.find(s => s.status === 'ABERTO') || null;
          setActiveCashSession(active);
        }
        if (remoteTxs && remoteTxs.length > 0) {
          storage.set('cash_transactions', remoteTxs);
          setCashTransactions(remoteTxs);
        }
        if (remoteMovs && remoteMovs.length > 0) {
          storage.set('stock_movements', remoteMovs);
          setStockMovements(remoteMovs);
        }
      } catch (e) {
        console.warn('Initial Supabase sync error:', e);
      }
    }

    loadFromSupabase();

    return () => {
      isMounted = false;
    };
  }, []);

  // Products CRUD
  const refreshProducts = useCallback(() => {
    setProducts(db.getProducts());
    setCategories(db.getCategories());
  }, []);

  const addProduct = (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
    const prod = db.addProduct(data);
    refreshProducts();
    setStockMovements(db.getStockMovements());
    addToast('success', 'Produto adicionado com sucesso!');
    return prod;
  };

  const updateProduct = (id: string, data: Partial<Product>): Product | null => {
    const updated = db.updateProduct(id, data);
    refreshProducts();
    addToast('success', 'Produto atualizado com sucesso!');
    return updated;
  };

  const deleteProduct = (id: string): boolean => {
    const ok = db.deleteProduct(id);
    refreshProducts();
    addToast('info', 'Produto removido.');
    return ok;
  };

  // Cart Management
  const addToCart = (product: Product, quantity = 1): boolean => {
    // Busca o produto fresco no db para garantir estoque atualizado
    const currentProd = db.getProductById(product.id) || product;

    if (currentProd.stock <= 0) {
      addToast('error', 'Produto Esgotado', `Não há unidades de "${currentProd.name}" disponíveis.`);
      return false;
    }

    const existingIndex = cart.findIndex(item => item.product.id === product.id);
    const effectivePrice = currentProd.promoPrice && currentProd.promoPrice > 0 ? currentProd.promoPrice : currentProd.price;

    if (existingIndex > -1) {
      const currentQtyInCart = cart[existingIndex].quantity;
      const newQty = currentQtyInCart + quantity;

      if (newQty > currentProd.stock) {
        addToast(
          'warning',
          'Limite de Estoque',
          `Existem apenas ${currentProd.stock} unidades disponíveis de "${currentProd.name}".`
        );
        return false;
      }

      const updatedCart = [...cart];
      updatedCart[existingIndex] = {
        ...updatedCart[existingIndex],
        quantity: newQty,
        subtotal: newQty * effectivePrice
      };
      setCart(updatedCart);
    } else {
      if (quantity > currentProd.stock) {
        addToast(
          'warning',
          'Limite de Estoque',
          `Existem apenas ${currentProd.stock} unidades disponíveis de "${currentProd.name}".`
        );
        return false;
      }

      setCart(prev => [
        ...prev,
        {
          product: currentProd,
          quantity,
          unitPrice: effectivePrice,
          subtotal: quantity * effectivePrice
        }
      ]);
    }

    addToast('success', 'Item adicionado', `${product.name} no carrinho.`);
    return true;
  };

  const updateCartQuantity = (productId: string, quantity: number): boolean => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return true;
    }

    const prod = db.getProductById(productId);
    if (!prod) return false;

    if (quantity > prod.stock) {
      addToast('warning', 'Limite de Estoque', `Existem apenas ${prod.stock} unidades disponíveis.`);
      return false;
    }

    const effectivePrice = prod.promoPrice && prod.promoPrice > 0 ? prod.promoPrice : prod.price;

    setCart(prev =>
      prev.map(item =>
        item.product.id === productId
          ? {
              ...item,
              quantity,
              unitPrice: effectivePrice,
              subtotal: quantity * effectivePrice
            }
          : item
      )
    );
    return true;
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Sales Finalization
  const finalizeCurrentSale = (options: {
    paymentMethod: PaymentMethod;
    amountReceived?: number;
    change?: number;
    discount?: number;
    notes?: string;
  }) => {
    if (cart.length === 0) {
      addToast('error', 'Carrinho vazio', 'Adicione pelo menos um produto para vender.');
      return { success: false, error: 'Carrinho vazio' };
    }

    const currentUser = user || { id: 'usr_admin', name: 'Atendente', email: 'admin@brisaleve.com', role: 'admin' };
    const discount = options.discount || 0;
    const finalTotal = Math.max(0, cartTotal - discount);

    const result = db.finalizeSale({
      items: cart,
      total: finalTotal,
      subtotal: cartTotal,
      discount,
      paymentMethod: options.paymentMethod,
      amountReceived: options.amountReceived,
      change: options.change,
      user: currentUser,
      notes: options.notes
    });

    if (!result.success) {
      addToast('error', 'Não foi possível finalizar', result.error);
      return result;
    }

    // Sucesso!
    clearCart();
    refreshProducts();
    setSales(db.getSales());
    setStockMovements(db.getStockMovements());
    setActiveCashSession(db.getActiveCashSession());
    setCashTransactions(db.getCashTransactions());

    // Confetti delicado
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#C46D75', '#E8A598', '#E5C378', '#F3D8D8']
      });
    } catch {
      // Ignora caso confetti falhe
    }

    addToast('success', 'Venda realizada com sucesso!', `Venda #${result.sale?.saleNumber} registrada.`);
    return result;
  };

  const refreshSales = useCallback(async () => {
    const local = db.getSales();
    setSales(local);
    const remote = await supabaseService.fetchSales();
    if (remote) {
      storage.set('sales', remote);
      setSales(remote);
    }
  }, []);

  const clearSales = () => {
    db.clearSales();
    setSales([]);
    addToast('info', 'Histórico de vendas limpo com sucesso.');
  };

  // Stock adjustments
  const adjustStock = (productId: string, qty: number, reason: string): boolean => {
    const res = db.adjustStock(productId, qty, reason, user || undefined);
    if (!res) {
      addToast('error', 'Erro ao ajustar estoque');
      return false;
    }
    refreshProducts();
    setStockMovements(db.getStockMovements());
    addToast('success', 'Estoque atualizado com sucesso!');
    return true;
  };

  // Cash Register
  const openCash = (initialBalance: number, notes?: string) => {
    const currentUser = user || { id: 'usr_admin', name: 'Atendente', email: 'admin@brisaleve.com', role: 'admin' };
    const session = db.openCashSession(initialBalance, currentUser, notes);
    setActiveCashSession(session);
    setCashTransactions(db.getCashTransactions());
    addToast('success', 'Caixa aberto com sucesso!', `Saldo inicial: R$ ${Number(initialBalance).toFixed(2)}`);
  };

  const closeCash = (countedBalance: number, notes?: string) => {
    if (!activeCashSession) return;
    const currentUser = user || { id: 'usr_admin', name: 'Atendente', email: 'admin@brisaleve.com', role: 'admin' };
    const closed = db.closeCashSession(activeCashSession.id, countedBalance, currentUser, notes);
    setActiveCashSession(null);
    addToast('success', 'Caixa fechado com sucesso!', `Diferença apurada: R$ ${closed?.difference?.toFixed(2)}`);
  };

  const addCashEntry = (amount: number, reason: string) => {
    const currentUser = user || { id: 'usr_admin', name: 'Atendente', email: 'admin@brisaleve.com', role: 'admin' };
    const tx = db.addCashTransaction('ENTRADA', amount, reason, currentUser);
    if (tx) {
      setActiveCashSession(db.getActiveCashSession());
      setCashTransactions(db.getCashTransactions());
      addToast('success', 'Entrada adicionada no caixa', `+ R$ ${Number(amount).toFixed(2)}`);
    } else {
      addToast('error', 'O caixa precisa estar aberto para registrar entradas.');
    }
  };

  const addCashExit = (amount: number, reason: string) => {
    const currentUser = user || { id: 'usr_admin', name: 'Atendente', email: 'admin@brisaleve.com', role: 'admin' };
    const tx = db.addCashTransaction('SAIDA', amount, reason, currentUser);
    if (tx) {
      setActiveCashSession(db.getActiveCashSession());
      setCashTransactions(db.getCashTransactions());
      addToast('warning', 'Saída registrada no caixa', `- R$ ${Number(amount).toFixed(2)} (${reason})`);
    } else {
      addToast('error', 'O caixa precisa estar aberto para registrar saídas.');
    }
  };

  // Settings
  const updateSettings = (newSettings: Settings) => {
    const saved = db.saveSettings(newSettings);
    setSettingsState(saved);
    addToast('success', 'Configurações salvas!');
  };

  const resetAllData = () => {
    db.resetToDefaults();
    setProducts(db.getProducts());
    setCategories(db.getCategories());
    setCart([]);
    setSales([]);
    setStockMovements([]);
    setActiveCashSession(null);
    setCashTransactions([]);
    setSettingsState(db.getSettings());
    addToast('info', 'Dados restaurados para o padrão de demonstração.');
  };

  return (
    <AppContext.Provider
      value={{
        products,
        categories,
        refreshProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartTotal,
        cartItemCount,
        sales,
        refreshSales,
        clearSales,
        finalizeCurrentSale,
        receiptToPrint,
        setReceiptToPrint,
        stockMovements,
        adjustStock,
        activeCashSession,
        cashTransactions,
        openCash,
        closeCash,
        addCashEntry,
        addCashExit,
        settings,
        updateSettings,
        resetAllData,
        toasts,
        addToast,
        removeToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp deve ser utilizado dentro de AppProvider');
  }
  return context;
};
