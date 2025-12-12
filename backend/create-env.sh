#!/bin/bash
# Script pour créer un fichier .env.local avec SQLite
# Usage: ./create-env.sh

cat > .env.local << 'ENVEOF'
###> symfony/framework-bundle ###
APP_ENV=dev
APP_SECRET=collectevp-secret-key-2025-ocp-safi-production-change-in-prod
###< symfony/framework-bundle ###

###> doctrine/doctrine-bundle ###
DATABASE_URL="sqlite:///%kernel.project_dir%/var/data.db"
###< doctrine/doctrine-bundle ###

###> lexik/jwt-authentication-bundle ###
JWT_SECRET_KEY=%kernel.project_dir%/config/jwt/private.pem
JWT_PUBLIC_KEY=%kernel.project_dir%/config/jwt/public.pem
JWT_PASSPHRASE=collectevp-jwt-passphrase-2025-ocp-safi
JWT_TTL=3600
###< lexik/jwt-authentication-bundle ###
ENVEOF

echo "✅ Fichier .env.local créé avec configuration SQLite"







