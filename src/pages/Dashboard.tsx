import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageId } from '../components/layout/Sidebar';
import {
  DollarSign,
  ShoppingCart,
  Boxes,
  AlertTriangle,
  TrendingUp,
  Package,
  ArrowUpRight,
  Eye,
  EyeOff
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (page: PageId) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { sales, products, activeCashSession, settings } = useApp();

  // Estado para ocultar/mostrar valores sensíveis (com persistência no localStorage)
  const [hideSensitive, setHideSensitive] = useState<boolean>(() => {
    try {
      return localStorage.getItem('brisaleve_hide_sensitive') === 'true';
    } catch {
      return false;
    }
  });

  const toggleHideSensitive = () => {
    setHideSensitive(prev => {
      const next = !prev;
      try {
        localStorage.setItem('brisaleve_hide_sensitive', String(next));
      } catch {}
      return next;
    });
  };

  // Cálculo de vendas de hoje usando a data local do dispositivo
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todaySales = sales.filter(s => new Date(s.createdAt) >= todayStart);

  const totalVendasHoje = todaySales.reduce((acc, s) => acc + s.total, 0);
  const totalProdutosVendidosHoje = todaySales.reduce(
    (acc, s) => acc + s.items.reduce((itemAcc, it) => itemAcc + it.quantity, 0),
    0
  );

  // Caixa atual
  const saldoCaixaAtual = activeCashSession ? activeCashSession.expectedBalance : 0;

  // Produtos com estoque baixo (estoque <= threshold e > 0 ou == 0)
  const lowThreshold = settings.lowStockThreshold || 3;
  const produtosEstoqueBaixo = products.filter(p => p.stock <= lowThreshold);

  // Vendas dos últimos 7 dias para gráfico simples
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i));
    const nextD = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (5 - i));
    const daySales = sales.filter(s => {
      const sDate = new Date(s.createdAt);
      return sDate >= d && sDate < nextD;
    });
    const sum = daySales.reduce((acc, s) => acc + s.total, 0);
    return {
      dayName: d.toLocaleDateString('pt-BR', { weekday: 'short' }),
      date: d.toISOString().split('T')[0],
      total: sum
    };
  });

  const maxDaily = Math.max(...last7Days.map(d => d.total), 100);

  const formatMoney = (val: number) => {
    if (hideSensitive) return '••••••';
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatQuantity = (val: number) => {
    if (hideSensitive) return '••';
    return val;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* BARRA SUPERIOR DO DASHBOARD COM BOTÃO OCULTAR/EXIBIR DADOS SENSÍVEIS */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Visão Geral</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Acompanhe o desempenho da sua loja em tempo real
          </p>
        </div>

        <button
          className={`btn ${hideSensitive ? 'btn-secondary' : 'btn-soft'}`}
          onClick={toggleHideSensitive}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            fontSize: '0.88rem',
            borderRadius: 'var(--radius-full)'
          }}
          title={hideSensitive ? 'Exibir valores do painel' : 'Ocultar valores do painel'}
        >
          {hideSensitive ? <EyeOff size={18} color="var(--primary)" /> : <Eye size={18} />}
          <span>{hideSensitive ? 'Valores Ocultos' : 'Ocultar Valores'}</span>
        </button>
      </div>
      {/* 4 CARDS PRINCIPAIS COM INFORMAÇÕES DIRETAS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 20
        }}
      >
        {/* Vendas de Hoje */}
        <div className="card card-hover" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}
          >
            <TrendingUp size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Vendas de hoje
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--primary)' }}>
              {formatMoney(totalVendasHoje)}
            </div>
          </div>
        </div>

        {/* Caixa Atual */}
        <div
          className="card card-hover"
          style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}
          onClick={() => onNavigate('cash')}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 'var(--radius-md)',
              background: activeCashSession ? 'var(--success-bg)' : 'var(--warning-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: activeCashSession ? 'var(--success-text)' : 'var(--warning-text)'
            }}
          >
            <DollarSign size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Caixa atual {activeCashSession ? '(Aberto)' : '(Fechado)'}
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>
              {activeCashSession ? formatMoney(saldoCaixaAtual) : 'Fechado'}
            </div>
          </div>
        </div>

        {/* Produtos Vendidos Hoje */}
        <div className="card card-hover" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 'var(--radius-md)',
              background: 'var(--secondary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}
          >
            <ShoppingCart size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Produtos vendidos hoje
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>
              {formatQuantity(totalProdutosVendidosHoje)}{' '}
              <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-light)' }}>unid.</span>
            </div>
          </div>
        </div>

        {/* Produtos com Estoque Baixo */}
        <div
          className="card card-hover"
          style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}
          onClick={() => onNavigate('stock')}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 'var(--radius-md)',
              background: produtosEstoqueBaixo.length > 0 ? 'var(--danger-bg)' : 'var(--success-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: produtosEstoqueBaixo.length > 0 ? 'var(--danger-text)' : 'var(--success-text)'
            }}
          >
            <AlertTriangle size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Produtos com estoque baixo
            </div>
            <div
              style={{
                fontSize: '1.6rem',
                fontWeight: 700,
                color: produtosEstoqueBaixo.length > 0 ? 'var(--danger-text)' : 'inherit'
              }}
            >
              {formatQuantity(produtosEstoqueBaixo.length)}
            </div>
          </div>
        </div>
      </div>

      {/* 4 ATALHOS GIGANTES PARA AÇÕES PRINCIPAIS */}
      <div>
        <h3 style={{ fontSize: '1.1rem', marginBottom: 14, color: 'var(--text-muted)' }}>
          Ações Rápidas
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16
          }}
        >
          {/* NOVA VENDA */}
          <button
            className="btn btn-primary btn-xl"
            onClick={() => onNavigate('pos')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '24px 20px',
              gap: 12,
              alignItems: 'flex-start'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <ShoppingCart size={28} />
              <ArrowUpRight size={22} />
            </div>
            <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>NOVA VENDA</span>
            <span style={{ fontSize: '0.82rem', opacity: 0.9, fontWeight: 400 }}>
              Ir para tela do PDV
            </span>
          </button>

          {/* ABRIR / VER CAIXA */}
          <button
            className="btn btn-secondary btn-xl"
            onClick={() => onNavigate('cash')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '24px 20px',
              gap: 12,
              alignItems: 'flex-start'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <DollarSign size={28} color="var(--primary)" />
              <ArrowUpRight size={22} color="var(--text-muted)" />
            </div>
            <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              {activeCashSession ? 'VER CAIXA' : 'ABRIR CAIXA'}
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 400 }}>
              {activeCashSession ? 'Entradas, saídas e fechamento' : 'Informar saldo inicial'}
            </span>
          </button>

          {/* PRODUTOS */}
          <button
            className="btn btn-secondary btn-xl"
            onClick={() => onNavigate('products')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '24px 20px',
              gap: 12,
              alignItems: 'flex-start'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <Package size={28} color="var(--primary)" />
              <ArrowUpRight size={22} color="var(--text-muted)" />
            </div>
            <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>PRODUTOS</span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 400 }}>
              Cadastrar e gerenciar catálogo
            </span>
          </button>

          {/* ESTOQUE */}
          <button
            className="btn btn-secondary btn-xl"
            onClick={() => onNavigate('stock')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '24px 20px',
              gap: 12,
              alignItems: 'flex-start'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <Boxes size={28} color="var(--primary)" />
              <ArrowUpRight size={22} color="var(--text-muted)" />
            </div>
            <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>ESTOQUE</span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 400 }}>
              Ajustes rápidos e histórico
            </span>
          </button>
        </div>
      </div>

      {/* GRÁFICO SIMPLES E ACOLHEDOR DE VENDAS DOS ÚLTIMOS 7 DIAS */}
      <div className="card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.15rem' }}>Vendas dos Últimos 7 Dias</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Acompanhamento simples do movimento semanal
            </p>
          </div>
          <button
            className="btn btn-soft"
            onClick={() => onNavigate('sales')}
            style={{ fontSize: '0.85rem', padding: '8px 14px' }}
          >
            Ver todas as vendas
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 14,
            height: 160,
            paddingTop: 20
          }}
        >
          {last7Days.map((d, i) => {
            const heightPercent = maxDaily > 0 ? Math.max(10, (d.total / maxDaily) * 100) : 10;
            const isToday = i === 6;

            return (
              <div
                key={d.date}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  height: '100%',
                  justifyContent: 'flex-end'
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: isToday ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {d.total > 0 ? `R$ ${d.total.toFixed(0)}` : 'R$ 0'}
                </div>
                <div
                  style={{
                    width: '100%',
                    height: `${heightPercent}%`,
                    borderRadius: 'var(--radius-sm)',
                    background: isToday ? 'var(--primary)' : 'var(--primary-light)',
                    transition: 'all 0.3s ease',
                    minHeight: 10
                  }}
                  title={`${d.date}: ${formatMoney(d.total)}`}
                />
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: isToday ? 700 : 500,
                    color: isToday ? 'var(--primary)' : 'var(--text-muted)',
                    textTransform: 'capitalize'
                  }}
                >
                  {d.dayName}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
