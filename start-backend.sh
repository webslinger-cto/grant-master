#!/bin/bash
set -e

echo "==> Running database migrations..."
cd apps/backend && npx ts-node -r tsconfig-paths/register src/database/cli.ts migrate:latest
cd ../..

echo "==> Starting application..."
cd apps/backend && node dist/src/main.js
