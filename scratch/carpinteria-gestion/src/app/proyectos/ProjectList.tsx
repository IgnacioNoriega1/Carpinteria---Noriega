'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Eye, 
  X,
  FolderKanban,
  Calendar,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle,
  Activity,
  ArrowRight
} from 'lucide-react';
import { createProject } from './actions';

interface Project {
  id: string;
  projectNumber: string;
  description: string;
  priority: string;
  status: string;
  paymentStatus: string;
  agreedPrice: number;
  depositReceived: number;
  startDate: Date | null;
  estimatedDeliveryDate: Date | null;
  client: { name: string };
  furnitureType: { name: string };
  payments: any[];
}

interface ProjectListProps {
  initialProjects: any[];
  clients: any[];
  furnitureTypes: any[];
}

export default function ProjectList({
  initialProjects,
  clients,
  furnitureTypes
}: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>(
    initialProjects.map(p => ({
      ...p,
      startDate: p.startDate ? new Date(p.startDate) : null,
      estimatedDeliveryDate: p.estimatedDeliveryDate ? new Date(p.estimatedDeliveryDate) : null
    }))
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Form states
  const [clientId, setClientId] = useState('');
  const [furnitureTypeId, setFurnitureTypeId] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('media');
  const [agreedPrice, setAgreedPrice] = useState(0);
  const [depositReceived, setDepositReceived] = useState(0);
  const [startDateInput, setStartDateInput] = useState('');
  const [deliveryDateInput, setDeliveryDateInput] = useState('');

  // Estimations
  const [estimatedBudget, setEstimatedBudget] = useState(0);
  const [estimatedLaborCost, setEstimatedLaborCost] = useState(0);
  const [estimatedLaborDays, setEstimatedLaborDays] = useState(0);
  const [estimatedOtherExpenses, setEstimatedOtherExpenses] = useState(0);

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Currency format
  const formatARS = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(val);
  };

  // Filter projects
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchSearch = p.projectNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = !statusFilter || p.status === statusFilter;
      const matchPriority = !priorityFilter || p.priority === priorityFilter;

      return matchSearch && matchStatus && matchPriority;
    });
  }, [projects, searchQuery, statusFilter, priorityFilter]);

  // Open modal for Create
  const handleOpenCreate = () => {
    if (clients.length === 0) {
      alert('Debe crear al menos un cliente antes de abrir un proyecto.');
      return;
    }
    if (furnitureTypes.length === 0) {
      alert('Debe tener al menos un tipo de mueble configurado en la base de datos.');
      return;
    }
    setClientId(clients[0]?.id || '');
    setFurnitureTypeId(furnitureTypes[0]?.id || '');
    setDescription('');
    setPriority('media');
    setAgreedPrice(0);
    setDepositReceived(0);
    setStartDateInput(new Date().toISOString().substring(0, 10));
    setDeliveryDateInput('');
    setEstimatedBudget(0);
    setEstimatedLaborCost(0);
    setEstimatedLaborDays(0);
    setEstimatedOtherExpenses(0);
    setShowAdvanced(false);
    setFormError('');
    setShowModal(true);
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    const estProfit = agreedPrice - (estimatedLaborCost + estimatedOtherExpenses);

    const projectData = {
      clientId,
      furnitureTypeId,
      description,
      priority,
      agreedPrice: Number(agreedPrice),
      depositReceived: Number(depositReceived),
      startDate: startDateInput ? new Date(startDateInput) : null,
      estimatedDeliveryDate: deliveryDateInput ? new Date(deliveryDateInput) : null,
      // Estimaciones
      estimatedBudget: estimatedBudget > 0 ? Number(estimatedBudget) : Number(agreedPrice),
      estimatedLaborCost: Number(estimatedLaborCost),
      estimatedLaborDays: Number(estimatedLaborDays),
      estimatedOtherExpenses: Number(estimatedOtherExpenses),
      estimatedProfit: estProfit > 0 ? estProfit : 0
    };

    const res = await createProject(projectData);

    if (res.success && res.project) {
      const client = clients.find(c => c.id === clientId);
      const fType = furnitureTypes.find(t => t.id === furnitureTypeId);
      
      const created: Project = {
        ...res.project,
        startDate: res.project.startDate ? new Date(res.project.startDate) : null,
        estimatedDeliveryDate: res.project.estimatedDeliveryDate ? new Date(res.project.estimatedDeliveryDate) : null,
        client: client ? { name: client.name } : { name: '' },
        furnitureType: fType ? { name: fType.name } : { name: '' },
        payments: depositReceived > 0 ? [{ amount: depositReceived }] : []
      };

      setProjects(prev => [created, ...prev]);
      setShowModal(false);
    } else {
      setFormError(res.error || 'Error al crear proyecto');
    }
    setFormLoading(false);
  };

  // Priority Label Styles
  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'alta': return <span className="badge badge-danger">Alta</span>;
      case 'media': return <span className="badge badge-warning">Media</span>;
      case 'baja': return <span className="badge badge-secondary">Baja</span>;
      default: return <span className="badge">{p}</span>;
    }
  };

  // Status Label Styles
  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'presupuesto': return <span className="badge badge-secondary" style={{ backgroundColor: 'var(--surface-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>Presupuesto</span>;
      case 'a_confirmar': return <span className="badge badge-warning">A Confirmar</span>;
      case 'confirmado': return <span className="badge badge-primary">Confirmado</span>;
      case 'en_proceso': return <span className="badge badge-primary" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)' }}>En Proceso</span>;
      case 'finalizado': return <span className="badge badge-success" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)' }}>Finalizado</span>;
      case 'entregado': return <span className="badge badge-success">Entregado</span>;
      case 'cancelado': return <span className="badge badge-danger">Cancelado</span>;
      default: return <span className="badge">{s}</span>;
    }
  };

  // Payment Status Label
  const getPaymentStatusBadge = (ps: string) => {
    switch (ps) {
      case 'pendiente': return <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>Pendiente</span>;
      case 'parcial': return <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Pago Parcial</span>;
      case 'pagado': return <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Cobrado</span>;
      default: return <span className="badge" style={{ fontSize: '0.7rem' }}>{ps}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Filters and Action Bar */}
      <div style={{ display: 'flex', gap: '15px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '10px', flexGrow: 1, maxWidth: '750px' }}>
          <div style={{ position: 'relative', flexGrow: 1 }}>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por código, cliente, descripción..."
              style={{ paddingLeft: '40px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-muted)' }} />
          </div>

          <select
            className="form-control"
            style={{ maxWidth: '170px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">-- Todos los Estados --</option>
            <option value="presupuesto">Presupuesto</option>
            <option value="a_confirmar">A Confirmar</option>
            <option value="confirmado">Confirmado</option>
            <option value="en_proceso">En Proceso</option>
            <option value="finalizado">Finalizado</option>
            <option value="entregado">Entregado</option>
            <option value="cancelado">Cancelado</option>
          </select>

          <select
            className="form-control"
            style={{ maxWidth: '140px' }}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">-- Prioridades --</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={18} />
          <span>Crear Proyecto</span>
        </button>
      </div>

      {/* Projects Table */}
      {filteredProjects.length === 0 ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <FolderKanban size={48} style={{ color: 'var(--text-muted)', marginBottom: '15px', display: 'inline-block' }} />
          <p style={{ color: 'var(--text-muted)' }}>No se encontraron proyectos con los filtros actuales.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Tipo de Mueble</th>
                <th>Prioridad</th>
                <th>Estado de Obra</th>
                <th>Cobros</th>
                <th>Precio Acordado</th>
                <th>Entrega Estimada</th>
                <th style={{ textAlign: 'right' }}>Ficha</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{p.projectNumber}</span>
                  </td>
                  <td style={{ fontWeight: 550 }}>{p.client.name}</td>
                  <td>{p.furnitureType.name}</td>
                  <td>{getPriorityBadge(p.priority)}</td>
                  <td>{getStatusBadge(p.status)}</td>
                  <td>{getPaymentStatusBadge(p.paymentStatus)}</td>
                  <td style={{ fontWeight: 600 }}>{formatARS(p.agreedPrice)}</td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                      <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                      {p.estimatedDeliveryDate ? p.estimatedDeliveryDate.toLocaleDateString('es-AR') : 'Sin definir'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link href={`/proyectos/${p.id}`} className="btn btn-secondary btn-sm" style={{ padding: '6px' }} title="Ver ficha completa">
                      <Eye size={15} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3>Crear Nuevo Proyecto</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }} onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ maxHeight: '72vh' }}>
                {formError && (
                  <div style={{ backgroundColor: 'var(--error-light)', color: 'var(--error-color)', padding: '10px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '15px' }}>
                    {formError}
                  </div>
                )}
                
                <div className="form-grid">
                  <div className="form-group">
                    <label>Cliente *</label>
                    <select
                      className="form-control"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      required
                    >
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name} {c.companyName ? `(${c.companyName})` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tipo de Mueble *</label>
                    <select
                      className="form-control"
                      value={furnitureTypeId}
                      onChange={(e) => setFurnitureTypeId(e.target.value)}
                      required
                    >
                      {furnitureTypes.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Descripción / Detalle del Trabajo *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="ej: Bajo mesada a medida en melamina blanca 18mm con herrajes telescópicos."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Prioridad *</label>
                    <select
                      className="form-control"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      required
                    >
                      <option value="baja">Baja</option>
                      <option value="media">Media</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Fecha de Inicio</label>
                    <input
                      type="date"
                      className="form-control"
                      value={startDateInput}
                      onChange={(e) => setStartDateInput(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Precio Acordado (ARS) *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={agreedPrice}
                      onChange={(e) => setAgreedPrice(Number(e.target.value))}
                      min="0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Seña Recibida Inicial (ARS)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={depositReceived}
                      onChange={(e) => setDepositReceived(Number(e.target.value))}
                      min="0"
                      max={agreedPrice}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Fecha Estimada de Entrega</label>
                  <input
                    type="date"
                    className="form-control"
                    value={deliveryDateInput}
                    onChange={(e) => setDeliveryDateInput(e.target.value)}
                  />
                </div>

                {/* Advanced Estimates Toggle */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '15px', marginTop: '15px' }}>
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary-color)',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    <span>{showAdvanced ? 'Ocultar estimaciones' : 'Cargar estimaciones de presupuesto (Comparativa)'}</span>
                    <ArrowRight size={14} style={{ transform: showAdvanced ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>
                </div>

                {showAdvanced && (
                  <div className="form-grid" style={{ marginTop: '15px', padding: '15px', backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div className="form-group">
                      <label>Presupuesto Global Estimado</label>
                      <input
                        type="number"
                        className="form-control"
                        value={estimatedBudget}
                        onChange={(e) => setEstimatedBudget(Number(e.target.value))}
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Mano de Obra Estimada</label>
                      <input
                        type="number"
                        className="form-control"
                        value={estimatedLaborCost}
                        onChange={(e) => setEstimatedLaborCost(Number(e.target.value))}
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Días de Trabajo Estimados</label>
                      <input
                        type="number"
                        className="form-control"
                        value={estimatedLaborDays}
                        onChange={(e) => setEstimatedLaborDays(Number(e.target.value))}
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Gastos Varios Estimados</label>
                      <input
                        type="number"
                        className="form-control"
                        value={estimatedOtherExpenses}
                        onChange={(e) => setEstimatedOtherExpenses(Number(e.target.value))}
                        min="0"
                      />
                    </div>
                  </div>
                )}

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={formLoading}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Creando...' : 'Crear Proyecto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
