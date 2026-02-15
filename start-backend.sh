#!/bin/bash
set -e

echo "==> Current directory: $(pwd)"
echo "==> Listing files in current directory:"
ls -la

echo "==> Checking if apps/backend exists:"
ls -la apps/ || echo "apps/ directory not found"

echo "==> Checking if apps/backend/dist exists:"
ls -la apps/backend/ || echo "apps/backend/ directory not found"

echo "==> Checking if apps/backend/dist/main.js exists:"
ls -la apps/backend/dist/ || echo "apps/backend/dist/ directory not found"

echo "==> Attempting to start application..."
cd apps/backend && node dist/src/main.js
