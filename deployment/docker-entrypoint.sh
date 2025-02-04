#!/bin/sh
set -e

echo "Running migrations..."
npx prisma migrate deploy

# como detectar si ya hubo un deploy anterior, y no se
# deberia ejecutar seeds?
# echo "Running seeds"
# node dist/seed.js

node dist/main.js
