import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { useApp } from '../context/AppContext';
import { Download, Sparkles, Copy, ExternalLink } from 'lucide-react';

export const QrCodePage: React.FC = () => {
  const { settings, addToast } = useApp();

  const [catalogUrl, setCatalogUrl] = useState(() => {
    return window.location.origin + '/#catalogo';
  });

  // Customizações
  const [fgColor, setFgColor] = useState('#C46D75');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [qrSize, setQrSize] = useState<number>(260);
  const [includeLogo, setIncludeLogo] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Paleta de presets rápidos
  const colorPresets = [
    { label: 'Rosé Brisa', fg: '#C46D75', bg: '#FFFFFF' },
    { label: 'Rosa Queimado', fg: '#9E4A53', bg: '#FDF7F7' },
    { label: 'Dourado Elegante', fg: '#8C6D23', bg: '#FFFDF9' },
    { label: 'Preto Clássico', fg: '#1F1A1C', bg: '#FFFFFF' }
  ];

  useEffect(() => {
    generateQR();
  }, [catalogUrl, fgColor, bgColor, qrSize, includeLogo]);

  const generateQR = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      await QRCode.toCanvas(canvas, catalogUrl || 'https://brisaleve.com/catalogo', {
        width: qrSize,
        margin: 2,
        color: {
          dark: fgColor,
          light: bgColor
        },
        errorCorrectionLevel: 'H' // High para permitir logo no centro
      });

      // Se incluir logo no centro
      if (includeLogo) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const logoSize = qrSize * 0.22;
          const center = qrSize / 2;

          // Círculo de fundo branco para o logo
          ctx.beginPath();
          ctx.arc(center, center, (logoSize / 2) + 4, 0, Math.PI * 2);
          ctx.fillStyle = bgColor;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(center, center, (logoSize / 2) + 2, 0, Math.PI * 2);
          ctx.fillStyle = fgColor;
          ctx.fill();

          // Desenha ícone de brilho/coração/texto
          ctx.fillStyle = bgColor;
          ctx.font = `bold ${Math.floor(logoSize * 0.45)}px 'Outfit', sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('BL', center, center);
        }
      }
    } catch (err) {
      console.error('Erro ao gerar QR Code', err);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `qrcode-catalogo-brisa-leve.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    addToast('success', 'Download iniciado!', 'QR Code salvo como PNG.');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(catalogUrl);
    addToast('success', 'Link copiado!', 'URL do catálogo copiada para a área de transferência.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ fontSize: '1.4rem', marginBottom: 4 }}>QR Code do seu Catálogo Online</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
          Gere uma placa para o balcão, embalagens ou adesivos para as clientes acessarem o catálogo pelo celular.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24
        }}
      >
        {/* COLUNA 1: CONTROLES DE PERSONALIZAÇÃO */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <h3 style={{ fontSize: '1.15rem' }}>Personalizar QR Code</h3>

          {/* Link do Catálogo */}
          <div className="form-group">
            <label className="form-label">Link de Destino do Catálogo</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                className="form-input"
                value={catalogUrl}
                onChange={e => setCatalogUrl(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCopyLink}
                title="Copiar Link"
              >
                <Copy size={16} />
              </button>
            </div>
          </div>

          {/* Presets Rápidos de Cores */}
          <div>
            <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>
              Estilos Rápidos:
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {colorPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="btn btn-secondary"
                  style={{
                    padding: '8px 12px',
                    fontSize: '0.82rem',
                    border: fgColor === preset.fg ? '2px solid var(--primary)' : '1px solid var(--border-color)'
                  }}
                  onClick={() => {
                    setFgColor(preset.fg);
                    setBgColor(preset.bg);
                  }}
                >
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      backgroundColor: preset.fg,
                      display: 'inline-block'
                    }}
                  />
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Seletor Manual de Cores */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Cor dos Pontos (QR)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="color"
                  value={fgColor}
                  onChange={e => setFgColor(e.target.value)}
                  style={{ width: 44, height: 40, border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{fgColor}</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Cor de Fundo</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="color"
                  value={bgColor}
                  onChange={e => setBgColor(e.target.value)}
                  style={{ width: 44, height: 40, border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{bgColor}</span>
              </div>
            </div>
          </div>

          {/* Logo no Centro */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={includeLogo}
                onChange={e => setIncludeLogo(e.target.checked)}
                style={{ accentColor: 'var(--primary)', width: 18, height: 18 }}
              />
              <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>
                Adicionar logo Brisa Leve no centro
              </span>
            </label>
          </div>

          {/* Tamanho */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label className="form-label">Resolução / Tamanho (px)</label>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{qrSize} x {qrSize} px</span>
            </div>
            <input
              type="range"
              min="180"
              max="400"
              step="20"
              value={qrSize}
              onChange={e => setQrSize(parseInt(e.target.value, 10))}
              style={{ accentColor: 'var(--primary)' }}
            />
          </div>

          {/* Botão Baixar PNG */}
          <button className="btn btn-primary btn-xl btn-block" onClick={handleDownload}>
            <Download size={22} />
            <span>BAIXAR QR CODE (PNG)</span>
          </button>
        </div>

        {/* COLUNA 2: PREVIEW DA PLACA DE BALCÃO */}
        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
            background: 'var(--bg-surface-subtle)',
            textAlign: 'center'
          }}
        >
          {/* Card / Display de Balcão Decorativo */}
          <div
            style={{
              background: '#FFFFFF',
              color: '#2D2426',
              padding: '28px 24px',
              borderRadius: 20,
              boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
              maxWidth: 320,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              border: '1px solid #EFE6E1'
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: '#FCEEF0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10
              }}
            >
              <Sparkles size={22} color="#C46D75" />
            </div>

            <div
              style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#C46D75',
                marginBottom: 2
              }}
            >
              {settings.companyName || 'Brisa Leve'}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#7A6C6F', marginBottom: 16 }}>
              Aponte a câmera e veja nosso catálogo online
            </div>

            {/* CANVAS RENDERIZADO */}
            <div
              style={{
                padding: 10,
                background: bgColor,
                borderRadius: 14,
                border: '1px solid #EFE6E1',
                boxShadow: '0 4px 10px rgba(0,0,0,0.04)'
              }}
            >
              <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%', height: 'auto' }} />
            </div>

            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#C46D75', marginTop: 14 }}>
              {settings.instagram || '@brisaleve.oficial'}
            </div>
          </div>

          <div style={{ marginTop: 20, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Pré-visualização do display de balcão para impressão
          </div>
        </div>
      </div>
    </div>
  );
};
