# Tareas: Sistema de Gestión de Carpintería

## 1. Configuración del Entorno e Inicialización
- [x] Instalar Node.js LTS mediante `winget`
- [x] Instalar Git mediante `winget`
- [x] Verificar rutas absolutas y funcionamiento de `node`, `npm`, `npx` y `git`
- [x] Crear el directorio del proyecto `C:\Users\nacho\.gemini\antigravity\scratch\carpinteria-gestion`
- [x] Inicializar la aplicación Next.js con TypeScript, App Router y sin Tailwind (Vanilla CSS/CSS Modules)
- [x] Configurar el archivo `.gitignore` y realizar el commit inicial en Git

## 2. Modelado de Base de Datos y Prisma
- [x] Instalar dependencias de Prisma (`prisma`, `@prisma/client`) e inicializar
- [x] Definir el esquema completo en `prisma/schema.prisma` con:
  - [x] Tabla `User` (autenticación y roles)
  - [x] Tabla `Client` (datos y baja lógica)
  - [x] Tabla `FurnitureType` (tipos de muebles configurables)
  - [x] Tabla `Employee` (entidad independiente para empleados)
  - [x] Tabla `Project` (con prioridad, estados e info económica)
  - [x] Tabla `ProjectMaterial` (materiales del proyecto, opcionalmente linkeado a Inventario)
  - [x] Tabla `ProjectLabor` (mano de obra general)
  - [x] Tabla `ProjectEmployee` (registro de días trabajados por empleado en un proyecto)
  - [x] Tabla `ProjectExpense` (flete, combustible, etc.)
  - [x] Tabla `Payment` (pagos parciales)
  - [x] Tabla `Cutlist` (piezas, placas y resultados optimizados)
  - [x] Tabla `OverheadExpense` (gastos generales del taller)
  - [x] Tabla `Inventory` e `InventoryTransaction` (control de stock y auditoría de movimientos)
  - [x] Tabla `AuditLog` (registro de cambios relacionales)
- [x] Generar e implementar la migración inicial de la base de datos SQLite
- [x] Crear y ejecutar el archivo `prisma/seed.js` para precargar datos de prueba realistas (clientes, empleados, inventario inicial, proyectos y usuarios)

## 3. Infraestructura y API Backend
- [x] Crear helper del cliente de Prisma (`src/lib/prisma.ts`)
- [x] Implementar middleware o helpers de auditoría y baja lógica
- [x] Crear endpoints de API para:
  - [x] Autenticación (Login simple y sesión local)
  - [x] CRUD de Clientes
  - [x] CRUD de Empleados
  - [x] CRUD de Proyectos (con sus sub-entidades: materiales, mano de obra, empleados asignados, gastos y pagos)
  - [x] CRUD de Inventario y Movimientos de Stock
  - [x] CRUD de Gastos Generales (Overhead)
  - [x] Módulo de Respaldo: Endpoints para exportar e importar la base de datos (respaldo SQLite / JSON completo)

## 4. Frontend - Diseño Premium y Componentes Base
- [x] Configurar estilos globales en `src/app/globals.css` con variables CSS para temas oscuros/claros, sombras premium y animaciones
- [x] Crear componente de navegación lateral (`Sidebar`) y cabecera (`Header`) responsive
- [x] Implementar control de sesión y pantalla de Login
- [x] Configurar selector de tema Oscuro/Claro

## 5. Implementación de Módulos (Vistas)
- [x] **Clientes**: Listado con filtros, buscador, formulario de alta/edición y ficha histórica
- [x] **Empleados**: Listado de empleados, gestión de tarifas y desglose de su historial
- [x] **Proyectos**: 
  - [x] Listado Kanban / Tabla por estados
  - [x] Formulario de creación con número correlativo y tipo de mueble dinámico
  - [x] Ficha del proyecto con pestañas:
    - [x] *Detalles*: Info general, estados, fechas estimadas vs reales
    - [x] *Costos*: Tablas para agregar materiales (con opción de descontar de Inventario), mano de obra, días trabajados por empleados (vinculado a la entidad `Employee`) y otros gastos
    - [x] *Presupuesto Estimado vs Costo Real*: Reporte comparativo de desviaciones y ganancia neta real
    - [x] *Pagos*: Registro de señas y cobros con medio de pago e historial
- [x] **Gastos Generales**: CRUD con categorías de taller y enlace opcional a proyectos
- [x] **Inventario**: CRUD de materiales, alertas visuales por bajo stock y registro de movimientos de entrada/salida

## 6. Algoritmo y Visualizador de Cortes (CutList Optimizer)
- [x] Implementar el algoritmo 2D Bin Packing en `src/lib/cutlistOptimizer.ts` (Guillotine Cut recursivo) que soporte `kerf` (grosor de sierra), refilado de placa y veta
- [x] Crear interfaz de optimización: entrada de piezas y hojas de placa
- [x] Generar visor interactivo en SVG a escala con medidas, etiquetas y áreas de descarte
- [x] Añadir botón para incorporar automáticamente el costo de placas optimizadas al presupuesto del proyecto

## 7. Reportes y Dashboard
- [x] **Dashboard**: Indicadores principales, alertas activas (vencimientos, entregas), y gráficos SVG (Ingresos, Gastos, Ganancias y Proyectos por tipo)
- [x] **Reporte de Costos Laborales**: Tabla y gráficos filtrables por empleado, mes y año
- [x] **Exportación**: Habilitar descargas en formato CSV y preparar estructura para generación de presupuestos en PDF

## 8. Módulo de Respaldo y Restauración
- [x] Crear panel de configuración para exportar respaldos
- [x] Desarrollar carga de archivos de respaldo para restaurar la base de datos SQLite

## 9. Verificación y Entrega
- [x] Ejecutar pruebas del motor Prisma y cascadas
- [x] Verificar funcionamiento del optimizador de cortes
- [x] Validar importación/exportación de base de datos
- [x] Crear el archivo de documentación `walkthrough.md` con los resultados
