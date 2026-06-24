# Walkthrough: Sistema de Gestión de Carpintería - Verificación Final

Se ha completado con éxito la fase de verificación y corrección del sistema. A continuación se detallan los elementos comprobados, los cambios de corrección aplicados y las validaciones realizadas sobre el entorno real.

---

## 1. Navegación y Rutas (Menú Lateral)

Se auditó el componente [LayoutWrapper.tsx](file:///C:/Users/nacho/.gemini/antigravity/scratch/carpinteria-gestion/src/components/LayoutWrapper.tsx) y se reestructuró la ubicación física de las páginas para asegurar el cumplimiento exacto del direccionamiento:

- **Cambio Aplicado**: El Dashboard, que anteriormente residía en la raíz `/` con un redireccionamiento desde `/dashboard`, se trasladó a [src/app/dashboard/page.tsx](file:///C:/Users/nacho/.gemini/antigravity/scratch/carpinteria-gestion/src/app/dashboard/page.tsx). La raíz `/` ahora realiza un redireccionamiento limpio de servidor a `/dashboard`.
- **Efecto**: La URL `/dashboard` es ahora el Dashboard interactivo principal del taller, lo que elimina cualquier problema de redireccionamiento inverso y garantiza la compatibilidad con scripts de prueba automatizados.
- **Validación**: No existen enlaces rotos ni rutas que devuelvan 404 en el menú.
  - `Dashboard`: [/dashboard](file:///C:/Users/nacho/.gemini/antigravity/scratch/carpinteria-gestion/src/app/dashboard)
  - `Clientes`: [/clientes](file:///C:/Users/nacho/.gemini/antigravity/scratch/carpinteria-gestion/src/app/clientes)
  - `Proyectos`: [/proyectos](file:///C:/Users/nacho/.gemini/antigravity/scratch/carpinteria-gestion/src/app/proyectos)
  - `Empleados`: [/empleados](file:///C:/Users/nacho/.gemini/antigravity/scratch/carpinteria-gestion/src/app/empleados)
  - `Gastos Generales`: [/gastos](file:///C:/Users/nacho/.gemini/antigravity/scratch/carpinteria-gestion/src/app/gastos)
  - `Inventario / Stock`: [/inventario](file:///C:/Users/nacho/.gemini/antigravity/scratch/carpinteria-gestion/src/app/inventario)
  - `Copias de Seguridad`: [/respaldos](file:///C:/Users/nacho/.gemini/antigravity/scratch/carpinteria-gestion/src/app/respaldos)

---

## 2. Módulo de Proyectos

El flujo económico e interactivo dentro de un proyecto ha sido validado mediante el archivo [ProjectDetailManager.tsx](file:///C:/Users/nacho/.gemini/antigravity/scratch/carpinteria-gestion/src/app/proyectos/%5Bid%5D/ProjectDetailManager.tsx) y sus correspondientes Server Actions en [actions.ts](file:///C:/Users/nacho/.gemini/antigravity/scratch/carpinteria-gestion/src/app/proyectos/actions.ts):

- **Crear Proyecto**: Genera un número correlativo secuencial `PRJ-XXX` consultando el último índice en base de datos. Permite asignar una seña inicial de confirmación, la cual crea un registro de pago automático en la cuenta del proyecto.
- **Editar Proyecto**: Permite alterar las fechas (estimadas vs reales), estado de avance del trabajo (`presupuesto`, `confirmado`, `en_proceso`, `finalizado`), prioridad y precio acordado.
- **Cargar Costos**:
  - **Materiales**: Permite cargar materiales ingresados manualmente o descontándolos directamente del catálogo de **Inventario / Stock**, reduciendo las existencias y registrando el movimiento de salida.
  - **Mano de Obra**: Registra horas o jornadas globales para contratistas externos o estimaciones generales de mano de obra.
  - **Jornales de Empleados**: Registra días trabajados por operarios específicos de la carpintería (vinculados a la tabla independiente `Employee`), aplicando su tarifa diaria y calculando el costo laboral directo.
  - **Gastos Directos**: Permite imputar fletes, combustible o instalaciones asociados al proyecto, vinculándolos a categorías pre-configuradas de gastos.
- **Registrar Cobros**: Historial de cobros con medio de pago y observaciones. Actualiza automáticamente el estado de cobro general del proyecto (`pendiente`, `parcial`, `pagado`).
- **Cálculo de Finanzas Reales (en base a la base de datos)**:
  - **Saldo Pendiente**: `Agreed Price - Total Payments Received` (indicado claramente en la cabecera de la ficha del proyecto).
  - **Ganancia Neta Real**: Se visualizan dos métricas complementarias en la pestaña **Presupuesto vs Costo Real**:
    1. *Ganancia Real de Caja (Líquido)*: Monto cobrado al cliente menos el costo total acumulado.
    2. *Ganancia Real Final Proyectada*: Precio total acordado menos el costo total acumulado de materiales, mano de obra y gastos.
- **Optimizador de Cortes Integrado**:
  - Resuelve la colocación de piezas en las hojas disponibles utilizando el algoritmo 2D Guillotina en [cutlistOptimizer.ts](file:///C:/Users/nacho/.gemini/antigravity/scratch/carpinteria-gestion/src/lib/cutlistOptimizer.ts).
  - Permite cargar placas directamente desde el stock real de inventario.
  - **Imputación de Costos**: Al presionar **Confirmar e Imputar**, se realiza una transacción en la base de datos que descuenta las placas utilizadas de stock, registra transacciones de salida con el número de proyecto correspondiente, e imputa su costo unitario como costo de material directo del proyecto.
  - **Corrección de Compilación**: Se resolvió el error de typecheck en TypeScript que afectaba al renderizador SVG de [CutlistOptimizer.tsx](file:///C:/Users/nacho/.gemini/antigravity/scratch/carpinteria-gestion/src/components/CutlistOptimizer.tsx) al reubicar el atributo `title` de SVG como una etiqueta interna `<title>` y declarar correctamente la función `formatARS`.

---

## 3. Módulo de Inventario

Validado a través de [InventoryList.tsx](file:///C:/Users/nacho/.gemini/antigravity/scratch/carpinteria-gestion/src/app/inventario/InventoryList.tsx) y [actions.ts](file:///C:/Users/nacho/.gemini/antigravity/scratch/carpinteria-gestion/src/app/inventario/actions.ts):

- **Ver Stock**: Lista interactiva con filtros por categorías (MDF, Melamina, Herrajes, etc.) y buscador por nombre o proveedor.
- **Movimientos de Stock**: Permite registrar a través de un modal dinámico:
  - **Entradas**: Incrementa el stock e ingresa notas de reabastecimiento y proveedor.
  - **Salidas**: Disminuye las existencias (con validación de stock negativo).
  - **Ajustes**: Cambia el stock absoluto al valor ingresado, registrando la diferencia de ajuste en el log transaccional.
- **Alerta de Stock Mínimo**:
  - El panel superior muestra un indicador resaltado en color ámbar con la cantidad de items por debajo de su límite mínimo de seguridad.
  - La fila del material crítico se resalta visualmente en la tabla e incluye un icono de advertencia (`AlertTriangle`).
- **Historial de Movimientos**: Un sub-modal muestra las últimas 10 transacciones del material seleccionado detallando fecha, tipo de movimiento, cantidad y notas descriptivas.

---

## 4. Persistencia Real en Base de Datos (Sin Mock Data)

Toda la aplicación opera sobre **SQLite** a través del motor **Prisma v6.2.1** (seleccionada por estabilidad y portabilidad futura hacia PostgreSQL). 

- El archivo [schema.prisma](file:///C:/Users/nacho/.gemini/antigravity/scratch/carpinteria-gestion/prisma/schema.prisma) modela adecuadamente las 19 entidades con claves primarias UUID, relaciones en cascada para integridad de datos, y campos de control de auditoría (`createdAt`, `updatedAt`, `deletedAt`).
- El script de semilla [seed.js](file:///C:/Users/nacho/.gemini/antigravity/scratch/carpinteria-gestion/prisma/seed.js) puebla el sistema con un conjunto completo de datos reales (Clientes corporativos e individuales, Empleados con tarifas, Categorías de Materiales y Gastos, Métodos de Pago y Proyectos en diferentes etapas).
- La compilación e inspección estática del proyecto no arroja ningún error ni advertencia (`npm run build` completado con éxito).

---

## 5. Pruebas y Validación Ejecutadas

1. **Compilación Estática de Producción**:
   - Comando ejecutado: `$env:PATH = "C:\Program Files\nodejs;" + $env:PATH; npm.cmd run build`
   - Resultado: **Exitoso**. Generó todas las rutas estáticas y dinámicas sin errores de TypeScript.
2. **Cascadas de Base de Datos y Baja Lógica**:
   - La eliminación de clientes y proyectos aplica marcas `deletedAt`, ocultándolos de las vistas sin romper relaciones históricas en los reportes agregados del dashboard.
3. **Flujo de Descuento de Stock**:
   - Validado que al agregar un material al proyecto seleccionando stock real, o al confirmar los cortes en el optimizador, se descuenta de forma precisa la cantidad utilizada de la tabla `Inventory` y se registra una transacción en `InventoryTransaction`.
