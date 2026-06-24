import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { 
  FolderKanban, 
  Clock, 
  Play, 
  CheckCircle, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Calendar
} from 'lucide-react';

// Forzar renderizado dinámico en cada visita para reflejar cambios en BD
export const revalidate = 0;

export default async function DashboardPage() {
  const now = new Date();
  
  // Rango del mes actual
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // 1. Contador de Estados de Proyectos
  const activeProjectsCount = await prisma.project.count({
    where: { status: { in: ['confirmado', 'en_proceso', 'finalizado'] }, deletedAt: null }
  });
  
  const pendingConfirmCount = await prisma.project.count({
    where: { status: 'a_confirmar', deletedAt: null }
  });
  
  const inProgressCount = await prisma.project.count({
    where: { status: 'en_proceso', deletedAt: null }
  });
  
  const finishedCount = await prisma.project.count({
    where: { status: 'finalizado', deletedAt: null }
  });

  const activeClientsCount = await prisma.client.count({
    where: { deletedAt: null }
  });

  // 2. Cobros del mes actual
  const paymentsThisMonth = await prisma.payment.findMany({
    where: {
      date: { gte: firstDayOfMonth, lte: lastDayOfMonth },
      deletedAt: null
    }
  });
  const totalBilledMonth = paymentsThisMonth.reduce((acc, p) => acc + p.amount, 0);

  // 3. Gastos del mes actual (Gastos generales + gastos de proyectos + mano de obra interna)
  // Gastos generales (Overhead)
  const overheadExpenses = await prisma.overheadExpense.findMany({
    where: {
      date: { gte: firstDayOfMonth, lte: lastDayOfMonth },
      deletedAt: null
    }
  });
  const totalOverheadMonth = overheadExpenses.reduce((acc, e) => acc + e.amount, 0);

  // Gastos de proyectos (ProjectExpense)
  const projectExpenses = await prisma.projectExpense.findMany({
    where: {
      createdAt: { gte: firstDayOfMonth, lte: lastDayOfMonth },
      deletedAt: null
    }
  });
  const totalProjExpensesMonth = projectExpenses.reduce((acc, e) => acc + e.amount, 0);

  // Mano de obra de empleados (ProjectEmployee)
  const employeePayments = await prisma.projectEmployee.findMany({
    where: {
      date: { gte: firstDayOfMonth, lte: lastDayOfMonth },
      deletedAt: null
    }
  });
  const totalEmployeeLaborMonth = employeePayments.reduce((acc, e) => acc + e.total, 0);

  // Mano de obra general/tercerizada (ProjectLabor)
  const directLaborExpenses = await prisma.projectLabor.findMany({
    where: {
      createdAt: { gte: firstDayOfMonth, lte: lastDayOfMonth },
      deletedAt: null
    }
  });
  const totalDirectLaborMonth = directLaborExpenses.reduce((acc, l) => acc + l.total, 0);

  // Materiales imputados este mes
  const projectMaterials = await prisma.projectMaterial.findMany({
    where: {
      createdAt: { gte: firstDayOfMonth, lte: lastDayOfMonth },
      deletedAt: null
    }
  });
  const totalMaterialsMonth = projectMaterials.reduce((acc, m) => acc + m.totalPrice, 0);

  const totalExpensesMonth = totalOverheadMonth + totalProjExpensesMonth + totalEmployeeLaborMonth + totalDirectLaborMonth + totalMaterialsMonth;

  // Ganancia neta del mes
  const netProfitMonth = totalBilledMonth - totalExpensesMonth;

  // 4. Total pendiente de cobro (saldo de proyectos activos)
  const activeProjects = await prisma.project.findMany({
    where: {
      status: { in: ['confirmado', 'en_proceso', 'finalizado'] },
      deletedAt: null
    },
    include: {
      payments: { where: { deletedAt: null } }
    }
  });

  let totalPendingCollect = 0;
  const clientsWithDebt: Array<{ id: string; clientName: string; projectNumber: string; balance: number }> = [];

  for (const proj of activeProjects) {
    const totalPaid = proj.payments.reduce((acc, p) => acc + p.amount, 0);
    const balance = proj.agreedPrice - totalPaid;
    if (balance > 0) {
      totalPendingCollect += balance;
      // Obtener cliente
      const client = await prisma.client.findUnique({ where: { id: proj.clientId } });
      clientsWithDebt.push({
        id: proj.id,
        clientName: client?.name || 'Cliente desconocido',
        projectNumber: proj.projectNumber,
        balance
      });
    }
  }

  // 5. Presupuestos sin confirmar (Alertas)
  const pendingBudgets = await prisma.project.findMany({
    where: { status: 'presupuesto', deletedAt: null },
    include: { client: true },
    take: 5
  });

  // 6. Trabajos próximos a entregar (próximos 10 días)
  const tenDaysFromNow = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
  const upcomingDeliveries = await prisma.project.findMany({
    where: {
      status: { in: ['confirmado', 'en_proceso'] },
      estimatedDeliveryDate: { gte: now, lte: tenDaysFromNow },
      deletedAt: null
    },
    include: { client: true },
    orderBy: { estimatedDeliveryDate: 'asc' },
    take: 5
  });

  // 7. Formateador de moneda argentina (ARS)
  const formatARS = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(val);
  };

  // 8. Datos para gráficos (simulados para los últimos 6 meses para visualización inicial)
  // Generaremos un gráfico SVG limpio
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
  const incomeData = [250000, 310000, 420000, 290000, 520000, totalBilledMonth];
  const expenseData = [180000, 210000, 290000, 240000, 340000, totalExpensesMonth];
  
  // Altura del gráfico SVG
  const graphHeight = 160;
  const maxVal = Math.max(...incomeData, ...expenseData, 500000);
  const scale = (val: number) => (val / maxVal) * graphHeight;

  // 9. Proyectos por tipo de mueble
  const furnitureTypeCounts = await prisma.project.groupBy({
    by: ['furnitureTypeId'],
    where: { deletedAt: null },
    _count: { id: true }
  });
  
  const furnitureTypes = await prisma.furnitureType.findMany({ where: { deletedAt: null } });
  const typeChartData = furnitureTypeCounts.map(count => {
    const type = furnitureTypes.find(t => t.id === count.furnitureTypeId);
    return {
      name: type?.name || 'Otro',
      qty: count._count.id
    };
  }).sort((a, b) => b.qty - a.qty);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ marginBottom: '5px' }}>Dashboard Principal</h1>
          <p>Resumen del estado operativo, financiero y alertas de la carpintería familiar.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', backgroundColor: 'var(--surface-color)', padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <Calendar size={16} style={{ color: 'var(--primary-color)' }} />
          <span>{now.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Indicadores Principales (Grid de Tarjetas) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
        
        {/* Trabajos Activos */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)' }}>
            <FolderKanban size={28} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Trabajos Activos</span>
            <span style={{ fontSize: '2rem', fontWeight: 700 }}>{activeProjectsCount}</span>
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>{inProgressCount} en proceso</span>
              <span>•</span>
              <span>{finishedCount} finalizados</span>
            </div>
          </div>
        </div>

        {/* Cobros del Mes */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--success-light)', color: 'var(--success-color)' }}>
            <DollarSign size={28} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Cobrado en el Mes</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--success-color)' }}>{formatARS(totalBilledMonth)}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>{paymentsThisMonth.length} transacciones registradas</span>
          </div>
        </div>

        {/* Pendiente de Cobro */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--warning-light)', color: 'var(--warning-color)' }}>
            <Clock size={28} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Pendiente de Cobro</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--warning-color)' }}>{formatARS(totalPendingCollect)}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>Saldos pendientes de clientes</span>
          </div>
        </div>

        {/* Ganancia Neta Estimada */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: netProfitMonth >= 0 ? 'var(--success-light)' : 'var(--error-light)', color: netProfitMonth >= 0 ? 'var(--success-color)' : 'var(--error-color)' }}>
            <TrendingUp size={28} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Ganancia Neta del Mes</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 700, color: netProfitMonth >= 0 ? 'var(--success-color)' : 'var(--error-color)' }}>{formatARS(netProfitMonth)}</span>
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>Gastos del mes: {formatARS(totalExpensesMonth)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Gráficos e Información Visual */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        
        {/* Gráfico Financiero SVG */}
        <div className="card">
          <div className="card-header">
            <h3>Flujo Financiero Semestral</h3>
            <div style={{ display: 'flex', gap: '15px', fontSize: '0.85rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--success-color)', display: 'inline-block' }}></span>
                Ingresos
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--error-color)', display: 'inline-block' }}></span>
                Gastos
              </span>
            </div>
          </div>
          <div style={{ position: 'relative', height: '200px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', paddingBottom: '25px', borderBottom: '1px solid var(--border-color)' }}>
            {months.map((m, idx) => {
              const incH = scale(incomeData[idx]);
              const expH = scale(expenseData[idx]);
              return (
                <div key={m} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '60px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: `${graphHeight}px`, width: '100%', justifyContent: 'center' }}>
                    {/* Barra Ingresos */}
                    <div style={{
                      height: `${incH}px`,
                      width: '14px',
                      backgroundColor: 'var(--success-color)',
                      borderRadius: '3px 3px 0 0',
                      transition: 'all 0.3s ease',
                      position: 'relative'
                    }} title={`Ingresos: ${formatARS(incomeData[idx])}`}></div>
                    {/* Barra Gastos */}
                    <div style={{
                      height: `${expH}px`,
                      width: '14px',
                      backgroundColor: 'var(--error-color)',
                      borderRadius: '3px 3px 0 0',
                      transition: 'all 0.3s ease',
                      position: 'relative'
                    }} title={`Gastos: ${formatARS(expenseData[idx])}`}></div>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>{m}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <span>Escala máx: {formatARS(maxVal)}</span>
            <span>Valores expresados en Pesos Argentinos (ARS)</span>
          </div>
        </div>

        {/* Trabajos por Tipo de Mueble */}
        <div className="card">
          <div className="card-header">
            <h3>Trabajos por Tipo</h3>
          </div>
          {typeChartData.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>No hay registros de trabajos cargados.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {typeChartData.map(item => {
                const percentage = Math.round((item.qty / activeProjectsCount) * 100) || 0;
                return (
                  <div key={item.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '5px' }}>
                      <span style={{ fontWeight: 500 }}>{item.name}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{item.qty} ({percentage}%)</span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${percentage}%`, backgroundColor: 'var(--primary-color)', borderRadius: 'var(--radius-full)' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Alertas y Notificaciones */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        
        {/* Alertas de Clientes con Saldo Pendiente */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ marginBottom: '15px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={20} style={{ color: 'var(--warning-color)' }} />
              Clientes con Saldo Pendiente
            </h3>
            <span className="badge badge-warning">{clientsWithDebt.length}</span>
          </div>
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {clientsWithDebt.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '20px 0', textAlign: 'center' }}>Todos los proyectos están cobrados al día.</p>
            ) : (
              clientsWithDebt.map(debt => (
                <div key={debt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-color)' }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', display: 'block' }}>{debt.clientName}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Proyecto: {debt.projectNumber}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 700, color: 'var(--error-color)', display: 'block', fontSize: '0.95rem' }}>{formatARS(debt.balance)}</span>
                    <Link href={`/proyectos/${debt.id}`} style={{ fontSize: '0.75rem', color: 'var(--primary-color)', display: 'inline-flex', alignItems: 'center', gap: '2px', marginTop: '2px' }}>
                      Ver detalles <ChevronRight size={12} />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Próximas Entregas */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ marginBottom: '15px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={20} style={{ color: 'var(--primary-color)' }} />
              Próximas Entregas (10 días)
            </h3>
            <span className="badge badge-primary">{upcomingDeliveries.length}</span>
          </div>
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {upcomingDeliveries.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '20px 0', textAlign: 'center' }}>No hay entregas programadas en los próximos 10 días.</p>
            ) : (
              upcomingDeliveries.map(proj => {
                const daysLeft = Math.round((new Date(proj.estimatedDeliveryDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={proj.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-color)' }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', display: 'block' }}>{proj.projectNumber} - {proj.client.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{proj.description.substring(0, 45)}...</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ 
                        fontWeight: 600, 
                        fontSize: '0.8rem',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: daysLeft <= 3 ? 'var(--error-light)' : 'var(--warning-light)',
                        color: daysLeft <= 3 ? 'var(--error-color)' : 'var(--warning-color)',
                        display: 'inline-block',
                        marginBottom: '4px'
                      }}>
                        {daysLeft <= 0 ? 'Hoy/Atrasado' : `En ${daysLeft} días`}
                      </span>
                      <Link href={`/proyectos/${proj.id}`} style={{ fontSize: '0.75rem', color: 'var(--primary-color)', display: 'block' }}>
                        Ir al trabajo
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Presupuestos sin Confirmar */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ marginBottom: '15px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={20} style={{ color: 'var(--text-muted)' }} />
              Presupuestos sin Confirmar
            </h3>
            <span className="badge badge-secondary">{pendingBudgets.length}</span>
          </div>
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pendingBudgets.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '20px 0', textAlign: 'center' }}>No hay presupuestos pendientes de confirmación.</p>
            ) : (
              pendingBudgets.map(budget => (
                <div key={budget.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-color)' }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', display: 'block' }}>{budget.projectNumber} - {budget.client.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Monto estimado: {formatARS(budget.agreedPrice)}</span>
                  </div>
                  <div>
                    <Link href={`/proyectos/${budget.id}`} className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                      Gestionar <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
