'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Calendar,
  DollarSign,
  TrendingUp,
  FolderKanban,
  Edit2,
  Trash2,
  Briefcase,
  Users,
  Settings,
  AlertTriangle,
  Scissors,
  CheckCircle,
  Clock,
  Plus,
  Coins,
  FileText
} from 'lucide-react';
import { 
  updateProject, 
  deleteProject,
  addProjectMaterial, 
  deleteProjectMaterial,
  addProjectLabor,
  deleteProjectLabor,
  addProjectEmployeeWork,
  deleteProjectEmployeeWork,
  addProjectExpense,
  deleteProjectExpense,
  addProjectPayment,
  deleteProjectPayment
} from '../actions';
import CutlistOptimizer from '@/components/CutlistOptimizer';

interface ProjectDetailManagerProps {
  project: any;
  clients: any[];
  furnitureTypes: any[];
  employees: any[];
  materialCategories: any[];
  expenseCategories: any[];
  paymentMethods: any[];
  inventory: any[];
  suppliers: any[];
}

export default function ProjectDetailManager({
  project: initialProject,
  clients,
  furnitureTypes,
  employees,
  materialCategories,
  expenseCategories,
  paymentMethods,
  inventory,
  suppliers
}: ProjectDetailManagerProps) {
  const router = useRouter();
  const [project, setProject] = useState(initialProject);
  const [activeTab, setActiveTab] = useState<'detalles' | 'costos' | 'pagos' | 'comparativa' | 'cutlist'>('detalles');
  const [costsTab, setCostsTab] = useState<'materiales' | 'labor' | 'empleados' | 'gastos_directos'>('materiales');

  // Basic edit form states
  const [clientId, setClientId] = useState(project.clientId);
  const [furnitureTypeId, setFurnitureTypeId] = useState(project.furnitureTypeId);
  const [description, setDescription] = useState(project.description);
  const [priority, setPriority] = useState(project.priority);
  const [status, setStatus] = useState(project.status);
  const [agreedPrice, setAgreedPrice] = useState(project.agreedPrice);
  const [startDateInput, setStartDateInput] = useState(project.startDate ? new Date(project.startDate).toISOString().substring(0, 10) : '');
  const [deliveryDateInput, setDeliveryDateInput] = useState(project.estimatedDeliveryDate ? new Date(project.estimatedDeliveryDate).toISOString().substring(0, 10) : '');
  const [actualDeliveryDateInput, setActualDeliveryDateInput] = useState(project.actualDeliveryDate ? new Date(project.actualDeliveryDate).toISOString().substring(0, 10) : '');
  const [estimatedBudget, setEstimatedBudget] = useState(project.estimatedBudget || 0);
  const [estimatedLaborCost, setEstimatedLaborCost] = useState(project.estimatedLaborCost || 0);
  const [estimatedLaborDays, setEstimatedLaborDays] = useState(project.estimatedLaborDays || 0);
  const [estimatedOtherExpenses, setEstimatedOtherExpenses] = useState(project.estimatedOtherExpenses || 0);
  const [workOrderNotes, setWorkOrderNotes] = useState(project.workOrderNotes || '');

  // Form add cost states
  const [matMode, setMatMode] = useState<'manual' | 'stock'>('manual');
  const [matName, setMatName] = useState('');
  const [matCategoryId, setMatCategoryId] = useState(materialCategories[0]?.id || '');
  const [matQty, setMatQty] = useState(1);
  const [matUnit, setMatUnit] = useState('placa');
  const [matPrice, setMatPrice] = useState(0);
  const [matInventoryId, setMatInventoryId] = useState('');
  const [matSupplierId, setMatSupplierId] = useState('');

  const [labDesc, setLabDesc] = useState('');
  const [labHoursDays, setLabHoursDays] = useState(1);
  const [labRate, setLabRate] = useState(0);

  const [empId, setEmpId] = useState(employees[0]?.id || '');
  const [empDate, setEmpDate] = useState(new Date().toISOString().substring(0, 10));
  const [empDays, setEmpDays] = useState(1);
  const [empRate, setEmpRate] = useState(employees[0]?.ratePerDay || 0);
  const [empNotes, setEmpNotes] = useState('');

  const [expCategoryId, setExpCategoryId] = useState(expenseCategories[0]?.id || '');
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState(0);
  const [expSupplierId, setExpSupplierId] = useState('');

  const [payDate, setPayDate] = useState(new Date().toISOString().substring(0, 10));
  const [payAmount, setPayAmount] = useState(0);
  const [payMethodId, setPayMethodId] = useState(paymentMethods[0]?.id || '');
  const [payNotes, setPayNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ARS Currency formatter
  const formatARS = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(val);
  };

  // Re-fetch project detail to update client side state
  const refreshProjectData = async () => {
    const res = await fetch(`/api/projects/${project.id}`);
    if (res.ok) {
      const data = await res.json();
      setProject(data);
    } else {
      router.refresh();
    }
  };

  // 1. Submit basic details form
  const handleUpdateProjectBasic = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const estProfit = agreedPrice - (estimatedLaborCost + estimatedOtherExpenses);

    const res = await updateProject(project.id, {
      clientId,
      furnitureTypeId,
      description,
      priority,
      status,
      agreedPrice: Number(agreedPrice),
      startDate: startDateInput ? new Date(startDateInput) : null,
      estimatedDeliveryDate: deliveryDateInput ? new Date(deliveryDateInput) : null,
      actualDeliveryDate: actualDeliveryDateInput ? new Date(actualDeliveryDateInput) : null,
      estimatedBudget: Number(estimatedBudget),
      estimatedLaborCost: Number(estimatedLaborCost),
      estimatedLaborDays: Number(estimatedLaborDays),
      estimatedOtherExpenses: Number(estimatedOtherExpenses),
      estimatedProfit: estProfit > 0 ? estProfit : 0,
      workOrderNotes: workOrderNotes || null,
    });

    if (res.success && res.project) {
      setSuccessMsg('Información de proyecto actualizada con éxito.');
      await refreshProjectData();
    } else {
      setError(res.error || 'Error al actualizar proyecto.');
    }
    setLoading(false);
  };

  // Delete project
  const handleDeleteProject = async () => {
    if (!confirm('¿Está seguro de que desea eliminar este proyecto? Esta acción es irreversible.')) return;
    setLoading(true);
    const res = await deleteProject(project.id);
    if (res.success) {
      router.push('/proyectos');
    } else {
      alert(res.error || 'Error al eliminar proyecto.');
    }
    setLoading(false);
  };

  // 2. Add Project Material
  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let res;
    if (matMode === 'stock') {
      const invItem = inventory.find(i => i.id === matInventoryId);
      if (!invItem) {
        setError('Debe seleccionar un item de stock válido.');
        setLoading(false);
        return;
      }
      res = await addProjectMaterial({
        projectId: project.id,
        materialName: invItem.name,
        materialCategoryId: invItem.materialCategoryId,
        quantity: Number(matQty),
        unit: invItem.unit,
        unitPrice: Number(matPrice),
        inventoryMaterialId: matInventoryId,
      });
    } else {
      res = await addProjectMaterial({
        projectId: project.id,
        materialName: matName,
        materialCategoryId: matCategoryId,
        quantity: Number(matQty),
        unit: matUnit,
        unitPrice: Number(matPrice),
        supplierId: matSupplierId || null,
      });
    }

    if (res.success) {
      setMatName('');
      setMatQty(1);
      setMatPrice(0);
      await refreshProjectData();
    } else {
      setError(res.error || 'Error al agregar material');
    }
    setLoading(false);
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm('¿Desea eliminar este material? Si provenía de stock, la cantidad se devolverá al inventario.')) return;
    const res = await deleteProjectMaterial(id);
    if (res.success) {
      await refreshProjectData();
    } else {
      alert(res.error || 'Error al eliminar');
    }
  };

  // 3. Add General Labor
  const handleAddLabor = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await addProjectLabor({
      projectId: project.id,
      description: labDesc,
      hoursOrDays: Number(labHoursDays),
      rate: Number(labRate)
    });
    if (res.success) {
      setLabDesc('');
      setLabHoursDays(1);
      setLabRate(0);
      await refreshProjectData();
    } else {
      setError(res.error || 'Error al agregar mano de obra');
    }
    setLoading(false);
  };

  const handleDeleteLabor = async (id: string) => {
    if (!confirm('¿Desea eliminar este registro de mano de obra?')) return;
    const res = await deleteProjectLabor(id);
    if (res.success) await refreshProjectData();
  };

  // 4. Add Employee Work Record
  const handleAddEmployeeWork = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await addProjectEmployeeWork({
      projectId: project.id,
      employeeId: empId,
      date: new Date(empDate),
      daysWorked: Number(empDays),
      ratePerDay: Number(empRate),
      notes: empNotes || null
    });
    if (res.success) {
      setEmpDays(1);
      setEmpNotes('');
      await refreshProjectData();
    } else {
      setError(res.error || 'Error al registrar jornal');
    }
    setLoading(false);
  };

  const handleDeleteEmployeeWork = async (id: string) => {
    if (!confirm('¿Desea eliminar esta jornada de empleado?')) return;
    const res = await deleteProjectEmployeeWork(id);
    if (res.success) await refreshProjectData();
  };

  // 5. Add Project Expense
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await addProjectExpense({
      projectId: project.id,
      expenseCategoryId: expCategoryId,
      description: expDesc,
      amount: Number(expAmount),
      supplierId: expSupplierId || null
    });
    if (res.success) {
      setExpDesc('');
      setExpAmount(0);
      await refreshProjectData();
    } else {
      setError(res.error || 'Error al registrar gasto');
    }
    setLoading(false);
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('¿Desea eliminar este gasto directo?')) return;
    const res = await deleteProjectExpense(id);
    if (res.success) await refreshProjectData();
  };

  // 6. Add Payment
  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await addProjectPayment({
      projectId: project.id,
      date: new Date(payDate),
      amount: Number(payAmount),
      paymentMethodId: payMethodId,
      notes: payNotes || null
    });
    if (res.success) {
      setPayAmount(0);
      setPayNotes('');
      await refreshProjectData();
    } else {
      setError(res.error || 'Error al registrar cobro');
    }
    setLoading(false);
  };

  const handleDeletePayment = async (id: string) => {
    if (!confirm('¿Desea eliminar este registro de cobro?')) return;
    const res = await deleteProjectPayment(id);
    if (res.success) await refreshProjectData();
  };

  // Financial calculations
  const finances = useMemo(() => {
    const materials = project.materials.reduce((acc: number, m: any) => acc + m.totalPrice, 0);
    const labor = project.labor.reduce((acc: number, l: any) => acc + l.total, 0);
    const employeeLabor = project.employees.reduce((acc: number, e: any) => acc + e.total, 0);
    const expenses = project.expenses.reduce((acc: number, e: any) => acc + e.amount, 0);
    
    const totalCost = materials + labor + employeeLabor + expenses;
    const totalPaid = project.payments.reduce((acc: number, p: any) => acc + p.amount, 0);
    const balanceOwed = project.agreedPrice - totalPaid;
    
    const grossProfit = project.agreedPrice - totalCost;
    const netProfit = totalPaid - totalCost;
    const margin = project.agreedPrice > 0 ? (grossProfit / project.agreedPrice) * 100 : 0;

    return {
      materials,
      labor: labor + employeeLabor,
      expenses,
      totalCost,
      totalPaid,
      balanceOwed,
      grossProfit,
      netProfit,
      margin: parseFloat(margin.toFixed(1))
    };
  }, [project]);

  // Comparison Budget vs Real
  const comparison = useMemo(() => {
    const estLabor = project.estimatedLaborCost || 0;
    const estExpenses = project.estimatedOtherExpenses || 0;
    const estProfit = project.estimatedProfit || 0;
    const estBudget = project.estimatedBudget || project.agreedPrice;

    // Supongamos que el presupuesto de materiales estimado es la diferencia
    const estMaterials = estBudget - (estLabor + estExpenses + estProfit);
    const realMaterials = finances.materials;
    const realLabor = finances.labor;
    const realExpenses = finances.expenses;
    const realCost = finances.totalCost;
    const realProfit = finances.grossProfit; // Ganancia real en base a lo acordado

    const budgetDiff = realCost - estBudget;
    const budgetDiffPct = estBudget > 0 ? (budgetDiff / estBudget) * 100 : 0;

    return {
      estBudget,
      estMaterials: estMaterials > 0 ? estMaterials : 0,
      realMaterials,
      estLabor,
      realLabor,
      estExpenses,
      realExpenses,
      estProfit,
      realProfit,
      budgetDiff,
      budgetDiffPct: parseFloat(budgetDiffPct.toFixed(1))
    };
  }, [project, finances]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Banner Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/proyectos" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)', fontWeight: 600 }}>
          <ArrowLeft size={16} />
          <span>Volver a Proyectos</span>
        </Link>
        <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-muted)' }}>
          {project.projectNumber}
        </span>
      </div>

      {/* Project title and brief summary cards */}
      <div className="card" style={{ padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '30px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="badge badge-primary" style={{ fontSize: '0.7rem', padding: '2px 8px', marginBottom: '6px' }}>{project.furnitureType.name}</span>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '2px 0 6px 0' }}>{project.client.name}</h2>
          <p style={{ fontSize: '0.85rem' }}>{project.description}</p>
        </div>
        
        {/* Economic Summary Banner */}
        <div style={{ display: 'flex', gap: '25px', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Acordado</span>
            <span style={{ fontSize: '1.15rem', fontWeight: 700 }}>{formatARS(project.agreedPrice)}</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Costo Acumulado</span>
            <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--error-color)' }}>{formatARS(finances.totalCost)}</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Cobrado</span>
            <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--success-color)' }}>{formatARS(finances.totalPaid)}</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Saldo</span>
            <span style={{ fontSize: '1.15rem', fontWeight: 700, color: finances.balanceOwed > 0 ? 'var(--warning-color)' : 'var(--success-color)' }}>
              {formatARS(finances.balanceOwed)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'detalles' ? 'active' : ''}`} onClick={() => setActiveTab('detalles')}>
          <Settings size={15} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
          Detalles de Obra
        </button>
        <button className={`tab-btn ${activeTab === 'costos' ? 'active' : ''}`} onClick={() => setActiveTab('costos')}>
          <Coins size={15} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
          Cargar Costos
        </button>
        <button className={`tab-btn ${activeTab === 'pagos' ? 'active' : ''}`} onClick={() => setActiveTab('pagos')}>
          <DollarSign size={15} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
          Cobros de Cliente
        </button>
        <button className={`tab-btn ${activeTab === 'comparativa' ? 'active' : ''}`} onClick={() => setActiveTab('comparativa')}>
          <TrendingUp size={15} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
          Presupuesto vs Costo Real
        </button>
        <button className={`tab-btn ${activeTab === 'cutlist' ? 'active' : ''}`} onClick={() => setActiveTab('cutlist')}>
          <Scissors size={15} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
          Optimizador de Cortes
        </button>
      </div>

      {/* ERROR / SUCCESS ALERTS */}
      {error && <div style={{ backgroundColor: 'var(--error-light)', color: 'var(--error-color)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--error-color)' }}>{error}</div>}
      {successMsg && <div style={{ backgroundColor: 'var(--success-light)', color: 'var(--success-color)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--success-color)' }}>{successMsg}</div>}

      {/* TAB 1: DETALLES GENERALES (EDITAR PROYECTO) */}
      {activeTab === 'detalles' && (
        <div className="card">
          <form onSubmit={handleUpdateProjectBasic} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Modificar Atributos del Proyecto</h3>
              <button type="button" className="btn btn-danger btn-sm" onClick={handleDeleteProject} disabled={loading}>
                <Trash2 size={14} /> Eliminar Proyecto
              </button>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Cliente</label>
                <select className="form-control" value={clientId} onChange={(e) => setClientId(e.target.value)} required>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Tipo de Mueble</label>
                <select className="form-control" value={furnitureTypeId} onChange={(e) => setFurnitureTypeId(e.target.value)} required>
                  {furnitureTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Descripción del Trabajo</label>
              <input type="text" className="form-control" value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Prioridad</label>
                <select className="form-control" value={priority} onChange={(e) => setPriority(e.target.value)} required>
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
              <div className="form-group">
                <label>Estado de Obra</label>
                <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)} required>
                  <option value="presupuesto">Presupuesto</option>
                  <option value="a_confirmar">A Confirmar</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="en_proceso">En Proceso</option>
                  <option value="finalizado">Finalizado</option>
                  <option value="entregado">Entregado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Fecha de Inicio</label>
                <input type="date" className="form-control" value={startDateInput} onChange={(e) => setStartDateInput(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Fecha Estimada de Entrega</label>
                <input type="date" className="form-control" value={deliveryDateInput} onChange={(e) => setDeliveryDateInput(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Fecha Real de Entrega</label>
                <input type="date" className="form-control" value={actualDeliveryDateInput} onChange={(e) => setActualDeliveryDateInput(e.target.value)} />
              </div>
            </div>

            <div className="form-grid" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
              <div className="form-group">
                <label>Precio Acordado Final (ARS)</label>
                <input type="number" className="form-control" value={agreedPrice} onChange={(e) => setAgreedPrice(Number(e.target.value))} required />
              </div>
              <div className="form-group">
                <label>Presupuesto Estimado Global</label>
                <input type="number" className="form-control" value={estimatedBudget} onChange={(e) => setEstimatedBudget(Number(e.target.value))} />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Costo de Mano de Obra Estimada (ARS)</label>
                <input type="number" className="form-control" value={estimatedLaborCost} onChange={(e) => setEstimatedLaborCost(Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label>Días de Trabajo Estimados</label>
                <input type="number" className="form-control" value={estimatedLaborDays} onChange={(e) => setEstimatedLaborDays(Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label>Gastos Varios Estimados (ARS)</label>
                <input type="number" className="form-control" value={estimatedOtherExpenses} onChange={(e) => setEstimatedOtherExpenses(Number(e.target.value))} />
              </div>
            </div>

            <div className="form-group">
              <label>Notas de Taller / Orden de Trabajo</label>
              <textarea className="form-control" style={{ minHeight: '80px' }} placeholder="Medidas críticas, colocación de bisagras, advertencias..." value={workOrderNotes} onChange={(e) => setWorkOrderNotes(e.target.value)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Guardando...' : 'Actualizar Proyecto'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: GESTION DE COSTOS */}
      {activeTab === 'costos' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '20px', alignItems: 'stretch' }}>
          
          {/* Form Side */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Cost Selector menu */}
            <div className="card" style={{ padding: '16px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Categoría de Costo</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button className={`btn btn-sm ${costsTab === 'materiales' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setCostsTab('materiales')} style={{ justifyContent: 'flex-start' }}>Materiales</button>
                <button className={`btn btn-sm ${costsTab === 'labor' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setCostsTab('labor')} style={{ justifyContent: 'flex-start' }}>Mano Obra General</button>
                <button className={`btn btn-sm ${costsTab === 'empleados' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setCostsTab('empleados')} style={{ justifyContent: 'flex-start' }}>Operarios (Jornadas)</button>
                <button className={`btn btn-sm ${costsTab === 'gastos_directos' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setCostsTab('gastos_directos')} style={{ justifyContent: 'flex-start' }}>Gastos Directos (Fletes/etc.)</button>
              </div>
            </div>

            {/* FORM 2.1: MATERIALES */}
            {costsTab === 'materiales' && (
              <div className="card">
                <h3>Cargar Material</h3>
                <div style={{ display: 'flex', gap: '10px', margin: '12px 0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                    <input type="radio" checked={matMode === 'manual'} onChange={() => setMatMode('manual')} /> Compra Directa
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                    <input type="radio" checked={matMode === 'stock'} onChange={() => setMatMode('stock')} /> Consumir de Stock
                  </label>
                </div>

                <form onSubmit={handleAddMaterial} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {matMode === 'stock' ? (
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Seleccionar Material en Stock</label>
                      <select 
                        className="form-control" 
                        value={matInventoryId} 
                        onChange={(e) => {
                          setMatInventoryId(e.target.value);
                          const item = inventory.find(i => i.id === e.target.value);
                          if (item) {
                            setMatPrice(item.unitCost);
                            setMatUnit(item.unit);
                          }
                        }}
                        required
                      >
                        <option value="" disabled>-- Buscar en stock --</option>
                        {inventory.filter(i => i.currentStock > 0).map(i => (
                          <option key={i.id} value={i.id}>{i.name} (Stock: {i.currentStock})</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Nombre del Material *</label>
                        <input type="text" className="form-control" placeholder="ej: Tornillos 3.5x16mm" value={matName} onChange={(e) => setMatName(e.target.value)} required />
                      </div>
                      <div className="form-grid">
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Categoría *</label>
                          <select className="form-control" value={matCategoryId} onChange={(e) => setMatCategoryId(e.target.value)} required>
                            {materialCategories.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Unidad *</label>
                          <input type="text" className="form-control" placeholder="u, m, placa, etc." value={matUnit} onChange={(e) => setMatUnit(e.target.value)} required />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="form-grid">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Cantidad *</label>
                      <input type="number" className="form-control" value={matQty} onChange={(e) => setMatQty(Number(e.target.value))} min="0.01" step="0.01" required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Costo Unitario (ARS) *</label>
                      <input type="number" className="form-control" value={matPrice} onChange={(e) => setMatPrice(Number(e.target.value))} min="0" required />
                    </div>
                  </div>

                  {matMode === 'manual' && (
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Proveedor (Opcional)</label>
                      <select className="form-control" value={matSupplierId} onChange={(e) => setMatSupplierId(e.target.value)}>
                        <option value="">-- Comprado a --</option>
                        {suppliers.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                    Agregar Material
                  </button>
                </form>
              </div>
            )}

            {/* FORM 2.2: MANO OBRA GENERAL */}
            {costsTab === 'labor' && (
              <div className="card">
                <h3>Cargar Mano de Obra General</h3>
                <form onSubmit={handleAddLabor} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Descripción de Tarea *</label>
                    <input type="text" className="form-control" placeholder="ej: Pintado laqueado especial" value={labDesc} onChange={(e) => setLabDesc(e.target.value)} required />
                  </div>
                  <div className="form-grid">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Horas o Días Trabajados *</label>
                      <input type="number" className="form-control" value={labHoursDays} onChange={(e) => setLabHoursDays(Number(e.target.value))} min="0.01" step="0.01" required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Valor / Costo Unitario *</label>
                      <input type="number" className="form-control" value={labRate} onChange={(e) => setLabRate(Number(e.target.value))} min="0" required />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>Agregar Mano de Obra</button>
                </form>
              </div>
            )}

            {/* FORM 2.3: OPERARIOS JORNADAS */}
            {costsTab === 'empleados' && (
              <div className="card">
                <h3>Registrar Jornal de Empleado</h3>
                <form onSubmit={handleAddEmployeeWork} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Empleado *</label>
                    <select 
                      className="form-control" 
                      value={empId} 
                      onChange={(e) => {
                        setEmpId(e.target.value);
                        const emp = employees.find(emp => emp.id === e.target.value);
                        if (emp) setEmpRate(emp.ratePerDay);
                      }}
                      required
                    >
                      {employees.map(e => (
                        <option key={e.id} value={e.id}>{e.name} (Ref: {formatARS(e.ratePerDay)}/día)</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-grid">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Fecha Jornada *</label>
                      <input type="date" className="form-control" value={empDate} onChange={(e) => setEmpDate(e.target.value)} required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Días Trabajados *</label>
                      <input type="number" className="form-control" value={empDays} onChange={(e) => setEmpDays(Number(e.target.value))} min="0.1" step="0.1" required />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Valor por Día acordado (ARS) *</label>
                    <input type="number" className="form-control" value={empRate} onChange={(e) => setEmpRate(Number(e.target.value))} min="0" required />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Tarea / Log de Productividad</label>
                    <input type="text" className="form-control" placeholder="ej: Lijado de frentes, Colocación rieles" value={empNotes} onChange={(e) => setEmpNotes(e.target.value)} />
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>Registrar Jornal</button>
                </form>
              </div>
            )}

            {/* FORM 2.4: GASTOS DIRECTOS */}
            {costsTab === 'gastos_directos' && (
              <div className="card">
                <h3>Cargar Gasto Directo</h3>
                <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-grid">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Categoría Gasto *</label>
                      <select className="form-control" value={expCategoryId} onChange={(e) => setExpCategoryId(e.target.value)} required>
                        {expenseCategories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Importe (ARS) *</label>
                      <input type="number" className="form-control" value={expAmount} onChange={(e) => setExpAmount(Number(e.target.value))} min="0.01" step="0.01" required />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Descripción / Detalle *</label>
                    <input type="text" className="form-control" placeholder="ej: Flete para entrega de mueble" value={expDesc} onChange={(e) => setExpDesc(e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Proveedor / Prestador</label>
                    <select className="form-control" value={expSupplierId} onChange={(e) => setExpSupplierId(e.target.value)}>
                      <option value="">-- Seleccionar Proveedor --</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>Agregar Gasto</button>
                </form>
              </div>
            )}

          </div>

          {/* Listing Side */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* RENDER 2.1: TABLA MATERIALES */}
            {costsTab === 'materiales' && (
              <div className="card">
                <div className="card-header" style={{ marginBottom: '15px' }}>
                  <h3>Materiales Cargados</h3>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-color)' }}>Total: {formatARS(finances.materials)}</span>
                </div>
                {project.materials.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>No hay materiales cargados aún en el proyecto.</p>
                ) : (
                  <div className="table-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Material</th>
                          <th>Cant</th>
                          <th>Costo Unit</th>
                          <th>Total</th>
                          <th>Origen</th>
                          <th style={{ textAlign: 'right' }}>Eliminar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {project.materials.map((m: any) => (
                          <tr key={m.id}>
                            <td>
                              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{m.materialName}</div>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Cat: {m.materialCategory.name}</span>
                            </td>
                            <td>{m.quantity} {m.unit}</td>
                            <td>{formatARS(m.unitPrice)}</td>
                            <td style={{ fontWeight: 600 }}>{formatARS(m.totalPrice)}</td>
                            <td>
                              {m.fromCutlist ? (
                                <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>Optimizador</span>
                              ) : m.inventoryMaterialId ? (
                                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Stock</span>
                              ) : (
                                <span className="badge badge-secondary" style={{ fontSize: '0.65rem' }}>Compra</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error-color)' }} onClick={() => handleDeleteMaterial(m.id)}>
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* RENDER 2.2: TABLA MANO OBRA */}
            {costsTab === 'labor' && (
              <div className="card">
                <div className="card-header" style={{ marginBottom: '15px' }}>
                  <h3>Mano de Obra General</h3>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-color)' }}>Total: {formatARS(project.labor.reduce((sum: number, l: any) => sum + l.total, 0))}</span>
                </div>
                {project.labor.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>No hay registros de mano de obra general.</p>
                ) : (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Descripción</th>
                          <th>Horas/Días</th>
                          <th>Costo</th>
                          <th>Total</th>
                          <th style={{ textAlign: 'right' }}>Eliminar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {project.labor.map((l: any) => (
                          <tr key={l.id}>
                            <td style={{ fontWeight: 500 }}>{l.description}</td>
                            <td>{l.hoursOrDays}</td>
                            <td>{formatARS(l.rate)}</td>
                            <td style={{ fontWeight: 600 }}>{formatARS(l.total)}</td>
                            <td style={{ textAlign: 'right' }}>
                              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error-color)' }} onClick={() => handleDeleteLabor(l.id)}>
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* RENDER 2.3: TABLA EMPLEADOS */}
            {costsTab === 'empleados' && (
              <div className="card">
                <div className="card-header" style={{ marginBottom: '15px' }}>
                  <h3>Jornales Registrados</h3>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-color)' }}>Total: {formatARS(project.employees.reduce((sum: number, e: any) => sum + e.total, 0))}</span>
                </div>
                {project.employees.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>No se han cargado jornales de empleados para este trabajo.</p>
                ) : (
                  <div className="table-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Operario</th>
                          <th>Jornada</th>
                          <th>Jornal</th>
                          <th>Total</th>
                          <th>Tarea</th>
                          <th style={{ textAlign: 'right' }}>Eliminar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {project.employees.map((e: any) => (
                          <tr key={e.id}>
                            <td>{new Date(e.date).toLocaleDateString('es-AR')}</td>
                            <td style={{ fontWeight: 600 }}>{e.employee.name}</td>
                            <td>{e.daysWorked} día(s)</td>
                            <td>{formatARS(e.ratePerDay)}</td>
                            <td style={{ fontWeight: 600 }}>{formatARS(e.total)}</td>
                            <td style={{ fontStyle: 'italic', fontSize: '0.8rem' }}>{e.notes || '-'}</td>
                            <td style={{ textAlign: 'right' }}>
                              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error-color)' }} onClick={() => handleDeleteEmployeeWork(e.id)}>
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* RENDER 2.4: TABLA GASTOS DIRECTOS */}
            {costsTab === 'gastos_directos' && (
              <div className="card">
                <div className="card-header" style={{ marginBottom: '15px' }}>
                  <h3>Gastos Directos</h3>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-color)' }}>Total: {formatARS(project.expenses.reduce((sum: number, e: any) => sum + e.amount, 0))}</span>
                </div>
                {project.expenses.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>No hay gastos directos cargados.</p>
                ) : (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Categoría</th>
                          <th>Detalle</th>
                          <th>Importe</th>
                          <th>Proveedor</th>
                          <th style={{ textAlign: 'right' }}>Eliminar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {project.expenses.map((e: any) => (
                          <tr key={e.id}>
                            <td>
                              <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>{e.expenseCategory.name}</span>
                            </td>
                            <td style={{ fontWeight: 500 }}>{e.description}</td>
                            <td style={{ fontWeight: 600, color: 'var(--error-color)' }}>{formatARS(e.amount)}</td>
                            <td>{e.supplier?.name || '-'}</td>
                            <td style={{ textAlign: 'right' }}>
                              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error-color)' }} onClick={() => handleDeleteExpense(e.id)}>
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      )}

      {/* TAB 3: PAGOS DE CLIENTES */}
      {activeTab === 'pagos' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '20px', alignItems: 'stretch' }}>
          {/* Form */}
          <div className="card" style={{ height: 'fit-content' }}>
            <h3>Registrar Cobro de Cliente</h3>
            <form onSubmit={handleAddPayment} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Fecha de Cobro *</label>
                <input type="date" className="form-control" value={payDate} onChange={(e) => setPayDate(e.target.value)} required />
              </div>
              
              <div className="form-grid">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Monto Cobrado (ARS) *</label>
                  <input type="number" className="form-control" value={payAmount} onChange={(e) => setPayAmount(Number(e.target.value))} min="0.01" step="0.01" max={finances.balanceOwed} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Medio de Pago *</label>
                  <select className="form-control" value={payMethodId} onChange={(e) => setPayMethodId(e.target.value)} required>
                    {paymentMethods.map(pm => (
                      <option key={pm.id} value={pm.id}>{pm.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Observaciones / Notas del Cobro</label>
                <input type="text" className="form-control" placeholder="ej: Transferencia seña, Saldo final, etc." value={payNotes} onChange={(e) => setPayNotes(e.target.value)} />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading || finances.balanceOwed <= 0}>
                {finances.balanceOwed <= 0 ? 'Trabajo Cobrado al 100%' : 'Registrar Cobro'}
              </button>
            </form>
          </div>

          {/* List and Balance Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Debt status banner card */}
            <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: finances.balanceOwed > 0 ? 'var(--warning-light)' : 'var(--success-light)', borderColor: finances.balanceOwed > 0 ? 'var(--warning-color)' : 'var(--success-color)' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: finances.balanceOwed > 0 ? 'var(--warning-color)' : 'var(--success-color)', fontWeight: 600, display: 'block' }}>Estado de Pago del Proyecto</span>
                <h3 style={{ textTransform: 'uppercase', color: finances.balanceOwed > 0 ? 'var(--warning-color)' : 'var(--success-color)' }}>
                  {project.paymentStatus === 'pendiente' ? 'Pendiente Completo' : project.paymentStatus === 'parcial' ? 'Cobro Parcial' : 'Cobrado Total'}
                </h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Saldo de Deuda Restante</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: finances.balanceOwed > 0 ? 'var(--error-color)' : 'var(--success-color)' }}>{formatARS(finances.balanceOwed)}</span>
              </div>
            </div>

            {/* List of payments */}
            <div className="card">
              <h3>Historial de Cobros Recibidos</h3>
              {project.payments.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>No hay registros de cobros cargados.</p>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Importe</th>
                        <th>Medio de Pago</th>
                        <th>Notas</th>
                        <th style={{ textAlign: 'right' }}>Eliminar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {project.payments.map((p: any) => (
                        <tr key={p.id}>
                          <td>{new Date(p.date).toLocaleDateString('es-AR')}</td>
                          <td style={{ fontWeight: 600, color: 'var(--success-color)' }}>{formatARS(p.amount)}</td>
                          <td>{p.paymentMethod.name}</td>
                          <td style={{ fontStyle: 'italic', fontSize: '0.85rem' }}>{p.notes || '-'}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error-color)' }} onClick={() => handleDeletePayment(p.id)}>
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* TAB 4: COMPARATIVA PRESUPUESTO VS COSTO REAL */}
      {activeTab === 'comparativa' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Top banner comparison */}
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: comparison.budgetDiff > 0 ? 'var(--error-light)' : 'var(--success-light)', borderColor: comparison.budgetDiff > 0 ? 'var(--error-color)' : 'var(--success-color)' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>Desviación de Presupuesto Real contra Estimado</span>
              <h3>
                {comparison.budgetDiff > 0 
                  ? `Exceso de Costos: +${formatARS(comparison.budgetDiff)} (+${comparison.budgetDiffPct}%)`
                  : comparison.budgetDiff < 0 
                    ? `Ahorro de Costos: ${formatARS(comparison.budgetDiff)} (${comparison.budgetDiffPct}%)`
                    : 'Costo en línea con lo estimado'}
              </h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Margen de Ganancia Real</span>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: finances.grossProfit > 0 ? 'var(--success-color)' : 'var(--error-color)' }}>
                {finances.margin}%
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
            
            {/* Detalle comparativo de rubros */}
            <div className="card">
              <h3>Desglose Comparativo de Costos</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                
                {/* 1. Materiales */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600 }}>Materiales</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Real: {formatARS(comparison.realMaterials)} vs Est: {formatARS(comparison.estMaterials)}
                    </span>
                  </div>
                  <div style={{ height: '14px', backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius-full)', display: 'flex', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (comparison.realMaterials / (comparison.estMaterials || 1)) * 100)}%`, backgroundColor: comparison.realMaterials > comparison.estMaterials ? 'var(--error-color)' : 'var(--success-color)' }}></div>
                  </div>
                </div>

                {/* 2. Mano de Obra */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600 }}>Mano de Obra</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Real: {formatARS(comparison.realLabor)} vs Est: {formatARS(comparison.estLabor)}
                    </span>
                  </div>
                  <div style={{ height: '14px', backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius-full)', display: 'flex', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (comparison.realLabor / (comparison.estLabor || 1)) * 100)}%`, backgroundColor: comparison.realLabor > comparison.estLabor ? 'var(--error-color)' : 'var(--success-color)' }}></div>
                  </div>
                </div>

                {/* 3. Gastos Directos */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600 }}>Gastos Varios / Fletes</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Real: {formatARS(comparison.realExpenses)} vs Est: {formatARS(comparison.estExpenses)}
                    </span>
                  </div>
                  <div style={{ height: '14px', backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius-full)', display: 'flex', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (comparison.realExpenses / (comparison.estExpenses || 1)) * 100)}%`, backgroundColor: comparison.realExpenses > comparison.estExpenses ? 'var(--error-color)' : 'var(--success-color)' }}></div>
                  </div>
                </div>

              </div>
            </div>

            {/* Ficha de rentabilidad y ganancia real */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3>Rentabilidad Real</h3>
              
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Ganancia Esperada Estimada</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>{formatARS(comparison.estProfit)}</span>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Ganancia Real Final</span>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: comparison.realProfit > 0 ? 'var(--success-color)' : 'var(--error-color)' }}>
                  {formatARS(comparison.realProfit)}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                  Fórmula: Precio Acordado - Costo Total del Proyecto
                </span>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Diferencia de Ganancia</span>
                <span style={{ 
                  fontWeight: 700, 
                  fontSize: '1rem',
                  color: comparison.realProfit - comparison.estProfit >= 0 ? 'var(--success-color)' : 'var(--error-color)'
                }}>
                  {comparison.realProfit - comparison.estProfit >= 0 ? '+' : ''}
                  {formatARS(comparison.realProfit - comparison.estProfit)}
                </span>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {comparison.realProfit - comparison.estProfit >= 0 
                    ? '¡Excelente! El proyecto generó más o igual ganancia que la proyectada.'
                    : 'Atención: Hubo desviaciones en el presupuesto que mermaron la ganancia esperada.'}
                </p>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 5: OPTIMIZADOR DE CORTES EMBEBIDO */}
      {activeTab === 'cutlist' && (
        <div>
          <CutlistOptimizer
            projectId={project.id}
            materialCategories={materialCategories}
            inventory={inventory}
            initialCutlist={project.cutlist}
            projectNumber={project.projectNumber}
            onConfirmSuccess={refreshProjectData}
          />
        </div>
      )}

    </div>
  );
}
