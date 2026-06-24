import React from 'react';
import { getClients } from './actions';
import ClientList from './ClientList';

export const revalidate = 0;

export default async function ClientesPage() {
  const initialClients = await getClients();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h1 style={{ marginBottom: '5px' }}>Gestión de Clientes</h1>
        <p>Alta, baja, edición y visualización del historial comercial de los clientes.</p>
      </div>
      <ClientList initialClients={initialClients} />
    </div>
  );
}
