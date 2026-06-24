'use client';

import React, { useState } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  RefreshCcw
} from 'lucide-react';
import { exportDatabaseBackup, importDatabaseBackup } from './actions';

export default function RespaldosPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Export database to JSON file
  const handleExport = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await exportDatabaseBackup();
      if (res.success && res.backup) {
        const blob = new Blob([res.backup], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
        
        link.download = `respaldo_carpinteria_${dateStr}_${timeStr}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        setMessage({ type: 'success', text: 'Copia de seguridad exportada y descargada con éxito.' });
      } else {
        setMessage({ type: 'error', text: res.error || 'Error al exportar base de datos' });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Error de conexión' });
    } finally {
      setLoading(false);
    }
  };

  // Import database from JSON file
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('ATENCIÓN: Al restaurar esta copia de seguridad, se borrarán TODOS los datos actuales de la aplicación y se reemplazarán por los del archivo. ¿Está seguro de que desea continuar?')) {
      e.target.value = '';
      return;
    }

    setLoading(true);
    setMessage(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const res = await importDatabaseBackup(text);
        
        if (res.success) {
          setMessage({
            type: 'success',
            text: 'Base de datos restaurada con éxito. Todos los registros, costos e inventario se han sincronizado con la copia de seguridad.'
          });
        } else {
          setMessage({ type: 'error', text: ('error' in res ? res.error : null) || 'Error al restaurar respaldo' });
        }
      } catch (err: any) {
        setMessage({ type: 'error', text: 'El archivo seleccionado no tiene un formato JSON válido.' });
      } finally {
        setLoading(false);
        e.target.value = ''; // Limpiar input
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Page Header */}
      <div>
        <h1 style={{ marginBottom: '5px' }}>Copias de Seguridad (Backup)</h1>
        <p>Exportá respaldos de toda la información comercial del taller o restaurá una copia anterior.</p>
      </div>

      {message && (
        <div style={{ 
          backgroundColor: message.type === 'success' ? 'var(--success-light)' : 'var(--error-light)', 
          color: message.type === 'success' ? 'var(--success-color)' : 'var(--error-color)', 
          padding: '16px', 
          borderRadius: 'var(--radius-md)', 
          fontSize: '0.9rem',
          border: `1px solid ${message.type === 'success' ? 'var(--success-color)' : 'var(--error-color)'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {message.type === 'success' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Backup and Restore options grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        
        {/* Card 1: Export */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '20px' }}>
          <div>
            <div className="card-header" style={{ marginBottom: '15px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Download size={20} style={{ color: 'var(--success-color)' }} />
                Exportar Base de Datos
              </h3>
            </div>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
              Generá una copia de seguridad completa con todos los clientes, empleados, inventarios, costos de proyectos, transacciones de stock e historial de pagos.
            </p>
            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              El archivo descargado se guardará en formato <strong>.json</strong>. Guardá esta copia en un pendrive o en la nube periódicamente.
            </div>
          </div>
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px', fontWeight: 600 }}
            onClick={handleExport}
            disabled={loading}
          >
            {loading ? 'Compilando datos...' : 'Descargar Copia de Seguridad'}
          </button>
        </div>

        {/* Card 2: Import */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '20px' }}>
          <div>
            <div className="card-header" style={{ marginBottom: '15px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Upload size={20} style={{ color: 'var(--warning-color)' }} />
                Restaurar Base de Datos
              </h3>
            </div>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
              Cargá un archivo de respaldo previamente exportado para recuperar la base de datos completa.
            </p>
            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: 'var(--error-light)', color: 'var(--error-color)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>
                <strong>ADVERTENCIA:</strong> Esta acción sobrescribirá todos los datos actuales del taller de forma definitiva. Asegúrese de cargar el archivo correcto.
              </span>
            </div>
          </div>
          <label className="btn btn-secondary" style={{ width: '100%', padding: '12px', fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}>
            {loading ? 'Procesando archivo...' : 'Seleccionar Archivo e Importar'}
            <input 
              type="file" 
              accept=".json" 
              style={{ display: 'none' }} 
              onChange={handleImport} 
              disabled={loading} 
            />
          </label>
        </div>

      </div>

      {/* Migration Info Section */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <Database size={20} style={{ color: 'var(--primary-color)' }} />
          <h3>Migración de Base de Datos y Portabilidad</h3>
        </div>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Este archivo de respaldo en formato JSON es universal. Si en el futuro decide migrar de la base de datos local SQLite a una base de datos PostgreSQL alojada en un servidor para utilizar el sistema en múltiples computadoras o sucursales del taller, podrá importar este mismo archivo JSON en la nueva base de datos sin perder ningún dato de facturación, clientes o historial laboral.
        </p>
      </div>

    </div>
  );
}
