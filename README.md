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

Variable requerida:

```env
NEXT_PUBLIC_API_URL=https://taller-nest-nestea.onrender.com/api
```
