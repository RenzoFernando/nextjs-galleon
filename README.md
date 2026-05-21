# nextjs-galleon

Frontend en Next.js para Gringotts/NestEA.

## Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Zustand
- Axios
- Bun

## Variables de entorno

Copia el archivo de ejemplo:

```bash
cp .env.example .env.local
```

Configura:

```env
NEXT_PUBLIC_API_URL=https://taller-nest-nestea.onrender.com/api
```

## Instalación

```bash
bun install
```

## Desarrollo

```bash
bun run dev
```

La aplicación queda disponible en:

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

También puedes ejecutar todo junto:

```bash
bun run check:build
```

## Producción

```bash
bun run build
bun run start
```

## Despliegue en Render

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
