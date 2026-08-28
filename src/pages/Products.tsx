import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Modal } from '../components/common/Modal';
import { Product } from '../types';
import { supabaseService } from '../services/supabaseService';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Upload,
  Loader2,
  Camera
} from 'lucide-react';

const PRESET_IMAGES = [
  { label: 'Vestido Rosa', url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80' },
  { label: 'Bolsa Couro', url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80' },
  { label: 'Batom Rosé', url: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&auto=format&fit=crop&q=80' },
  { label: 'Brinco Pérola', url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&auto=format&fit=crop&q=80' },
  { label: 'Vela Aromática', url: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&auto=format&fit=crop&q=80' },
  { label: 'Blusa Nude', url: 'https://images.unsplash.com/photo-1551803091-e20673f15770?w=600&auto=format&fit=crop&q=80' },
  { label: 'Cosmético Iluminador', url: 'https://images.unsplash.com/photo-1608248597359-3382f1f0a204?w=600&auto=format&fit=crop&q=80' },
  { label: 'Lenço Seda', url: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&auto=format&fit=crop&q=80' }
];

export const Products: React.FC = () => {
  const { products, categories, addProduct, updateProduct, deleteProduct, settings, addToast } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('cat_all');

  // Modal de Adicionar/Editar
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(categories[1]?.id || 'cat_1');
  const [price, setPrice] = useState('');
  const [promoPrice, setPromoPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [sku, setSku] = useState('');
  const [image, setImage] = useState(PRESET_IMAGES[0].url);
  const [active, setActive] = useState(true);
  const [showInCatalog, setShowInCatalog] = useState(true);

  // Modal de Exclusão
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCat === 'cat_all' || p.categoryId === selectedCat;
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [products, selectedCat, search]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setCategoryId(categories[1]?.id || 'cat_1');
    setPrice('');
    setPromoPrice('');
    setStock('10');
    setSku('');
    setImage(PRESET_IMAGES[0].url);
    setActive(true);
    setShowInCatalog(true);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setDescription(p.description || '');
    setCategoryId(p.categoryId);
    setPrice(p.price.toString());
    setPromoPrice(p.promoPrice ? p.promoPrice.toString() : '');
    setStock(p.stock.toString());
    setSku(p.sku || '');
    setImage(p.image);
    setActive(p.active);
    setShowInCatalog(p.showInCatalog);
    setIsFormModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const numPrice = parseFloat(price.replace(',', '.')) || 0;
    const numPromo = promoPrice ? parseFloat(promoPrice.replace(',', '.')) : undefined;
    const numStock = parseInt(stock, 10) || 0;

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name,
        description,
        categoryId,
        price: numPrice,
        promoPrice: numPromo,
        stock: numStock,
        sku: sku || undefined,
        image,
        active,
        showInCatalog
      });
    } else {
      addProduct({
        name,
        description,
        categoryId,
        price: numPrice,
        promoPrice: numPromo,
        stock: numStock,
        sku: sku || undefined,
        image: image || PRESET_IMAGES[0].url,
        active,
        showInCatalog
      });
    }

    setIsFormModalOpen(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Valida se é imagem
    if (!file.type.startsWith('image/')) {
      addToast('error', 'Formato inválido', 'Por favor, selecione um arquivo de imagem (PNG, JPG, WEBP).');
      return;
    }

    // Valida tamanho max (5MB)
    if (file.size > 5 * 1024 * 1024) {
      addToast('warning', 'Arquivo muito grande', 'A imagem deve ter no máximo 5MB.');
      return;
    }

    setIsUploading(true);
    addToast('info', 'Enviando imagem...', 'Fazendo upload para o Supabase Storage.');

    const res = await supabaseService.uploadImage(file, 'products');

    setIsUploading(false);

    if (res.url) {
      setImage(res.url);
      addToast('success', 'Upload concluído!', 'Foto salva no Supabase Storage com sucesso.');
    } else {
      addToast('error', 'Erro no upload', res.error || 'Não foi possível enviar a imagem.');
    }
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      deleteProduct(productToDelete.id);
      setProductToDelete(null);
    }
  };

  const formatMoney = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getCategoryName = (id: string) => {
    const found = categories.find(c => c.id === id);
    return found ? found.name : 'Geral';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Barra de Ações Superior */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16
        }}
      >
        <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 280 }}>
          <div className="search-input-wrap" style={{ flex: 1 }}>
            <Search size={18} />
            <input
              type="text"
              className="form-input"
              placeholder="Buscar produtos por nome ou SKU..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            value={selectedCat}
            onChange={e => setSelectedCat(e.target.value)}
            style={{ width: 180 }}
          >
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <button className="btn btn-primary btn-lg" onClick={handleOpenAdd}>
          <Plus size={20} />
          <span>Cadastrar Produto</span>
        </button>
      </div>

      {/* Tabela de Produtos */}
      <div className="custom-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Foto & Nome</th>
              <th>Categoria</th>
              <th>Preço</th>
              <th>Estoque</th>
              <th>Status</th>
              <th>Catálogo</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(p => {
              const isLowStock = p.stock <= (settings.lowStockThreshold || 3);
              const isOutOfStock = p.stock <= 0;

              return (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <img
                        src={p.image}
                        alt={p.name}
                        style={{
                          width: 48,
                          height: 48,
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
                    <span className="badge badge-soft">{getCategoryName(p.categoryId)}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{formatMoney(p.price)}</div>
                    {p.promoPrice && p.promoPrice > 0 && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>
                        Promo: {formatMoney(p.promoPrice)}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isOutOfStock ? (
                        <span className="badge badge-danger">Sem estoque (0)</span>
                      ) : isLowStock ? (
                        <span className="badge badge-warning">Baixo ({p.stock})</span>
                      ) : (
                        <span className="badge badge-success">{p.stock} un.</span>
                      )}
                    </div>
                  </td>
                  <td>
                    {p.active ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--success-text)', fontSize: '0.85rem' }}>
                        <CheckCircle2 size={16} /> Ativo
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-light)', fontSize: '0.85rem' }}>
                        <XCircle size={16} /> Inativo
                      </span>
                    )}
                  </td>
                  <td>
                    {p.showInCatalog ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)', fontSize: '0.85rem' }}>
                        <Eye size={16} /> Visível
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-light)', fontSize: '0.85rem' }}>
                        <EyeOff size={16} /> Oculto
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 8 }}>
                      <button
                        className="btn-icon"
                        onClick={() => handleOpenEdit(p)}
                        title="Editar produto"
                        style={{ width: 36, height: 36 }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => setProductToDelete(p)}
                        title="Excluir produto"
                        style={{ width: 36, height: 36, color: 'var(--danger-text)' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  Nenhum produto cadastrado ou encontrado no filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DE CADASTRO / EDIÇÃO */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
        size="lg"
      >
        <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Nome do Produto *</label>
              <input
                type="text"
                className="form-input"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Vestido Midi Floral Rosé"
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Descrição Breve</label>
              <textarea
                className="form-textarea"
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Detalhes sobre tecido, medidas ou benefícios..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Categoria *</label>
              <select
                className="form-select"
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
              >
                {categories
                  .filter(c => c.id !== 'cat_all')
                  .map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Código / SKU (Opcional)</label>
              <input
                type="text"
                className="form-input"
                value={sku}
                onChange={e => setSku(e.target.value)}
                placeholder="Ex: VEST-01"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Preço Normal (R$) *</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                required
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Preço Promocional (Opcional)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={promoPrice}
                onChange={e => setPromoPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Quantidade Inicial em Estoque *</label>
              <input
                type="number"
                className="form-input"
                required
                value={stock}
                onChange={e => setStock(e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Foto do Produto</label>
              
              {/* Card de Upload e Preview */}
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
                {/* Preview da Foto */}
                <div
                  style={{
                    width: 72,
                    height: 72,
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
                  {image ? (
                    <img
                      src={image}
                      alt="Prévia"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={() => {}}
                    />
                  ) : (
                    <ImageIcon size={28} color="var(--text-light)" />
                  )}
                </div>

                {/* Botões de Ação de Upload */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/webp, image/gif"
                    style={{ display: 'none' }}
                  />

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      style={{ padding: '8px 16px', fontSize: '0.88rem' }}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Enviando para o Supabase...</span>
                        </>
                      ) : (
                        <>
                          <Camera size={16} />
                          <span>Carregar do Computador / Celular</span>
                        </>
                      )}
                    </button>
                  </div>

                  <input
                    type="url"
                    className="form-input"
                    value={image}
                    onChange={e => setImage(e.target.value)}
                    placeholder="Ou cole a URL direta da imagem..."
                    style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seletor de Fotos Rápidas (Presets) */}
          <div>
            <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>
              Ou selecione uma foto de exemplo:
            </label>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}>
              {PRESET_IMAGES.map((preset, idx) => (
                <img
                  key={idx}
                  src={preset.url}
                  alt={preset.label}
                  title={preset.label}
                  onClick={() => setImage(preset.url)}
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 'var(--radius-sm)',
                    objectFit: 'cover',
                    cursor: 'pointer',
                    border: image === preset.url ? '3px solid var(--primary)' : '1px solid var(--border-color)'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Opções de Ativo e Catálogo */}
          <div style={{ display: 'flex', gap: 24, padding: '12px 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={active}
                onChange={e => setActive(e.target.checked)}
                style={{ accentColor: 'var(--primary)', width: 18, height: 18 }}
              />
              <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>Produto Ativo</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showInCatalog}
                onChange={e => setShowInCatalog(e.target.checked)}
                style={{ accentColor: 'var(--primary)', width: 18, height: 18 }}
              />
              <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>Mostrar no Catálogo Online</span>
            </label>
          </div>

          {/* Botões do Modal */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsFormModalOpen(false)}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <Modal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        title="Confirmar Exclusão"
      >
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <p style={{ fontSize: '1.05rem', marginBottom: 20 }}>
            Tem certeza que deseja excluir o produto{' '}
            <strong>"{productToDelete?.name}"</strong>?
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14 }}>
            <button className="btn btn-secondary" onClick={() => setProductToDelete(null)}>
              Cancelar
            </button>
            <button className="btn btn-danger" onClick={handleConfirmDelete}>
              Excluir Produto
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
