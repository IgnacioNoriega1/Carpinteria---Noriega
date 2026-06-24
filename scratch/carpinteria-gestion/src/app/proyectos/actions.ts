'use server';

import prisma from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { revalidatePath } from 'next/cache';

// FORMATO DE NRO DE PROYECTO CORRELATIVO AUTO-GENERADO
async function generateProjectNumber() {
  const lastProject = await prisma.project.findFirst({
    orderBy: { projectNumber: 'desc' },
  });

  let num = 1;
  if (lastProject) {
    const match = lastProject.projectNumber.match(/PRJ-(\d+)/);
    if (match) {
      num = parseInt(match[1]) + 1;
    }
  }

  return `PRJ-${String(num).padStart(3, '0')}`;
}

// ACTUALIZADOR AUTOMATICO DE ESTADO DE PAGO
async function updateProjectPaymentStatus(projectId: string, agreedPriceOverride?: number) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { payments: { where: { deletedAt: null } } }
  });

  if (!project) return;

  const totalPaid = project.payments.reduce((acc, p) => acc + p.amount, 0);
  const agreedPrice = agreedPriceOverride !== undefined ? agreedPriceOverride : project.agreedPrice;

  let status = 'pendiente';
  if (totalPaid >= agreedPrice && agreedPrice > 0) {
    status = 'pagado';
  } else if (totalPaid > 0) {
    status = 'parcial';
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { paymentStatus: status }
  });
}

export async function getProjects() {
  try {
    return await prisma.project.findMany({
      where: { deletedAt: null },
      include: {
        client: true,
        furnitureType: true,
        payments: { where: { deletedAt: null } }
      },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    return [];
  }
}

export async function getProjectById(id: string) {
  try {
    return await prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        furnitureType: true,
        materials: {
          where: { deletedAt: null },
          include: { materialCategory: true, supplier: true, inventoryMaterial: true }
        },
        labor: { where: { deletedAt: null } },
        employees: {
          where: { deletedAt: null },
          include: { employee: true },
          orderBy: { date: 'asc' }
        },
        expenses: {
          where: { deletedAt: null },
          include: { expenseCategory: true, supplier: true }
        },
        payments: {
          where: { deletedAt: null },
          include: { paymentMethod: true }
        },
        cutlist: true
      }
    });
  } catch (error) {
    console.error('Error al obtener proyecto:', error);
    return null;
  }
}

export async function createProject(data: {
  clientId: string;
  furnitureTypeId: string;
  description: string;
  priority: string;
  startDate?: Date | null;
  estimatedDeliveryDate?: Date | null;
  agreedPrice: number;
  depositReceived: number;
  // Estimaciones iniciales
  estimatedBudget?: number | null;
  estimatedLaborCost?: number;
  estimatedLaborDays?: number;
  estimatedOtherExpenses?: number;
  estimatedProfit?: number;
}) {
  try {
    const projectNumber = await generateProjectNumber();

    const project = await prisma.project.create({
      data: {
        clientId: data.clientId,
        projectNumber,
        furnitureTypeId: data.furnitureTypeId,
        description: data.description,
        priority: data.priority,
        status: 'presupuesto',
        paymentStatus: data.depositReceived > 0 ? 'parcial' : 'pendiente',
        agreedPrice: data.agreedPrice,
        depositReceived: data.depositReceived,
        estimatedBudget: data.estimatedBudget || null,
        estimatedLaborCost: data.estimatedLaborCost || 0,
        estimatedLaborDays: data.estimatedLaborDays || 0,
        estimatedOtherExpenses: data.estimatedOtherExpenses || 0,
        estimatedProfit: data.estimatedProfit || 0,
        startDate: data.startDate || null,
        estimatedDeliveryDate: data.estimatedDeliveryDate || null,
        files: '[]'
      },
    });

    // Si se especificó seña inicial, cargar pago automático
    if (data.depositReceived > 0) {
      // Método de pago por defecto (Efectivo)
      const defaultPm = await prisma.paymentMethod.findFirst();
      if (defaultPm) {
        await prisma.payment.create({
          data: {
            projectId: project.id,
            date: new Date(),
            amount: data.depositReceived,
            paymentMethodId: defaultPm.id,
            notes: 'Seña inicial de confirmación cargada al crear el proyecto.'
          }
        });
      }
    }

    await createAuditLog('projects', project.id, 'insert', null, project);
    revalidatePath('/proyectos');
    revalidatePath('/'); // Revalidar dashboard
    return { success: true, project };
  } catch (error: any) {
    console.error('Error al crear proyecto:', error);
    return { success: false, error: error.message || 'Error al crear proyecto' };
  }
}

