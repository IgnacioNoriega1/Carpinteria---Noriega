'use server';

import prisma from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { revalidatePath } from 'next/cache';

// EXPORTAR RESPALDO COMPLETO (DUMP JSON)
export async function exportDatabaseBackup() {
  try {
    const data = {
      users: await prisma.user.findMany(),
      clients: await prisma.client.findMany(),
      furnitureTypes: await prisma.furnitureType.findMany(),
      materialCategories: await prisma.materialCategory.findMany(),
      expenseCategories: await prisma.expenseCategory.findMany(),
      paymentMethods: await prisma.paymentMethod.findMany(),
      suppliers: await prisma.supplier.findMany(),
      employees: await prisma.employee.findMany(),
      projects: await prisma.project.findMany(),
      projectMaterials: await prisma.projectMaterial.findMany(),
      projectLabor: await prisma.projectLabor.findMany(),
      projectEmployees: await prisma.projectEmployee.findMany(),
      projectExpenses: await prisma.projectExpense.findMany(),
      payments: await prisma.payment.findMany(),
      cutlists: await prisma.cutlist.findMany(),
      overheadExpenses: await prisma.overheadExpense.findMany(),
      inventory: await prisma.inventory.findMany(),
      inventoryTransactions: await prisma.inventoryTransaction.findMany(),
      auditLogs: await prisma.auditLog.findMany(),
    };

    return { success: true, backup: JSON.stringify(data, null, 2) };
  } catch (error: any) {
    console.error('Error al exportar respaldo:', error);
    return { success: false, error: error.message || 'Error al compilar respaldo' };
  }
}

