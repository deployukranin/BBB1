import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Settings as SettingsType } from '../types';
import { supabaseService } from '../services/supabaseService';
import { qzPrinterService } from '../services/qzPrinterService';
import {
  Building2,
  Printer,
  Boxes,
  Palette,
  RotateCcw,
  Save,
  CheckCircle2,
  Sun,
  Moon,
  Upload,
  Camera,
  Loader2,
  Image as ImageIcon,
  Zap
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { settings, updateSettings, resetAllData, addToast } = useApp();
  const { theme, setTheme } = useTheme();

  const [form, setForm] = useState<SettingsType>({ ...settings });
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Sincroniza o formulário sempre que as configurações do Supabase/Contexto carregarem
  useEffect(() => {
    setForm({ ...settings });
  }, [settings]);

  const handleChange = (field: keyof SettingsType, val: any) => {
    setForm(prev => ({ ...prev, [field]: val }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('error', 'Formato inválido', 'Selecione um arquivo de imagem para o logo.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast('warning', 'Arquivo muito grande', 'A imagem deve ter no máximo 5MB.');
      return;
    }

    setIsUploadingLogo(true);
    addToast('info', 'Enviando logo...', 'Fazendo upload para o Supabase Storage.');

    const res = await supabaseService.uploadImage(file, 'logo');
    setIsUploadingLogo(false);

    if (res.url) {
      handleChange('logoUrl', res.url);
      addToast('success', 'Logo atualizado!', 'Imagem salva no Supabase Storage.');
    } else {
      addToast('error', 'Erro no upload', res.error || 'Não foi possível enviar o logo.');
    }
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
          {/* Logo da Loja */}
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Logotipo da Loja</label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: 14,
                background: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)'
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {form.logoUrl ? (
                  <img
                    src={form.logoUrl}
                    alt="Logo da Loja"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <ImageIcon size={26} color="var(--text-light)" />
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                <input
                  type="file"
                  ref={logoInputRef}
                  onChange={handleLogoUpload}
                  accept="image/png, image/jpeg, image/webp, image/gif"
                  style={{ display: 'none' }}
                />

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isUploadingLogo}
                    style={{ padding: '8px 16px', fontSize: '0.88rem' }}
                  >
                    {isUploadingLogo ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Enviando Logo...</span>
                      </>
                    ) : (
                      <>
                        <Camera size={16} />
                        <span>Carregar Logo do Computador / Celular</span>
                      </>
                    )}
                  </button>
                </div>

                <input
                  type="url"
                  className="form-input"
                  value={form.logoUrl || ''}
                  onChange={e => handleChange('logoUrl', e.target.value)}
                  placeholder="Ou cole a URL direta do logotipo..."
                  style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                />
              </div>
            </div>
          </div>

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

      {/* 2. CONFIGURAÇÕES DO RECIBO TÉRMICO E QZ TRAY */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: 12, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Printer size={22} color="var(--primary)" />
            <h3 style={{ fontSize: '1.15rem' }}>Recibo Térmico & Impressão Direta (QZ Tray)</h3>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem', padding: '6px 14px' }}
            onClick={async () => {
              addToast('info', 'Verificando QZ Tray...', 'Buscando impressoras locais.');
              const status = await qzPrinterService.getStatus();
              if (status.connected) {
                addToast('success', 'QZ Tray Conectado!', `Versão ${status.version}. ${status.printers.length} impressoras encontradas.`);
                if (status.printers.length > 0 && !form.printerName) {
                  handleChange('printerName', status.defaultPrinter || status.printers[0]);
                }
              } else {
                addToast('warning', 'QZ Tray não detectado', status.error || 'Certifique-se de que o aplicativo QZ Tray está aberto.');
              }
            }}
          >
            <Zap size={16} color="var(--primary)" />
            <span>Testar Conexão QZ Tray</span>
          </button>
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

          <div className="form-group">
            <label className="form-label">Modo de Emissão</label>
            <select
              className="form-select"
              value={form.printMode || 'qz'}
              onChange={e => handleChange('printMode', e.target.value as 'qz' | 'browser')}
            >
              <option value="qz">⚡ Direto / Silencioso via QZ Tray (Sem Diálogo do Windows)</option>
              <option value="browser">🖨️ Diálogo Padrão do Navegador (Manual)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Nome da Impressora Térmica no Windows (Opcional)</label>
            <input
              type="text"
              className="form-input"
              value={form.printerName || ''}
              onChange={e => handleChange('printerName', e.target.value)}
              placeholder="Ex: POS-58, TM-T20, Elgin i9 (ou vazio para padrão)"
            />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Se deixar em branco, usará automaticamente a impressora padrão do Windows.
            </span>
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
