'use client';

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Save, 
  Check, 
  Trash2, 
  Plus, 
  Upload, 
  Download, 
  Maximize2, 
  Minimize2,
  AlertTriangle,
  Scissors,
  CheckCircle,
  FileText
} from 'lucide-react';
import { optimizeCuts, Part, Sheet, OptimizationResult } from '@/lib/cutlistOptimizer';
import { saveCutlist, confirmCutlistCuts } from '@/app/proyectos/actions';

const formatARS = (val: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0
  }).format(val);
};

interface CutlistOptimizerProps {
  projectId: string;
  materialCategories: any[];
  inventory: any[];
  initialCutlist: any;
  projectNumber: string;
  onConfirmSuccess?: () => void;
}

export default function CutlistOptimizer({
  projectId,
  materialCategories,
  inventory,
  initialCutlist,
  projectNumber,
  onConfirmSuccess
}: CutlistOptimizerProps) {
  // Config options
  const [kerf, setKerf] = useState(4);
  const [edgeTrim, setEdgeTrim] = useState(10);
  const [useGrain, setUseGrain] = useState(true);

  // Parts list
  const [parts, setParts] = useState<Part[]>([
    { length: 600, width: 400, qty: 4, label: 'Frente Cajón', material: 'Melamina Blanca', thickness: 18, notes: 'Veta horizontal' },
    { length: 800, width: 500, qty: 2, label: 'Lateral Módulo', material: 'Melamina Blanca', thickness: 18 }
  ]);

  // Hojas/Placas disponibles
  const [sheets, setSheets] = useState<Sheet[]>([
    { length: 2750, width: 1830, qty: 2, material: 'Melamina Blanca', thickness: 18, cost: 45000, notes: 'Placa estándar' }
  ]);

  // Results
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [zoomScale, setZoomScale] = useState(0.2); // Escala para renderizado SVG
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Cargar datos guardados si existen
  useEffect(() => {
    if (initialCutlist) {
      try {
        setKerf(initialCutlist.kerf || 4);
        setEdgeTrim(initialCutlist.edgeTrim || 10);
        setUseGrain(initialCutlist.useGrain !== undefined ? initialCutlist.useGrain : true);
        if (initialCutlist.parts) setParts(JSON.parse(initialCutlist.parts));
        if (initialCutlist.sheets) setSheets(JSON.parse(initialCutlist.sheets));
        if (initialCutlist.results) setOptimizationResult(JSON.parse(initialCutlist.results));
      } catch (e) {
        console.error('Error al parsear cutlist guardado:', e);
      }
    }
  }, [initialCutlist]);

  // Cargar plantilla desde inventario para comodidad del usuario
  const handleLoadSheetFromInventory = (invItem: any) => {
    // Intentar extraer largo y ancho del nombre, ej: "2.75x1.83" -> 2750x1830
    let length = 2750;
    let width = 1830;
    const regex = /(\d+[\.,]\d+)\s*[xX]\s*(\d+[\.,]\d+)/;
    const match = invItem.name.match(regex);
    if (match) {
      length = Math.round(parseFloat(match[1].replace(',', '.')) * 1000);
      width = Math.round(parseFloat(match[2].replace(',', '.')) * 1000);
    }
    
    // Buscar si ya existe la placa del mismo material y tamaño
    const exists = sheets.find(s => s.material === invItem.name);
    if (exists) {
      alert('Esta placa ya está agregada en la lista de disponibles.');
      return;
    }

    setSheets(prev => [
      ...prev,
      {
        length,
        width,
        qty: invItem.currentStock || 1,
        material: invItem.name,
        thickness: 18, // Grosor estimado por defecto
        cost: invItem.unitCost,
        notes: `Vinculado a Stock (Id: ${invItem.id})`
      }
    ]);
  };

  // Agregar fila de piezas
  const handleAddPart = () => {
    setParts(prev => [
      ...prev,
      { length: 500, width: 300, qty: 1, label: `Pieza ${prev.length + 1}`, material: sheets[0]?.material || 'Melamina Blanca', thickness: 18 }
    ]);
  };

  // Remover fila de piezas
  const handleRemovePart = (idx: number) => {
    setParts(prev => prev.filter((_, i) => i !== idx));
  };

  // Editar valor de pieza
  const handleUpdatePart = (idx: number, field: keyof Part, value: any) => {
    setParts(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  // Agregar fila de placas
  const handleAddSheet = () => {
    setSheets(prev => [
      ...prev,
      { length: 2750, width: 1830, qty: 1, material: 'Melamina Blanca', thickness: 18, cost: 45000 }
    ]);
  };

  // Remover fila de placas
  const handleRemoveSheet = (idx: number) => {
    setSheets(prev => prev.filter((_, i) => i !== idx));
  };

  // Editar valor de placa
  const handleUpdateSheet = (idx: number, field: keyof Sheet, value: any) => {
    setSheets(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  // Ejecutar el algoritmo de empaquetamiento 2D
  const handleOptimize = () => {
    setMessage(null);
    if (parts.length === 0 || sheets.length === 0) {
      setMessage({ type: 'error', text: 'Debe cargar al menos una pieza y una placa disponible.' });
      return;
    }

    const result = optimizeCuts(parts, sheets, { kerf, edgeTrim, useGrain });
    setOptimizationResult(result);
    setIsConfirmed(false);
  };

  // Guardar configuración del Cutlist en base de datos
  const handleSaveCutlist = async () => {
    setLoading(true);
    setMessage(null);
    const res = await saveCutlist({
      projectId,
      kerf,
      edgeTrim,
      useGrain,
      parts,
      sheets,
      results: optimizationResult
    });

    if (res.success) {
      setMessage({ type: 'success', text: 'Configuración de corte guardada con éxito.' });
    } else {
      setMessage({ type: 'error', text: res.error || 'Error al guardar configuración.' });
    }
    setLoading(false);
  };

  // Confirmar y aplicar cortes a costos del proyecto e inventario de stock
  const handleConfirmAndApply = async () => {
    if (!optimizationResult || optimizationResult.results.length === 0) return;
    
    if (!confirm('Al confirmar, se descontarán las placas del inventario de stock y se imputará su costo automáticamente a los materiales del proyecto. ¿Desea proceder?')) return;

    setLoading(true);
    setMessage(null);

    // Mapear placas utilizadas para descontar de inventario y agregar a materiales
    const sheetsUsedMap: Array<{
      materialName: string;
      materialCategoryId: string;
      quantityUsed: number;
      unitPrice: number;
      inventoryMaterialId?: string | null;
    }> = [];

    // Categoría melamina/MDF por defecto
    const defaultCategory = materialCategories.find(c => c.name === 'Melamina' || c.name === 'MDF') || materialCategories[0];

    optimizationResult.results.forEach(res => {
      // Buscar la configuración de la placa original en sheets
      // res.sheetIndex es 1-indexed, flatSheets se mapeó desde sheets
      // Recuperar el material name buscando coincidencia en el array original sheets
      const originalSheet = sheets.find(s => s.length === res.sheetLength && s.width === res.sheetWidth && s.cost === res.cost);
      const matName = originalSheet?.material || 'Placa Melamina';
      
      // Intentar extraer el ID del inventario si está guardado en notes
      let invId: string | null = null;
      if (originalSheet?.notes && originalSheet.notes.includes('Id:')) {
        const match = originalSheet.notes.match(/Id:\s*([a-fA-F0-9\-]+)/);
        if (match) invId = match[1];
      }

      // Agrupar cantidades para pasarlo consolidado
      const existing = sheetsUsedMap.find(s => s.materialName === matName && s.unitPrice === res.cost);
      if (existing) {
        existing.quantityUsed += 1;
      } else {
        sheetsUsedMap.push({
          materialName: matName,
          materialCategoryId: defaultCategory?.id || '',
          quantityUsed: 1,
          unitPrice: res.cost,
          inventoryMaterialId: invId
        });
      }
    });

    const resCuts = await confirmCutlistCuts(projectId, sheetsUsedMap);
    
    if (resCuts.success) {
      // Guardar también la optimización
      await saveCutlist({
        projectId,
        kerf,
        edgeTrim,
        useGrain,
        parts,
        sheets,
        results: optimizationResult
      });
      
      setIsConfirmed(true);
      setMessage({ type: 'success', text: 'Corte confirmado. Placas imputadas a costos de materiales del proyecto y descontadas de stock.' });
      if (onConfirmSuccess) onConfirmSuccess();
    } else {
      setMessage({ type: 'error', text: ('error' in resCuts ? resCuts.error : null) || 'Error al aplicar cortes a inventario.' });
    }
    setLoading(false);
  };

  // Exportar piezas a CSV
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,Etiqueta,Largo,Ancho,Cantidad,Material,Espesor,Notas\n';
    parts.forEach(p => {
      csvContent += `"${p.label}",${p.length},${p.width},${p.qty},"${p.material}",${p.thickness},"${p.notes || ''}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `piezas_corte_${projectNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Importar CSV
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      // Saltar cabecera
      const newParts: Part[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.replace(/"/g, '').trim());
        if (cols.length >= 4) {
          newParts.push({
            label: cols[0],
            length: parseInt(cols[1]) || 500,
            width: parseInt(cols[2]) || 300,
            qty: parseInt(cols[3]) || 1,
            material: cols[4] || sheets[0]?.material || 'Melamina Blanca',
            thickness: parseInt(cols[5]) || 18,
            notes: cols[6] || ''
          });
        }
      }
      if (newParts.length > 0) {
        setParts(newParts);
        setMessage({ type: 'success', text: `Importadas ${newParts.length} piezas con éxito.` });
      } else {
        setMessage({ type: 'error', text: 'El archivo CSV no tiene el formato correcto.' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '20px', alignItems: 'stretch' }}>
      
      {/* Left panel: Config and lists */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Action buttons */}
        <div className="card" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary btn-sm" onClick={handleOptimize} disabled={loading}>
              <Play size={14} />
              <span>Optimizar</span>
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleSaveCutlist} disabled={loading}>
              <Save size={14} />
              <span>Guardar Config</span>
            </button>
          </div>
          {optimizationResult && (
            <button 
              className={`btn btn-sm ${isConfirmed ? 'btn-secondary' : 'btn-primary'}`} 
              style={{ backgroundColor: isConfirmed ? 'var(--success-light)' : 'var(--primary-color)', color: isConfirmed ? 'var(--success-color)' : '#ffffff', borderColor: isConfirmed ? 'var(--success-color)' : 'transparent' }}
              onClick={handleConfirmAndApply} 
              disabled={loading || isConfirmed}
            >
              {isConfirmed ? <CheckCircle size={14} /> : <Scissors size={14} />}
              <span>{isConfirmed ? 'Corte Aplicado' : 'Confirmar e Imputar'}</span>
            </button>
          )}
        </div>

        {message && (
          <div style={{ 
            backgroundColor: message.type === 'success' ? 'var(--success-light)' : 'var(--error-light)', 
            color: message.type === 'success' ? 'var(--success-color)' : 'var(--error-color)', 
            padding: '12px', 
            borderRadius: 'var(--radius-sm)', 
            fontSize: '0.85rem',
            border: `1px solid ${message.type === 'success' ? 'var(--success-color)' : 'var(--error-color)'}`
          }}>
            {message.text}
          </div>
        )}

        {/* Options */}
        <div className="card">
          <h3>Opciones de Cálculo</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Grosor de sierra (Kerf mm)</label>
              <input
                type="number"
                className="form-control"
                value={kerf}
                onChange={(e) => setKerf(Number(e.target.value))}
                min="0"
                max="10"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Refilado de bordes (mm)</label>
              <input
                type="number"
                className="form-control"
                value={edgeTrim}
                onChange={(e) => setEdgeTrim(Number(e.target.value))}
                min="0"
                max="50"
              />
            </div>
          </div>
          <div style={{ marginTop: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={useGrain}
                onChange={(e) => setUseGrain(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Respetar dirección del grano / veta</span>
            </label>
          </div>
        </div>

        {/* Placas Disponibles */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3>1. Hojas / Placas Disponibles</h3>
            <button className="btn btn-secondary btn-sm" onClick={handleAddSheet} style={{ padding: '4px 8px' }}>
              <Plus size={14} />
            </button>
          </div>
          
          {/* Cargar desde stock dropdown */}
          <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Cargar placa desde stock</label>
            <select
              className="form-control"
              style={{ fontSize: '0.8rem', padding: '6px' }}
              onChange={(e) => {
                const item = inventory.find(i => i.id === e.target.value);
                if (item) handleLoadSheetFromInventory(item);
                e.target.value = '';
              }}
              defaultValue=""
            >
              <option value="" disabled>-- Seleccionar madera de stock --</option>
              {inventory
                .filter(i => i.currentStock > 0 && (i.materialCategory.name.toLowerCase().includes('melamina') || i.materialCategory.name.toLowerCase().includes('mdf') || i.unit === 'placa'))
                .map(i => (
                  <option key={i.id} value={i.id}>{i.name} (Stock: {i.currentStock})</option>
                ))}
            </select>
          </div>

          <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sheets.map((sheet, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 0.8fr 0.8fr 0.8fr 0.3fr', gap: '8px', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                <input
                  type="text"
                  className="form-control"
                  style={{ fontSize: '0.8rem', padding: '6px' }}
                  placeholder="Material"
                  value={sheet.material}
                  onChange={(e) => handleUpdateSheet(idx, 'material', e.target.value)}
                />
                <input
                  type="number"
                  className="form-control"
                  style={{ fontSize: '0.8rem', padding: '6px' }}
                  placeholder="Largo mm"
                  value={sheet.length}
                  onChange={(e) => handleUpdateSheet(idx, 'length', Number(e.target.value))}
                  title="Longitud"
                />
                <input
                  type="number"
                  className="form-control"
                  style={{ fontSize: '0.8rem', padding: '6px' }}
                  placeholder="Ancho mm"
                  value={sheet.width}
                  onChange={(e) => handleUpdateSheet(idx, 'width', Number(e.target.value))}
                  title="Ancho"
                />
                <input
                  type="number"
                  className="form-control"
                  style={{ fontSize: '0.8rem', padding: '6px' }}
                  placeholder="Cant"
                  value={sheet.qty}
                  onChange={(e) => handleUpdateSheet(idx, 'qty', Number(e.target.value))}
                  title="Cantidad"
                />
                <input
                  type="number"
                  className="form-control"
                  style={{ fontSize: '0.8rem', padding: '6px' }}
                  placeholder="Costo"
                  value={sheet.cost}
                  onChange={(e) => handleUpdateSheet(idx, 'cost', Number(e.target.value))}
                  title="Costo por placa"
                />
                <button 
                  type="button" 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error-color)' }}
                  onClick={() => handleRemoveSheet(idx)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Piezas a Cortar */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3>2. Piezas a Cortar</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              {/* Import CSV */}
              <label className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', cursor: 'pointer' }}>
                <Upload size={14} />
                <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImportCSV} />
              </label>
              <button className="btn btn-secondary btn-sm" onClick={handleExportCSV} title="Exportar Piezas CSV" style={{ padding: '4px 8px' }}>
                <Download size={14} />
              </button>
              <button className="btn btn-secondary btn-sm" onClick={handleAddPart} style={{ padding: '4px 8px' }}>
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {parts.map((part, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 0.8fr 0.6fr 1fr 0.3fr', gap: '8px', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                <input
                  type="text"
                  className="form-control"
                  style={{ fontSize: '0.8rem', padding: '6px' }}
                  placeholder="Etiqueta"
                  value={part.label}
                  onChange={(e) => handleUpdatePart(idx, 'label', e.target.value)}
                />
                <input
                  type="number"
                  className="form-control"
                  style={{ fontSize: '0.8rem', padding: '6px' }}
                  placeholder="Largo"
                  value={part.length}
                  onChange={(e) => handleUpdatePart(idx, 'length', Number(e.target.value))}
                />
                <input
                  type="number"
                  className="form-control"
                  style={{ fontSize: '0.8rem', padding: '6px' }}
                  placeholder="Ancho"
                  value={part.width}
                  onChange={(e) => handleUpdatePart(idx, 'width', Number(e.target.value))}
                />
                <input
                  type="number"
                  className="form-control"
                  style={{ fontSize: '0.8rem', padding: '6px' }}
                  placeholder="Cant"
                  value={part.qty}
                  onChange={(e) => handleUpdatePart(idx, 'qty', Number(e.target.value))}
                />
                <input
                  type="text"
                  className="form-control"
                  style={{ fontSize: '0.8rem', padding: '6px' }}
                  placeholder="Notas (ej: Veta)"
                  value={part.notes || ''}
                  onChange={(e) => handleUpdatePart(idx, 'notes', e.target.value)}
                />
                <button 
                  type="button" 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error-color)' }}
                  onClick={() => handleRemovePart(idx)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Right panel: SVG visual layout and yield results */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Yield Results Summary */}
        {optimizationResult && (
          <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '15px', padding: '16px' }}>
            <div style={{ padding: '8px', borderRight: '1px solid var(--border-color)', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Aprovechamiento</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success-color)' }}>
                {optimizationResult.totals.utilizationPercentage}%
              </span>
            </div>
            <div style={{ padding: '8px', borderRight: '1px solid var(--border-color)', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Placas Usadas</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                {optimizationResult.totals.sheetsUsedCount}
              </span>
            </div>
            <div style={{ padding: '8px', borderRight: '1px solid var(--border-color)', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Costo Placas</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                {formatARS(optimizationResult.totals.totalSheetsCost)}
              </span>
            </div>
            <div style={{ padding: '8px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Pérdida ($)</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--error-color)' }}>
                {formatARS(optimizationResult.totals.wastedCost)}
              </span>
            </div>
          </div>
        )}

        {/* Visual Render Container */}
        <div className="card" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: '500px' }}>
          <div className="card-header" style={{ marginBottom: '10px' }}>
            <h3>Plano de Cortes</h3>
            {optimizationResult && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Zoom:</span>
                <input
                  type="range"
                  min="0.05"
                  max="0.6"
                  step="0.02"
                  value={zoomScale}
                  onChange={(e) => setZoomScale(parseFloat(e.target.value))}
                  style={{ width: '80px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{Math.round(zoomScale * 100 * 5)}%</span>
              </div>
            )}
          </div>

          <div style={{ 
            flexGrow: 1, 
            backgroundColor: 'var(--bg-color)', 
            border: '1px dashed var(--border-color)', 
            borderRadius: 'var(--radius-sm)', 
            overflow: 'auto', 
            padding: '20px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '30px',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {!optimizationResult ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <Scissors size={40} style={{ marginBottom: '10px', display: 'inline-block' }} />
                <p>Cargue piezas y placas, y presione el botón <strong>Optimizar</strong> para generar el diagrama de cortes.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', width: '100%', alignItems: 'center' }}>
                {optimizationResult.results.map((res, sheetIdx) => {
                  const svgW = res.sheetWidth * zoomScale;
                  const svgH = res.sheetLength * zoomScale;
                  return (
                    <div key={sheetIdx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Placa #{res.sheetIndex} ({res.sheetWidth} x {res.sheetLength} mm) - Rendimiento: {res.utilizationPercentage}%
                      </div>
                      
                      <div style={{
                        boxShadow: 'var(--shadow-md)',
                        border: '2px solid #78350f', // Wood border
                        backgroundColor: '#1c1917', // Dark wood background
                        display: 'inline-block',
                      }}>
                        <svg width={svgW} height={svgH} style={{ display: 'block' }}>
                          {/* Fondo de refilado / descarte inicial */}
                          <rect 
                            x={0} 
                            y={0} 
                            width={res.sheetWidth * zoomScale} 
                            height={res.sheetLength * zoomScale} 
                            fill="rgba(239, 68, 68, 0.08)"
                          />
                          
                          {/* Área útil de placa */}
                          <rect
                            x={edgeTrim * zoomScale}
                            y={edgeTrim * zoomScale}
                            width={(res.sheetWidth - edgeTrim * 2) * zoomScale}
                            height={(res.sheetLength - edgeTrim * 2) * zoomScale}
                            fill="#292524" // Dark grey surface
                            stroke="rgba(255, 255, 255, 0.1)"
                            strokeWidth={1}
                          />

                          {/* Piezas colocadas */}
                          {res.placedParts.map((part, pIdx) => {
                            const px = part.x * zoomScale;
                            const py = part.y * zoomScale;
                            const pw = part.w * zoomScale;
                            const ph = part.h * zoomScale;

                            // Color de pieza premium (acento amber-wood)
                            return (
                              <g key={pIdx}>
                                <rect
                                  x={px}
                                  y={py}
                                  width={pw}
                                  height={ph}
                                  fill="#f59e0b" // Amber/Gold piece
                                  stroke="#78350f" // Brown border
                                  strokeWidth={1}
                                >
                                  <title>{`${part.label}: ${part.h}x${part.w}`}</title>
                                </rect>
                                {/* Etiqueta */}
                                {pw > 30 && ph > 20 && (
                                  <text
                                    x={px + pw / 2}
                                    y={py + ph / 2}
                                    fontSize={Math.max(9, 14 * zoomScale)}
                                    fontWeight="600"
                                    fill="#451a03"
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                  >
                                    {part.label}
                                  </text>
                                )}
                                {/* Medida */}
                                {pw > 40 && ph > 35 && (
                                  <text
                                    x={px + pw / 2}
                                    y={py + ph / 2 + 10}
                                    fontSize={Math.max(8, 11 * zoomScale)}
                                    fill="#78350f"
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                  >
                                    {Math.round(part.h)}x{Math.round(part.w)}
                                  </text>
                                )}
                              </g>
                            );
                          })}

                          {/* Renderizar espacios libres de desperdicio */}
                          {res.freeSpaces.map((space, sIdx) => {
                            const sx = space.x * zoomScale;
                            const sy = space.y * zoomScale;
                            const sw = space.w * zoomScale;
                            const sh = space.h * zoomScale;

                            if (sw > 3 && sh > 3) {
                              return (
                                <g key={`free-${sIdx}`}>
                                  {/* Patrón rayado para descarte */}
                                  <rect
                                    x={sx}
                                    y={sy}
                                    width={sw}
                                    height={sh}
                                    fill="rgba(255,255,255,0.05)"
                                    stroke="rgba(255, 255, 255, 0.15)"
                                    strokeDasharray="2,2"
                                  />
                                  {sw > 30 && sh > 20 && (
                                    <text
                                      x={sx + sw / 2}
                                      y={sy + sh / 2}
                                      fontSize={9}
                                      fill="rgba(255,255,255,0.3)"
                                      textAnchor="middle"
                                      dominantBaseline="middle"
                                    >
                                      Sobrante
                                    </text>
                                  )}
                                </g>
                              );
                            }
                            return null;
                          })}
                        </svg>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Unplaced pieces warning */}
          {optimizationResult && optimizationResult.unplacedParts.length > 0 && (
            <div style={{ 
              marginTop: '15px', 
              backgroundColor: 'var(--error-light)', 
              color: 'var(--error-color)', 
              padding: '12px', 
              borderRadius: 'var(--radius-sm)', 
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              border: '1px solid var(--error-color)'
            }}>
              <AlertTriangle size={20} />
              <div>
                <strong>Atención:</strong> Las siguientes piezas no cupieron en las placas cargadas:
                <ul style={{ paddingLeft: '20px', marginTop: '4px' }}>
                  {optimizationResult.unplacedParts.map((p, idx) => (
                    <li key={idx}>{p.label} ({p.h}x{p.w}mm) x {p.qty} unidad(es)</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
