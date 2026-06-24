'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X,
  Calendar,
  DollarSign,
  TrendingDown,
  Building,
  Wrench,
  Receipt
} from 'lucide-react';
import { createOverheadExpense, updateOverheadExpense, deleteOverheadExpense } from './actions';

interface Expense {
  id: string;
  date: Date;
  expenseCategoryId: string;
  expenseCategory: { name: string };
  description: string;
  amount: number;
  paymentMethodId: string;
  paymentMethod: { name: string };
  projectId: string | null;
  project: { projectNumber: string } | null;
  supplierId: string | null;
  supplier: { name: string } | null;
}

interface ExpenseListProps {
  initialExpenses: any[];
  categories: any[];
  paymentMethods: any[];
  projects: any[];
  suppliers: any[];
}

export default function ExpenseList({
  initialExpenses,
  categories,
  paymentMethods,
  projects,
  suppliers
}: ExpenseListProps) {
  const [expenses, setExpenses] = useState<Expense[]>(
    initialExpenses.map(e => ({ ...e, date: new Date(e.date) }))
  );
  
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form states
  const [dateInput, setDateInput] = useState('');
  const [expenseCategoryId, setExpenseCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [supplierId, setSupplierId] = useState('');

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

  // Filters logic
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchSearch = e.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (e.supplier && e.supplier.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.project && e.project.projectNumber.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchCategory = !categoryFilter || e.expenseCategoryId === categoryFilter;
      
      return matchSearch && matchCategory;
    });
  }, [expenses, searchQuery, categoryFilter]);

  // Summaries
  const totals = useMemo(() => {
    const total = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
    const thisMonth = new Date().getMonth();
    const thisMonthTotal = expenses
      .filter(e => e.date.getMonth() === thisMonth && e.date.getFullYear() === new Date().getFullYear())
      .reduce((acc, e) => acc + e.amount, 0);
    return { total, thisMonthTotal };
  }, [filteredExpenses, expenses]);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingExpense(null);
    setDateInput(new Date().toISOString().substring(0, 10));
    setExpenseCategoryId(categories[0]?.id || '');
    setDescription('');
    setAmount(0);
    setPaymentMethodId(paymentMethods[0]?.id || '');
    setProjectId('');
    setSupplierId('');
    setFormError('');
    setShowModal(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setDateInput(exp.date.toISOString().substring(0, 10));
    setExpenseCategoryId(exp.expenseCategoryId);
    setDescription(exp.description);
    setAmount(exp.amount);
    setPaymentMethodId(exp.paymentMethodId);
    setProjectId(exp.projectId || '');
    setSupplierId(exp.supplierId || '');
    setFormError('');
    setShowModal(true);
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    const expenseData = {
      date: new Date(dateInput),
      expenseCategoryId,
      description,
      amount: Number(amount),
      paymentMethodId,
      projectId: projectId || null,
      supplierId: supplierId || null
    };

    if (editingExpense) {
      const res = await updateOverheadExpense(editingExpense.id, expenseData);
      if (res.success && res.expense) {
        // Encontrar objetos de relación para actualizar en el listado local
        const cat = categories.find(c => c.id === expenseCategoryId);
        const pm = paymentMethods.find(p => p.id === paymentMethodId);
        const proj = projects.find(p => p.id === projectId);
        const sup = suppliers.find(s => s.id === supplierId);
        
        const updated: Expense = {
          ...res.expense,
          date: new Date(res.expense.date),
          expenseCategory: cat ? { name: cat.name } : { name: '' },
          paymentMethod: pm ? { name: pm.name } : { name: '' },
          project: proj ? { projectNumber: proj.projectNumber } : null,
          supplier: sup ? { name: sup.name } : null
        };
        
        setExpenses(prev => prev.map(e => e.id === editingExpense.id ? updated : e));
        setShowModal(false);
      } else {
        setFormError(res.error || 'Error al actualizar gasto');
      }
    } else {
      const res = await createOverheadExpense(expenseData);
      if (res.success && res.expense) {
        const cat = categories.find(c => c.id === expenseCategoryId);
        const pm = paymentMethods.find(p => p.id === paymentMethodId);
        const proj = projects.find(p => p.id === projectId);
        const sup = suppliers.find(s => s.id === supplierId);
        
        const created: Expense = {
          ...res.expense,
          date: new Date(res.expense.date),
          expenseCategory: cat ? { name: cat.name } : { name: '' },
          paymentMethod: pm ? { name: pm.name } : { name: '' },
          project: proj ? { projectNumber: proj.projectNumber } : null,
          supplier: sup ? { name: sup.name } : null
        };
        
        setExpenses(prev => [created, ...prev]);
        setShowModal(false);
      } else {
        setFormError(res.error || 'Error al registrar gasto');
      }
    }
    setFormLoading(false);
  };

  // Delete Gasto
  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este gasto?')) return;
    const res = await deleteOverheadExpense(id);
    if (res.success) {
      setExpenses(prev => prev.filter(e => e.id !== id));
    } else {
      alert(res.error || 'Error al eliminar gasto');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Overview stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--error-light)', color: 'var(--error-color)' }}>
            <TrendingDown size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>Gastos Generales del Mes</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--error-color)' }}>{formatARS(totals.thisMonthTotal)}</span>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)' }}>
            <Receipt size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>Gastos Filtrados</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatARS(totals.total)}</span>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '15px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '10px', flexGrow: 1, maxWidth: '600px' }}>
          <div style={{ position: 'relative', flexGrow: 1 }}>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por descripción, proveedor, proyecto..."
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
            <option value="">-- Todas las Categorías --</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={18} />
          <span>Registrar Gasto</span>
        </button>
      </div>

      {/* Expenses Table */}
      {filteredExpenses.length === 0 ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <Receipt size={48} style={{ color: 'var(--text-muted)', marginBottom: '15px', display: 'inline-block' }} />
          <p style={{ color: 'var(--text-muted)' }}>No se encontraron gastos generales con los filtros aplicados.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Categoría</th>
                <th>Descripción</th>
                <th>Importe</th>
                <th>Medio de Pago</th>
                <th>Proyecto</th>
                <th>Proveedor</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((exp) => (
                <tr key={exp.id}>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                      <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                      {exp.date.toLocaleDateString('es-AR')}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>
                      {exp.expenseCategory.name}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{exp.description}</td>
                  <td style={{ fontWeight: 600, color: 'var(--error-color)' }}>{formatARS(exp.amount)}</td>
                  <td>{exp.paymentMethod.name}</td>
                  <td>
                    {exp.projectId ? (
                      <Link href={`/proyectos/${exp.projectId}`} style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
                        {exp.project?.projectNumber}
                      </Link>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Indirecto</span>
                    )}
                  </td>
                  <td>{exp.supplier?.name || '-'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button className="btn btn-secondary btn-sm" title="Editar" style={{ padding: '6px' }} onClick={() => handleOpenEdit(exp)}>
                        <Edit2 size={15} style={{ color: 'var(--primary-color)' }} />
                      </button>
                      <button className="btn btn-secondary btn-sm" title="Eliminar" style={{ padding: '6px' }} onClick={() => handleDelete(exp.id)}>
                        <Trash2 size={15} style={{ color: 'var(--error-color)' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingExpense ? 'Editar Gasto General' : 'Registrar Gasto General'}</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }} onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && (
                  <div style={{ backgroundColor: 'var(--error-light)', color: 'var(--error-color)', padding: '10px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '15px' }}>
                    {formError}
                  </div>
                )}
                
                <div className="form-grid">
                  <div className="form-group">
                    <label>Fecha *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={dateInput}
                      onChange={(e) => setDateInput(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Categoría *</label>
                    <select
                      className="form-control"
                      value={expenseCategoryId}
                      onChange={(e) => setExpenseCategoryId(e.target.value)}
                      required
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Descripción *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="ej: Factura EDESA Junio taller"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Monto (ARS) *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      min="0.01"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Medio de Pago *</label>
                    <select
                      className="form-control"
                      value={paymentMethodId}
                      onChange={(e) => setPaymentMethodId(e.target.value)}
                      required
                    >
                      {paymentMethods.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Proyecto Asociado (Opcional)</label>
                    <select
                      className="form-control"
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                    >
                      <option value="">Ninguno (Gasto Indirecto)</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.projectNumber} - {p.description.substring(0, 30)}...</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Proveedor (Opcional)</label>
                    <select
                      className="form-control"
                      value={supplierId}
                      onChange={(e) => setSupplierId(e.target.value)}
                    >
                      <option value="">Ninguno / Particular</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={formLoading}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Guardando...' : 'Guardar Gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
