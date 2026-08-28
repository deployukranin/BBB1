-- ============================================================
-- ESQUEMA DO BANCO DE DADOS SUPABASE - BRISA LEVE PDV
-- ============================================================

-- 1. Categorias
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT
);

-- 2. Produtos
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  price NUMERIC(10, 2) NOT NULL,
  promo_price NUMERIC(10, 2),
  stock NUMERIC(10, 2) DEFAULT 0,
  image TEXT,
  active BOOLEAN DEFAULT TRUE,
  show_in_catalog BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Configurações da Loja
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  company_name TEXT NOT NULL,
  logo_url TEXT,
  phone TEXT,
  whatsapp TEXT,
  instagram TEXT,
  address TEXT,
  receipt_header TEXT,
  receipt_footer TEXT,
  printer_width TEXT DEFAULT '58mm',
  low_stock_threshold NUMERIC DEFAULT 3,
  theme TEXT DEFAULT 'light',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Sessões de Caixa
CREATE TABLE IF NOT EXISTS cash_sessions (
  id TEXT PRIMARY KEY,
  opened_at TIMESTAMPTZ NOT NULL,
  closed_at TIMESTAMPTZ,
  status TEXT NOT NULL, -- 'ABERTO' | 'FECHADO'
  initial_balance NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_sales NUMERIC(10, 2) DEFAULT 0,
  total_in NUMERIC(10, 2) DEFAULT 0,
  total_out NUMERIC(10, 2) DEFAULT 0,
  expected_balance NUMERIC(10, 2) NOT NULL DEFAULT 0,
  counted_balance NUMERIC(10, 2),
  difference NUMERIC(10, 2),
  opened_by_user_id TEXT NOT NULL,
  opened_by_user_name TEXT NOT NULL,
  closed_by_user_id TEXT,
  closed_by_user_name TEXT,
  notes TEXT
);

-- 5. Transações de Caixa
CREATE TABLE IF NOT EXISTS cash_transactions (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES cash_sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'ENTRADA' | 'SAIDA' | 'VENDA'
  amount NUMERIC(10, 2) NOT NULL,
  reason TEXT NOT NULL,
  sale_id TEXT,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Vendas
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  sale_number BIGINT NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL,
  discount NUMERIC(10, 2) DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  amount_received NUMERIC(10, 2),
  change NUMERIC(10, 2),
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  cash_session_id TEXT REFERENCES cash_sessions(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Itens da Venda
CREATE TABLE IF NOT EXISTS sale_items (
  id TEXT PRIMARY KEY,
  sale_id TEXT REFERENCES sales(id) ON DELETE CASCADE,
  product_id TEXT,
  product_name TEXT NOT NULL,
  product_image TEXT,
  quantity NUMERIC(10, 2) NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL
);

-- 8. Movimentações de Estoque
CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'ENTRADA' | 'SAIDA' | 'VENDA' | 'AJUSTE'
  quantity NUMERIC(10, 2) NOT NULL,
  previous_stock NUMERIC(10, 2) NOT NULL,
  new_stock NUMERIC(10, 2) NOT NULL,
  reason TEXT NOT NULL,
  sale_id TEXT REFERENCES sales(id) ON DELETE SET NULL,
  user_id TEXT,
  user_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HABILITAR ROW LEVEL SECURITY (RLS) COM POLÍTICAS DE ACESSO TOTAL PARA CHAVE PÚBLICA (ANON)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access to categories" ON categories;
CREATE POLICY "Allow public access to categories" ON categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to products" ON products;
CREATE POLICY "Allow public access to products" ON products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to settings" ON settings;
CREATE POLICY "Allow public access to settings" ON settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to cash_sessions" ON cash_sessions;
CREATE POLICY "Allow public access to cash_sessions" ON cash_sessions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to cash_transactions" ON cash_transactions;
CREATE POLICY "Allow public access to cash_transactions" ON cash_transactions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to sales" ON sales;
CREATE POLICY "Allow public access to sales" ON sales FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to sale_items" ON sale_items;
CREATE POLICY "Allow public access to sale_items" ON sale_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to stock_movements" ON stock_movements;
CREATE POLICY "Allow public access to stock_movements" ON stock_movements FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 9. SUPABASE STORAGE (BUCKET 'products' & POLICIES)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow public storage select" ON storage.objects;
CREATE POLICY "Allow public storage select" ON storage.objects FOR SELECT USING (bucket_id = 'products');

DROP POLICY IF EXISTS "Allow public storage insert" ON storage.objects;
CREATE POLICY "Allow public storage insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'products');

DROP POLICY IF EXISTS "Allow public storage update" ON storage.objects;
CREATE POLICY "Allow public storage update" ON storage.objects FOR UPDATE USING (bucket_id = 'products');

DROP POLICY IF EXISTS "Allow public storage delete" ON storage.objects;
CREATE POLICY "Allow public storage delete" ON storage.objects FOR DELETE USING (bucket_id = 'products');