export async function updateProject(
  id: string,
  data: {
    clientId: string;
    furnitureTypeId: string;
    description: string;
    priority: string;
    status: string;
    startDate?: Date | null;
    estimatedDeliveryDate?: Date | null;
    actualDeliveryDate?: Date | null;
    agreedPrice: number;
    estimatedBudget?: number | null;
    estimatedLaborCost?: number;
    estimatedLaborDays?: number;
    estimatedOtherExpenses?: number;
    estimatedProfit?: number;
    workOrderNotes?: string | null;
  }
) {
  try {
    const oldProject = await prisma.project.findUnique({ where: { id } });
    if (!oldProject) return { success: false, error: 'Proyecto no encontrado' };

    const project = await prisma.project.update({
      where: { id },
      data: {
        clientId: data.clientId,
        furnitureTypeId: data.furnitureTypeId,
        description: data.description,
        priority: data.priority,
        status: data.status,
        startDate: data.startDate || null,
        estimatedDeliveryDate: data.estimatedDeliveryDate || null,
        actualDeliveryDate: data.actualDeliveryDate || null,
        agreedPrice: data.agreedPrice,
        estimatedBudget: data.estimatedBudget || null,
        estimatedLaborCost: data.estimatedLaborCost || 0,
        estimatedLaborDays: data.estimatedLaborDays || 0,
        estimatedOtherExpenses: data.estimatedOtherExpenses || 0,
        estimatedProfit: data.estimatedProfit || 0,
        workOrderNotes: data.workOrderNotes || null,
      },
    });

    await updateProjectPaymentStatus(id, data.agreedPrice);
    await createAuditLog('projects', project.id, 'update', oldProject, project);
    
    revalidatePath('/proyectos');
    revalidatePath(`/proyectos/${id}`);
    revalidatePath('/');
    return { success: true, project };
  } catch (error: any) {
    console.error('Error al actualizar proyecto:', error);
    return { success: false, error: error.message || 'Error al actualizar proyecto' };
  }
}

export async function deleteProject(id: string) {
  try {
    const oldProject = await prisma.project.findUnique({ where: { id } });
    if (!oldProject) return { success: false, error: 'Proyecto no encontrado' };

    // Soft delete
    const project = await prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await createAuditLog('projects', project.id, 'delete', oldProject, { ...oldProject, deletedAt: project.deletedAt });
    revalidatePath('/proyectos');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Error al eliminar proyecto:', error);
    return { success: false, error: error.message || 'Error al eliminar proyecto' };
  }
}

// ----------------------------------------
// SUB-ENTIDADES: MATERIALES DE PROYECTO
// ----------------------------------------

export async function addProjectMaterial(data: {
  projectId: string;
  materialName: string;
  materialCategoryId: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  inventoryMaterialId?: string | null;
  supplierId?: string | null;
}) {
  try {
    const totalPrice = data.quantity * data.unitPrice;
    
    // Si viene del stock de inventario, verificar stock y crear movimiento
    if (data.inventoryMaterialId) {
      const invItem = await prisma.inventory.findUnique({ where: { id: data.inventoryMaterialId } });
      if (!invItem) throw new Error('Material de stock no encontrado');
      if (invItem.currentStock < data.quantity) {
        throw new Error(`Stock insuficiente. Solo quedan ${invItem.currentStock} ${invItem.unit}(s) en inventario.`);
      }

      // Descontar stock
      await prisma.inventory.update({
        where: { id: data.inventoryMaterialId },
        data: { currentStock: invItem.currentStock - data.quantity }
      });

      // Crear transacción stock
      const project = await prisma.project.findUnique({ where: { id: data.projectId } });
      await prisma.inventoryTransaction.create({
        data: {
          inventoryId: data.inventoryMaterialId,
          date: new Date(),
          type: 'salida',
          quantity: -data.quantity,
          notes: `Consumo en Proyecto ${project?.projectNumber || ''}`,
        }
      });
    }

    const material = await prisma.projectMaterial.create({
      data: {
        projectId: data.projectId,
        materialName: data.materialName,
        materialCategoryId: data.materialCategoryId,
        quantity: data.quantity,
        unit: data.unit,
        unitPrice: data.unitPrice,
        totalPrice,
        inventoryMaterialId: data.inventoryMaterialId || null,
        supplierId: data.supplierId || null,
      }
    });

    await createAuditLog('project_materials', material.id, 'insert', null, material);
    revalidatePath(`/proyectos/${data.projectId}`);
    return { success: true, material };
  } catch (error: any) {
    console.error('Error al agregar material a proyecto:', error);
    return { success: false, error: error.message || 'Error al agregar material' };
  }
}

