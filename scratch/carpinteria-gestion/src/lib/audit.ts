import prisma from './prisma';

export async function createAuditLog(
  tableName: string,
  recordId: string,
  action: 'insert' | 'update' | 'delete',
  oldValues: any = null,
  newValues: any = null,
  userId?: string
) {
  try {
    await prisma.auditLog.create({
      data: {
        tableName,
        recordId,
        action,
        oldValues: oldValues ? JSON.stringify(oldValues) : null,
        newValues: newValues ? JSON.stringify(newValues) : null,
        userId: userId || null,
      },
    });
  } catch (error) {
    console.error('Error al guardar log de auditoría:', error);
  }
}
