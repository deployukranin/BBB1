import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { PageId } from './components/layout/Sidebar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Pos } from './pages/Pos';
import { Products } from './pages/Products';
import { Stock } from './pages/Stock';
import { CashRegister } from './pages/CashRegister';
import { Sales } from './pages/Sales';
import { Catalog } from './pages/Catalog';
import { QrCodePage } from './pages/QrCodePage';
import { Settings } from './pages/Settings';

export const App: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [isPublicCatalogView, setIsPublicCatalogView] = useState(() => {
    return window.location.hash.includes('catalogo');
  });

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash.includes('catalogo')) {
        setIsPublicCatalogView(true);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Rota pública de catálogo (Instagram Bio / QR Code)
  if (isPublicCatalogView) {
    return (
      <Catalog
        isStandalone={true}
        onBackToAdmin={() => {
          setIsPublicCatalogView(false);
          window.location.hash = '';
        }}
      />
    );
  }

  // Se não estiver logado, exibe a tela de login
  if (!isAuthenticated) {
    return <Login onGoToCatalog={() => setIsPublicCatalogView(true)} />;
  }

  // Renderiza a página ativa dentro do Layout administrativo
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'pos':
        return <Pos />;
      case 'products':
        return <Products />;
      case 'stock':
        return <Stock />;
      case 'cash':
        return <CashRegister />;
      case 'sales':
        return <Sales />;
      case 'catalog':
        return (
          <Catalog
            isStandalone={false}
            onBackToAdmin={() => setCurrentPage('dashboard')}
          />
        );
      case 'qrcode':
        return <QrCodePage />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderCurrentPage()}
    </Layout>
  );
};
