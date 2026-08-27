import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sparkles, Sun, Moon, ArrowRight, Store } from 'lucide-react';

interface LoginProps {
  onGoToCatalog: () => void;
}

export const Login: React.FC<LoginProps> = ({ onGoToCatalog }) => {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState('admin@brisaleve.com');
  const [password, setPassword] = useState('123456');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(email, password, rememberMe);
    if (!res.success) {
      setError(res.error || 'Erro ao entrar.');
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 30%, var(--primary-light) 0%, var(--bg-page) 70%)',
        padding: 24,
        position: 'relative'
      }}
    >
      {/* Botão de Tema no Topo */}
      <button
        className="btn-icon"
        onClick={toggleTheme}
        style={{ position: 'absolute', top: 24, right: 24 }}
        title="Alternar Tema"
      >
        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </button>

      <div
        className="card"
        style={{
          maxWidth: 440,
          width: '100%',
          padding: '40px 32px',
          boxShadow: 'var(--shadow-lg)',
          borderRadius: 'var(--radius-lg)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'var(--primary-light)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14
            }}
          >
            <Sparkles size={28} color="var(--primary)" />
          </div>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--primary)', marginBottom: 4 }}>Brisa Leve</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Sistema de PDV, Estoque e Catálogo
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--danger-bg)',
              color: 'var(--danger-text)',
              fontSize: '0.88rem',
              marginBottom: 20
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">E-mail ou Usuário</label>
            <input
              type="text"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seuemail@exemplo.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Senha</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 24,
              fontSize: '0.88rem'
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                style={{ accentColor: 'var(--primary)', width: 16, height: 16 }}
              />
              <span style={{ color: 'var(--text-muted)' }}>Lembrar de mim</span>
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
            style={{ marginBottom: 16 }}
          >
            <span>{loading ? 'Entrando...' : 'Entrar no Sistema'}</span>
            <ArrowRight size={20} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16, borderTop: '1px solid var(--border-color)', paddingTop: 20 }}>
          <button
            className="btn btn-soft btn-block"
            onClick={onGoToCatalog}
            style={{ fontSize: '0.9rem' }}
          >
            <Store size={18} />
            <span>Acessar Catálogo Público (Sem login)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
