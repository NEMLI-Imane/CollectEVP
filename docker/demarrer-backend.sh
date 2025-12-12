#!/bin/bash

echo "========================================"
echo "  Démarrage du Backend CollectEVP"
echo "========================================"
echo ""

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "[ERREUR] Docker n'est pas installé"
    echo "Installez Docker depuis https://www.docker.com/products/docker-desktop"
    exit 1
fi

echo "[1/6] Vérification de Docker... OK"
echo ""

# Vérifier que docker-compose est disponible
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "[ERREUR] docker-compose n'est pas disponible"
    exit 1
fi

echo "[2/6] Démarrage des conteneurs Docker..."
if command -v docker-compose &> /dev/null; then
    docker-compose up -d
else
    docker compose up -d
fi

if [ $? -ne 0 ]; then
    echo "[ERREUR] Impossible de démarrer les conteneurs"
    exit 1
fi

echo "[3/6] Attente du démarrage des services (15 secondes)..."
sleep 15

echo "[4/6] Vérification des conteneurs..."
if command -v docker-compose &> /dev/null; then
    docker-compose ps
else
    docker compose ps
fi

echo ""
echo "[5/6] Installation des dépendances (si nécessaire)..."
if command -v docker-compose &> /dev/null; then
    docker-compose exec -T php composer install --no-interaction 2>/dev/null
else
    docker compose exec -T php composer install --no-interaction 2>/dev/null
fi

echo "[6/6] Vérification de l'API..."
sleep 2
response=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/api/login 2>/dev/null)
if [ "$response" = "000" ] || [ -z "$response" ]; then
    echo "[ATTENTION] L'API ne semble pas répondre encore"
    echo "Attendez quelques secondes de plus et testez: http://127.0.0.1:8080/api/login"
else
    echo "[SUCCÈS] L'API est accessible ! (HTTP $response)"
fi

echo ""
echo "========================================"
echo "  Backend démarré !"
echo "========================================"
echo ""
echo "L'API est accessible sur: http://127.0.0.1:8080/api"
echo ""
echo "Pour voir les logs: docker-compose logs -f php"
echo "Pour arrêter: docker-compose down"
echo ""

