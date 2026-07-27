# FaltaUno — Backend

API REST en Node.js + Express + Prisma (SQLite) para la app FaltaUno (organización de partidos de fútbol amateur).

## Requisitos

- Node.js 18 o superior
- npm

## Instalación

```bash
npm install
```

## Variables de entorno

El archivo `.env` ya está incluido en el repositorio con los valores necesarios para correr localmente:

```
DATABASE_URL="file:./prisma/dev.db"
PORT=3000
```

No hace falta crear ni modificar nada para levantar el proyecto tal cual está.

## Base de datos

Usa SQLite a través de Prisma, con la base de datos y las migraciones ya incluidas en el repo (no hace falta correr ningún seed).

Si por algún motivo hay que regenerar el cliente de Prisma o aplicar migraciones manualmente:

```bash
npx prisma generate
npx prisma migrate dev
```

(`npm run dev` ya ejecuta `prisma generate` automáticamente antes de levantar el servidor).

## Correr el servidor

```bash
npm run dev
```

Levanta el servidor en `http://localhost:3000` con recarga automática ante cambios (`ts-node-dev`).

## Librerías externas relevantes

- **express**: servidor HTTP / API REST.
- **prisma** + **@prisma/client**: ORM sobre SQLite.
- **bcryptjs**: hashing de contraseñas.
- **cors**: habilita que el frontend (Expo) consuma la API.

## Notas para correr junto al frontend

- El frontend (`faltauno` / faltauno-frontendd) apunta a este backend a través de `API_URL`, que se detecta automáticamente según la IP con la que se levanta el servidor de Expo — no hace falta configurar nada manualmente en un dispositivo nuevo, solo tener el backend corriendo (`npm run dev`) y el celular/emulador en la misma red que la computadora.
- Si el backend estaba corriendo y se edita `prisma/schema.prisma`, hay que detenerlo antes de correr `npx prisma generate` (en Windows el archivo del motor de Prisma queda bloqueado mientras el proceso está activo).
