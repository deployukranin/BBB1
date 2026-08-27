import React, { useState } from 'react';
import { Sidebar, PageId } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '../common/Toast';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { ThermalReceipt } from '../receipt/ThermalReceipt';

interface LayoutProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentPage,
  onNavigate,
  children
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { receiptToPrint, setReceiptToPrint } = useApp();

  return (
    <div className="app-container">
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        isOpenMobile={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="main-content">
        <Header
          currentPage={currentPage}
          onOpenMobileMenu={() => setMobileOpen(true)}
          onNavigate={onNavigate}
        />
        <main className="page-body">{children}</main>
      </div>

      {/* Modal global de impressão/reimpressão de cupom térmico */}
      <Modal
        isOpen={!!receiptToPrint}
        onClose={() => setReceiptToPrint(null)}
        title="Recibo da Venda"
      >
        <ThermalReceipt
          sale={receiptToPrint}
          onClose={() => setReceiptToPrint(null)}
        />
      </Modal>

      <ToastContainer />
    </div>
  );
};
