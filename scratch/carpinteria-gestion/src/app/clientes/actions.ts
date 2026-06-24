'use server';

import prisma from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { revalidatePath } from 'next/cache';

export async function getClients() {
  try {
    return await prisma.client.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    return [];
  }
}

export async function getClientById(id: string) {
  try {
    return await prisma.client.findUnique({
      where: { id },
      include: {
        projects: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          include: {
            payments: { where: { deletedAt: null } }
          }
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    return null;
  }
}

export async function createClient(data: {
  name: string;
  companyName?: string | null;
  taxId: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  notes?: string | null;
}) {
  try {
    const client = await prisma.client.create({
      data: {
        name: data.name,
        companyName: data.companyName || null,
        taxId: data.taxId,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        notes: data.notes || null,
      },
    });

    await createAuditLog('clients', client.id, 'insert', null, client);
    revalidatePath('/clientes');
    return { success: true, client };
  } catch (error: any) {
    console.error('Error al crear cliente:', error);
    return { success: false, error: error.message || 'Error al crear cliente' };
  }
}

export async function updateClient(
  id: string,
  data: {
    name: string;
    companyName?: string | null;
    taxId: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    notes?: string | null;
  }
) {
  try {
    const oldClient = await prisma.client.findUnique({ where: { id } });
    if (!oldClient) return { success: false, error: 'Cliente no encontrado' };

    const client = await prisma.client.update({
      where: { id },
      data: {
        name: data.name,
        companyName: data.companyName || null,
        taxId: data.taxId,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        notes: data.notes || null,
      },
    });

    await createAuditLog('clients', client.id, 'update', oldClient, client);
    revalidatePath('/clientes');
    revalidatePath(`/clientes/${id}`);
    return { success: true, client };
  } catch (error: any) {
    console.error('Error al actualizar cliente:', error);
    return { success: false, error: error.message || 'Error al actualizar cliente' };
  }
}

export async function deleteClient(id: string) {
  try {
    const oldClient = await prisma.client.findUnique({ where: { id } });
    if (!oldClient) return { success: false, error: 'Cliente no encontrado' };

    // Soft delete
    const client = await prisma.client.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await createAuditLog('clients', client.id, 'delete', oldClient, { ...oldClient, deletedAt: client.deletedAt });
    revalidatePath('/clientes');
    return { success: true };
  } catch (error: any) {
    console.error('Error al eliminar cliente:', error);
    return { success: false, error: error.message || 'Error al eliminar cliente' };
  }
}
