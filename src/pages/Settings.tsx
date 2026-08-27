import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Settings as SettingsType } from '../types';
import {
  Building2,
  Printer,
  Boxes,
  Palette,
  RotateCcw,
  Save,
  CheckCircle2,
  Sun,
  Moon
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { settings, updateSettings, resetAllData, addToast } = useApp();
  const { theme, setTheme } = useTheme();

  const [form, setForm] = useState<SettingsType>({ ...settings });
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleChange = (field: keyof SettingsType, val: any) => {
    setForm(prev => ({ ...prev, [field]: val }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(form);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    handleChange('theme', newTheme);
  };

  return (
    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 860 }}>
      {/* 1. DADOS DA EMPRESA */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
          <Building2 size={22} color="var(--primary)" />
          <h3 style={{ fontSize: '1.15rem' }}>Dados da Loja</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Nome da Loja *</label>
            <input
              type="text"
              className="form-input"
              required
              value={form.companyName}
              onChange={e => handleChange('companyName', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Telefone de Contato</label>
            <input
              type="text"
              className="form-input"
              value={form.phone}
              onChange={e => handleChange('phone', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">WhatsApp para Pedidos do Catálogo *</label>
            <input
              type="text"
              className="form-input"
              required
              value={form.whatsapp}
              onChange={e => handleChange('whatsapp', e.target.value)}
              placeholder="5511999999999 (com DDD)"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Instagram (@)</label>
            <input
              type="text"
              className="form-input"
              value={form.instagram}
              onChange={e => handleChange('instagram', e.target.value)}
              placeholder="@brisaleve.oficial"
            />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Endereço Completo</label>
            <input
              type="text"
              className="form-input"
              value={form.address}
              onChange={e => handleChange('address', e.target.value)}
              placeholder="Rua, Número, Bairro, Cidade - UF"
            />
          </div>
        </div>
      </div>

      {/* 2. CONFIGURAÇÕES DO RECIBO TÉRMICO */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
          <Printer size={22} color="var(--primary)" />
          <h3 style={{ fontSize: '1.15rem' }}>Recibo Térmico (Impressão)</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Nome Exibido no Topo do Recibo</label>
            <input
              type="text"
              className="form-input"
              value={form.receiptHeader}
              onChange={e => handleChange('receiptHeader', e.target.value)}
              placeholder="BRISA LEVE"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Largura da Bobina Térmica</label>
            <select
              className="form-select"
              value={form.printerWidth}
              onChange={e => handleChange('printerWidth', e.target.value as '58mm' | '80mm')}
            >
              <option value="58mm">58mm (Padrão Pequeno / Portátil)</option>
              <option value="80mm">80mm (Padrão Grande / Balcão)</option>
            </select>
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Mensagem Final de Agradecimento</label>
            <input
              type="text"
              className="form-input"
              value={form.receiptFooter}
              onChange={e => handleChange('receiptFooter', e.target.value)}
              placeholder="Obrigada pela preferência 💕"
            />
          </div>
        </div>
      </div>

      {/* 3. CONFIGURAÇÕES DE ESTOQUE */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
          <Boxes size={22} color="var(--primary)" />
          <h3 style={{ fontSize: '1.15rem' }}>Regras de Estoque</h3>
        </div>

        <div style={{ maxWidth: 360 }}>
          <div className="form-group">
            <label className="form-label">Limite para Alerta de Estoque Baixo (unidades)</label>
            <input
              type="number"
              className="form-input"
              min="1"
              max="50"
              value={form.lowStockThreshold}
              onChange={e => handleChange('lowStockThreshold', parseInt(e.target.value, 10) || 3)}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Produtos com quantidade menor ou igual a este valor serão destacados em amarelo.
            </span>
          </div>
        </div>
      </div>

      {/* 4. APARÊNCIA & TEMA */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
          <Palette size={22} color="var(--primary)" />
          <h3 style={{ fontSize: '1.15rem' }}>Aparência do Sistema</h3>
        </div>

        <div>
          <label className="form-label" style={{ marginBottom: 10, display: 'block' }}>
            Selecione o Modo Visual:
          </label>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleThemeChange('light')}
              style={{ padding: '14px 22px' }}
            >
              <Sun size={20} />
              <span>☀️ Tema Claro</span>
            </button>

            <button
              type="button"
              className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleThemeChange('dark')}
              style={{ padding: '14px 22px' }}
            >
              <Moon size={20} />
              <span>🌙 Tema Escuro</span>
            </button>
          </div>
        </div>
      </div>

      {/* BOTÃO SALVAR CONFIGURAÇÕES */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            if (window.confirm('Deseja realmente restaurar todos os dados para o padrão de demonstração da Brisa Leve?')) {
              resetAllData();
            }
          }}
          style={{ color: 'var(--text-muted)' }}
        >
          <RotateCcw size={18} />
          <span>Restaurar Dados de Demonstração</span>
        </button>

        <button type="submit" className="btn btn-primary btn-lg">
          <Save size={20} />
          <span>Salvar Todas as Configurações</span>
        </button>
      </div>
    </form>
  );
};
