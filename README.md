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

El archivo `.env.example` se deja como referencia para saber qué variable necesita el proyecto.

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

## Ejecución

Compilar la aplicación:

```bash
bun run build
```

Compilar la aplicación:

```bash
bun run start
```

## Despliegue

El frontend fue desplegado en Vercel:

```txt
https://nextjs-galleon.vercel.app/login
```

El backend consumido por el frontend está desplegado en Render:

```txt
https://taller-nest-nestea.onrender.com/api
```

## Credenciales de prueba

```txt
Email: superadmin@nestea.hp
Password: Gringotts2026*
```

## Rutas principales

### Públicas

```txt
/login
/unauthorized
```

### Privadas

```txt
/dashboard
/vaults
/vaults/new
/vaults/[vaultId]
/vaults/[vaultId]/edit
/vaults/[vaultId]/members
/vaults/[vaultId]/categories
/vaults/[vaultId]/merchants
/vaults/[vaultId]/transactions
/vaults/[vaultId]/transactions/new
/admin/users
/admin/roles
/admin/permissions
```

## Cómo probar la aplicación

### 1. Autenticación

1. Entrar a `/login`.
2. Intentar iniciar sesión con credenciales inválidas.
3. Confirmar que aparece un mensaje de error visual.
4. Iniciar sesión con credenciales válidas.
5. Confirmar redirección a `/dashboard`.
6. Cerrar sesión desde el navbar.
7. Confirmar redirección a `/login`.

### 2. Rutas protegidas

1. Cerrar sesión.
2. Intentar entrar directamente a `/dashboard`.
3. Confirmar redirección a `/login`.
4. Iniciar sesión.
5. Confirmar acceso a `/dashboard` y `/vaults`.

### 3. Administración

Probar como `superadmin`:

* Listar, crear, editar y eliminar usuarios en `/admin/users`.
* Listar, crear, editar y eliminar roles en `/admin/roles`.
* Asignar y remover permisos de roles en `/admin/roles`.
* Listar, crear, editar y eliminar permisos en `/admin/permissions`.

### 4. Bóvedas

Probar en `/vaults`:

* Listar bóvedas.
* Crear bóveda.
* Ver detalle.
* Editar bóveda.
* Eliminar bóveda.
* Usar filtros cuando estén disponibles.

### 5. Miembros de bóveda

Probar en `/vaults/[vaultId]/members`:

* Listar miembros.
* Agregar miembro.
* Cambiar permiso interno.
* Remover miembro.
* Usar filtros por usuario o permiso.

### 6. Categorías, comercios y transacciones

Probar dentro de una bóveda:

* Crear, editar y eliminar categorías.
* Crear, editar y eliminar comercios.
* Crear, listar, filtrar, editar y eliminar transacciones.

## Pruebas automatizadas

El taller solicita pruebas unitarias y E2E automatizadas.

```txt
PENDIENTE
```

## Informe de funcionalidades

El informe de funcionalidades está en:

```txt
docs/INFORME_FUNCIONALIDADES.md
```