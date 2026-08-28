import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Modal } from '../components/common/Modal';
import { PaymentMethod, Product, Sale } from '../types';
import { qzPrinterService } from '../services/qzPrinterService';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Printer,
  DollarSign,
  CreditCard,
  QrCode as QrCodeIcon,
  Sparkles,
  Layers,
  LucideIcon,
  Zap,
  Loader2
} from 'lucide-react';

export const Pos: React.FC = () => {
  const {
    products,
    categories,
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartTotal,
    finalizeCurrentSale,
    setReceiptToPrint,
    settings,
    addToast
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('cat_all');
  const [searchQuery, setSearchQuery] = useState('');

  // Estados do Modal de Pagamento / Checkout
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('PIX');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'payment' | 'success'>('payment');
  const [isPrintingSale, setIsPrintingSale] = useState(false);

  // Filtragem de produtos ativos
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (!p.active) return false;
      const matchCat = selectedCategory === 'cat_all' || p.categoryId === selectedCategory;
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const formatMoney = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Cálculo de troco
  const numReceived = parseFloat(amountReceived.replace(',', '.')) || 0;
  const changeValue = selectedPayment === 'DINHEIRO' && numReceived > cartTotal ? numReceived - cartTotal : 0;

  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setSelectedPayment('PIX');
    setAmountReceived('');
    setCompletedSale(null);
    setCheckoutStep('payment');
    setIsCheckoutOpen(true);
  };

  const handleConfirmSale = () => {
    const result = finalizeCurrentSale({
      paymentMethod: selectedPayment,
      amountReceived: selectedPayment === 'DINHEIRO' ? (numReceived > 0 ? numReceived : cartTotal) : cartTotal,
      change: changeValue
    });

    if (result.success && result.sale) {
      setCompletedSale(result.sale);
      setCheckoutStep('success');
    }
  };

  const handleNewSale = () => {
    setIsCheckoutOpen(false);
    setCompletedSale(null);
    setCheckoutStep('payment');
  };

  const handlePrintCompletedSale = async () => {
    if (!completedSale) return;

    if (settings.printMode === 'browser') {
      setReceiptToPrint(completedSale);
      return;
    }

    setIsPrintingSale(true);
    addToast('info', 'Enviando cupom...', 'Conectando ao QZ Tray para impressão silenciosa.');

    const result = await qzPrinterService.printReceipt(completedSale, settings);
    setIsPrintingSale(false);

    if (result.success) {
      addToast('success', 'Cupom impresso!', 'Venda impressa silenciosamente via QZ Tray.');
    } else {
      addToast(
        'warning',
        'QZ Tray indisponível',
        result.error || 'Abrindo diálogo de impressão padrão...'
      );
      setReceiptToPrint(completedSale);
    }
  };

  const paymentOptions: { id: PaymentMethod; label: string; icon: LucideIcon }[] = [
    { id: 'PIX', label: 'PIX', icon: QrCodeIcon },
    { id: 'DINHEIRO', label: 'Dinheiro', icon: DollarSign },
    { id: 'DEBITO', label: 'Cartão de Débito', icon: CreditCard },
    { id: 'CREDITO', label: 'Cartão de Crédito', icon: CreditCard },
    { id: 'OUTRO', label: 'Outro', icon: Layers }
  ];

  return (
    <div className="pos-layout">
      {/* LADO ESQUERDO: CATÁLOGO DE PRODUTOS */}
      <div className="pos-products-panel">
        {/* Barra de Busca */}
        <div className="search-input-wrap">
          <Search size={20} />
          <input
            type="text"
            className="form-input"
            placeholder="Buscar produto por nome ou código..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Pílulas de Categoria */}
        <div className="pos-category-pills">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Grade de Produtos */}
        <div className="pos-products-grid">
          {filteredProducts.map(prod => {
            const isOutOfStock = prod.stock <= 0;
            const isLowStock = prod.stock <= (settings.lowStockThreshold || 3);
            const displayPrice = prod.promoPrice && prod.promoPrice > 0 ? prod.promoPrice : prod.price;

            return (
              <div
                key={prod.id}
                className="pos-product-card"
                onClick={() => !isOutOfStock && addToCart(prod)}
                style={{
                  opacity: isOutOfStock ? 0.6 : 1,
                  cursor: isOutOfStock ? 'not-allowed' : 'pointer'
                }}
              >
                <img src={prod.image} alt={prod.name} className="pos-product-img" />
                <div className="pos-product-body">
                  <div className="pos-product-title">{prod.name}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <div className="pos-product-price">{formatMoney(displayPrice)}</div>
                    {prod.promoPrice && prod.promoPrice > 0 && (
                      <span style={{ fontSize: '0.75rem', textDecoration: 'line-through', color: 'var(--text-light)' }}>
                        {formatMoney(prod.price)}
                      </span>
                    )}
                  </div>
                  <div className="pos-product-stock-tag" style={{ marginTop: 4 }}>
                    {isOutOfStock ? (
                      <span className="badge badge-danger" style={{ padding: '2px 8px', fontSize: '0.72rem' }}>
                        Esgotado
                      </span>
                    ) : isLowStock ? (
                      <span className="badge badge-warning" style={{ padding: '2px 8px', fontSize: '0.72rem' }}>
                        Restam {prod.stock}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {prod.stock} em estoque
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: 40,
                color: 'var(--text-muted)'
              }}
            >
              Nenhum produto encontrado.
            </div>
          )}
        </div>
      </div>

      {/* LADO DIREITO: CARRINHO DA VENDA */}
      <div className="pos-cart-panel">
        <div className="pos-cart-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ fontSize: '1.15rem' }}>Carrinho da Venda</h3>
            <span className="badge badge-soft">{cart.length} itens</span>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              style={{ fontSize: '0.8rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Trash2 size={14} /> Limpar
            </button>
          )}
        </div>

        {/* Lista de Itens do Carrinho */}
        <div className="pos-cart-items">
          {cart.map(item => (
            <div key={item.product.id} className="pos-cart-item">
              <img src={item.product.image} alt={item.product.name} className="pos-cart-item-img" />
              <div className="pos-cart-item-info">
                <div className="pos-cart-item-name">{item.product.name}</div>
                <div className="pos-cart-item-price">
                  {formatMoney(item.unitPrice)} un.
                </div>
                <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.92rem', marginTop: 2 }}>
                  {formatMoney(item.subtotal)}
                </div>
              </div>

              <div className="pos-cart-qty-controls">
                <button
                  className="qty-btn"
                  onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                  title="Diminuir"
                >
                  <Minus size={14} />
                </button>
                <span style={{ fontWeight: 700, minWidth: 24, textAlign: 'center', fontSize: '0.95rem' }}>
                  {item.quantity}
                </span>
                <button
                  className="qty-btn"
                  onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                  title="Aumentar"
                >
                  <Plus size={14} />
                </button>
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  style={{ color: 'var(--text-light)', padding: 4, marginLeft: 4 }}
                  title="Remover produto"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}

          {cart.length === 0 && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-light)',
                gap: 12,
                padding: 30,
                textAlign: 'center'
              }}
            >
              <Sparkles size={40} color="var(--border-color)" />
              <div style={{ fontSize: '0.95rem' }}>O carrinho está vazio.</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Clique nos produtos ao lado para adicionar.
              </div>
            </div>
          )}
        </div>

        {/* Rodapé do Carrinho com Total em Destaque e Botão Gigante */}
        <div className="pos-cart-footer">
          <div className="pos-total-row">
            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL</span>
            <span className="pos-total-val">{formatMoney(cartTotal)}</span>
          </div>

          <button
            className="btn btn-primary btn-xl btn-block"
            onClick={handleOpenCheckout}
            disabled={cart.length === 0}
            style={{
              opacity: cart.length === 0 ? 0.5 : 1,
              cursor: cart.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            FINALIZAR VENDA
          </button>
        </div>
      </div>

      {/* MODAL DE FINALIZAÇÃO DA VENDA */}
      <Modal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        title={checkoutStep === 'payment' ? 'Finalização da Venda' : 'Venda Concluída!'}
      >
        {checkoutStep === 'payment' ? (
          <div>
            {/* Total da Venda em Destaque */}
            <div
              style={{
                background: 'var(--primary-light)',
                padding: '18px 24px',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
                marginBottom: 20
              }}
            >
              <div style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}>TOTAL A PAGAR</div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1.2 }}>
                {formatMoney(cartTotal)}
              </div>
            </div>

            {/* Seleção da Forma de Pagamento */}
            <div style={{ marginBottom: 20 }}>
              <label className="form-label" style={{ marginBottom: 10, display: 'block' }}>
                Selecione a forma de pagamento:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                {paymentOptions.map(opt => {
                  const Icon = opt.icon;
                  const isSelected = selectedPayment === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedPayment(opt.id)}
                      className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                      style={{
                        padding: '14px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        height: 'auto'
                      }}
                    >
                      <Icon size={22} />
                      <span style={{ fontSize: '0.85rem' }}>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Se DINHEIRO: Campo de Valor Recebido e Troco */}
            {selectedPayment === 'DINHEIRO' && (
              <div
                style={{
                  background: 'var(--bg-surface-subtle)',
                  padding: 16,
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 20,
                  border: '1px solid var(--border-color)'
                }}
              >
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">Valor Recebido do Cliente (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder={`Ex: ${cartTotal.toFixed(2)}`}
                    value={amountReceived}
                    onChange={e => setAmountReceived(e.target.value)}
                    style={{ fontSize: '1.2rem', fontWeight: 700 }}
                    autoFocus
                  />
                </div>

                {/* Atalhos rápidos de valores em dinheiro */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    onClick={() => setAmountReceived(cartTotal.toFixed(2))}
                  >
                    Exato ({formatMoney(cartTotal)})
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    onClick={() => setAmountReceived((Math.ceil(cartTotal / 10) * 10).toFixed(2))}
                  >
                    R$ {(Math.ceil(cartTotal / 10) * 10).toFixed(2)}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    onClick={() => setAmountReceived((Math.ceil(cartTotal / 50) * 50).toFixed(2))}
                  >
                    R$ {(Math.ceil(cartTotal / 50) * 50).toFixed(2)}
                  </button>
                </div>

                {/* Cálculo do Troco */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: changeValue > 0 ? 'var(--warning-bg)' : 'transparent'
                  }}
                >
                  <span style={{ fontWeight: 600 }}>Troco a Devolver:</span>
                  <span
                    style={{
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      color: changeValue > 0 ? 'var(--warning-text)' : 'inherit'
                    }}
                  >
                    {formatMoney(changeValue)}
                  </span>
                </div>
              </div>
            )}

            {/* Botão de Confirmação */}
            <button
              className="btn btn-primary btn-xl btn-block"
              onClick={handleConfirmSale}
            >
              CONFIRMAR VENDA
            </button>
          </div>
        ) : (
          /* TELA DE SUCESSO APÓS A VENDA */
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--success-bg)',
                color: 'var(--success-text)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h3 style={{ fontSize: '1.4rem', marginBottom: 6 }}>Venda realizada com sucesso!</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: '0.95rem' }}>
              Venda <strong>#{completedSale?.saleNumber}</strong> no valor de{' '}
              <strong>{formatMoney(completedSale?.total || 0)}</strong> registrada no sistema.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                className="btn btn-primary btn-lg btn-block"
                onClick={handlePrintCompletedSale}
                disabled={isPrintingSale}
              >
                {isPrintingSale ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>IMPRIMINDO SILENCIOSO...</span>
                  </>
                ) : (
                  <>
                    <Zap size={20} />
                    <span>IMPRIMIR RECIBO (DIRETO)</span>
                  </>
                )}
              </button>

              <button
                className="btn btn-secondary btn-lg btn-block"
                onClick={handleNewSale}
              >
                NOVA VENDA
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
