import React from 'react';
import { Sun, Moon, Menu, ShoppingCart, User as UserIcon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { PageId } from './Sidebar';

interface HeaderProps {
  currentPage: PageId;
  onOpenMobileMenu: () => void;
  onNavigate: (page: PageId) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onOpenMobileMenu,
  onNavigate
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { activeCashSession, cartItemCount } = useApp();

  const getPageTitle = (page: PageId) => {
    switch (page) {
      case 'dashboard':
        return 'Início';
      case 'pos':
        return 'Ponto de Venda (PDV)';
      case 'products':
        return 'Produtos';
      case 'stock':
        return 'Controle de Estoque';
      case 'cash':
        return 'Controle de Caixa';
      case 'sales':
        return 'Histórico de Vendas';
      case 'catalog':
        return 'Catálogo Online';
      case 'qrcode':
        return 'QR Code do Catálogo';
      case 'settings':
        return 'Configurações';
      default:
        return 'Brisa Leve';
    }
  };

  return (
    <header className="top-header">
      <div className="header-title-wrap">
        <button
          className="btn-icon"
          onClick={onOpenMobileMenu}
          style={{ display: 'none' }}
          id="mobile-menu-btn"
          aria-label="Abrir Menu"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="header-title">{getPageTitle(currentPage)}</h1>
        </div>
      </div>

      <div className="header-actions">
        {/* Status do Caixa */}
        <div
          onClick={() => onNavigate('cash')}
          style={{ cursor: 'pointer' }}
          title="Clique para ver o Caixa"
        >
          {activeCashSession ? (
            <span className="badge badge-success">
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: 'currentColor'
                }}
              />
              Caixa Aberto
            </span>
          ) : (
            <span className="badge badge-warning">
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: 'currentColor'
                }}
              />
              Caixa Fechado
            </span>
          )}
        </div>

        {/* Atalho rápido para PDV com badge de itens */}
        {currentPage !== 'pos' && (
          <button
            className="btn btn-soft"
            onClick={() => onNavigate('pos')}
            style={{ padding: '8px 16px', fontSize: '0.88rem' }}
          >
            <ShoppingCart size={18} />
            <span>PDV</span>
            {cartItemCount > 0 && (
              <span
                style={{
                  backgroundColor: 'var(--primary)',
                  color: '#FFF',
                  borderRadius: 999,
                  padding: '2px 8px',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}
              >
                {cartItemCount}
              </span>
            )}
          </button>
        )}

        {/* Alternador de Tema Claro / Escuro */}
        <button
          className="btn-icon"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Mudar para Tema Escuro' : 'Mudar para Tema Claro'}
          aria-label="Alternar Tema"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        {/* Perfil do Usuário */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            paddingLeft: 12,
            borderLeft: '1px solid var(--border-color)'
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              backgroundColor: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
              overflow: 'hidden'
            }}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <UserIcon size={20} />
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{user?.name || 'Administrador'}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Brisa Leve</span>
          </div>
        </div>
      </div>
    </header>
  );
};
