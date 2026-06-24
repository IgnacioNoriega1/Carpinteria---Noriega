'use client';

import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X,
  Boxes,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Settings,
  History,
  TrendingUp,
  Tag
} from 'lucide-react';
import { createInventoryItem, updateInventoryItem, recordStockTransaction, deleteInventoryItem } from './actions';

interface InventoryItem {
  id: string;
  name: string;
  materialCategoryId: string;
  materialCategory: { name: string };
  unit: string;
  currentStock: number;
  minStock: number;
  unitCost: number;
  supplierId: string | null;
  supplier: { name: string } | null;
  transactions: any[];
}

interface InventoryListProps {
  initialInventory: any[];
  categories: any[];
  suppliers: any[];
}

export default function InventoryList({
  initialInventory,
  categories,
  suppliers
}: InventoryListProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal states
  const [showItemModal, setShowItemModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Form Item States
  const [name, setName] = useState('');
  const [materialCategoryId, setMaterialCategoryId] = useState('');
  const [unit, setUnit] = useState('placa');
  const [currentStock, setCurrentStock] = useState(0);
  const [minStock, setMinStock] = useState(0);
  const [unitCost, setUnitCost] = useState(0);
  const [supplierId, setSupplierId] = useState('');

  // Form Transaction States
  const [txType, setTxType] = useState<'entrada' | 'salida' | 'ajuste'>('entrada');
  const [txQuantity, setTxQuantity] = useState(0);
  const [txNotes, setTxNotes] = useState('');
  const [txSupplierId, setTxSupplierId] = useState('');

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Format currency
  const formatARS = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(val);
  };

  // Filter items
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.supplier && item.supplier.name.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchCategory = !categoryFilter || item.materialCategoryId === categoryFilter;
      
      return matchSearch && matchCategory;
    });
  }, [inventory, searchQuery, categoryFilter]);

  // Alert Items Count (low stock)
  const lowStockItems = useMemo(() => {
    return inventory.filter(item => item.currentStock <= item.minStock);
  }, [inventory]);

  // Open modal for Create Item
  const handleOpenCreateItem = () => {
    setEditingItem(null);
    setName('');
    setMaterialCategoryId(categories[0]?.id || '');
    setUnit('placa');
    setCurrentStock(0);
    setMinStock(2);
    setUnitCost(0);
    setSupplierId('');
    setFormError('');
    setShowItemModal(true);
  };

  // Open modal for Edit Item
  const handleOpenEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setName(item.name);
    setMaterialCategoryId(item.materialCategoryId);
    setUnit(item.unit);
    setMinStock(item.minStock);
    setUnitCost(item.unitCost);
    setSupplierId(item.supplierId || '');
    setFormError('');
    setShowItemModal(true);
  };

  // Open modal for Stock Transaction
  const handleOpenTx = (item: InventoryItem) => {
    setSelectedItem(item);
    setTxType('entrada');
    setTxQuantity(0);
    setTxNotes('');
    setTxSupplierId(item.supplierId || '');
    setFormError('');
    setShowTxModal(true);
  };

  // Open modal for history logs
  const handleOpenHistory = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowHistoryModal(true);
  };

  // Form Submit Item (Create/Update)
  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    const itemData = {
      name,
      materialCategoryId,
      unit,
      minStock: Number(minStock),
      unitCost: Number(unitCost),
      supplierId: supplierId || null
    };

    if (editingItem) {
      const res = await updateInventoryItem(editingItem.id, itemData);
      if (res.success && res.item) {
        const cat = categories.find(c => c.id === materialCategoryId);
        const sup = suppliers.find(s => s.id === supplierId);
        
        const updated: InventoryItem = {
          ...editingItem,
          ...res.item,
          materialCategory: cat ? { name: cat.name } : { name: '' },
          supplier: sup ? { name: sup.name } : null
        };
        setInventory(prev => prev.map(i => i.id === editingItem.id ? updated : i));
        setShowItemModal(false);
      } else {
        setFormError(res.error || 'Error al actualizar material');
      }
    } else {
      const res = await createInventoryItem({
        ...itemData,
        currentStock: Number(currentStock)
      });
      if (res.success && res.item) {
        const cat = categories.find(c => c.id === materialCategoryId);
        const sup = suppliers.find(s => s.id === supplierId);
        
        // Carga inicial crea transacción
        const initialTx = res.item.currentStock > 0 ? [{
          date: new Date(),
          type: 'entrada',
          quantity: res.item.currentStock,
          notes: 'Carga inicial de stock',
          supplier: sup ? { name: sup.name } : null
        }] : [];

        const created: InventoryItem = {
          ...res.item,
          materialCategory: cat ? { name: cat.name } : { name: '' },
          supplier: sup ? { name: sup.name } : null,
          transactions: initialTx
        };
        
        setInventory(prev => [created, ...prev]);
        setShowItemModal(false);
      } else {
        setFormError(res.error || 'Error al guardar material');
      }
    }
    setFormLoading(false);
  };

  // Form Submit Transaction (stock adjust)
  const handleTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    if (!selectedItem) return;

    const res = await recordStockTransaction({
      inventoryId: selectedItem.id,
      type: txType,
      quantity: Number(txQuantity),
      notes: txNotes || null,
      supplierId: txSupplierId || null
    });

    if (res.success && 'item' in res && res.item) {
      // Registrar transacción en el log local
      const sup = suppliers.find(s => s.id === txSupplierId);
      const newTxRecord = {
        id: Math.random().toString(),
        date: new Date(),
        type: txType,
        quantity: txType === 'ajuste' ? Number(txQuantity) - selectedItem.currentStock : (txType === 'entrada' ? Number(txQuantity) : -Number(txQuantity)),
        notes: txNotes || (txType === 'ajuste' ? 'Ajuste manual de inventario' : ''),
        supplier: sup ? { name: sup.name } : null
      };

      setInventory(prev => prev.map(i => {
        if (i.id === selectedItem.id) {
          return {
            ...i,
            currentStock: res.item!.currentStock,
            transactions: [newTxRecord, ...i.transactions].slice(0, 10)
          };
        }
        return i;
      }));
      setShowTxModal(false);
    } else {
      setFormError(('error' in res ? res.error : null) || 'Error al registrar movimiento');
    }
    setFormLoading(false);
  };

  // Delete Item
  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este material del stock?')) return;
    const res = await deleteInventoryItem(id);
    if (res.success) {
      setInventory(prev => prev.filter(i => i.id !== id));
    } else {
      alert(res.error || 'Error al eliminar material');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Stock summaries */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        
        {/* Total Items */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)' }}>
            <Boxes size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>Catálogo de Materiales</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{inventory.length} items registrados</span>
          </div>
        </div>

        {/* Low Stock Warning */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '15px', border: lowStockItems.length > 0 ? '1px solid var(--warning-color)' : '1px solid var(--border-color)', backgroundColor: lowStockItems.length > 0 ? 'var(--warning-light)' : 'var(--surface-color)' }}>
          <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: '#ffffff', color: 'var(--warning-color)' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: lowStockItems.length > 0 ? 'var(--warning-color)' : 'var(--text-secondary)', fontWeight: 600, display: 'block' }}>
              {lowStockItems.length > 0 ? 'Faltantes de Stock / Crítico' : 'Stock en Niveles Seguros'}
            </span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: lowStockItems.length > 0 ? 'var(--warning-color)' : 'var(--text-primary)' }}>
              {lowStockItems.length} items por debajo del mínimo
            </span>
          </div>
        </div>

      </div>

      {/* Filter and Action Bar */}
      <div style={{ display: 'flex', gap: '15px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '10px', flexGrow: 1, maxWidth: '600px' }}>
          <div style={{ position: 'relative', flexGrow: 1 }}>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar material o proveedor..."
              style={{ paddingLeft: '40px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-muted)' }} />
          </div>
          
          <select
            className="form-control"
            style={{ maxWidth: '200px' }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">-- Categorías --</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreateItem}>
          <Plus size={18} />
          <span>Agregar Material</span>
        </button>
      </div>

      {/* Inventory Table */}
      {filteredInventory.length === 0 ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <Boxes size={48} style={{ color: 'var(--text-muted)', marginBottom: '15px', display: 'inline-block' }} />
          <p style={{ color: 'var(--text-muted)' }}>No se encontraron materiales en stock.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Material</th>
                <th>Categoría</th>
                <th>Unidad</th>
                <th>Stock Actual</th>
                <th>Stock Mínimo</th>
                <th>Costo Unitario</th>
                <th>Proveedor Principal</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => {
                const isLow = item.currentStock <= item.minStock;
                return (
                  <tr key={item.id} style={{ backgroundColor: isLow ? 'rgba(245, 158, 11, 0.03)' : 'transparent' }}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.name}</div>
                    </td>
                    <td>
                      <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>
                        {item.materialCategory.name}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace' }}>{item.unit}</td>
                    <td>
                      <span style={{ 
                        fontWeight: 700, 
                        color: isLow ? 'var(--warning-color)' : 'var(--success-color)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        {item.currentStock} {isLow && <span title="Stock bajo el mínimo"><AlertTriangle size={14} /></span>}
                      </span>
                    </td>
                    <td>{item.minStock}</td>
                    <td style={{ fontWeight: 500 }}>{formatARS(item.unitCost)}</td>
                    <td>{item.supplier?.name || '-'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button className="btn btn-secondary btn-sm" title="Registrar Movimiento" style={{ padding: '6px' }} onClick={() => handleOpenTx(item)}>
                          <TrendingUp size={15} style={{ color: 'var(--success-color)' }} />
                        </button>
                        <button className="btn btn-secondary btn-sm" title="Historial Logs" style={{ padding: '6px' }} onClick={() => handleOpenHistory(item)}>
                          <History size={15} style={{ color: 'var(--text-secondary)' }} />
                        </button>
                        <button className="btn btn-secondary btn-sm" title="Editar" style={{ padding: '6px' }} onClick={() => handleOpenEditItem(item)}>
                          <Edit2 size={15} style={{ color: 'var(--primary-color)' }} />
                        </button>
                        <button className="btn btn-secondary btn-sm" title="Eliminar" style={{ padding: '6px' }} onClick={() => handleDelete(item.id)}>
                          <Trash2 size={15} style={{ color: 'var(--error-color)' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Item Create/Edit Modal */}
      {showItemModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingItem ? 'Editar Material' : 'Nuevo Material en Stock'}</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }} onClick={() => setShowItemModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleItemSubmit}>
              <div className="modal-body">
                {formError && (
                  <div style={{ backgroundColor: 'var(--error-light)', color: 'var(--error-color)', padding: '10px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '15px' }}>
                    {formError}
                  </div>
                )}
                
                <div className="form-group">
                  <label>Nombre del Material *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="ej: Placa Melamina Cedro 18mm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Categoría *</label>
                    <select
                      className="form-control"
                      value={materialCategoryId}
                      onChange={(e) => setMaterialCategoryId(e.target.value)}
                      required
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Unidad de Medida *</label>
                    <select
                      className="form-control"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      required
                    >
                      <option value="placa">Placa</option>
                      <option value="u">Unidad (u)</option>
                      <option value="m">Metro lineal (m)</option>
                      <option value="m2">Metro cuadrado (m2)</option>
                      <option value="l">Litros (l)</option>
                    </select>
                  </div>
                </div>

                {!editingItem && (
                  <div className="form-group">
                    <label>Stock Inicial *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={currentStock}
                      onChange={(e) => setCurrentStock(Number(e.target.value))}
                      min="0"
                      required
                    />
                  </div>
                )}

                <div className="form-grid">
                  <div className="form-group">
                    <label>Stock Mínimo (Alerta) *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={minStock}
                      onChange={(e) => setMinStock(Number(e.target.value))}
                      min="0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Costo Unitario Promedio (ARS) *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={unitCost}
                      onChange={(e) => setUnitCost(Number(e.target.value))}
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Proveedor Recomendado</label>
                  <select
                    className="form-control"
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                  >
                    <option value="">-- Seleccionar Proveedor --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowItemModal(false)} disabled={formLoading}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Guardando...' : 'Guardar Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Transaction Modal (entrada/salida/ajuste) */}
      {showTxModal && selectedItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Registrar Movimiento: {selectedItem.name}</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }} onClick={() => setShowTxModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleTxSubmit}>
              <div className="modal-body">
                {formError && (
                  <div style={{ backgroundColor: 'var(--error-light)', color: 'var(--error-color)', padding: '10px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '15px' }}>
                    {formError}
                  </div>
                )}
                
                <div className="form-group">
                  <label>Tipo de Movimiento</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', flexGrow: 1, justifyContent: 'center', backgroundColor: txType === 'entrada' ? 'var(--success-light)' : 'transparent' }}>
                      <input type="radio" name="txType" checked={txType === 'entrada'} onChange={() => setTxType('entrada')} />
                      <span style={{ color: txType === 'entrada' ? 'var(--success-color)' : 'inherit', fontWeight: 600 }}>Entrada (Compra)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', flexGrow: 1, justifyContent: 'center', backgroundColor: txType === 'salida' ? 'var(--error-light)' : 'transparent' }}>
                      <input type="radio" name="txType" checked={txType === 'salida'} onChange={() => setTxType('salida')} />
                      <span style={{ color: txType === 'salida' ? 'var(--error-color)' : 'inherit', fontWeight: 600 }}>Salida (Merma)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', flexGrow: 1, justifyContent: 'center', backgroundColor: txType === 'ajuste' ? 'var(--primary-light)' : 'transparent' }}>
                      <input type="radio" name="txType" checked={txType === 'ajuste'} onChange={() => setTxType('ajuste')} />
                      <span style={{ color: txType === 'ajuste' ? 'var(--primary-color)' : 'inherit', fontWeight: 600 }}>Ajuste de Recuento</span>
                    </label>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>
                      {txType === 'ajuste' ? 'Stock Físico Actual (Absoluto) *' : 'Cantidad a transferir *'}
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      value={txQuantity}
                      onChange={(e) => setTxQuantity(Number(e.target.value))}
                      min="0.01"
                      step="0.01"
                      required
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      Stock actual en taller: {selectedItem.currentStock} {selectedItem.unit}
                    </span>
                  </div>
                  
                  {txType === 'entrada' && (
                    <div className="form-group">
                      <label>Proveedor</label>
                      <select
                        className="form-control"
                        value={txSupplierId}
                        onChange={(e) => setTxSupplierId(e.target.value)}
                      >
                        <option value="">-- Proveedor Suministrante --</option>
                        {suppliers.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Observaciones / Motivo</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="ej: Compra factura Nro 4252, Merma por descarte, etc."
                    value={txNotes}
                    onChange={(e) => setTxNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTxModal(false)} disabled={formLoading}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Procesando...' : 'Aplicar Movimiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Log Modal */}
      {showHistoryModal && selectedItem && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h3>Historial de Movimientos: {selectedItem.name}</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }} onClick={() => setShowHistoryModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: 0 }}>
              {selectedItem.transactions.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', padding: '40px', textAlign: 'center' }}>No hay registros de movimientos recientes.</p>
              ) : (
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--surface-hover)' }}>
                      <th style={{ padding: '12px 20px', fontSize: '0.8rem' }}>Fecha</th>
                      <th style={{ padding: '12px 20px', fontSize: '0.8rem' }}>Tipo</th>
                      <th style={{ padding: '12px 20px', fontSize: '0.8rem' }}>Cantidad</th>
                      <th style={{ padding: '12px 20px', fontSize: '0.8rem' }}>Proveedor</th>
                      <th style={{ padding: '12px 20px', fontSize: '0.8rem' }}>Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItem.transactions.map((tx: any, idx: number) => (
                      <tr key={tx.id || idx}>
                        <td style={{ padding: '12px 20px', fontSize: '0.85rem' }}>
                          {new Date(tx.date).toLocaleDateString('es-AR')}
                        </td>
                        <td style={{ padding: '12px 20px' }}>
                          <span className={`badge ${
                            tx.type === 'entrada' ? 'badge-success' : 
                            tx.type === 'salida' ? 'badge-danger' : 'badge-primary'
                          }`} style={{ fontSize: '0.65rem' }}>
                            {tx.type}
                          </span>
                        </td>
                        <td style={{ padding: '12px 20px', fontWeight: 600, fontSize: '0.85rem', color: tx.quantity > 0 ? 'var(--success-color)' : 'var(--error-color)' }}>
                          {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                        </td>
                        <td style={{ padding: '12px 20px', fontSize: '0.85rem' }}>
                          {tx.supplier?.name || '-'}
                        </td>
                        <td style={{ padding: '12px 20px', fontSize: '0.8rem', fontStyle: 'italic' }}>
                          {tx.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowHistoryModal(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
