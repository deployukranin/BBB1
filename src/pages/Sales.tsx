import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Modal } from '../components/common/Modal';
import { Sale } from '../types';
import {
  Receipt,
  Search,
  Printer,
  Calendar,
  Eye,
  CreditCard,
  DollarSign,
  QrCode,
  Trash2,
  RefreshCw
} from 'lucide-react';

type DateFilter = 'today' | 'yesterday' | '7days' | '30days' | 'custom';

export const Sales: React.FC = () => {
  const { sales, refreshSales, clearSales, setReceiptToPrint } = useApp();

  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [search, setSearch] = useState('');
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  // Sincroniza sempre ao entrar na tela de Vendas
  useEffect(() => {
    refreshSales();
  }, [refreshSales]);

  // Detalhes da venda selecionada
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const formatMoney = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const filteredSales = useMemo(() => {
    const now = new Date();

    return sales.filter(s => {
      const saleDate = new Date(s.createdAt);

      // Filtro de Texto (número da venda, atendente, método de pagamento)
      const matchesSearch =
        s.saleNumber.toString().includes(search) ||
        s.userName.toLowerCase().includes(search.toLowerCase()) ||
        s.paymentMethod.toLowerCase().includes(search.toLowerCase()) ||
        s.items.some(it => it.productName.toLowerCase().includes(search.toLowerCase()));

      if (!matchesSearch) return false;

      // Filtro por Data
      if (dateFilter === 'today') {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return saleDate >= today;
      }

      if (dateFilter === 'yesterday') {
        const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return saleDate >= yesterdayStart && saleDate < yesterdayEnd;
      }

      if (dateFilter === '7days') {
        const days7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return saleDate >= days7Ago;
      }

      if (dateFilter === '30days') {
        const days30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return saleDate >= days30Ago;
      }

      if (dateFilter === 'custom') {
        if (customStart && saleDate < new Date(customStart + 'T00:00:00')) return false;
        if (customEnd && saleDate > new Date(customEnd + 'T23:59:59')) return false;
        return true;
      }

      return true;
    });
  }, [sales, dateFilter, customStart, customEnd, search]);

  const totalFilteredValue = filteredSales.reduce((acc, s) => acc + s.total, 0);

  const getPaymentBadge = (method: string) => {
    switch (method) {
      case 'PIX':
        return (
          <span className="badge badge-soft" style={{ display: 'inline-flex', gap: 4 }}>
            <QrCode size={13} /> PIX
          </span>
        );
      case 'DINHEIRO':
        return (
          <span className="badge badge-success" style={{ display: 'inline-flex', gap: 4 }}>
            <DollarSign size={13} /> Dinheiro
          </span>
        );
      case 'DEBITO':
      case 'CREDITO':
        return (
          <span className="badge badge-warning" style={{ display: 'inline-flex', gap: 4 }}>
            <CreditCard size={13} /> {method === 'DEBITO' ? 'Débito' : 'Crédito'}
          </span>
        );
      default:
        return <span className="badge badge-soft">{method}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Barra de Filtros Rápidos */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16
        }}
      >
        {/* Pílulas de Período */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button
            className={`btn ${dateFilter === 'today' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.88rem' }}
            onClick={() => setDateFilter('today')}
          >
            Hoje
          </button>
          <button
            className={`btn ${dateFilter === 'yesterday' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.88rem' }}
            onClick={() => setDateFilter('yesterday')}
          >
            Ontem
          </button>
          <button
            className={`btn ${dateFilter === '7days' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.88rem' }}
            onClick={() => setDateFilter('7days')}
          >
            Últimos 7 dias
          </button>
          <button
            className={`btn ${dateFilter === '30days' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.88rem' }}
            onClick={() => setDateFilter('30days')}
          >
            Últimos 30 dias
          </button>
          <button
            className={`btn ${dateFilter === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.88rem' }}
            onClick={() => setDateFilter('custom')}
          >
            <Calendar size={16} />
            Período Personalizado
          </button>
        </div>

        {/* Busca por Texto e Ação de Limpar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div className="search-input-wrap" style={{ minWidth: 240 }}>
            <Search size={18} />
            <input
              type="text"
              className="form-input"
              placeholder="Buscar por nº, atendente..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <button
            className="btn btn-secondary"
            onClick={() => refreshSales()}
            title="Atualizar lista com Supabase"
            style={{ padding: '8px 12px' }}
          >
            <RefreshCw size={16} />
          </button>

          {sales.length > 0 && (
            <button
              className="btn btn-secondary"
              onClick={() => setIsConfirmClearOpen(true)}
              style={{
                padding: '8px 14px',
                fontSize: '0.85rem',
                color: 'var(--danger-text)',
                borderColor: 'var(--danger-border)'
              }}
              title="Limpar histórico de vendas"
            >
              <Trash2 size={16} />
              <span>Limpar Vendas</span>
            </button>
          )}
        </div>
      </div>

      {/* Se filtro personalizado: inputs de data */}
      {dateFilter === 'custom' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: 16,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>De:</span>
            <input
              type="date"
              className="form-input"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              style={{ width: 'auto' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Até:</span>
            <input
              type="date"
              className="form-input"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              style={{ width: 'auto' }}
            />
          </div>
        </div>
      )}

      {/* Card Resumo do Período */}
      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '18px 24px',
          background: 'var(--bg-surface)'
        }}
      >
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Vendas no período selecionado
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            {filteredSales.length} {filteredSales.length === 1 ? 'venda' : 'vendas'}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Total Faturado
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
            {formatMoney(totalFilteredValue)}
          </div>
        </div>
      </div>

      {/* Tabela de Vendas */}
      <div className="custom-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Nº Venda</th>
              <th>Data & Hora</th>
              <th>Itens</th>
              <th>Forma de Pagamento</th>
              <th>Atendente</th>
              <th>Total</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.map(sale => {
              const saleDate = new Date(sale.createdAt);

              return (
                <tr
                  key={sale.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedSale(sale)}
                >
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      #{sale.saleNumber}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>
                      {saleDate.toLocaleDateString('pt-BR')}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                      {saleDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                      {sale.items.length} {sale.items.length === 1 ? 'produto' : 'produtos'}
                    </span>
                  </td>
                  <td>{getPaymentBadge(sale.paymentMethod)}</td>
                  <td>
                    <span style={{ fontSize: '0.88rem' }}>{sale.userName}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                      {formatMoney(sale.total)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 8 }} onClick={e => e.stopPropagation()}>
                      <button
                        className="btn-icon"
                        onClick={() => setSelectedSale(sale)}
                        title="Ver detalhes da venda"
                        style={{ width: 36, height: 36 }}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => setReceiptToPrint(sale)}
                        title="Reimprimir recibo térmico"
                        style={{ width: 36, height: 36, color: 'var(--primary)' }}
                      >
                        <Printer size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredSales.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  Nenhuma venda encontrada para o período ou termo selecionado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DE DETALHES DA VENDA */}
      <Modal
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        title={`Detalhes da Venda #${selectedSale?.saleNumber}`}
      >
        {selectedSale && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Header com Data e Operador */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.88rem'
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Data: </span>
                <strong>{new Date(selectedSale.createdAt).toLocaleString('pt-BR')}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Atendente: </span>
                <strong>{selectedSale.userName}</strong>
              </div>
            </div>

            {/* Lista de Itens */}
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: 8 }}>
                Itens Vendidos:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedSale.items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.productName}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {item.quantity} un. x {formatMoney(item.unitPrice)}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      {formatMoney(item.subtotal)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumo Financeiro */}
            <div
              style={{
                borderTop: '1px solid var(--border-color)',
                paddingTop: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                fontSize: '0.92rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Forma de Pagamento:</span>
                <strong>{selectedSale.paymentMethod}</strong>
              </div>

              {selectedSale.paymentMethod === 'DINHEIRO' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Valor Recebido:</span>
                    <span>{formatMoney(selectedSale.amountReceived || selectedSale.total)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Troco:</span>
                    <span>{formatMoney(selectedSale.change || 0)}</span>
                  </div>
                </>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  marginTop: 6,
                  color: 'var(--primary)'
                }}
              >
                <span>TOTAL:</span>
                <span>{formatMoney(selectedSale.total)}</span>
              </div>
            </div>

            {/* Botão de Reimprimir Recibo */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedSale(null)}
              >
                Fechar
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setReceiptToPrint(selectedSale);
                  setSelectedSale(null);
                }}
              >
                <Printer size={18} />
                <span>Reimprimir Recibo</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL DE CONFIRMAÇÃO DE LIMPEZA DE VENDAS */}
      <Modal
        isOpen={isConfirmClearOpen}
        onClose={() => setIsConfirmClearOpen(false)}
        title="Limpar Histórico de Vendas"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Tem certeza que deseja apagar todas as <strong>{sales.length}</strong> vendas registradas?
            Esta ação limpará o histórico no banco de dados e atualizará o painel de início automaticamente.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <button
              className="btn btn-secondary"
              onClick={() => setIsConfirmClearOpen(false)}
            >
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              style={{ background: 'var(--danger-text)', borderColor: 'var(--danger-text)' }}
              onClick={() => {
                clearSales();
                setIsConfirmClearOpen(false);
              }}
            >
              <Trash2 size={16} />
              <span>Sim, Limpar Todas as Vendas</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
