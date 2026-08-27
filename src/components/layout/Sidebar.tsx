import {
  Home,
  ShoppingCart,
  Package,
  Boxes,
  DollarSign,
  Receipt,
  Store,
  QrCode,
  Settings as SettingsIcon,
  LogOut,
  Sparkles,
  LucideIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export type PageId =
  | 'dashboard'
  | 'pos'
  | 'products'
  | 'stock'
  | 'cash'
  | 'sales'
  | 'catalog'
  | 'qrcode'
  | 'settings';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isOpenMobile,
  onCloseMobile
}) => {
  const { logout } = useAuth();
  const { activeCashSession, settings } = useApp();

  const navItems: { id: PageId; label: string; icon: LucideIcon }[] = [
    { id: 'dashboard', label: 'Início', icon: Home },
    { id: 'pos', label: 'PDV', icon: ShoppingCart },
    { id: 'products', label: 'Produtos', icon: Package },
    { id: 'stock', label: 'Estoque', icon: Boxes },
    { id: 'cash', label: 'Caixa', icon: DollarSign },
    { id: 'sales', label: 'Vendas', icon: Receipt },
    { id: 'catalog', label: 'Catálogo', icon: Store },
    { id: 'qrcode', label: 'QR Code', icon: QrCode },
    { id: 'settings', label: 'Configurações', icon: SettingsIcon }
  ];

  const handleNav = (id: PageId) => {
    onNavigate(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <aside className={`sidebar ${isOpenMobile ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo-icon">
          <Sparkles size={24} color="var(--primary)" />
        </div>
        <div>
          <div className="sidebar-brand-name">{settings.companyName || 'Brisa Leve'}</div>
          <div className="sidebar-brand-tag">PDV & Catálogo</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNav(item.id)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
              {item.id === 'cash' && activeCashSession && (
                <span
                  style={{
                    marginLeft: 'auto',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: 'var(--success-text)'
                  }}
                  title="Caixa Aberto"
                />
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item" onClick={logout} style={{ color: 'var(--danger-text)' }}>
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
};