// IMPORTAR RESPALDO COMPLETO (RESTAURAR DESDE JSON DUMP)
export async function importDatabaseBackup(backupJson: string) {
  try {
    const data = JSON.parse(backupJson);

    // Validar estructura básica
    const requiredKeys = ['users', 'clients', 'furnitureTypes', 'projects', 'inventory'];
    const keys = Object.keys(data);
    const hasRequired = requiredKeys.every(k => keys.includes(k));
    if (!hasRequired) {
      return { success: false, error: 'El archivo de respaldo no es válido o está incompleto.' };
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Limpiar base de datos (orden inverso de claves foráneas)
      await tx.auditLog.deleteMany({});
      await tx.inventoryTransaction.deleteMany({});
      await tx.inventory.deleteMany({});
      await tx.overheadExpense.deleteMany({});
      await tx.payment.deleteMany({});
      await tx.projectMaterial.deleteMany({});
      await tx.projectLabor.deleteMany({});
      await tx.projectEmployee.deleteMany({});
      await tx.projectExpense.deleteMany({});
      await tx.cutlist.deleteMany({});
      await tx.project.deleteMany({});
      await tx.client.deleteMany({});
      await tx.employee.deleteMany({});
      await tx.supplier.deleteMany({});
      await tx.materialCategory.deleteMany({});
      await tx.expenseCategory.deleteMany({});
      await tx.paymentMethod.deleteMany({});
      await tx.furnitureType.deleteMany({});
      await tx.user.deleteMany({});

      console.log('Restauración: Tablas limpiadas.');

      // Helper para convertir strings de fecha en objetos Date de JS
      const toDate = (val: any) => (val ? new Date(val) : null);

      // 2. Insertar registros (respetando dependencias jerárquicas)
      if (data.users?.length) {
        await tx.user.createMany({ data: data.users.map((x: any) => ({ ...x, createdAt: new Date(x.createdAt), deletedAt: toDate(x.deletedAt) })) });
      }
      if (data.clients?.length) {
        await tx.client.createMany({ data: data.clients.map((x: any) => ({ ...x, createdAt: new Date(x.createdAt), updatedAt: new Date(x.updatedAt), deletedAt: toDate(x.deletedAt) })) });
      }
      if (data.furnitureTypes?.length) {
        await tx.furnitureType.createMany({ data: data.furnitureTypes.map((x: any) => ({ ...x, createdAt: new Date(x.createdAt), updatedAt: new Date(x.updatedAt), deletedAt: toDate(x.deletedAt) })) });
      }
      if (data.materialCategories?.length) {
        await tx.materialCategory.createMany({ data: data.materialCategories.map((x: any) => ({ ...x, createdAt: new Date(x.createdAt), updatedAt: new Date(x.updatedAt), deletedAt: toDate(x.deletedAt) })) });
      }
      if (data.expenseCategories?.length) {
        await tx.expenseCategory.createMany({ data: data.expenseCategories.map((x: any) => ({ ...x, createdAt: new Date(x.createdAt), updatedAt: new Date(x.updatedAt), deletedAt: toDate(x.deletedAt) })) });
      }
      if (data.paymentMethods?.length) {
        await tx.paymentMethod.createMany({ data: data.paymentMethods.map((x: any) => ({ ...x, createdAt: new Date(x.createdAt), updatedAt: new Date(x.updatedAt), deletedAt: toDate(x.deletedAt) })) });
      }
      if (data.suppliers?.length) {
        await tx.supplier.createMany({ data: data.suppliers.map((x: any) => ({ ...x, createdAt: new Date(x.createdAt), updatedAt: new Date(x.updatedAt), deletedAt: toDate(x.deletedAt) })) });
      }
      if (data.employees?.length) {
        await tx.employee.createMany({ data: data.employees.map((x: any) => ({ ...x, createdAt: new Date(x.createdAt), updatedAt: new Date(x.updatedAt), deletedAt: toDate(x.deletedAt) })) });
      }
      
      // Proyectos (manejar fechas nulas correctamente)
      if (data.projects?.length) {
        for (const p of data.projects) {
          await tx.project.create({
            data: {
              ...p,
              createdAt: new Date(p.createdAt),
              updatedAt: new Date(p.updatedAt),
              startDate: toDate(p.startDate),
              estimatedDeliveryDate: toDate(p.estimatedDeliveryDate),
              actualDeliveryDate: toDate(p.actualDeliveryDate),
              deletedAt: toDate(p.deletedAt)
            }
          });
        }
      }

      // Tablas hijas de proyectos
      if (data.projectMaterials?.length) {
        await tx.projectMaterial.createMany({ data: data.projectMaterials.map((x: any) => ({ ...x, createdAt: new Date(x.createdAt), updatedAt: new Date(x.updatedAt), deletedAt: toDate(x.deletedAt) })) });
      }
      if (data.projectLabor?.length) {
        await tx.projectLabor.createMany({ data: data.projectLabor.map((x: any) => ({ ...x, createdAt: new Date(x.createdAt), updatedAt: new Date(x.updatedAt), deletedAt: toDate(x.deletedAt) })) });
      }
      if (data.projectEmployees?.length) {
        await tx.projectEmployee.createMany({ data: data.projectEmployees.map((x: any) => ({ ...x, date: new Date(x.date), createdAt: new Date(x.createdAt), updatedAt: new Date(x.updatedAt), deletedAt: toDate(x.deletedAt) })) });
      }
      if (data.projectExpenses?.length) {
        await tx.projectExpense.createMany({ data: data.projectExpenses.map((x: any) => ({ ...x, createdAt: new Date(x.createdAt), updatedAt: new Date(x.updatedAt), deletedAt: toDate(x.deletedAt) })) });
      }
      if (data.payments?.length) {
        await tx.payment.createMany({ data: data.payments.map((x: any) => ({ ...x, date: new Date(x.date), createdAt: new Date(x.createdAt), updatedAt: new Date(x.updatedAt), deletedAt: toDate(x.deletedAt) })) });
      }
      if (data.cutlists?.length) {
        await tx.cutlist.createMany({ data: data.cutlists.map((x: any) => ({ ...x, updatedAt: new Date(x.updatedAt) })) });
      }
      if (data.overheadExpenses?.length) {
        await tx.overheadExpense.createMany({ data: data.overheadExpenses.map((x: any) => ({ ...x, date: new Date(x.date), createdAt: new Date(x.createdAt), updatedAt: new Date(x.updatedAt), deletedAt: toDate(x.deletedAt) })) });
      }

      // Inventario
      if (data.inventory?.length) {
        await tx.inventory.createMany({ data: data.inventory.map((x: any) => ({ ...x, createdAt: new Date(x.createdAt), updatedAt: new Date(x.updatedAt), deletedAt: toDate(x.deletedAt) })) });
      }
      if (data.inventoryTransactions?.length) {
        await tx.inventoryTransaction.createMany({ data: data.inventoryTransactions.map((x: any) => ({ ...x, date: new Date(x.date), createdAt: new Date(x.createdAt), updatedAt: new Date(x.updatedAt) })) });
      }
      
      // Auditoría
      if (data.auditLogs?.length) {
        await tx.auditLog.createMany({ data: data.auditLogs.map((x: any) => ({ ...x, timestamp: new Date(x.timestamp) })) });
      }

      console.log('Restauración: Todos los datos insertados.');

      // Registrar auditoría de importación
      await tx.auditLog.create({
        data: {
          tableName: 'system',
          recordId: 'backup_restore',
          action: 'update',
          newValues: JSON.stringify({ event: 'importación de copia de seguridad' }),
          timestamp: new Date()
        }
      });

      return { success: true };
    });
  } catch (error: any) {
    console.error('Error al importar respaldo:', error);
    return { success: false, error: error.message || 'Error al procesar el archivo e insertar datos' };
  }
}
