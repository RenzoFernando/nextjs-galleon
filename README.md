# nextjs-galleon

Frontend en Next.js para **Gringotts/NestEA**. La aplicación consume la API backend desarrollada en NestJS y permite gestionar autenticación, autorización, usuarios, roles, permisos, bóvedas, miembros, categorías, comercios y transacciones.

* Luna Catalina Martínez Vásquez — A00401964
* Renzo Fernando Mosquera Daza — A00401681
* Hideki Tamura Hernández — A00348618

## Stack

* Next.js
* React
* TypeScript
* Tailwind CSS
* Zustand
* Axios
* React Icons
* Bun

## Requisitos

* Bun
* Acceso a la API backend de Gringotts/NestEA
* Archivo de variables de entorno configurado

## Variables de entorno

El proyecto utiliza un archivo `.env` en la raíz.

El archivo debe contener la URL base del backend desplegado:

```env
NEXT_PUBLIC_API_URL=https://taller-nest-nestea.onrender.com/api
```

## Instalación

```bash
bun install
```

## Ejecución en desarrollo

```bash
bun run dev
```

Abrir:

```txt
http://localhost:3000
```

## Validación local

```bash
bun run typecheck
bun run lint
bun run format:check
bun run build
```

O ejecutar la validación completa:

```bash
bun run check:build
```

## Ejecución en producción

Compilar la aplicación:

```bash
bun run build
```

Iniciar la aplicación compilada:

```bash
bun run start
```

## Credenciales de prueba

Usuario superadmin inicial del backend:

```txt
Correo: superadmin@nestea.hp
Contraseña: Gringotts2026*
```

## Funcionalidades principales

* Login y logout con JWT.
* Refresh automático de sesión desde el cliente HTTP.
* Rutas privadas mediante `AppShell` y `ProtectedRoute`.
* Sidebar con navegación privada y opciones administrativas según rol o permisos.
* Administración de usuarios, roles y permisos.
* Asignación y remoción de permisos por rol.
* Gestión de bóvedas.
* Gestión de miembros de bóveda.
* Gestión de categorías.
* Gestión de comercios.
* Gestión de transacciones con filtros y paginación.
* Mensajes de carga, éxito, error y confirmación sin `window.alert`.


## Informe

El informe funcional está en:

```txt
docs/INFORME_FUNCIONALIDADES.md
```

## Despliegue

El proyecto incluye configuración para Render en `render.yaml`.

Build command:

```bash
bun install --frozen-lockfile && bun run build
```

Start command:

```bash
bun run start
```

Variable requerida:

```env
NEXT_PUBLIC_API_URL=https://taller-nest-nestea.onrender.com/api
```

## Pipeline

El workflow principal está en:

```txt
.github/workflows/ci.yml
```

El pipeline valida instalación, TypeScript, ESLint, formato y build. También deja preparado el disparo de despliegue en Render si se configura el secret `RENDER_DEPLOY_HOOK_URL`.
