# Informe de funcionalidades 

## 1. Descripción general

`nextjs-galleon` es el frontend de Gringotts/NestEA. Fue desarrollado con Next.js y consume una API backend en NestJS mediante servicios HTTP.

La aplicación permite iniciar sesión, navegar por rutas privadas, administrar usuarios, roles y permisos, y gestionar bóvedas con miembros, categorías, comercios y transacciones.

## 2. Funcionalidades implementadas

### Autenticación

Se implementó inicio y cierre de sesión con JWT.

El login se realiza desde `/login`. Cuando las credenciales son válidas, el frontend guarda los tokens, carga el usuario autenticado y redirige al dashboard privado.

También se implementó cierre de sesión desde el navbar. Al cerrar sesión se limpia el estado local y se redirige al usuario a `/login`.

### Sesión y refresh de tokens

El cliente HTTP agrega automáticamente el token de acceso en las peticiones privadas.

Si una petición responde `401`, el frontend intenta renovar la sesión con el refresh token. Si el refresh funciona, guarda los nuevos tokens y repite la petición original. Si falla, limpia la sesión.

### Rutas protegidas

Las páginas privadas se renderizan dentro de `AppShell`, que usa `ProtectedRoute`.

`ProtectedRoute` valida:

* sesión hidratada;
* usuario autenticado;
* roles permitidos;
* permisos requeridos.

Si no hay sesión, redirige a `/login`. Si hay sesión pero no permisos, redirige a `/unauthorized`.

### Autorización

La autorización se basa en el modelo:

```txt
User → Role → RolePermission → Permission
```

Los permisos no están directamente en el usuario; se heredan desde el rol.

La interfaz usa helpers de autorización para mostrar u ocultar opciones del sidebar y proteger rutas administrativas. El rol `superadmin` se trata como acceso administrativo completo en el frontend.

### Gestión de estado

La gestión global de autenticación se implementó con Zustand en `store/auth.store.ts`.

El store centraliza:

* usuario autenticado;
* access token;
* refresh token;
* estado de autenticación;
* estado de carga;
* hidratación de sesión;
* errores de autenticación;
* login;
* logout;
* carga de sesión;
* validación de roles;
* validación de permisos.

El estado específico de cada módulo, como formularios, filtros, listas y modales, se maneja localmente en las páginas con hooks de React.

## 3. Módulos o rutas 

### Dashboard

La ruta `/dashboard` muestra información del usuario autenticado, rol, permisos, resumen de bóvedas, movimientos recientes y accesos rápidos.

### Administración de usuarios

La ruta `/admin/users` permite listar, crear, editar y eliminar usuarios. También permite asignar roles a usuarios.

### Administración de roles

La ruta `/admin/roles` permite listar, crear, editar y eliminar roles. Además permite asignar y remover permisos de cada rol.

### Administración de permisos

La ruta `/admin/permissions` permite listar, crear, editar y eliminar permisos globales.

### Bóvedas

La ruta `/vaults` permite listar bóvedas, aplicar filtros, crear nuevas bóvedas y acceder al detalle de cada una.

Desde el detalle de una bóveda se puede acceder a edición, miembros, categorías, comercios y transacciones.

### Miembros de bóveda

El módulo de miembros permite compartir una bóveda con otros usuarios y asignar permisos internos como lector, editor o administrador.

También se contempla el caso de propietario de la bóveda como un permiso especial tratado desde la interfaz.

### Categorías

Las categorías permiten organizar transacciones dentro de una bóveda. El frontend incluye listado, creación, edición y eliminación o archivo de categorías.

### Comercios

Los comercios permiten asociar transacciones a entidades externas. El frontend incluye listado, creación, edición y eliminación.

### Transacciones

Las transacciones permiten registrar movimientos financieros dentro de una bóveda. El frontend incluye listado, filtros, creación, edición y eliminación.

## 4. Consumo de API

El consumo del backend se organiza en `lib/api`.

Servicios implementados:

```txt
auth.api.ts
users.api.ts
roles.api.ts
permissions.api.ts
role-permissions.api.ts
vaults.api.ts
members.api.ts
categories.api.ts
merchants.api.ts
transactions.api.ts
```

El archivo `http.ts` centraliza Axios, token bearer, refresh automático y normalización de errores.

## 5. Interfaz de usuario

La interfaz utiliza una estética oscura inspirada en Gringotts, con tonos dorados, verdes y burdeos.

Se implementaron:

* layout privado con sidebar y navbar;
* formularios controlados;
* modales;
* tarjetas de resumen;
* tablas y listados;
* filtros;
* estados vacíos;
* mensajes de éxito;
* mensajes de error;
* estados de carga.

## 6. Código

El proyecto está organizado por responsabilidades:

```txt
app/
components/
lib/api/
lib/auth/
store/
types/
```

También usamos tipos TypeScript para las entidades principales del dominio: usuario, rol, permiso, bóveda, membresía, categoría, comercio y transacción.

## 7. Despliegue

El frontend fue desplegado en Vercel y consume el backend desplegado en Render.

Frontend desplegado:

```txt
https://nextjs-galleon.vercel.app/login
```

Backend consumido:

```bash
https://taller-nest-nestea.onrender.com/api
```

Con esta configuración, el frontend desplegado en Vercel realiza las peticiones HTTP hacia la API pública del backend.

## 8. Pruebas

El taller solicita pruebas unitarias y E2E automatizadas.

```txt
PENDIENTE
```
