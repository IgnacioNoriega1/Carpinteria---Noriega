'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye, 
  X,
  Phone,
  Mail,
  MapPin,
  Building,
  UserCheck
} from 'lucide-react';
import { createClient, updateClient, deleteClient } from './actions';

interface Client {
  id: string;
  name: string;
  companyName: string | null;
  taxId: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  notes: string | null;
  createdAt: Date;
}

interface ClientListProps {
  initialClients: Client[];
}

export default function ClientList({ initialClients }: ClientListProps) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');
  
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Search logic
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const query = searchQuery.toLowerCase();
    return clients.filter(c => 
      c.name.toLowerCase().includes(query) ||
      (c.companyName && c.companyName.toLowerCase().includes(query)) ||
      c.taxId.includes(query) ||
      c.city.toLowerCase().includes(query)
    );
  }, [clients, searchQuery]);

  // Open Modal for Create
  const handleOpenCreate = () => {
    setEditingClient(null);
    setName('');
    setCompanyName('');
    setTaxId('');
    setPhone('');
    setEmail('');
    setAddress('');
    setCity('');
    setNotes('');
    setFormError('');
    setShowModal(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setCompanyName(client.companyName || '');
    setTaxId(client.taxId);
    setPhone(client.phone);
    setEmail(client.email);
    setAddress(client.address);
    setCity(client.city);
    setNotes(client.notes || '');
    setFormError('');
    setShowModal(true);
  };

  // Handle Form Submit (Create/Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    const clientData = {
      name,
      companyName: companyName || null,
      taxId,
      phone,
      email,
      address,
      city,
      notes: notes || null
    };

    if (editingClient) {
      // Update
      const res = await updateClient(editingClient.id, clientData);
      if (res.success && res.client) {
        // Cast date string from action response to Date object
        const updated = { ...res.client, createdAt: new Date(res.client.createdAt) } as Client;
        setClients(prev => prev.map(c => c.id === editingClient.id ? updated : c));
        setShowModal(false);
      } else {
        setFormError(res.error || 'Error al actualizar cliente');
      }
    } else {
      // Create
      const res = await createClient(clientData);
      if (res.success && res.client) {
        const created = { ...res.client, createdAt: new Date(res.client.createdAt) } as Client;
        setClients(prev => [created, ...prev]);
        setShowModal(false);
      } else {
        setFormError(res.error || 'Error al crear cliente');
      }
    }
    setFormLoading(false);
  };

  // Handle Delete (Soft delete)
  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este cliente? Se mantendrá en el historial pero ya no aparecerá en búsquedas activas.')) return;
    
    const res = await deleteClient(id);
    if (res.success) {
      setClients(prev => prev.filter(c => c.id !== id));
    } else {
      alert(res.error || 'Error al eliminar cliente');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Search and Action Bar */}
      <div style={{ display: 'flex', gap: '15px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', maxWidth: '400px', width: '100%' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por nombre, CUIT/DNI, razón social..."
            style={{ paddingLeft: '40px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-muted)' }} />
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={18} />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Clients Table */}
      {filteredClients.length === 0 ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <UserCheck size={48} style={{ color: 'var(--text-muted)', marginBottom: '15px', display: 'inline-block' }} />
          <p style={{ color: 'var(--text-muted)' }}>No se encontraron clientes activos.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Cliente / Razón Social</th>
                <th>CUIT / DNI</th>
                <th>Contacto</th>
                <th>Ubicación</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr key={client.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{client.name}</div>
                    {client.companyName && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <Building size={12} /> {client.companyName}
                      </div>
                    )}
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{client.taxId}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.85rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={12} style={{ color: 'var(--primary-color)' }} />
                        {client.phone}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={12} style={{ color: 'var(--text-muted)' }} />
                        {client.email}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                      <MapPin size={12} style={{ color: 'var(--text-muted)' }} />
                      <span>{client.address}, {client.city}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <Link href={`/clientes/${client.id}`} className="btn btn-secondary btn-sm" title="Ver ficha e historial" style={{ padding: '6px' }}>
                        <Eye size={15} />
                      </Link>
                      <button className="btn btn-secondary btn-sm" title="Editar" style={{ padding: '6px' }} onClick={() => handleOpenEdit(client)}>
                        <Edit2 size={15} style={{ color: 'var(--primary-color)' }} />
                      </button>
                      <button className="btn btn-secondary btn-sm" title="Eliminar" style={{ padding: '6px' }} onClick={() => handleDelete(client.id)}>
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
              <h3>{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
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
                    placeholder="ej: Juan Pérez"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Razón Social (Opcional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="ej: Muebles Pérez SRL"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>DNI / CUIT *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="ej: 20-30444555-9"
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Teléfono *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="ej: 3875123456"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="ej: juan.perez@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Dirección *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="ej: Belgrano 450"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Ciudad *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="ej: Salta"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Observaciones / Notas</label>
                  <textarea
                    className="form-control"
                    placeholder="Detalles sobre el cliente, formas de pago habituales, etc..."
                    style={{ minHeight: '80px', resize: 'vertical' }}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={formLoading}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Guardando...' : 'Guardar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