export async function deleteProjectMaterial(id: string) {
  try {
    const mat = await prisma.projectMaterial.findUnique({ where: { id } });
    if (!mat) return { success: false, error: 'Material no encontrado' };

    // Si provenía de inventario, devolver el stock
    if (mat.inventoryMaterialId) {
      const invItem = await prisma.inventory.findUnique({ where: { id: mat.inventoryMaterialId } });
      if (invItem) {
        await prisma.inventory.update({
          where: { id: mat.inventoryMaterialId },
          data: { currentStock: invItem.currentStock + mat.quantity }
        });
        
        await prisma.inventoryTransaction.create({
          data: {
            inventoryId: mat.inventoryMaterialId,
            date: new Date(),
            type: 'entrada',
            quantity: mat.quantity,
            notes: 'Devolución de stock por eliminación de material en proyecto',
          }
        });
      }
    }

    await prisma.projectMaterial.delete({ where: { id } });
    await createAuditLog('project_materials', id, 'delete', mat, null);
    revalidatePath(`/proyectos/${mat.projectId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error al eliminar material:', error);
    return { success: false, error: error.message || 'Error al eliminar' };
  }
}

// ----------------------------------------
// SUB-ENTIDADES: MANO DE OBRA / TRABAJO GENERAL
// ----------------------------------------

export async function addProjectLabor(data: {
  projectId: string;
  description: string;
  hoursOrDays: number;
  rate: number;
}) {
  try {
    const total = data.hoursOrDays * data.rate;
    const labor = await prisma.projectLabor.create({
      data: {
        projectId: data.projectId,
        description: data.description,
        hoursOrDays: data.hoursOrDays,
        rate: data.rate,
        total
      }
    });

    await createAuditLog('project_labor', labor.id, 'insert', null, labor);
    revalidatePath(`/proyectos/${data.projectId}`);
    return { success: true, labor };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al registrar mano de obra' };
  }
}

export async function deleteProjectLabor(id: string) {
  try {
    const labor = await prisma.projectLabor.delete({ where: { id } });
    await createAuditLog('project_labor', id, 'delete', labor, null);
    revalidatePath(`/proyectos/${labor.projectId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ----------------------------------------
// SUB-ENTIDADES: EMPLEADOS / JORNALES TRABAJADOS
// ----------------------------------------

export async function addProjectEmployeeWork(data: {
  projectId: string;
  employeeId: string;
  date: Date;
  daysWorked: number;
  ratePerDay: number;
  notes?: string | null;
}) {
  try {
    const total = data.daysWorked * data.ratePerDay;
    const record = await prisma.projectEmployee.create({
      data: {
        projectId: data.projectId,
        employeeId: data.employeeId,
        date: data.date,
        daysWorked: data.daysWorked,
        ratePerDay: data.ratePerDay,
        total,
        notes: data.notes || null
      }
    });

    await createAuditLog('project_employees', record.id, 'insert', null, record);
    revalidatePath(`/proyectos/${data.projectId}`);
    revalidatePath('/empleados'); // Revalidar reporte laboral
    return { success: true, record };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al registrar jornal' };
  }
}

export async function deleteProjectEmployeeWork(id: string) {
  try {
    const record = await prisma.projectEmployee.delete({ where: { id } });
    await createAuditLog('project_employees', id, 'delete', record, null);
    revalidatePath(`/proyectos/${record.projectId}`);
    revalidatePath('/empleados');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ----------------------------------------
// SUB-ENTIDADES: OTROS GASTOS DE PROYECTO
// ----------------------------------------

export async function addProjectExpense(data: {
  projectId: string;
  expenseCategoryId: string;
  description: string;
  amount: number;
  supplierId?: string | null;
}) {
  try {
    const expense = await prisma.projectExpense.create({
      data: {
        projectId: data.projectId,
        expenseCategoryId: data.expenseCategoryId,
        description: data.description,
        amount: data.amount,
        supplierId: data.supplierId || null
      }
    });

    await createAuditLog('project_expenses', expense.id, 'insert', null, expense);
    revalidatePath(`/proyectos/${data.projectId}`);
    return { success: true, expense };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al registrar gasto' };
  }
}

export async function deleteProjectExpense(id: string) {
  try {
    const exp = await prisma.projectExpense.delete({ where: { id } });
    await createAuditLog('project_expenses', id, 'delete', exp, null);
    revalidatePath(`/proyectos/${exp.projectId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ----------------------------------------
// SUB-ENTIDADES: PAGOS / COBROS DE CLIENTES
// ----------------------------------------

export async function addProjectPayment(data: {
  projectId: string;
  date: Date;
  amount: number;
  paymentMethodId: string;
  notes?: string | null;
}) {
  try {
    const payment = await prisma.payment.create({
      data: {
        projectId: data.projectId,
        date: data.date,
        amount: data.amount,
        paymentMethodId: data.paymentMethodId,
        notes: data.notes || null
      }
    });

    // Actualizar estado de pago del proyecto
    await updateProjectPaymentStatus(data.projectId);

    await createAuditLog('payments', payment.id, 'insert', null, payment);
    revalidatePath(`/proyectos/${data.projectId}`);
    revalidatePath('/'); // Revalidar dashboard
    return { success: true, payment };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al registrar cobro' };
  }
}

export async function deleteProjectPayment(id: string) {
  try {
    const payment = await prisma.payment.delete({ where: { id } });
    
    // Actualizar estado de pago del proyecto
    await updateProjectPaymentStatus(payment.projectId);

    await createAuditLog('payments', id, 'delete', payment, null);
    revalidatePath(`/proyectos/${payment.projectId}`);
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ----------------------------------------
// OPTIMIZADOR DE CORTES E INTEGRACION
// ----------------------------------------

export async function saveCutlist(data: {
  projectId: string;
  kerf: number;
  edgeTrim: number;
  useGrain: boolean;
  parts: any[];
  sheets: any[];
  results?: any | null;
}) {
  try {
    const cutlist = await prisma.cutlist.upsert({
      where: { projectId: data.projectId },
      update: {
        kerf: data.kerf,
        edgeTrim: data.edgeTrim,
        useGrain: data.useGrain,
        parts: JSON.stringify(data.parts),
        sheets: JSON.stringify(data.sheets),
        results: data.results ? JSON.stringify(data.results) : null
      },
      create: {
        projectId: data.projectId,
        kerf: data.kerf,
        edgeTrim: data.edgeTrim,
        useGrain: data.useGrain,
        parts: JSON.stringify(data.parts),
        sheets: JSON.stringify(data.sheets),
        results: data.results ? JSON.stringify(data.results) : null
      }
    });

    revalidatePath(`/proyectos/${data.projectId}`);
    return { success: true, cutlist };
  } catch (error: any) {
    console.error('Error al guardar optimización de cortes:', error);
    return { success: false, error: error.message };
  }
}

// CONFIRMACION Y APLICACION DE COSTOS E INVENTARIO DESDE EL OPTIMIZADOR
export async function confirmCutlistCuts(projectId: string, sheetsUsed: Array<{
  materialName: string;
  materialCategoryId: string;
  quantityUsed: number;
  unitPrice: number;
  inventoryMaterialId?: string | null;
}>) {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Obtener proyecto
      const project = await tx.project.findUnique({ where: { id: projectId } });
      if (!project) throw new Error('Proyecto no encontrado');

      // 2. Eliminar materiales anteriores del proyecto generados por el cutlist
      await tx.projectMaterial.deleteMany({
        where: { projectId, fromCutlist: true }
      });

      // 3. Crear nuevos materiales e imputar consumos de stock en inventario
      for (const sheet of sheetsUsed) {
        const totalPrice = sheet.quantityUsed * sheet.unitPrice;

        // Si el material proviene de stock, aplicar descuento
        if (sheet.inventoryMaterialId) {
          const invItem = await tx.inventory.findUnique({ where: { id: sheet.inventoryMaterialId } });
          if (invItem) {
            const finalStock = invItem.currentStock - sheet.quantityUsed;
            if (finalStock < 0) {
              throw new Error(`Stock insuficiente en inventario para '${invItem.name}'. Requerido: ${sheet.quantityUsed}, Disponible: ${invItem.currentStock}.`);
            }

            // Descontar stock
            await tx.inventory.update({
              where: { id: sheet.inventoryMaterialId },
              data: { currentStock: finalStock }
            });

            // Crear registro transaccional
            await tx.inventoryTransaction.create({
              data: {
                inventoryId: sheet.inventoryMaterialId,
                date: new Date(),
                type: 'salida',
                quantity: -sheet.quantityUsed,
                notes: `Consumo optimizador de corte - Proyecto ${project.projectNumber}`
              }
            });
          }
        }

        // Crear material en proyecto
        await tx.projectMaterial.create({
          data: {
            projectId,
            materialName: `${sheet.materialName} (Corte Optimizado)`,
            materialCategoryId: sheet.materialCategoryId,
            quantity: sheet.quantityUsed,
            unit: 'placa',
            unitPrice: sheet.unitPrice,
            totalPrice,
            inventoryMaterialId: sheet.inventoryMaterialId || null,
            fromCutlist: true
          }
        });
      }

      return { success: true };
    });
  } catch (error: any) {
    console.error('Error al confirmar optimización de corte:', error);
    return { success: false, error: error.message };
  }
}
