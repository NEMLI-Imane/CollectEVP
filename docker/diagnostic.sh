#!/bin/bash

echo "🔍 Diagnostic CollectEVP Backend"
echo "================================="
echo ""

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "composer.json" ]; then
    echo "❌ Erreur : Vous devez être dans le dossier backend"
    echo "   Exécutez : cd backend"
    exit 1
fi

echo "1. Vérification Docker..."
if command -v docker &> /dev/null; then
    echo "✅ Docker installé"
    docker --version
else
    echo "❌ Docker non installé"
    echo "   Installez Docker Desktop depuis https://www.docker.com/products/docker-desktop"
fi

echo ""
echo "2. Vérification Docker Compose..."
if command -v docker-compose &> /dev/null; then
    echo "✅ Docker Compose installé"
    docker-compose --version
else
    echo "❌ Docker Compose non installé"
fi

echo ""
echo "3. Vérification des conteneurs..."
if docker-compose ps &> /dev/null; then
    docker-compose ps
else
    echo "⚠️  Impossible de vérifier les conteneurs (docker-compose.yml manquant ?)"
fi

echo ""
echo "4. Vérification des fichiers de configuration..."

if [ -f ".env.local" ]; then
    echo "✅ .env.local existe"
else
    echo "❌ .env.local manquant"
    echo "   Créez-le avec : cp .env .env.local"
fi

if [ -f "config/jwt/private.pem" ] && [ -f "config/jwt/public.pem" ]; then
    echo "✅ Clés JWT existent"
else
    echo "❌ Clés JWT manquantes"
    echo "   Générez-les avec : php bin/console lexik:jwt:generate-keypair"
fi

if [ -d "vendor" ]; then
    echo "✅ Dépendances installées (dossier vendor existe)"
else
    echo "❌ Dépendances non installées"
    echo "   Installez-les avec : composer install"
fi

echo ""
echo "5. Test de connexion API..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/login 2>/dev/null)
if [ "$response" = "405" ] || [ "$response" = "401" ] || [ "$response" = "200" ]; then
    echo "✅ API accessible (HTTP $response - réponse normale pour OPTIONS/GET)"
elif [ "$response" = "000" ]; then
    echo "❌ API non accessible (connexion refusée)"
    echo "   Vérifiez que le backend est démarré : docker-compose up -d"
else
    echo "⚠️  API répond avec HTTP $response"
fi

echo ""
echo "6. Vérification base de données..."
if docker-compose exec -T php php bin/console doctrine:query:sql "SELECT COUNT(*) FROM users" 2>/dev/null | grep -q "[0-9]"; then
    echo "✅ Base de données accessible et contient des utilisateurs"
    user_count=$(docker-compose exec -T php php bin/console doctrine:query:sql "SELECT COUNT(*) FROM users" 2>/dev/null | grep -o '[0-9]*' | head -1)
    echo "   Nombre d'utilisateurs : $user_count"
else
    echo "❌ Problème de connexion à la base de données ou base vide"
    echo "   Vérifiez : docker-compose logs postgres"
fi

echo ""
echo "================================="
echo "Diagnostic terminé !"
echo ""
echo "💡 Prochaines étapes si des erreurs :"
echo "   1. Voir DEPANNAGE_ERREURS.md pour les solutions"
echo "   2. Vérifier les logs : docker-compose logs php"
echo "   3. Redémarrer : docker-compose restart"

