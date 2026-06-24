# Sistema de Gestión de Carpintería

Este es un sistema de gestión integral autocontenido diseñado para carpinterías familiares. Permite centralizar la administración de clientes, proyectos, control de stock, presupuestos versus costos reales, cobros a cuenta, gastos generales del taller y optimización de cortes de placas.

## Tecnologías Utilizadas

* **Frontend & Backend**: Next.js (App Router) con TypeScript.
* **Estilos**: Vanilla CSS con variables de diseño premium y soporte para tema Oscuro/Claro.
* **Base de Datos**: SQLite (para desarrollo y uso local) y preparado para PostgreSQL.
* **ORM**: Prisma ORM.
* **Íconos**: Lucide React.

---

## Requisitos Previos

Asegúrese de tener instalado en su sistema:
1. **Node.js** (LTS v18 o superior).
2. **NPM** (incluido con Node.js).

---

## Instalación y Configuración Inicial

Siga estos pasos para poner en marcha el sistema en su computadora local:

### 1. Descargar las dependencias
Abra su consola de comandos en el directorio del proyecto y ejecute:
```bash
npm install
```

### 2. Configurar las Variables de Entorno
Cree un archivo llamado `.env` en la raíz del proyecto (si no existe) y configure la ruta de la base de datos local de SQLite:
```env
DATABASE_URL="file:./dev.db"
```

### 3. Ejecutar las Migraciones de Base de Datos
Para crear las tablas y relaciones relacionales en el archivo local de base de datos (`dev.db`), ejecute:
```bash
npx prisma migrate dev --name init
```

### 4. Precargar Datos de Ejemplo (Seed)
Para comenzar con clientes, empleados, inventario inicial, categorías y usuarios de prueba precargados, ejecute:
```bash
npx prisma db seed
```

---

## Ejecutar la Aplicación Localmente

Para iniciar el servidor de desarrollo local, ejecute:
```bash
npm run dev
```

Abra su navegador web e ingrese a:
[http://localhost:3000](http://localhost:3000)

---

## Credenciales de Acceso por Defecto

El sistema cuenta con dos usuarios creados en el seed para probar el control de roles:

1. **Administrador** (Acceso total a finanzas, auditoría y eliminación):
   * **Usuario**: `admin`
   * **Contraseña**: `admin123`

2. **Operario / Operador** (Permisos de taller, carga de gastos y proyectos, sin acceso a ganancias netas ni borrado de datos críticos):
   * **Usuario**: `operador`
   * **Contraseña**: `operador123`

---

## Estructura del Proyecto

* `prisma/schema.prisma`: Definición de la estructura relacional de la base de datos.
* `prisma/seed.js`: Script que carga los datos de prueba.
* `src/app/page.tsx`: Pantalla de Dashboard principal con indicadores clave de rendimiento (KPIs), alertas y gráficos SVG.
* `src/app/clientes/`: Vistas y acciones para el CRUD de Clientes e historiales comerciales.
* `src/app/empleados/`: CRUD de operarios y el Reporte de Costos Laborales consolidado por mes y año.
* `src/app/gastos/`: Control de gastos fijos y generales del taller (Alquiler, Luz, Internet, etc.).
* `src/app/inventario/`: Control de stock, alertas por faltante e historial de transacciones de maderas y herrajes.
* `src/app/proyectos/`: Gestión de proyectos y cotizaciones, presupuestos vs costo real, cobros y el **Optimizador de Cortes**.
* `src/components/CutlistOptimizer.tsx`: Módulo visual de optimización de cortes inspirado en CutList Optimizer.
* `src/app/respaldos/`: Módulo para exportar e importar copias de seguridad de toda la base de datos en formato JSON.

---

## Módulo de Copias de Seguridad (Backup & Restore)

En la sección **Copias de Seguridad** del menú lateral:
* **Exportar**: Compila todas las tablas en un único archivo JSON descargable. Esto le permite guardar respaldos fuera de la computadora.
* **Importar**: Permite subir un archivo JSON anterior para restaurar el taller al estado exacto del respaldo (sobrescribe la base de datos actual).

---

## Cómo Migrar de SQLite a PostgreSQL en el Futuro

Si el taller crece y desea utilizar el sistema en múltiples computadoras conectadas simultáneamente, debe migrar a una base de datos PostgreSQL alojada en red o en la nube. Siga estos sencillos pasos:

1. **Exportar Respaldo**: Vaya a la sección "Copias de Seguridad" en su instalación local actual y descargue el archivo de copia de seguridad `.json`.
2. **Actualizar el Esquema de Prisma**:
   Abra `prisma/schema.prisma` y modifique el bloque `datasource db` para usar el proveedor de PostgreSQL:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. **Modificar Variable de Entorno**:
   Abra el archivo `.env` en el servidor de producción o en las computadoras del taller y configure la cadena de conexión de PostgreSQL:
   ```env
   DATABASE_URL="postgresql://usuario:contraseña@servidor:5432/carpinteria_db?schema=public"
   ```
4. **Ejecutar las Migraciones en el Servidor**:
   Corra el comando de migración para estructurar las tablas en PostgreSQL:
   ```bash
   npx prisma migrate deploy
   ```
5. **Importar los Datos**:
   Inicie el sistema en red, inicie sesión con el usuario admin por defecto, vaya a "Copias de Seguridad" e importe el archivo `.json` descargado en el paso 1. Todos los clientes, proyectos, stock y reportes se restaurarán en el nuevo servidor PostgreSQL.
