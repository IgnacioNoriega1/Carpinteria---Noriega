'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  X,
  Phone,
  Mail,
  DollarSign,
  UserCheck,
  Calendar,
  Filter,
  FileText,
  Clock,
  Printer
} from 'lucide-react';
import { createEmployee, updateEmployee, deleteEmployee, getLaborCostReport } from './actions';

interface Employee {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  ratePerDay: number;
  active: boolean;
}

interface EmployeeListProps {
  initialEmployees: Employee[];
}

export default function EmployeeList({ initialEmployees }: EmployeeListProps) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [activeTab, setActiveTab] = useState<'list' | 'report'>('list');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [ratePerDay, setRatePerDay] = useState(0);
  const [active, setActive] = useState(true);

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Report states
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [reportRecords, setReportRecords] = useState<any[]>([]);
  const [reportLoading, setReportLoading] = useState(false);

  // Formateador ARS
  const formatARS = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(val);
  };

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingEmployee(null);
    setName('');
    setPhone('');
    setEmail('');
    setRatePerDay(15000);
    setActive(true);
    setFormError('');
    setShowModal(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setName(emp.name);
    setPhone(emp.phone || '');
    setEmail(emp.email || '');
    setRatePerDay(emp.ratePerDay);
    setActive(emp.active);
    setFormError('');
    setShowModal(true);
  };

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    const empData = {
      name,
      phone: phone || null,
      email: email || null,
      ratePerDay: Number(ratePerDay)
    };

    if (editingEmployee) {
      // Update
      const res = await updateEmployee(editingEmployee.id, { ...empData, active });
      if (res.success && res.employee) {
        setEmployees(prev => prev.map(e => e.id === editingEmployee.id ? (res.employee as Employee) : e));
        setShowModal(false);
      } else {
        setFormError(res.error || 'Error al actualizar empleado');
      }
    } else {
      // Create
      const res = await createEmployee(empData);
      if (res.success && res.employee) {
        setEmployees(prev => [res.employee as Employee, ...prev]);
        setShowModal(false);
      } else {
        setFormError(res.error || 'Error al crear empleado');
      }
    }
    setFormLoading(false);
  };

  // Handle Delete (Soft delete)
  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este empleado?')) return;
    
    const res = await deleteEmployee(id);
    if (res.success) {
      setEmployees(prev => prev.filter(e => e.id !== id));
    } else {
      alert(res.error || 'Error al eliminar empleado');
    }
  };

  // Run Report query
  const handleRunReport = async () => {
    setReportLoading(true);
    const records = await getLaborCostReport({
      employeeId: filterEmployeeId || undefined,
      year: Number(filterYear) || undefined,
      month: Number(filterMonth) || undefined
    });
    setReportRecords(records);
    setReportLoading(false);
  };

  // Run report once when tab shifts to 'report'
  useEffect(() => {
    if (activeTab === 'report') {
      handleRunReport();
    }
  }, [activeTab]);

  // Report calculations
  const reportTotals = useMemo(() => {
    const totalDays = reportRecords.reduce((acc, r) => acc + r.daysWorked, 0);
    const totalCost = reportRecords.reduce((acc, r) => acc + r.total, 0);
    return { totalDays, totalCost };
  }, [reportRecords]);

  // Print report
  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Tabs Menu */}
      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          Lista de Empleados
        </button>
        <button 
          className={`tab-btn ${activeTab === 'report' ? 'active' : ''}`}
          onClick={() => setActiveTab('report')}
        >
          Reporte de Costos Laborales
        </button>
      </div>

      {/* TAB 1: EMPLOYEES CRUD */}
      {activeTab === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleOpenCreate}>
              <Plus size={18} />
              <span>Nuevo Empleado</span>
            </button>
          </div>

          {employees.length === 0 ? (
            <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
              <UserCheck size={48} style={{ color: 'var(--text-muted)', marginBottom: '15px', display: 'inline-block' }} />
              <p style={{ color: 'var(--text-muted)' }}>No hay empleados registrados en el taller.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nombre / Operario</th>
                    <th>Contacto</th>
                    <th>Jornada de Referencia</th>
                    <th>Estado</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id}>
                      <td style={{ fontWeight: 600 }}>{emp.name}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.85rem' }}>
                          {emp.phone && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Phone size={12} style={{ color: 'var(--primary-color)' }} />
                              {emp.phone}
                            </span>
                          )}
                          {emp.email && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Mail size={12} style={{ color: 'var(--text-muted)' }} />
                              {emp.email}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--success-color)' }}>
                          {formatARS(emp.ratePerDay)} / día
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${emp.active ? 'badge-success' : 'badge-danger'}`}>
                          {emp.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button className="btn btn-secondary btn-sm" title="Editar" style={{ padding: '6px' }} onClick={() => handleOpenEdit(emp)}>
                            <Edit2 size={15} style={{ color: 'var(--primary-color)' }} />
                          </button>
                          <button className="btn btn-secondary btn-sm" title="Eliminar" style={{ padding: '6px' }} onClick={() => handleDelete(emp.id)}>
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
        </div>
      )}

      {/* TAB 2: LABOR COST REPORTS */}
      {activeTab === 'report' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Report Filters Card */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
              <Filter size={18} style={{ color: 'var(--primary-color)' }} />
              <h3>Filtros de Reporte Laboral</h3>
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Empleado</label>
                <select 
                  className="form-control"
                  value={filterEmployeeId}
                  onChange={(e) => setFilterEmployeeId(e.target.value)}
                >
                  <option value="">-- Todos los empleados --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Mes</label>
                <select
                  className="form-control"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(Number(e.target.value))}
                >
                  <option value="1">Enero</option>
                  <option value="2">Febrero</option>
                  <option value="3">Marzo</option>
                  <option value="4">Abril</option>
                  <option value="5">Mayo</option>
                  <option value="6">Junio</option>
                  <option value="7">Julio</option>
                  <option value="8">Agosto</option>
                  <option value="9">Septiembre</option>
                  <option value="10">Octubre</option>
                  <option value="11">Noviembre</option>
                  <option value="12">Diciembre</option>
                </select>
              </div>

              <div className="form-group">
                <label>Año</label>
                <select
                  className="form-control"
                  value={filterYear}
                  onChange={(e) => setFilterYear(Number(e.target.value))}
                >
                  {[2025, 2026, 2027, 2028].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button className="btn btn-secondary" onClick={handlePrint}>
                <Printer size={16} />
                <span>Imprimir Reporte</span>
              </button>
              <button className="btn btn-primary" onClick={handleRunReport} disabled={reportLoading}>
                {reportLoading ? 'Consultando...' : 'Generar Reporte'}
              </button>
            </div>
          </div>

          {/* Report Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)' }}>
                <Clock size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>Jornales Registrados</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{reportTotals.totalDays} días trabajados</span>
              </div>
            </div>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--success-light)', color: 'var(--success-color)' }}>
                <DollarSign size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>Costo Laboral Total</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success-color)' }}>{formatARS(reportTotals.totalCost)}</span>
              </div>
            </div>
          </div>

          {/* Report Results Table */}
          {reportRecords.length === 0 ? (
            <div className="card" style={{ padding: '40px 20px', textAlign: 'center' }}>
              <FileText size={40} style={{ color: 'var(--text-muted)', marginBottom: '10px', display: 'inline-block' }} />
              <p style={{ color: 'var(--text-muted)' }}>No hay jornadas registradas para los filtros seleccionados.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Empleado</th>
                    <th>Proyecto</th>
                    <th>Jornada</th>
                    <th>Jornal Diario</th>
                    <th>Importe Total</th>
                    <th>Tarea / Productividad</th>
                  </tr>
                </thead>
                <tbody>
                  {reportRecords.map((rec) => (
                    <tr key={rec.id}>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                          {new Date(rec.date).toLocaleDateString('es-AR')}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{rec.employee.name}</td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{rec.project.projectNumber}</span>
                      </td>
                      <td>{rec.daysWorked} día(s)</td>
                      <td>{formatARS(rec.ratePerDay)}</td>
                      <td style={{ fontWeight: 600, color: 'var(--success-color)' }}>{formatARS(rec.total)}</td>
                      <td style={{ fontStyle: 'italic', fontSize: '0.85rem' }}>{rec.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}</h3>
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
                <div className="form-group">
                  <label>Nombre y Apellido *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="ej: Carlos Gómez"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Teléfono (Opcional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="ej: 3875123456"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email (Opcional)</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="ej: carlos@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-grid" style={{ alignItems: 'center' }}>
                  <div className="form-group">
                    <label>Jornal Diario de Referencia (ARS) *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={ratePerDay}
                      onChange={(e) => setRatePerDay(Number(e.target.value))}
                      min="0"
                      required
                    />
                  </div>
                  {editingEmployee && (
                    <div className="form-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '22px' }}>
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={(e) => setActive(e.target.checked)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <span>Empleado Activo</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={formLoading}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Guardando...' : 'Guardar Empleado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
