import React from 'react';
import { getProjects } from './actions';
import { getClients } from '../clientes/actions';
import prisma from '@/lib/prisma';
import ProjectList from './ProjectList';

export const revalidate = 0;

export default async function ProyectosPage() {
  const [projects, clients, furnitureTypes] = await Promise.all([
    getProjects(),
    getClients(),
    prisma.furnitureType.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' } })
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h1 style={{ marginBottom: '5px' }}>Proyectos y Trabajos</h1>
        <p>Administración del ciclo de fabricación, presupuestos y control financiero de cada mueble.</p>
      </div>
      <ProjectList 
        initialProjects={projects} 
        clients={clients} 
        furnitureTypes={furnitureTypes} 
      />
    </div>
  );
}
