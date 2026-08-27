import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Product } from '../types';
import { Modal } from '../components/common/Modal';
import {
  Search,
  Sparkles,
  MessageCircle,
  Sun,
  Moon,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Share2
} from 'lucide-react';

interface CatalogProps {
  isStandalone?: boolean;
  onBackToAdmin?: () => void;
}

export const Catalog: React.FC<CatalogProps> = ({
  isStandalone = false,
  onBackToAdmin
}) => {
  const { products, categories, settings } = useApp();
  const { theme, toggleTheme } = useTheme();

  const [selectedCat, setSelectedCat] = useState('cat_all');
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Filtragem: apenas produtos com showInCatalog = true e active = true
  const catalogProducts = useMemo(() => {
    return products.filter(p => {
      if (!p.active || !p.showInCatalog) return false;
      const matchCat = selectedCat === 'cat_all' || p.categoryId === selectedCat;
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [products, selectedCat, search]);

  const formatMoney = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleOrderWhatsApp = (product: Product) => {
    const rawNumber = (settings.whatsapp || '5511987654321').replace(/\D/g, '');
    const priceText = product.promoPrice && product.promoPrice > 0 ? formatMoney(product.promoPrice) : formatMoney(product.price);
    const msg = `Olá! Vi o produto *${product.name}* (${priceText}) no catálogo online da Brisa Leve e gostaria de saber mais.`;
    const encodedMsg = encodeURIComponent(msg);
    const url = `https://wa.me/${rawNumber}?text=${encodedMsg}`;
    window.open(url, '_blank');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-page)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      {/* Container Mobile First */}
      <div
        style={{
          width: '100%',
          maxWidth: 640,
          margin: '0 auto',
          padding: '16px 16px 48px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20
        }}
      >
        {/* Header Superior com Voltar ao Admin ou Toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {onBackToAdmin ? (
            <button
              className="btn btn-secondary"
              onClick={onBackToAdmin}
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            >
              <ArrowLeft size={16} />
              <span>Painel Admin</span>
            </button>
          ) : (
            <div />
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn-icon"
              onClick={toggleTheme}
              title="Alternar Tema"
              style={{ width: 38, height: 38 }}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </div>

        {/* Banner e Identidade da Brisa Leve */}
        <div
          style={{
            textAlign: 'center',
            padding: '24px 16px',
            background: 'radial-gradient(circle at 50% 20%, var(--primary-light) 0%, var(--bg-surface) 100%)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              background: 'var(--primary-light)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12
            }}
          >
            <Sparkles size={28} color="var(--primary)" />
          </div>

          <h1
            style={{
              fontSize: '1.8rem',
              color: 'var(--primary)',
              marginBottom: 4,
              fontFamily: 'Playfair Display, serif'
            }}
          >
            {settings.companyName || 'Brisa Leve'}
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto 12px' }}>
            Moda feminina, autocuidado e acessórios selecionados com delicadeza e amor.
          </p>

          {settings.instagram && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 14px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-surface-subtle)',
                fontSize: '0.82rem',
                color: 'var(--primary)',
                fontWeight: 600
              }}
            >
              <span>{settings.instagram}</span>
            </div>
          )}
        </div>

        {/* Barra de Busca de Produtos */}
        <div className="search-input-wrap">
          <Search size={18} />
          <input
            type="text"
            className="form-input"
            placeholder="O que você está procurando hoje?"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ borderRadius: 'var(--radius-full)' }}
          />
        </div>

        {/* Pílulas de Categorias */}
        <div className="pos-category-pills" style={{ paddingBottom: 6 }}>
          {categories.map(c => (
            <button
              key={c.id}
              className={`category-pill ${selectedCat === c.id ? 'active' : ''}`}
              onClick={() => setSelectedCat(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Grade de Cards de Produtos (2 colunas em celular) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: 14
          }}
        >
          {catalogProducts.map(p => {
            const isOutOfStock = p.stock <= 0;
            const displayPrice = p.promoPrice && p.promoPrice > 0 ? p.promoPrice : p.price;

            return (
              <div
                key={p.id}
                className="pos-product-card"
                onClick={() => setSelectedProduct(p)}
                style={{
                  borderRadius: 'var(--radius-md)',
                  opacity: isOutOfStock ? 0.75 : 1
                }}
              >
                <div style={{ position: 'relative' }}>
                  <img
                    src={p.image}
                    alt={p.name}
                    style={{
                      width: '100%',
                      height: 160,
                      objectFit: 'cover'
                    }}
                  />
                  {isOutOfStock ? (
                    <span
                      className="badge badge-danger"
                      style={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                      }}
                    >
                      ESGOTADO
                    </span>
                  ) : p.promoPrice && p.promoPrice > 0 ? (
                    <span
                      className="badge badge-soft"
                      style={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        background: 'var(--primary)',
                        color: '#FFF',
                        fontWeight: 700
                      }}
                    >
                      OFERTA
                    </span>
                  ) : null}
                </div>

                <div className="pos-product-body" style={{ padding: '12px 10px' }}>
                  <div className="pos-product-title" style={{ fontSize: '0.88rem' }}>
                    {p.name}
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: 6 }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)' }}>
                      {formatMoney(displayPrice)}
                    </div>
                    {p.promoPrice && p.promoPrice > 0 && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          textDecoration: 'line-through',
                          color: 'var(--text-light)'
                        }}
                      >
                        {formatMoney(p.price)}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn btn-soft btn-block"
                    style={{ marginTop: 8, padding: '8px 10px', fontSize: '0.8rem' }}
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedProduct(p);
                    }}
                  >
                    VER PRODUTO
                  </button>
                </div>
              </div>
            );
          })}

          {catalogProducts.length === 0 && (
            <div
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: 40,
                color: 'var(--text-muted)'
              }}
            >
              Nenhum produto disponível no momento.
            </div>
          )}
        </div>

        {/* Rodapé Delicado do Catálogo */}
        <div style={{ textAlign: 'center', marginTop: 32, color: 'var(--text-light)', fontSize: '0.8rem' }}>
          <div>{settings.companyName || 'Brisa Leve'} — Todos os direitos reservados</div>
          <div style={{ marginTop: 4 }}>Atendimento pelo WhatsApp: {settings.phone || '(11) 98765-4321'}</div>
        </div>
      </div>

      {/* MODAL / PÁGINA DO PRODUTO NO CATÁLOGO */}
      <Modal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title="Detalhes do Produto"
      >
        {selectedProduct && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Foto do Produto */}
            <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                style={{
                  width: '100%',
                  maxHeight: 320,
                  objectFit: 'cover'
                }}
              />
              {selectedProduct.stock <= 0 && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span className="badge badge-danger" style={{ fontSize: '1rem', padding: '8px 18px' }}>
                    ESGOTADO
                  </span>
                </div>
              )}
            </div>

            {/* Informações */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <h2 style={{ fontSize: '1.35rem', lineHeight: 1.2 }}>{selectedProduct.name}</h2>
                {selectedProduct.stock > 0 ? (
                  <span className="badge badge-success">
                    <CheckCircle2 size={14} /> Disponível
                  </span>
                ) : (
                  <span className="badge badge-danger">
                    <AlertCircle size={14} /> Esgotado
                  </span>
                )}
              </div>

              {selectedProduct.description && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: 10, lineHeight: 1.5 }}>
                  {selectedProduct.description}
                </p>
              )}

              {/* Preços */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 14 }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {selectedProduct.promoPrice && selectedProduct.promoPrice > 0
                    ? formatMoney(selectedProduct.promoPrice)
                    : formatMoney(selectedProduct.price)}
                </span>
                {selectedProduct.promoPrice && selectedProduct.promoPrice > 0 && (
                  <span style={{ textDecoration: 'line-through', color: 'var(--text-light)', fontSize: '1rem' }}>
                    {formatMoney(selectedProduct.price)}
                  </span>
                )}
              </div>
            </div>

            {/* BOTÃO PEDIR PELO WHATSAPP */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              <button
                className="btn btn-primary btn-xl btn-block"
                onClick={() => handleOrderWhatsApp(selectedProduct)}
                style={{
                  background: '#25D366',
                  color: '#FFFFFF',
                  borderColor: '#25D366',
                  boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)'
                }}
              >
                <MessageCircle size={24} />
                <span>PEDIR PELO WHATSAPP</span>
              </button>

              <button
                className="btn btn-secondary btn-block"
                onClick={() => setSelectedProduct(null)}
              >
                Continuar Vendo Produtos
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
