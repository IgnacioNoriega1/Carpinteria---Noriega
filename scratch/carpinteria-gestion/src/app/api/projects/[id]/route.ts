import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const project = await prisma.project.findUnique({
      where: { id: resolvedParams.id },
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

    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error al obtener proyecto JSON:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
