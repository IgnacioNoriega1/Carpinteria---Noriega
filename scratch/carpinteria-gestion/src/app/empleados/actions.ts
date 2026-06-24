'use server';

import prisma from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { revalidatePath } from 'next/cache';

export async function getEmployees() {
  try {
    return await prisma.employee.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  } catch (error) {
    console.error('Error al obtener empleados:', error);
    return [];
  }
}

export async function getEmployeeById(id: string) {
  try {
    return await prisma.employee.findUnique({
      where: { id },
      include: {
        workRecords: {
          where: { deletedAt: null },
          orderBy: { date: 'desc' },
          include: {
            project: true
          }
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener empleado:', error);
    return null;
  }
}

export async function createEmployee(data: {
  name: string;
  phone?: string | null;
  email?: string | null;
  ratePerDay: number;
}) {
  try {
    const employee = await prisma.employee.create({
      data: {
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        ratePerDay: data.ratePerDay,
        active: true,
      },
    });

    await createAuditLog('employees', employee.id, 'insert', null, employee);
    revalidatePath('/empleados');
    return { success: true, employee };
  } catch (error: any) {
    console.error('Error al crear empleado:', error);
    return { success: false, error: error.message || 'Error al crear empleado' };
  }
}

export async function updateEmployee(
  id: string,
  data: {
    name: string;
    phone?: string | null;
    email?: string | null;
    ratePerDay: number;
    active: boolean;
  }
) {
  try {
    const oldEmployee = await prisma.employee.findUnique({ where: { id } });
    if (!oldEmployee) return { success: false, error: 'Empleado no encontrado' };

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        ratePerDay: data.ratePerDay,
        active: data.active,
      },
    });

    await createAuditLog('employees', employee.id, 'update', oldEmployee, employee);
    revalidatePath('/empleados');
    revalidatePath(`/empleados/${id}`);
    return { success: true, employee };
  } catch (error: any) {
    console.error('Error al actualizar empleado:', error);
    return { success: false, error: error.message || 'Error al actualizar empleado' };
  }
}

export async function deleteEmployee(id: string) {
  try {
    const oldEmployee = await prisma.employee.findUnique({ where: { id } });
    if (!oldEmployee) return { success: false, error: 'Empleado no encontrado' };

    // Soft delete
    const employee = await prisma.employee.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await createAuditLog('employees', employee.id, 'delete', oldEmployee, { ...oldEmployee, deletedAt: employee.deletedAt });
    revalidatePath('/empleados');
    return { success: true };
  } catch (error: any) {
    console.error('Error al eliminar empleado:', error);
    return { success: false, error: error.message || 'Error al eliminar empleado' };
  }
}

// Obtener reporte de costos laborales consolidado
export async function getLaborCostReport(filters: {
  employeeId?: string;
  year?: number;
  month?: number;
}) {
  try {
    const whereClause: any = { deletedAt: null };
    
    if (filters.employeeId) {
      whereClause.employeeId = filters.employeeId;
    }
    
    if (filters.year && filters.month) {
      const start = new Date(filters.year, filters.month - 1, 1);
      const end = new Date(filters.year, filters.month, 0, 23, 59, 59);
      whereClause.date = { gte: start, lte: end };
    } else if (filters.year) {
      const start = new Date(filters.year, 0, 1);
      const end = new Date(filters.year, 11, 31, 23, 59, 59);
      whereClause.date = { gte: start, lte: end };
    }

    const records = await prisma.projectEmployee.findMany({
      where: whereClause,
      include: {
        employee: true,
        project: true
      },
      orderBy: { date: 'desc' }
    });

    return records;
  } catch (error) {
    console.error('Error al obtener reporte de costos laborales:', error);
    return [];
  }
}
