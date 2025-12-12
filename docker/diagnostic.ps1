# Script de diagnostic PowerShell pour CollectEVP Backend
# Usage: .\diagnostic.ps1

Write-Host "🔍 Diagnostic CollectEVP Backend" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier qu'on est dans le bon répertoire
if (-not (Test-Path "composer.json")) {
    Write-Host "❌ Erreur : Vous devez être dans le dossier backend" -ForegroundColor Red
    Write-Host "   Exécutez : cd backend" -ForegroundColor Yellow
    exit 1
}

Write-Host "1. Vérification Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>&1
    Write-Host "✅ Docker installé" -ForegroundColor Green
    Write-Host "   $dockerVersion" -ForegroundColor Gray
} catch {
    Write-Host "❌ Docker non installé" -ForegroundColor Red
    Write-Host "   Installez Docker Desktop depuis https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "2. Vérification Docker Compose..." -ForegroundColor Yellow
try {
    $composeVersion = docker-compose --version 2>&1
    Write-Host "✅ Docker Compose installé" -ForegroundColor Green
    Write-Host "   $composeVersion" -ForegroundColor Gray
} catch {
    Write-Host "❌ Docker Compose non installé" -ForegroundColor Red
}

Write-Host ""
Write-Host "3. Vérification des conteneurs..." -ForegroundColor Yellow
try {
    docker-compose ps 2>&1 | Out-Null
    docker-compose ps
} catch {
    Write-Host "⚠️  Impossible de vérifier les conteneurs (docker-compose.yml manquant ?)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "4. Vérification des fichiers de configuration..." -ForegroundColor Yellow

if (Test-Path ".env.local") {
    Write-Host "✅ .env.local existe" -ForegroundColor Green
} else {
    Write-Host "❌ .env.local manquant" -ForegroundColor Red
    Write-Host "   Créez-le avec : cp .env .env.local" -ForegroundColor Yellow
}

if ((Test-Path "config/jwt/private.pem") -and (Test-Path "config/jwt/public.pem")) {
    Write-Host "✅ Clés JWT existent" -ForegroundColor Green
} else {
    Write-Host "❌ Clés JWT manquantes" -ForegroundColor Red
    Write-Host "   Générez-les avec : php bin/console lexik:jwt:generate-keypair" -ForegroundColor Yellow
}

if (Test-Path "vendor") {
    Write-Host "✅ Dépendances installées (dossier vendor existe)" -ForegroundColor Green
} else {
    Write-Host "❌ Dépendances non installées" -ForegroundColor Red
    Write-Host "   Installez-les avec : composer install" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "5. Test de connexion API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/login" -Method GET -UseBasicParsing -ErrorAction SilentlyContinue
    $statusCode = $response.StatusCode
    if ($statusCode -eq 405 -or $statusCode -eq 401 -or $statusCode -eq 200) {
        Write-Host "✅ API accessible (HTTP $statusCode - réponse normale)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  API répond avec HTTP $statusCode" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ API non accessible (connexion refusée)" -ForegroundColor Red
    Write-Host "   Vérifiez que le backend est démarré : docker-compose up -d" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "6. Vérification base de données..." -ForegroundColor Yellow
try {
    $result = docker-compose exec -T php php bin/console doctrine:query:sql "SELECT COUNT(*) FROM users" 2>&1
    if ($result -match '\d+') {
        Write-Host "✅ Base de données accessible et contient des utilisateurs" -ForegroundColor Green
        $userCount = [regex]::Match($result, '\d+').Value
        Write-Host "   Nombre d'utilisateurs : $userCount" -ForegroundColor Gray
    } else {
        Write-Host "❌ Problème de connexion à la base de données ou base vide" -ForegroundColor Red
        Write-Host "   Vérifiez : docker-compose logs postgres" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Impossible de vérifier la base de données" -ForegroundColor Red
}

Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "Diagnostic terminé !" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Prochaines étapes si des erreurs :" -ForegroundColor Yellow
Write-Host "   1. Voir DEPANNAGE_ERREURS.md pour les solutions"
Write-Host "   2. Vérifier les logs : docker-compose logs php"
Write-Host "   3. Redémarrer : docker-compose restart"

