'use server';

import prisma from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { revalidatePath } from 'next/cache';

export async function getOverheadExpenses() {
  try {
    return await prisma.overheadExpense.findMany({
      where: { deletedAt: null },
      include: {
        expenseCategory: true,
        paymentMethod: true,
        project: true,
        supplier: true
      },
      orderBy: { date: 'desc' }
    });
  } catch (error) {
    console.error('Error al obtener gastos generales:', error);
    return [];
  }
}

export async function getExpenseCategories() {
  try {
    return await prisma.expenseCategory.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' }
    });
  } catch (error) {
    console.error('Error al obtener categorías de gastos:', error);
    return [];
  }
}

export async function getPaymentMethods() {
  try {
    return await prisma.paymentMethod.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' }
    });
  } catch (error) {
    console.error('Error al obtener métodos de pago:', error);
    return [];
  }
}

export async function getProjectsList() {
  try {
    return await prisma.project.findMany({
      where: { deletedAt: null },
      orderBy: { projectNumber: 'desc' }
    });
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    return [];
  }
}

export async function getSuppliersList() {
  try {
    return await prisma.supplier.findMany({
      where: { deletedAt: null, active: true },
      orderBy: { name: 'asc' }
    });
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    return [];
  }
}

export async function createOverheadExpense(data: {
  date: Date;
  expenseCategoryId: string;
  description: string;
  amount: number;
  paymentMethodId: string;
  projectId?: string | null;
  supplierId?: string | null;
}) {
  try {
    const expense = await prisma.overheadExpense.create({
      data: {
        date: data.date,
        expenseCategoryId: data.expenseCategoryId,
        description: data.description,
        amount: data.amount,
        paymentMethodId: data.paymentMethodId,
        projectId: data.projectId || null,
        supplierId: data.supplierId || null,
      },
    });

    await createAuditLog('overhead_expenses', expense.id, 'insert', null, expense);
    revalidatePath('/gastos');
    revalidatePath('/'); // Revalidar dashboard
    return { success: true, expense };
  } catch (error: any) {
    console.error('Error al crear gasto general:', error);
    return { success: false, error: error.message || 'Error al crear gasto' };
  }
}

export async function updateOverheadExpense(
  id: string,
  data: {
    date: Date;
    expenseCategoryId: string;
    description: string;
    amount: number;
    paymentMethodId: string;
    projectId?: string | null;
    supplierId?: string | null;
  }
) {
  try {
    const oldExpense = await prisma.overheadExpense.findUnique({ where: { id } });
    if (!oldExpense) return { success: false, error: 'Gasto no encontrado' };

    const expense = await prisma.overheadExpense.update({
      where: { id },
      data: {
        date: data.date,
        expenseCategoryId: data.expenseCategoryId,
        description: data.description,
        amount: data.amount,
        paymentMethodId: data.paymentMethodId,
        projectId: data.projectId || null,
        supplierId: data.supplierId || null,
      },
    });

    await createAuditLog('overhead_expenses', expense.id, 'update', oldExpense, expense);
    revalidatePath('/gastos');
    revalidatePath('/'); // Revalidar dashboard
    return { success: true, expense };
  } catch (error: any) {
    console.error('Error al actualizar gasto general:', error);
    return { success: false, error: error.message || 'Error al actualizar gasto' };
  }
}

export async function deleteOverheadExpense(id: string) {
  try {
    const oldExpense = await prisma.overheadExpense.findUnique({ where: { id } });
    if (!oldExpense) return { success: false, error: 'Gasto no encontrado' };

    // Soft delete
    const expense = await prisma.overheadExpense.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await createAuditLog('overhead_expenses', expense.id, 'delete', oldExpense, { ...oldExpense, deletedAt: expense.deletedAt });
    revalidatePath('/gastos');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Error al eliminar Gasto General:', error);
    return { success: false, error: error.message || 'Error al eliminar gasto' };
  }
}
