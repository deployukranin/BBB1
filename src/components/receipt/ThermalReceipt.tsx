import React, { useState } from 'react';
import { Sale } from '../../types';
import { useApp } from '../../context/AppContext';
import { qzPrinterService } from '../../services/qzPrinterService';
import { Printer, X, Loader2, Zap } from 'lucide-react';

interface ThermalReceiptProps {
  sale: Sale | null;
  onClose?: () => void;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({ sale, onClose }) => {
  const { settings, addToast } = useApp();
  const [isPrinting, setIsPrinting] = useState(false);

  if (!sale) return null;

  const widthClass = settings.printerWidth === '80mm' ? 'receipt-80mm' : 'receipt-58mm';
  const saleDate = new Date(sale.createdAt);

  const handlePrint = async () => {
    // Se o usuário optou expressamente pelo modo navegador
    if (settings.printMode === 'browser') {
      window.print();
      return;
    }

    setIsPrinting(true);
    addToast('info', 'Enviando cupom...', 'Conectando ao QZ Tray para impressão silenciosa.');

    const result = await qzPrinterService.printReceipt(sale, settings);
    setIsPrinting(false);

    if (result.success) {
      addToast('success', 'Cupom impresso!', 'Impresso com sucesso na impressora térmica.');
      if (onClose) onClose();
    } else {
      // Alerta amigável e fallback opcional
      addToast(
        'warning',
        'QZ Tray indisponível',
        result.error || 'Inicie o QZ Tray no seu computador. Abrindo impressão do navegador...'
      );
      // Fallback para não travar a venda
      setTimeout(() => {
        window.print();
      }, 600);
    }
  };

  const formatMoney = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Formato: <strong>{settings.printerWidth || '58mm'}</strong> • Modo:{' '}
          <strong>{settings.printMode === 'browser' ? 'Diálogo Navegador' : 'Direto Silencioso (QZ Tray)'}</strong>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={handlePrint} disabled={isPrinting}>
            {isPrinting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Imprimindo...
              </>
            ) : (
              <>
                <Zap size={18} />
                IMPRIMIR DIRETO
              </>
            )}
          </button>
          {onClose && (
            <button className="btn btn-secondary" onClick={onClose}>
              <X size={18} />
              Fechar
            </button>
          )}
        </div>
      </div>

      {/* ÁREA DO RECIBO QUE SERÁ IMPRESSO */}
      <div id="printable-receipt" className={`thermal-receipt-preview ${widthClass}`}>
        <div className="receipt-center receipt-bold" style={{ fontSize: 16, marginBottom: 4 }}>
          {settings.receiptHeader || settings.companyName || 'BRISA LEVE'}
        </div>
        {settings.address && (
          <div className="receipt-center" style={{ fontSize: 10, color: '#333', marginBottom: 2 }}>
            {settings.address}
          </div>
        )}
        {settings.phone && (
          <div className="receipt-center" style={{ fontSize: 10, color: '#333', marginBottom: 4 }}>
            Tel: {settings.phone}
          </div>
        )}

        <div className="receipt-divider"></div>

        <div className="receipt-row">
          <span>VENDA: #{sale.saleNumber}</span>
          <span>{saleDate.toLocaleDateString('pt-BR')}</span>
        </div>
        <div className="receipt-row">
          <span>HORA: {saleDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          <span>OP: {sale.userName || 'Brisa'}</span>
        </div>

        <div className="receipt-divider"></div>

        <div className="receipt-bold" style={{ marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
          <span>ITEM / DESCRIÇÃO</span>
          <span>TOTAL</span>
        </div>

        {sale.items.map((item, idx) => (
          <div key={idx} style={{ marginBottom: 4 }}>
            <div style={{ wordBreak: 'break-word' }}>{item.productName}</div>
            <div className="receipt-row" style={{ color: '#444', fontSize: 11 }}>
              <span>
                {item.quantity} un x {formatMoney(item.unitPrice)}
              </span>
              <span>{formatMoney(item.subtotal)}</span>
            </div>
          </div>
        ))}

        <div className="receipt-divider"></div>

        {sale.discount > 0 && (
          <div className="receipt-row">
            <span>SUBTOTAL:</span>
            <span>{formatMoney(sale.subtotal)}</span>
          </div>
        )}

        {sale.discount > 0 && (
          <div className="receipt-row">
            <span>DESCONTO:</span>
            <span>- {formatMoney(sale.discount)}</span>
          </div>
        )}

        <div className="receipt-row receipt-bold" style={{ fontSize: 14, margin: '4px 0' }}>
          <span>TOTAL:</span>
          <span>{formatMoney(sale.total)}</span>
        </div>

        <div className="receipt-divider"></div>

        <div className="receipt-row">
          <span>FORMA DE PAGTO:</span>
          <span className="receipt-bold">{sale.paymentMethod}</span>
        </div>

        {sale.paymentMethod === 'DINHEIRO' && (
          <>
            <div className="receipt-row">
              <span>VALOR RECEBIDO:</span>
              <span>{formatMoney(sale.amountReceived || sale.total)}</span>
            </div>
            <div className="receipt-row receipt-bold">
              <span>TROCO:</span>
              <span>{formatMoney(sale.change || 0)}</span>
            </div>
          </>
        )}

        <div className="receipt-divider"></div>

        <div className="receipt-center" style={{ marginTop: 8, fontStyle: 'italic' }}>
          {settings.receiptFooter || 'Obrigada pela preferência 💕'}
        </div>

        <div className="receipt-center" style={{ fontSize: 9, marginTop: 6, color: '#666' }}>
          www.brisaleve.com
        </div>
      </div>
    </div>
  );
};
