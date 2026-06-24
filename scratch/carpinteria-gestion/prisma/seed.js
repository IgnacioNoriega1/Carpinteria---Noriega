const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('Iniciando el sembrado de datos (Seed)...');

  // Limpiar base de datos para evitar duplicados
  await prisma.auditLog.deleteMany({});
  await prisma.inventoryTransaction.deleteMany({});
  await prisma.inventory.deleteMany({});
  await prisma.overheadExpense.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.projectMaterial.deleteMany({});
  await prisma.projectLabor.deleteMany({});
  await prisma.projectEmployee.deleteMany({});
  await prisma.projectExpense.deleteMany({});
  await prisma.cutlist.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.materialCategory.deleteMany({});
  await prisma.expenseCategory.deleteMany({});
  await prisma.paymentMethod.deleteMany({});
  await prisma.furnitureType.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Base de datos limpia.');

  // 1. Crear Usuarios
  const adminPassword = hashPassword('admin123');
  const operatorPassword = hashPassword('operador123');

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      password: adminPassword,
      role: 'admin',
    },
  });

  const operator = await prisma.user.create({
    data: {
      username: 'operador',
      password: operatorPassword,
      role: 'operator',
    },
  });

  console.log('Usuarios creados.');

  // 2. Crear Categorías de Materiales
  const catMdf = await prisma.materialCategory.create({ data: { name: 'MDF' } });
  const catMelamina = await prisma.materialCategory.create({ data: { name: 'Melamina' } });
  const catHerrajes = await prisma.materialCategory.create({ data: { name: 'Herrajes' } });
  const catPintura = await prisma.materialCategory.create({ data: { name: 'Pintura' } });
  const catVidrio = await prisma.materialCategory.create({ data: { name: 'Vidrio' } });
  const catOtrosMat = await prisma.materialCategory.create({ data: { name: 'Otros Materiales' } });

  console.log('Categorías de materiales creadas.');

  // 3. Crear Categorías de Gastos
  const catCombustible = await prisma.expenseCategory.create({ data: { name: 'Combustible' } });
  const catFlete = await prisma.expenseCategory.create({ data: { name: 'Flete' } });
  const catInstalacion = await prisma.expenseCategory.create({ data: { name: 'Instalación' } });
  const catHerramientas = await prisma.expenseCategory.create({ data: { name: 'Herramientas' } });
  const catMantenimiento = await prisma.expenseCategory.create({ data: { name: 'Mantenimiento' } });
  const catImpuestos = await prisma.expenseCategory.create({ data: { name: 'Impuestos' } });
  const catAlquiler = await prisma.expenseCategory.create({ data: { name: 'Alquiler' } });
  const catLuz = await prisma.expenseCategory.create({ data: { name: 'Luz' } });
  const catInternet = await prisma.expenseCategory.create({ data: { name: 'Internet' } });
  const catOtrosGast = await prisma.expenseCategory.create({ data: { name: 'Otros Gastos' } });

  console.log('Categorías de gastos creadas.');

  // 4. Crear Métodos de Pago
  const pmEfectivo = await prisma.paymentMethod.create({ data: { name: 'Efectivo' } });
  const pmTransferencia = await prisma.paymentMethod.create({ data: { name: 'Transferencia' } });
  const pmMercadoPago = await prisma.paymentMethod.create({ data: { name: 'Mercado Pago' } });
  const pmDebito = await prisma.paymentMethod.create({ data: { name: 'Débito' } });
  const pmCredito = await prisma.paymentMethod.create({ data: { name: 'Crédito' } });
  const pmCheque = await prisma.paymentMethod.create({ data: { name: 'Cheque' } });
  const pmOtro = await prisma.paymentMethod.create({ data: { name: 'Otro' } });

  console.log('Métodos de pago creados.');

  // 5. Crear Proveedores
  const supArauco = await prisma.supplier.create({
    data: {
      name: 'Arauco Argentina',
      phone: '011-4567-8900',
      email: 'ventas@arauco.com.ar',
      address: 'Av. Libertador 450, CABA',
      notes: 'Proveedor principal de melaminas y MDF. Descuento 10% por pago transferencia.',
    },
  });

  const supHerrajes = await prisma.supplier.create({
    data: {
      name: 'Herrajes del Norte',
      phone: '0387-432-1090',
      email: 'contacto@herrajesdelnorte.com',
      address: 'Av. Belgrano 1200, Salta',
      notes: 'Bisagras, correderas y tornillos.',
    },
  });

  const supPinturas = await prisma.supplier.create({
    data: {
      name: 'Pinturas Premium',
      phone: '0387-499-8877',
      email: 'salta@pinturaspremium.com',
      address: 'San Martín 840, Salta',
      notes: 'Lacas, barnices y solventes.',
    },
  });

  console.log('Proveedores creados.');

  // 6. Crear Empleados
  const empJuan = await prisma.employee.create({
    data: {
      name: 'Juan Pérez',
      phone: '387-5123456',
      email: 'juan.perez@gmail.com',
      ratePerDay: 25000,
    },
  });

  const empCarlos = await prisma.employee.create({
    data: {
      name: 'Carlos Gómez',
      phone: '387-5987654',
      email: 'carlos.gomez@hotmail.com',
      ratePerDay: 18000,
    },
  });

  const empSofia = await prisma.employee.create({
    data: {
      name: 'Sofía Rodríguez',
      phone: '387-4112233',
      email: 'sofia.rodriguez@gmail.com',
      ratePerDay: 20000,
    },
  });

  console.log('Empleados creados.');

  // 7. Crear Tipos de Mueble
  const ftCocina = await prisma.furnitureType.create({ data: { name: 'Cocina' } });
  const ftPlacard = await prisma.furnitureType.create({ data: { name: 'Placard' } });
  const ftBajoMesada = await prisma.furnitureType.create({ data: { name: 'Bajo mesada' } });
  const ftAlacena = await prisma.furnitureType.create({ data: { name: 'Alacena' } });
  const ftEscritorio = await prisma.furnitureType.create({ data: { name: 'Escritorio' } });
  const ftBiblioteca = await prisma.furnitureType.create({ data: { name: 'Biblioteca' } });
  const ftMesa = await prisma.furnitureType.create({ data: { name: 'Mesa' } });
  const ftPuerta = await prisma.furnitureType.create({ data: { name: 'Puerta' } });
  const ftMedida = await prisma.furnitureType.create({ data: { name: 'Mueble a medida' } });
  const ftOtro = await prisma.furnitureType.create({ data: { name: 'Otro' } });

  console.log('Tipos de muebles creados.');

  // 8. Crear Clientes
  const cliMartinez = await prisma.client.create({
    data: {
      name: 'Familia Martínez',
      companyName: null,
      taxId: '20-30444555-9',
      phone: '387-4556677',
      email: 'martinez.carpinteria@gmail.com',
      address: 'Pueyrredón 1420',
      city: 'Salta',
      notes: 'Casa familiar. Seña entregada en efectivo.',
    },
  });

  const cliEstudio = await prisma.client.create({
    data: {
      name: 'Estudio Abierto SRL',
      companyName: 'Estudio Abierto Arquitectura',
      taxId: '30-71234567-8',
      phone: '011-5888-9999',
      email: 'info@estudioabierto.com',
      address: 'Balcarce 320, Of. 4A',
      city: 'Salta',
      notes: 'Cliente corporativo frecuente. Pagos por transferencia a 15 días.',
    },
  });

  const cliGonzalez = await prisma.client.create({
    data: {
      name: 'María Laura González',
      companyName: null,
      taxId: '27-25111222-3',
      phone: '387-6112244',
      email: 'mlgonzalez@yahoo.com.ar',
      address: 'Los Almendros 85, Tres Cerritos',
      city: 'Salta',
      notes: 'Mesa de luz y biblioteca para estudio.',
    },
  });

  console.log('Clientes creados.');

  // 9. Crear Inventario Inicial
  const invMdf18 = await prisma.inventory.create({
    data: {
      name: 'Placa MDF Crudo 18mm (2.75x1.83)',
      materialCategoryId: catMdf.id,
      unit: 'placa',
      currentStock: 8,
      minStock: 3,
      unitCost: 42000,
      supplierId: supArauco.id,
    },
  });

  const invMelWhite18 = await prisma.inventory.create({
    data: {
      name: 'Placa Melamina Blanca 18mm (2.75x1.83)',
      materialCategoryId: catMelamina.id,
      unit: 'placa',
      currentStock: 12,
      minStock: 4,
      unitCost: 45000,
      supplierId: supArauco.id,
    },
  });

  const invBisagra = await prisma.inventory.create({
    data: {
      name: 'Bisagra Cazoleta 35mm Codo 0',
      materialCategoryId: catHerrajes.id,
      unit: 'u',
      currentStock: 150,
      minStock: 40,
      unitCost: 1200,
      supplierId: supHerrajes.id,
    },
  });

  const invCorredera = await prisma.inventory.create({
    data: {
      name: 'Corredera Telescópica 450mm',
      materialCategoryId: catHerrajes.id,
      unit: 'u',
      currentStock: 36,
      minStock: 12,
      unitCost: 3500,
      supplierId: supHerrajes.id,
    },
  });

  const invLaca = await prisma.inventory.create({
    data: {
      name: 'Laca Poliuretánica Transparente x 4L',
      materialCategoryId: catPintura.id,
      unit: 'u',
      currentStock: 5,
      minStock: 2,
      unitCost: 28000,
      supplierId: supPinturas.id,
    },
  });

  console.log('Inventario creado.');

  // 10. Crear Historial de Transacciones de Inventario
  await prisma.inventoryTransaction.createMany({
    data: [
      {
        inventoryId: invMelWhite18.id,
        date: new Date('2026-06-01T10:00:00Z'),
        type: 'entrada',
        quantity: 10,
        supplierId: supArauco.id,
        notes: 'Compra inicial de stock',
      },
      {
        inventoryId: invCorredera.id,
        date: new Date('2026-06-02T11:00:00Z'),
        type: 'entrada',
        quantity: 24,
        supplierId: supHerrajes.id,
        notes: 'Reposición de guías',
      },
    ],
  });

  console.log('Transacciones de inventario creadas.');

  // 11. Crear Proyectos

  // PROYECTO 1: En Proceso (Bajo Mesada)
  const project1 = await prisma.project.create({
    data: {
      clientId: cliMartinez.id,
      projectNumber: 'PRJ-001',
      furnitureTypeId: ftBajoMesada.id,
      description: 'Bajo mesada a medida en melamina blanca 18mm con herrajes telescópicos.',
      priority: 'alta',
      status: 'en_proceso',
      paymentStatus: 'parcial',
      workOrderNotes: 'Colocar tapacantos de PVC de 2mm en frentes de cajón. Usar bisagras con cierre suave.',
      agreedPrice: 480000,
      depositReceived: 200000,
      files: JSON.stringify([
        { name: 'diseño_3d.jpg', url: '/files/martinez_bajo_mesada_3d.jpg', type: 'image/jpeg', size: 102450 },
        { name: 'plano_medidas.pdf', url: '/files/martinez_bajo_mesada_planos.pdf', type: 'application/pdf', size: 304200 }
      ]),
      estimatedBudget: 450000,
      estimatedLaborCost: 125000,
      estimatedLaborDays: 5,
      estimatedOtherExpenses: 30000,
      estimatedProfit: 145000,
      startDate: new Date('2026-06-15'),
      estimatedDeliveryDate: new Date('2026-06-28'),
    },
  });

  // Proyecto 1: Materiales (2 placas de stock y 10 bisagras)
  await prisma.projectMaterial.create({
    data: {
      projectId: project1.id,
      materialName: 'Placa Melamina Blanca 18mm (Consumo Stock)',
      materialCategoryId: catMelamina.id,
      quantity: 2,
      unit: 'placa',
      unitPrice: 45000,
      totalPrice: 90000,
      inventoryMaterialId: invMelWhite18.id,
      fromCutlist: true,
    },
  });

  await prisma.projectMaterial.create({
    data: {
      projectId: project1.id,
      materialName: 'Bisagra Cazoleta 35mm (Consumo Stock)',
      materialCategoryId: catHerrajes.id,
      quantity: 10,
      unit: 'u',
      unitPrice: 1200,
      totalPrice: 12000,
      inventoryMaterialId: invBisagra.id,
    },
  });

  // Proyecto 1: Empleados asignados (Juan trabajó 2 días, Carlos 1 día)
  await prisma.projectEmployee.create({
    data: {
      projectId: project1.id,
      employeeId: empJuan.id,
      date: new Date('2026-06-16'),
      daysWorked: 1,
      ratePerDay: 25000,
      total: 25000,
      notes: 'Estructura y armado del módulo',
    },
  });

  await prisma.projectEmployee.create({
    data: {
      projectId: project1.id,
      employeeId: empJuan.id,
      date: new Date('2026-06-17'),
      daysWorked: 1,
      ratePerDay: 25000,
      total: 25000,
      notes: 'Colocación de cajones',
    },
  });

  await prisma.projectEmployee.create({
    data: {
      projectId: project1.id,
      employeeId: empCarlos.id,
      date: new Date('2026-06-16'),
      daysWorked: 1,
      ratePerDay: 18000,
      total: 18000,
      notes: 'Ayuda general y lijado de bordes',
    },
  });

  // Proyecto 1: Gastos Directos (Flete)
  await prisma.projectExpense.create({
    data: {
      projectId: project1.id,
      expenseCategoryId: catFlete.id,
      description: 'Envío de maderas desde distribuidor al taller',
      amount: 15000,
      supplierId: supArauco.id,
    },
  });

  // Proyecto 1: Pago parcial (Seña)
  await prisma.payment.create({
    data: {
      projectId: project1.id,
      date: new Date('2026-06-14'),
      amount: 200000,
      paymentMethodId: pmEfectivo.id,
      notes: 'Seña recibida al confirmar el trabajo.',
    },
  });


  // PROYECTO 2: Entregado y Pagado (Placard)
  const project2 = await prisma.project.create({
    data: {
      clientId: cliEstudio.id,
      projectNumber: 'PRJ-002',
      furnitureTypeId: ftPlacard.id,
      description: 'Placard empotrado de piso a techo, 3 puertas corredizas, guías de aluminio.',
      priority: 'media',
      status: 'entregado',
      paymentStatus: 'pagado',
      workOrderNotes: 'Placard en melamina wengue. Ojo con la nivelación del riel inferior.',
      agreedPrice: 890000,
      depositReceived: 450000,
      files: '[]',
      estimatedBudget: 850000,
      estimatedLaborCost: 200000,
      estimatedLaborDays: 8,
      estimatedOtherExpenses: 40000,
      estimatedProfit: 250000,
      startDate: new Date('2026-06-02'),
      estimatedDeliveryDate: new Date('2026-06-18'),
      actualDeliveryDate: new Date('2026-06-19'),
    },
  });

  // Proyecto 2: Materiales (3 Placas de MDF crudo compradas directo al proveedor)
  await prisma.projectMaterial.create({
    data: {
      projectId: project2.id,
      materialName: 'Placa MDF Crudo 18mm (Compra Directa)',
      materialCategoryId: catMdf.id,
      quantity: 3,
      unit: 'placa',
      unitPrice: 42000,
      totalPrice: 126000,
      supplierId: supArauco.id,
    },
  });

  await prisma.projectMaterial.create({
    data: {
      projectId: project2.id,
      materialName: 'Guías y Kit de Rieles de Aluminio 3m',
      materialCategoryId: catHerrajes.id,
      quantity: 1,
      unit: 'u',
      unitPrice: 45000,
      totalPrice: 45000,
      supplierId: supHerrajes.id,
    },
  });

  // Proyecto 2: Mano de Obra interna (Juan 4 días, Sofía 2 días)
  for (let i = 0; i < 4; i++) {
    await prisma.projectEmployee.create({
      data: {
        projectId: project2.id,
        employeeId: empJuan.id,
        date: new Date(`2026-06-0${3 + i}`),
        daysWorked: 1,
        ratePerDay: 25000,
        total: 25000,
        notes: 'Corte y armado de placard',
      },
    });
  }
  for (let i = 0; i < 2; i++) {
    await prisma.projectEmployee.create({
      data: {
        projectId: project2.id,
        employeeId: empSofia.id,
        date: new Date(`2026-06-0${8 + i}`),
        daysWorked: 1,
        ratePerDay: 20000,
        total: 20000,
        notes: 'Pintura y laqueado de bordes',
      },
    });
  }

  // Proyecto 2: Gastos (Flete e Instalación)
  await prisma.projectExpense.create({
    data: {
      projectId: project2.id,
      expenseCategoryId: catFlete.id,
      description: 'Flete traslado al departamento del cliente',
      amount: 25000,
    },
  });

  await prisma.projectExpense.create({
    data: {
      projectId: project2.id,
      expenseCategoryId: catInstalacion.id,
      description: 'Gastos de colocación y ajuste final',
      amount: 15000,
    },
  });

  // Proyecto 2: Pagos (Seña + Saldo)
  await prisma.payment.create({
    data: {
      projectId: project2.id,
      date: new Date('2026-06-01'),
      amount: 450000,
      paymentMethodId: pmTransferencia.id,
      notes: 'Transferencia seña de confirmación.',
    },
  });

  await prisma.payment.create({
    data: {
      projectId: project2.id,
      date: new Date('2026-06-20'),
      amount: 440000,
      paymentMethodId: pmTransferencia.id,
      notes: 'Pago final contra entrega.',
    },
  });


  // PROYECTO 3: Presupuesto Pendiente (Escritorio)
  await prisma.project.create({
    data: {
      clientId: cliGonzalez.id,
      projectNumber: 'PRJ-003',
      furnitureTypeId: ftEscritorio.id,
      description: 'Escritorio con cajonera flotante en melamina negra.',
      priority: 'baja',
      status: 'presupuesto',
      paymentStatus: 'pendiente',
      workOrderNotes: null,
      agreedPrice: 195000,
      depositReceived: 0,
      files: '[]',
      estimatedBudget: 195000,
      estimatedLaborCost: 50000,
      estimatedLaborDays: 2,
      estimatedOtherExpenses: 10000,
      estimatedProfit: 60000,
    },
  });

  console.log('Proyectos y costos sembrados.');

  // 12. Gastos Generales / Fijos del Taller (Overhead)
  await prisma.overheadExpense.createMany({
    data: [
      {
        date: new Date('2026-06-05T00:00:00Z'),
        expenseCategoryId: catAlquiler.id,
        description: 'Alquiler del taller del mes de Junio',
        amount: 120000,
        paymentMethodId: pmTransferencia.id,
        supplierId: null,
      },
      {
        date: new Date('2026-06-10T00:00:00Z'),
        expenseCategoryId: catLuz.id,
        description: 'Factura mensual luz EDESA taller',
        amount: 32000,
        paymentMethodId: pmMercadoPago.id,
        supplierId: null,
      },
      {
        date: new Date('2026-06-12T00:00:00Z'),
        expenseCategoryId: catInternet.id,
        description: 'Abono internet fibra taller',
        amount: 12500,
        paymentMethodId: pmMercadoPago.id,
        supplierId: null,
      },
    ],
  });

  console.log('Gastos generales creados.');

  console.log('Sembrado de datos (Seed) completado con éxito.');
}

main()
  .catch((e) => {
    console.error('Error al ejecutar el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
