'use server';

import prisma from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { revalidatePath } from 'next/cache';

export async function getInventory() {
  try {
    return await prisma.inventory.findMany({
      where: { deletedAt: null },
      include: {
        materialCategory: true,
        supplier: true,
        transactions: {
          orderBy: { date: 'desc' },
          take: 10,
          include: { supplier: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  } catch (error) {
    console.error('Error al obtener inventario:', error);
    return [];
  }
}

export async function getMaterialCategories() {
  try {
    return await prisma.materialCategory.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' }
    });
  } catch (error) {
    console.error('Error al obtener categorías de materiales:', error);
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

export async function createInventoryItem(data: {
  name: string;
  materialCategoryId: string;
  unit: string;
  currentStock: number;
  minStock: number;
  unitCost: number;
  supplierId?: string | null;
}) {
  try {
    const item = await prisma.inventory.create({
      data: {
        name: data.name,
        materialCategoryId: data.materialCategoryId,
        unit: data.unit,
        currentStock: data.currentStock,
        minStock: data.minStock,
        unitCost: data.unitCost,
        supplierId: data.supplierId || null,
      },
    });

    // Registrar transacción inicial
    if (data.currentStock > 0) {
      await prisma.inventoryTransaction.create({
        data: {
          inventoryId: item.id,
          date: new Date(),
          type: 'entrada',
          quantity: data.currentStock,
          notes: 'Carga inicial de stock',
          supplierId: data.supplierId || null,
        }
      });
    }

    await createAuditLog('inventory', item.id, 'insert', null, item);
    revalidatePath('/inventario');
    return { success: true, item };
  } catch (error: any) {
    console.error('Error al crear item de inventario:', error);
    return { success: false, error: error.message || 'Error al crear item' };
  }
}

export async function updateInventoryItem(
  id: string,
  data: {
    name: string;
    materialCategoryId: string;
    unit: string;
    minStock: number;
    unitCost: number;
    supplierId?: string | null;
  }
) {
  try {
    const oldItem = await prisma.inventory.findUnique({ where: { id } });
    if (!oldItem) return { success: false, error: 'Item no encontrado' };

    const item = await prisma.inventory.update({
      where: { id },
      data: {
        name: data.name,
        materialCategoryId: data.materialCategoryId,
        unit: data.unit,
        minStock: data.minStock,
        unitCost: data.unitCost,
        supplierId: data.supplierId || null,
      },
    });

    await createAuditLog('inventory', item.id, 'update', oldItem, item);
    revalidatePath('/inventario');
    return { success: true, item };
  } catch (error: any) {
    console.error('Error al actualizar item de inventario:', error);
    return { success: false, error: error.message || 'Error al actualizar item' };
  }
}

export async function recordStockTransaction(data: {
  inventoryId: string;
  type: 'entrada' | 'salida' | 'ajuste';
  quantity: number; // Para entrada/salida: el delta. Para ajuste: el nuevo stock absoluto.
  notes?: string | null;
  supplierId?: string | null;
}) {
  try {
    return await prisma.$transaction(async (tx) => {
      const item = await tx.inventory.findUnique({
        where: { id: data.inventoryId }
      });
      if (!item) throw new Error('Item de inventario no encontrado');

      let newStock = item.currentStock;
      let transactionQty = data.quantity;

      if (data.type === 'entrada') {
        newStock = item.currentStock + data.quantity;
      } else if (data.type === 'salida') {
        newStock = item.currentStock - data.quantity;
      } else if (data.type === 'ajuste') {
        newStock = data.quantity;
        transactionQty = data.quantity - item.currentStock; // La diferencia para el log
      }

      if (newStock < 0) {
        throw new Error('El stock no puede quedar en negativo.');
      }

      // 1. Crear transacción de inventario
      const transaction = await tx.inventoryTransaction.create({
        data: {
          inventoryId: data.inventoryId,
          date: new Date(),
          type: data.type,
          quantity: transactionQty,
          notes: data.notes || null,
          supplierId: data.supplierId || null,
        }
      });

      // 2. Actualizar stock actual en el item
      const updatedItem = await tx.inventory.update({
        where: { id: data.inventoryId },
        data: { currentStock: newStock }
      });

      await createAuditLog('inventory_transactions', transaction.id, 'insert', null, transaction);
      await createAuditLog('inventory', item.id, 'update', item, updatedItem);

      return { success: true, item: updatedItem };
    });
  } catch (error: any) {
    console.error('Error al registrar transacción de stock:', error);
    return { success: false, error: error.message || 'Error al registrar transacción' };
  }
}

export async function deleteInventoryItem(id: string) {
  try {
    const oldItem = await prisma.inventory.findUnique({ where: { id } });
    if (!oldItem) return { success: false, error: 'Item no encontrado' };

    // Soft delete
    const item = await prisma.inventory.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await createAuditLog('inventory', item.id, 'delete', oldItem, { ...oldItem, deletedAt: item.deletedAt });
    revalidatePath('/inventario');
    return { success: true };
  } catch (error: any) {
    console.error('Error al eliminar item de inventario:', error);
    return { success: false, error: error.message || 'Error al eliminar item' };
  }
}
