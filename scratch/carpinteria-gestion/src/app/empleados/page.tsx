import React from 'react';
import { getEmployees } from './actions';
import EmployeeList from './EmployeeList';

export const revalidate = 0;

export default async function EmpleadosPage() {
  const initialEmployees = await getEmployees();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h1 style={{ marginBottom: '5px' }}>Gestión de Empleados</h1>
        <p>Alta, baja, edición de personal y reportes de costos laborales por fecha y proyecto.</p>
      </div>
      <EmployeeList initialEmployees={initialEmployees} />
    </div>
  );
}
