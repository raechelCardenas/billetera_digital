#!/bin/sh
set -e

echo "[DB-SERVICE] Ejecutando migraciones de Prisma..."
npx prisma generate
npx prisma migrate deploy

echo "[DB-SERVICE] Iniciando servicio"
exec npm run start
