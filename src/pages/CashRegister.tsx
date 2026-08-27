import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Modal } from '../components/common/Modal';
import {
  DollarSign,
  PlusCircle,
  MinusCircle,
  Lock,
  Unlock,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  History,
  FileText
} from 'lucide-react';

export const CashRegister: React.FC = () => {
  const {
    activeCashSession,
    cashTransactions,
    openCash,
    closeCash,
    addCashEntry,
    addCashExit,
    settings
  } = useApp();

  // Estados de Modais
  const [isOpenCashModal, setIsOpenCashModal] = useState(false);
  const [isCloseCashModal, setIsCloseCashModal] = useState(false);
  const [isEntryModal, setIsEntryModal] = useState(false);
  const [isExitModal, setIsExitModal] = useState(false);

  // Form states
  const [initialAmount, setInitialAmount] = useState('100.00');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryReason, setEntryReason] = useState('');
  const [exitAmount, setExitAmount] = useState('');
  const [exitReason, setExitReason] = useState('');
  const [countedAmount, setCountedAmount] = useState('');
  const [closeNotes, setCloseNotes] = useState('');

  const formatMoney = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleOpenCash = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(initialAmount.replace(',', '.')) || 0;
    openCash(num);
    setIsOpenCashModal(false);
  };

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(entryAmount.replace(',', '.')) || 0;
    if (num <= 0) return;
    addCashEntry(num, entryReason || 'Entrada avulsa');
    setEntryAmount('');
    setEntryReason('');
    setIsEntryModal(false);
  };

  const handleAddExit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(exitAmount.replace(',', '.')) || 0;
    if (num <= 0) return;
    addCashExit(num, exitReason || 'Saída / Sangria');
    setExitAmount('');
    setExitReason('');
    setIsExitModal(false);
  };

  const handleCloseCash = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(countedAmount.replace(',', '.')) || 0;
    closeCash(num, closeNotes);
    setIsCloseCashModal(false);
    setCountedAmount('');
    setCloseNotes('');
  };

  // Cálculo da diferença no modal de fechamento
  const numCounted = parseFloat(countedAmount.replace(',', '.')) || 0;
  const expectedVal = activeCashSession ? activeCashSession.expectedBalance : 0;
  const diffVal = numCounted - expectedVal;

  // Transações da sessão atual
  const currentSessionTransactions = activeCashSession
    ? cashTransactions.filter(t => t.sessionId === activeCashSession.id)
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* SE O CAIXA ESTIVER FECHADO */}
      {!activeCashSession ? (
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '60px 24px',
            maxWidth: 560,
            margin: '20px auto',
            width: '100%'
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'var(--warning-bg)',
              color: 'var(--warning-text)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16
            }}
          >
            <Lock size={36} />
          </div>

          <h2 style={{ fontSize: '1.6rem', marginBottom: 8 }}>O Caixa Está Fechado</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: '0.95rem' }}>
            Abra o caixa informando o valor inicial em dinheiro disponível na gaveta para iniciar as operações do dia.
          </p>

          <button
            className="btn btn-primary btn-xl"
            onClick={() => setIsOpenCashModal(true)}
            style={{ margin: '0 auto' }}
          >
            <Unlock size={22} />
            <span>ABRIR CAIXA</span>
          </button>
        </div>
      ) : (
        /* SE O CAIXA ESTIVER ABERTO */
        <>
          {/* Header do Caixa Aberto com Ações Rápidas */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="badge badge-success" style={{ padding: '6px 14px', fontSize: '0.9rem' }}>
                🟢 CAIXA ABERTO
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Aberto em: {new Date(activeCashSession.openedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} por {activeCashSession.openedByUserName}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-secondary"
                onClick={() => setIsEntryModal(true)}
              >
                <PlusCircle size={18} color="var(--primary)" />
                <span>Adicionar Entrada</span>
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => setIsExitModal(true)}
              >
                <MinusCircle size={18} color="var(--danger-text)" />
                <span>Adicionar Saída</span>
              </button>

              <button
                className="btn btn-danger"
                onClick={() => {
                  setCountedAmount(activeCashSession.expectedBalance.toFixed(2));
                  setIsCloseCashModal(true);
                }}
              >
                <Lock size={18} />
                <span>FECHAR CAIXA</span>
              </button>
            </div>
          </div>

          {/* Cards com Resumo Financeiro do Caixa */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16
            }}
          >
            {/* Saldo Inicial */}
            <div className="card">
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                Saldo Inicial
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>
                {formatMoney(activeCashSession.initialBalance)}
              </div>
            </div>

            {/* Vendas PDV */}
            <div className="card">
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                Vendas Realizadas
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)' }}>
                {formatMoney(activeCashSession.totalSales)}
              </div>
            </div>

            {/* Entradas Extras */}
            <div className="card">
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                Entradas Extras
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--success-text)' }}>
                +{formatMoney(activeCashSession.totalIn)}
              </div>
            </div>

            {/* Saídas */}
            <div className="card">
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                Saídas / Sangrias
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--danger-text)' }}>
                -{formatMoney(activeCashSession.totalOut)}
              </div>
            </div>

            {/* Saldo Atual Esperado */}
            <div
              className="card"
              style={{
                background: 'var(--primary-light)',
                border: '1px solid var(--primary)'
              }}
            >
              <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, marginBottom: 4 }}>
                SALDO ATUAL EM CAIXA
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
                {formatMoney(activeCashSession.expectedBalance)}
              </div>
            </div>
          </div>

          {/* Tabela de Movimentações da Sessão Atual */}
          <div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: 14 }}>
              Movimentações deste Caixa
            </h3>
            <div className="custom-table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Tipo</th>
                    <th>Motivo / Descrição</th>
                    <th>Operador</th>
                    <th style={{ textAlign: 'right' }}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSessionTransactions.map(tx => {
                    const isVenda = tx.type === 'VENDA';
                    const isEntrada = tx.type === 'ENTRADA';

                    return (
                      <tr key={tx.id}>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {new Date(tx.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td>
                          {isVenda ? (
                            <span className="badge badge-soft">Venda</span>
                          ) : isEntrada ? (
                            <span className="badge badge-success">Entrada</span>
                          ) : (
                            <span className="badge badge-danger">Saída</span>
                          )}
                        </td>
                        <td style={{ fontWeight: 500 }}>{tx.reason}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{tx.userName}</td>
                        <td
                          style={{
                            textAlign: 'right',
                            fontWeight: 700,
                            color: isVenda || isEntrada ? 'var(--success-text)' : 'var(--danger-text)'
                          }}
                        >
                          {isVenda || isEntrada ? `+${formatMoney(tx.amount)}` : `-${formatMoney(tx.amount)}`}
                        </td>
                      </tr>
                    );
                  })}

                  {currentSessionTransactions.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                        Nenhuma movimentação realizada nesta sessão até o momento.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* MODAL ABRIR CAIXA */}
      <Modal
        isOpen={isOpenCashModal}
        onClose={() => setIsOpenCashModal(false)}
        title="Abrir Caixa"
      >
        <form onSubmit={handleOpenCash} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Valor Inicial em Dinheiro (Fundo de Troco) *</label>
            <input
              type="number"
              step="0.01"
              className="form-input"
              required
              value={initialAmount}
              onChange={e => setInitialAmount(e.target.value)}
              placeholder="0.00"
              style={{ fontSize: '1.3rem', fontWeight: 700 }}
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsOpenCashModal(false)}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Confirmar Abertura
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL ADICIONAR ENTRADA */}
      <Modal
        isOpen={isEntryModal}
        onClose={() => setIsEntryModal(false)}
        title="Adicionar Entrada no Caixa"
      >
        <form onSubmit={handleAddEntry} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Valor (R$) *</label>
            <input
              type="number"
              step="0.01"
              className="form-input"
              required
              value={entryAmount}
              onChange={e => setEntryAmount(e.target.value)}
              placeholder="0.00"
              style={{ fontSize: '1.2rem', fontWeight: 700 }}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Motivo da Entrada *</label>
            <input
              type="text"
              className="form-input"
              required
              value={entryReason}
              onChange={e => setEntryReason(e.target.value)}
              placeholder="Ex: Suprimento para troco, aporte inicial..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsEntryModal(false)}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Confirmar Entrada
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL ADICIONAR SAÍDA (SANGRIA) */}
      <Modal
        isOpen={isExitModal}
        onClose={() => setIsExitModal(false)}
        title="Adicionar Saída do Caixa"
      >
        <form onSubmit={handleAddExit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Valor (R$) *</label>
            <input
              type="number"
              step="0.01"
              className="form-input"
              required
              value={exitAmount}
              onChange={e => setExitAmount(e.target.value)}
              placeholder="0.00"
              style={{ fontSize: '1.2rem', fontWeight: 700 }}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Motivo da Saída *</label>
            <input
              type="text"
              className="form-input"
              required
              value={exitReason}
              onChange={e => setExitReason(e.target.value)}
              placeholder="Ex: Compra de material, pagamento de entrega..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsExitModal(false)}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-danger">
              Confirmar Saída
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL FECHAR CAIXA */}
      <Modal
        isOpen={isCloseCashModal}
        onClose={() => setIsCloseCashModal(false)}
        title="Fechamento de Caixa"
      >
        {activeCashSession && (
          <form onSubmit={handleCloseCash} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Resumo da Sessão */}
            <div
              style={{
                background: 'var(--bg-surface-subtle)',
                padding: 16,
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                fontSize: '0.92rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Saldo Inicial:</span>
                <span>{formatMoney(activeCashSession.initialBalance)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Vendido:</span>
                <span>{formatMoney(activeCashSession.totalSales)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Entradas Extras:</span>
                <span>+{formatMoney(activeCashSession.totalIn)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Saídas / Sangrias:</span>
                <span>-{formatMoney(activeCashSession.totalOut)}</span>
              </div>

              <div
                style={{
                  borderTop: '1px dashed var(--border-color)',
                  paddingTop: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 700,
                  fontSize: '1rem'
                }}
              >
                <span>Saldo Esperado no Sistema:</span>
                <span style={{ color: 'var(--primary)' }}>
                  {formatMoney(activeCashSession.expectedBalance)}
                </span>
              </div>
            </div>

            {/* Campo Valor Contado */}
            <div className="form-group">
              <label className="form-label">Valor Contado Fisicamente na Gaveta (R$) *</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                required
                value={countedAmount}
                onChange={e => setCountedAmount(e.target.value)}
                placeholder="0.00"
                style={{ fontSize: '1.3rem', fontWeight: 700 }}
                autoFocus
              />
            </div>

            {/* Apuração da Diferença */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background:
                  diffVal === 0
                    ? 'var(--success-bg)'
                    : diffVal > 0
                    ? 'var(--primary-light)'
                    : 'var(--danger-bg)'
              }}
            >
              <span style={{ fontWeight: 600 }}>Diferença Apurada:</span>
              <span
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color:
                    diffVal === 0
                      ? 'var(--success-text)'
                      : diffVal > 0
                      ? 'var(--primary)'
                      : 'var(--danger-text)'
                }}
              >
                {diffVal > 0 ? `+${formatMoney(diffVal)} (Sobra)` : diffVal < 0 ? `${formatMoney(diffVal)} (Falta)` : 'R$ 0,00 (Exato)'}
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Observações do Fechamento (Opcional)</label>
              <textarea
                className="form-textarea"
                rows={2}
                value={closeNotes}
                onChange={e => setCloseNotes(e.target.value)}
                placeholder="Anotações sobre a conferência do caixa..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsCloseCashModal(false)}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-danger btn-lg">
                Confirmar Fechamento
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
