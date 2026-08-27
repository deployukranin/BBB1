import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(t => {
        let Icon = CheckCircle2;
        let iconColor = 'var(--primary)';
        if (t.type === 'error') {
          Icon = AlertCircle;
          iconColor = '#EF4444';
        } else if (t.type === 'warning') {
          Icon = AlertTriangle;
          iconColor = '#F59E0B';
        } else if (t.type === 'info') {
          Icon = Info;
          iconColor = '#3B82F6';
        }

        return (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <Icon size={22} color={iconColor} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{t.title}</div>
              {t.message && <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{t.message}</div>}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              style={{ color: 'var(--text-light)', padding: 4 }}
              title="Fechar"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
