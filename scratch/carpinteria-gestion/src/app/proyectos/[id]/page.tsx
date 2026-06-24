import React from 'react';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getProjectById } from '../actions';
import { getClients } from '@/app/clientes/actions';
import { getEmployees } from '@/app/empleados/actions';
import { getMaterialCategories, getInventory, getSuppliersList } from '@/app/inventario/actions';
import { getExpenseCategories, getPaymentMethods } from '@/app/gastos/actions';
import ProjectDetailManager from './ProjectDetailManager';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 0;

export default async function ProjectDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  
  const [
    project,
    clients,
    furnitureTypes,
    employees,
    materialCategories,
    expenseCategories,
    paymentMethods,
    inventory,
    suppliers
  ] = await Promise.all([
    getProjectById(resolvedParams.id),
    getClients(),
    prisma.furnitureType.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' } }),
    getEmployees(),
    getMaterialCategories(),
    getExpenseCategories(),
    getPaymentMethods(),
    getInventory(),
    getSuppliersList()
  ]);

  if (!project) {
    notFound();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <ProjectDetailManager
        project={project}
        clients={clients}
        furnitureTypes={furnitureTypes}
        employees={employees}
        materialCategories={materialCategories}
        expenseCategories={expenseCategories}
        paymentMethods={paymentMethods}
        inventory={inventory}
        suppliers={suppliers}
      />
    </div>
  );
}
