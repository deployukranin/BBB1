import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Modal } from '../components/common/Modal';
import { Product } from '../types';
import {
  Boxes,
  Plus,
  Minus,
  Search,
  History,
  TrendingDown,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

export const Stock: React.FC = () => {
  const { products, stockMovements, adjustStock, settings } = useApp();

  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [search, setSearch] = useState('');

  // Modal de Ajuste de Estoque
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<'ENTRADA' | 'SAIDA'>('ENTRADA');
  const [adjustQty, setAdjustQty] = useState('1');
  const [adjustReason, setAdjustReason] = useState('Reposição de mercadoria');

  const lowThreshold = settings.lowStockThreshold || 3;

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpenAdjust = (prod: Product, type: 'ENTRADA' | 'SAIDA') => {
    setSelectedProduct(prod);
    setAdjustType(type);
    setAdjustQty('1');
    setAdjustReason(type === 'ENTRADA' ? 'Reposição de mercadoria' : 'Ajuste de contagem / Perda');
  };

  const handleConfirmAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const qtyNumber = parseInt(adjustQty, 10);
    if (qtyNumber <= 0) return;

    const finalChange = adjustType === 'ENTRADA' ? qtyNumber : -qtyNumber;
    adjustStock(selectedProduct.id, finalChange, adjustReason);
    setSelectedProduct(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Abas Superiores: Estoque Atual vs Histórico de Movimentações */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`btn ${activeTab === 'current' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('current')}
          >
            <Boxes size={18} />
            <span>Estoque Atual</span>
          </button>
          <button
            className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={18} />
            <span>Histórico de Movimentações</span>
          </button>
        </div>

        {activeTab === 'current' && (
          <div className="search-input-wrap" style={{ minWidth: 260 }}>
            <Search size={18} />
            <input
              type="text"
              className="form-input"
              placeholder="Buscar no estoque..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        )}
      </div>

      {activeTab === 'current' ? (
        /* TABELA DE ESTOQUE ATUAL */
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Quantidade Atual</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações de Estoque</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(p => {
                const isOutOfStock = p.stock <= 0;
                const isLowStock = p.stock <= lowThreshold && p.stock > 0;

                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img
                          src={p.image}
                          alt={p.name}
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 'var(--radius-sm)',
                            objectFit: 'cover'
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.name}</div>
                          {p.sku && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                              SKU: {p.sku}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                        {p.stock}{' '}
                        <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                          unid.
                        </span>
                      </span>
                    </td>
                    <td>
                      {isOutOfStock ? (
                        <span className="badge badge-danger">🔴 Sem estoque</span>
                      ) : isLowStock ? (
                        <span className="badge badge-warning">🟡 Estoque baixo</span>
                      ) : (
                        <span className="badge badge-success">🟢 Em estoque</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 8 }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                          onClick={() => handleOpenAdjust(p, 'ENTRADA')}
                        >
                          <Plus size={16} color="var(--primary)" />
                          <span>Adicionar</span>
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                          onClick={() => handleOpenAdjust(p, 'SAIDA')}
                          disabled={p.stock <= 0}
                        >
                          <Minus size={16} color="var(--danger-text)" />
                          <span>Remover</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    Nenhum produto encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* TABELA DE HISTÓRICO DE MOVIMENTAÇÕES */
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Data / Hora</th>
                <th>Produto</th>
                <th>Movimento</th>
                <th>Quantidade</th>
                <th>Estoque Anterior &rarr; Novo</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {stockMovements.map(mov => {
                const movDate = new Date(mov.createdAt);
                const isPositive = mov.quantity > 0;

                return (
                  <tr key={mov.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {movDate.toLocaleDateString('pt-BR')} às{' '}
                      {movDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ fontWeight: 600 }}>{mov.productName}</td>
                    <td>
                      {mov.type === 'VENDA' ? (
                        <span className="badge badge-soft">Venda PDV</span>
                      ) : isPositive ? (
                        <span className="badge badge-success" style={{ display: 'inline-flex', gap: 4 }}>
                          <TrendingUp size={14} /> Entrada
                        </span>
                      ) : (
                        <span className="badge badge-danger" style={{ display: 'inline-flex', gap: 4 }}>
                          <TrendingDown size={14} /> Saída
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          color: isPositive ? 'var(--success-text)' : 'var(--danger-text)'
                        }}
                      >
                        {isPositive ? `+${mov.quantity}` : mov.quantity} un.
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {mov.previousStock} &rarr; <strong>{mov.newStock}</strong>
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                      {mov.reason || 'Sem descrição'}
                    </td>
                  </tr>
                );
              })}

              {stockMovements.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    Nenhuma movimentação registrada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE AJUSTE RÁPIDO DE ESTOQUE */}
      <Modal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title={adjustType === 'ENTRADA' ? 'Adicionar Estoque' : 'Remover Estoque'}
      >
        {selectedProduct && (
          <form onSubmit={handleConfirmAdjust} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                background: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                style={{ width: 48, height: 48, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
              />
              <div>
                <div style={{ fontWeight: 600 }}>{selectedProduct.name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Estoque atual: <strong>{selectedProduct.stock} unidades</strong>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Quantidade a {adjustType === 'ENTRADA' ? 'adicionar' : 'remover'} *
              </label>
              <input
                type="number"
                className="form-input"
                required
                min="1"
                max={adjustType === 'SAIDA' ? selectedProduct.stock : undefined}
                value={adjustQty}
                onChange={e => setAdjustQty(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Motivo do Ajuste *</label>
              <input
                type="text"
                className="form-input"
                required
                value={adjustReason}
                onChange={e => setAdjustReason(e.target.value)}
                placeholder="Ex: Reposição, Ajuste de contagem, Devolução..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedProduct(null)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`btn ${adjustType === 'ENTRADA' ? 'btn-primary' : 'btn-danger'}`}
              >
                {adjustType === 'ENTRADA' ? 'Confirmar Entrada' : 'Confirmar Saída'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
