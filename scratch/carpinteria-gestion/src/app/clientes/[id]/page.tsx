import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getClientById } from '../actions';
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  MapPin, 
  Building, 
  FileText, 
  DollarSign, 
  FolderKanban,
  CheckCircle,
  Clock,
  Eye
} from 'lucide-react';


interface PageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 0;

export default async function ClientDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const client = await getClientById(resolvedParams.id);

  if (!client) {
    notFound();
  }

  // Formatear moneda argentina (ARS)
  const formatARS = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(val);
  };

  // Resumen Económico del Cliente
  const totalBilled = client.projects.reduce((acc, p) => acc + p.agreedPrice, 0);
  const totalCollected = client.projects.reduce((acc, p) => {
    const paid = p.payments.reduce((sum, pay) => sum + pay.amount, 0);
    return acc + paid;
  }, 0);
  const totalDebt = totalBilled - totalCollected;

  // Extraer todos los pagos del cliente ordenados por fecha
  const allPayments = client.projects.flatMap(p => 
    p.payments.map(pay => ({
      ...pay,
      projectNumber: p.projectNumber,
      projectId: p.id
    }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Navigation Header */}
      <div>
        <Link href="/clientes" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)', fontSize: '0.95rem', fontWeight: 500, marginBottom: '15px' }}>
          <ArrowLeft size={16} />
          <span>Volver a Clientes</span>
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1>Ficha de Cliente</h1>
            <p>Historial comercial y detalles de contacto de {client.name}.</p>
          </div>
          <span className="badge badge-primary" style={{ fontSize: '0.9rem', padding: '6px 14px' }}>
            Historial Activo
          </span>
        </div>
      </div>

      {/* Profile Details and Financial Summary Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'stretch' }}>
        
        {/* Contact Info Card */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: '20px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Building size={20} style={{ color: 'var(--primary-color)' }} />
              Datos de Contacto
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Nombre y Apellido</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{client.name}</span>
            </div>
            {client.companyName && (
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Razón Social</span>
                <span style={{ fontSize: '1.05rem', fontWeight: 500 }}>{client.companyName}</span>
              </div>
            )}
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>CUIT / DNI</span>
              <span style={{ fontSize: '1rem', fontFamily: 'monospace' }}>{client.taxId}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Teléfono</span>
                <span style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={14} style={{ color: 'var(--primary-color)' }} />
                  {client.phone}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Email</span>
                <span style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                  {client.email}
                </span>
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Dirección de Obra / Facturación</span>
              <span style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} style={{ color: 'var(--text-muted)' }} />
                <span>{client.address}, {client.city}</span>
              </span>
            </div>
            {client.notes && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '15px', marginTop: '5px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Observaciones del Cliente</span>
                <p style={{ fontSize: '0.9rem', fontStyle: 'italic', lineHeight: 1.5 }}>"{client.notes}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Financial Summary Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-header" style={{ marginBottom: '20px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <DollarSign size={20} style={{ color: 'var(--success-color)' }} />
                Balance de Cuenta Cliente
              </h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Facturado Histórico</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 700 }}>{formatARS(totalBilled)}</span>
              </div>
              <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--success-light)', border: '1px solid var(--success-color)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--success-color)', display: 'block', marginBottom: '4px' }}>Total Cobrado</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--success-color)' }}>{formatARS(totalCollected)}</span>
              </div>
            </div>
          </div>
          
          <div style={{ padding: '20px', borderRadius: 'var(--radius-md)', backgroundColor: totalDebt > 0 ? 'var(--warning-light)' : 'var(--success-light)', border: `1px solid ${totalDebt > 0 ? 'var(--warning-color)' : 'var(--success-color)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: totalDebt > 0 ? 'var(--warning-color)' : 'var(--success-color)', fontWeight: 600, display: 'block', marginBottom: '2px' }}>
                {totalDebt > 0 ? 'Saldo Deudor Pendiente' : 'Cuenta al Día / Sin Deudas'}
              </span>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: totalDebt > 0 ? 'var(--error-color)' : 'var(--success-color)' }}>
                {formatARS(totalDebt)}
              </span>
            </div>
            <div style={{ padding: '12px', borderRadius: 'var(--radius-full)', backgroundColor: '#ffffff', color: totalDebt > 0 ? 'var(--warning-color)' : 'var(--success-color)' }}>
              {totalDebt > 0 ? <Clock size={28} /> : <CheckCircle size={28} />}
            </div>
          </div>
        </div>

      </div>

      {/* Tabs / Sub-tables Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' }}>
        
        {/* Projects History */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: '15px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FolderKanban size={20} style={{ color: 'var(--primary-color)' }} />
              Trabajos / Proyectos Relacionados
            </h3>
            <span className="badge badge-primary">{client.projects.length}</span>
          </div>
          {client.projects.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>No hay proyectos registrados para este cliente.</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Descripción</th>
                    <th>Estado</th>
                    <th>Precio</th>
                    <th style={{ textAlign: 'right' }}>Ver</th>
                  </tr>
                </thead>
                <tbody>
                  {client.projects.map(p => {
                    const paid = p.payments.reduce((sum, pay) => sum + pay.amount, 0);
                    const debt = p.agreedPrice - paid;
                    return (
                      <tr key={p.id}>
                        <td>
                          <span style={{ fontWeight: 600 }}>{p.projectNumber}</span>
                        </td>
                        <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.description}>
                          {p.description}
                        </td>
                        <td>
                          <span className={`badge ${
                            p.status === 'entregado' ? 'badge-success' : 
                            p.status === 'cancelado' ? 'badge-danger' : 
                            p.status === 'presupuesto' ? 'badge-secondary' : 'badge-primary'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{formatARS(p.agreedPrice)}</div>
                          {debt > 0 && <div style={{ fontSize: '0.75rem', color: 'var(--error-color)' }}>Debe {formatARS(debt)}</div>}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Link href={`/proyectos/${p.id}`} className="btn btn-secondary btn-sm" style={{ padding: '6px' }}>
                            <Eye size={14} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payments History */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: '15px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText size={20} style={{ color: 'var(--success-color)' }} />
              Historial de Pagos Recibidos
            </h3>
            <span className="badge badge-success">{allPayments.length}</span>
          </div>
          {allPayments.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>No se registran cobros para este cliente.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {allPayments.map(p => (
                <div key={p.id} style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
                      {new Date(p.date).toLocaleDateString('es-AR')}
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      Pago Proyecto {p.projectNumber}
                    </span>
                    {p.notes && <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{p.notes}</p>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 700, color: 'var(--success-color)', display: 'block', fontSize: '0.95rem' }}>
                      +{formatARS(p.amount)}
                    </span>
                    <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '2px 6px', marginTop: '2px', display: 'inline-block' }}>
                      Método ID
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
