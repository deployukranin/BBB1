import { supabase, isSupabaseConfigured } from './supabase';
import {
  Category,
  Product,
  Settings,
  Sale,
  SaleItem,
  CashSession,
  CashTransaction,
  StockMovement
} from '../types';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS, INITIAL_SETTINGS } from './seedData';

// --- DATA TRANSFORMERS ---
export const supabaseService = {
  // 1. CATEGORIES
  async fetchCategories(): Promise<Category[] | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*');
      
      if (error) throw error;
      if (!data || data.length === 0) {
        // Se vazio, insere os dados iniciais
        await this.syncInitialCategories();
        return INITIAL_CATEGORIES;
      }
      return data.map((c: any) => ({
        id: c.id,
        name: c.name,
        icon: c.icon || undefined
      }));
    } catch (err) {
      console.warn('Supabase fetchCategories warning:', err);
      return null;
    }
  },

  async syncInitialCategories(): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      const rows = INITIAL_CATEGORIES.map(c => ({
        id: c.id,
        name: c.name,
        icon: c.icon || null
      }));
      await supabase.from('categories').upsert(rows);
    } catch (err) {
      console.warn('Error syncing initial categories:', err);
    }
  },

  async saveCategory(cat: Category): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('categories').upsert({
        id: cat.id,
        name: cat.name,
        icon: cat.icon || null
      });
    } catch (err) {
      console.warn('Error saving category to Supabase:', err);
    }
  },

  async deleteCategory(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('categories').delete().eq('id', id);
    } catch (err) {
      console.warn('Error deleting category from Supabase:', err);
    }
  },

  // 2. PRODUCTS
  async fetchProducts(): Promise<Product[] | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) {
        await this.syncInitialProducts();
        return INITIAL_PRODUCTS;
      }

      return data.map((p: any) => ({
        id: p.id,
        name: p.name,
        sku: p.sku || undefined,
        description: p.description || undefined,
        categoryId: p.category_id || '',
        price: Number(p.price),
        promoPrice: p.promo_price !== null && p.promo_price !== undefined ? Number(p.promo_price) : undefined,
        stock: Number(p.stock || 0),
        image: p.image || '',
        active: Boolean(p.active),
        showInCatalog: Boolean(p.show_in_catalog),
        createdAt: p.created_at,
        updatedAt: p.updated_at
      }));
    } catch (err) {
      console.warn('Supabase fetchProducts warning:', err);
      return null;
    }
  },

  async syncInitialProducts(): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      const rows = INITIAL_PRODUCTS.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku || null,
        description: p.description || null,
        category_id: p.categoryId,
        price: p.price,
        promo_price: p.promoPrice || null,
        stock: p.stock,
        image: p.image,
        active: p.active,
        show_in_catalog: p.showInCatalog,
        created_at: p.createdAt,
        updated_at: p.updatedAt
      }));
      await supabase.from('products').upsert(rows);
    } catch (err) {
      console.warn('Error syncing initial products:', err);
    }
  },

  async saveProduct(p: Product): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('products').upsert({
        id: p.id,
        name: p.name,
        sku: p.sku || null,
        description: p.description || null,
        category_id: p.categoryId,
        price: p.price,
        promo_price: p.promoPrice || null,
        stock: p.stock,
        image: p.image,
        active: p.active,
        show_in_catalog: p.showInCatalog,
        created_at: p.createdAt,
        updated_at: p.updatedAt
      });
    } catch (err) {
      console.warn('Error saving product to Supabase:', err);
    }
  },

  async deleteProduct(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('products').delete().eq('id', id);
    } catch (err) {
      console.warn('Error deleting product from Supabase:', err);
    }
  },

  // 3. SETTINGS
  async fetchSettings(): Promise<Settings | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'default')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        await this.saveSettings(INITIAL_SETTINGS);
        return INITIAL_SETTINGS;
      }

      return {
        companyName: data.store_name || data.company_name || INITIAL_SETTINGS.companyName,
        logoUrl: data.logo || data.logo_url || undefined,
        phone: data.phone || '',
        whatsapp: data.pix_key || data.whatsapp || '',
        instagram: data.pix_beneficiary || data.instagram || '',
        address: data.address || '',
        receiptHeader: data.trade_name || data.receipt_header || data.store_name || '',
        receiptFooter: data.receipt_footer || '',
        printerWidth: (data.printer_width as '58mm' | '80mm') || '58mm',
        lowStockThreshold: Number(data.low_stock_threshold || 3),
        theme: (data.theme as 'light' | 'dark' | 'system') || 'light'
      };
    } catch (err) {
      console.warn('Supabase fetchSettings warning:', err);
      return null;
    }
  },

  async saveSettings(s: Settings): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('settings').upsert({
        id: 'default',
        store_name: s.companyName,
        trade_name: s.receiptHeader || s.companyName,
        phone: s.phone,
        address: s.address,
        logo: s.logoUrl || null,
        pix_key: s.whatsapp,
        pix_beneficiary: s.instagram,
        receipt_footer: s.receiptFooter,
        theme: s.theme,
        updated_at: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Error saving settings to Supabase:', err);
    }
  },

  // 4. SALES & SALE ITEMS
  async fetchSales(): Promise<Sale[] | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*, sale_items(*)')
        .order('created_at', { ascending: false });

      if (salesError) throw salesError;
      if (!salesData) return [];

      return salesData.map((s: any) => ({
        id: s.id,
        saleNumber: Number(s.sale_number),
        items: (s.sale_items || []).map((item: any) => ({
          id: item.id,
          productId: item.product_id,
          productName: item.product_name,
          productImage: item.product_image || undefined,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unit_price),
          subtotal: Number(item.subtotal)
        })),
        subtotal: Number(s.subtotal),
        discount: Number(s.discount || 0),
        total: Number(s.total),
        paymentMethod: s.payment_method,
        amountReceived: s.amount_received !== null ? Number(s.amount_received) : undefined,
        change: s.change !== null ? Number(s.change) : undefined,
        userId: s.user_id,
        userName: s.user_name,
        cashSessionId: s.cash_session_id || undefined,
        notes: s.notes || undefined,
        createdAt: s.created_at
      }));
    } catch (err) {
      console.warn('Supabase fetchSales warning:', err);
      return null;
    }
  },

  async saveSale(sale: Sale): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      // 1. Insert/upsert Sale
      await supabase.from('sales').upsert({
        id: sale.id,
        sale_number: sale.saleNumber,
        subtotal: sale.subtotal,
        discount: sale.discount,
        total: sale.total,
        payment_method: sale.paymentMethod,
        amount_received: sale.amountReceived || null,
        change: sale.change || null,
        user_id: sale.userId,
        user_name: sale.userName,
        cash_session_id: sale.cashSessionId || null,
        notes: sale.notes || null,
        created_at: sale.createdAt
      });

      // 2. Insert items
      if (sale.items && sale.items.length > 0) {
        const itemRows = sale.items.map(item => ({
          id: item.id,
          sale_id: sale.id,
          product_id: item.productId,
          product_name: item.productName,
          product_image: item.productImage || null,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          subtotal: item.subtotal
        }));
        await supabase.from('sale_items').upsert(itemRows);
      }
    } catch (err) {
      console.warn('Error saving sale to Supabase:', err);
    }
  },

  async clearAllSales(): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('sales').delete().neq('id', 'none');
    } catch (err) {
      console.warn('Error clearing sales from Supabase:', err);
    }
  },

  // 5. CASH SESSIONS
  async fetchCashSessions(): Promise<CashSession[] | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('cash_sessions')
        .select('*')
        .order('opened_at', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      return data.map((cs: any) => ({
        id: cs.id,
        openedAt: cs.opened_at,
        closedAt: cs.closed_at || undefined,
        status: cs.status,
        initialBalance: Number(cs.opening_balance ?? cs.initial_balance ?? 0),
        totalSales: Number(cs.total_sales || 0),
        totalIn: Number(cs.total_in || 0),
        totalOut: Number(cs.total_out || 0),
        expectedBalance: Number(cs.closing_balance ?? cs.opening_balance ?? cs.initial_balance ?? 0),
        countedBalance: cs.closing_balance !== null && cs.closing_balance !== undefined ? Number(cs.closing_balance) : undefined,
        difference: cs.difference !== null && cs.difference !== undefined ? Number(cs.difference) : undefined,
        openedByUserId: cs.user_id || cs.opened_by_user_id,
        openedByUserName: cs.user_name || cs.opened_by_user_name,
        closedByUserId: cs.closed_by_user_id || undefined,
        closedByUserName: cs.closed_by_user_name || undefined,
        notes: cs.notes || undefined
      }));
    } catch (err) {
      console.warn('Supabase fetchCashSessions warning:', err);
      return null;
    }
  },

  async saveCashSession(cs: CashSession): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('cash_sessions').upsert({
        id: cs.id,
        opened_at: cs.openedAt,
        closed_at: cs.closedAt || null,
        status: cs.status,
        opening_balance: cs.initialBalance,
        closing_balance: cs.countedBalance ?? cs.expectedBalance ?? null,
        user_id: cs.openedByUserId || 'usr_admin',
        user_name: cs.openedByUserName || 'Admin',
        notes: cs.notes || null
      });
    } catch (err) {
      console.warn('Error saving cash session to Supabase:', err);
    }
  },

  // 6. CASH TRANSACTIONS
  async fetchCashTransactions(): Promise<CashTransaction[] | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('cash_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      return data.map((tx: any) => ({
        id: tx.id,
        sessionId: tx.session_id,
        type: tx.type,
        amount: Number(tx.amount),
        reason: tx.reason,
        saleId: tx.sale_id || undefined,
        userId: tx.user_id,
        userName: tx.user_name,
        createdAt: tx.created_at
      }));
    } catch (err) {
      console.warn('Supabase fetchCashTransactions warning:', err);
      return null;
    }
  },

  async saveCashTransaction(tx: CashTransaction): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('cash_transactions').upsert({
        id: tx.id,
        session_id: tx.sessionId || null,
        type: tx.type,
        amount: tx.amount,
        reason: tx.reason,
        sale_id: tx.saleId || null,
        user_id: tx.userId || 'usr_admin',
        user_name: tx.userName || 'Admin',
        created_at: tx.createdAt
      });
    } catch (err) {
      console.warn('Error saving cash transaction to Supabase:', err);
    }
  },

  // 7. STOCK MOVEMENTS
  async fetchStockMovements(): Promise<StockMovement[] | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      return data.map((m: any) => ({
        id: m.id,
        productId: m.product_id,
        productName: m.product_name,
        type: m.type,
        quantity: Number(m.quantity),
        previousStock: Number(m.previous_stock),
        newStock: Number(m.new_stock),
        reason: m.reason,
        saleId: m.sale_id || undefined,
        userId: m.user_id || undefined,
        userName: m.user_name || undefined,
        createdAt: m.created_at
      }));
    } catch (err) {
      console.warn('Supabase fetchStockMovements warning:', err);
      return null;
    }
  },

  async saveStockMovement(mov: StockMovement): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('stock_movements').upsert({
        id: mov.id,
        product_id: mov.productId,
        product_name: mov.productName,
        type: mov.type,
        quantity: mov.quantity,
        previous_stock: mov.previousStock,
        new_stock: mov.newStock,
        reason: mov.reason,
        sale_id: mov.saleId || null,
        user_id: mov.userId || null,
        user_name: mov.userName || null,
        created_at: mov.createdAt
      });
    } catch (err) {
      console.warn('Error saving stock movement to Supabase:', err);
    }
  }
};
