import { Category, Product, Settings, User } from '../types';

export const INITIAL_USER: User = {
  id: 'usr_1',
  name: 'Brisa Admin',
  email: 'admin@brisaleve.com',
  role: 'admin',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
};

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat_all', name: 'Todos' },
  { id: 'cat_1', name: 'Roupas' },
  { id: 'cat_2', name: 'Acessórios' },
  { id: 'cat_3', name: 'Cosméticos' },
  { id: 'cat_4', name: 'Bolsas & Calçados' },
  { id: 'cat_5', name: 'Autocuidado' },
];

export const INITIAL_SETTINGS: Settings = {
  companyName: 'Brisa Leve Concept',
  logoUrl: '',
  phone: '(11) 98765-4321',
  whatsapp: '5511987654321',
  instagram: '@brisaleve.oficial',
  address: 'Rua das Flores, 120 — Jardins, SP',
  receiptHeader: 'BRISA LEVE',
  receiptFooter: 'Obrigada pela preferência 💕',
  printerWidth: '58mm',
  lowStockThreshold: 3,
  theme: 'light'
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    name: 'Vestido Midi Floral Rosé',
    sku: 'VEST-FLR-01',
    description: 'Vestido midi confeccionado em tecido leve e fluido, estampa floral delicada em tons rosé e fenda sutil.',
    categoryId: 'cat_1',
    price: 189.90,
    promoPrice: 169.90,
    stock: 8,
    image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80',
    active: true,
    showInCatalog: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_2',
    name: 'Bolsa Estruturada Nude',
    sku: 'BOL-STR-02',
    description: 'Bolsa transversal em acabamento premium, fecho dourado delicado e alça ajustável.',
    categoryId: 'cat_4',
    price: 149.00,
    stock: 5,
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80',
    active: true,
    showInCatalog: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_3',
    name: 'Batom Velvet Matte Rosebud',
    sku: 'BAT-VLV-03',
    description: 'Textura aveludada, alta pigmentação e hidratação com óleo de rosa mosqueta.',
    categoryId: 'cat_3',
    price: 49.90,
    promoPrice: 39.90,
    stock: 12,
    image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&auto=format&fit=crop&q=80',
    active: true,
    showInCatalog: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_4',
    name: 'Brinco Pérola Barroca Dourado',
    sku: 'ACC-BRN-04',
    description: 'Semijoia banhada a ouro 18k com pérola de água doce irregular. Delicado e atemporal.',
    categoryId: 'cat_2',
    price: 79.00,
    stock: 3, // alerta estoque baixo
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&auto=format&fit=crop&q=80',
    active: true,
    showInCatalog: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_5',
    name: 'Vela Aromática Flor de Algodão & Vanilla',
    sku: 'VEL-ALG-05',
    description: 'Vela 100% vegetal em pote de cerâmica artesanal, aroma suave e acolhedor.',
    categoryId: 'cat_5',
    price: 65.00,
    stock: 7,
    image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&auto=format&fit=crop&q=80',
    active: true,
    showInCatalog: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_6',
    name: 'Blusa Canelada Gola Alta Nude',
    sku: 'ROU-BLS-06',
    description: 'Blusa feminina em malha canelada super macia, toque suave e caimento perfeito.',
    categoryId: 'cat_1',
    price: 89.90,
    promoPrice: 79.90,
    stock: 2, // alerta estoque baixo
    image: 'https://images.unsplash.com/photo-1551803091-e20673f15770?w=600&auto=format&fit=crop&q=80',
    active: true,
    showInCatalog: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_7',
    name: 'Óleo Corporal Iluminador Rosé Glow',
    sku: 'COS-OLE-07',
    description: 'Fórmula enriquecida com micropartículas douradas e óleo de amêndoas doces.',
    categoryId: 'cat_3',
    price: 58.00,
    stock: 0, // esgotado para teste
    image: 'https://images.unsplash.com/photo-1608248597359-3382f1f0a204?w=600&auto=format&fit=crop&q=80',
    active: true,
    showInCatalog: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_8',
    name: 'Lenço de Seda Estampa Aquarela',
    sku: 'ACC-LNC-08',
    description: 'Lenço acetinado multiuso, perfeito para usar no pescoço, cabelo ou na bolsa.',
    categoryId: 'cat_2',
    price: 45.00,
    stock: 10,
    image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&auto=format&fit=crop&q=80',
    active: true,
    showInCatalog: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
