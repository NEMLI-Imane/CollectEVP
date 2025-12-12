# Script de configuration SQLite pour le backend
Write-Host "🔧 Configuration SQLite pour CollectEVP Backend" -ForegroundColor Cyan
Write-Host ""

# Vérifier qu'on est dans le bon répertoire
if (-not (Test-Path "composer.json")) {
    Write-Host "❌ Erreur : Vous devez être dans le dossier backend" -ForegroundColor Red
    Write-Host "   Exécutez : cd backend" -ForegroundColor Yellow
    exit 1
}

# Créer le dossier var si nécessaire
if (-not (Test-Path "var")) {
    New-Item -ItemType Directory -Path "var" | Out-Null
    Write-Host "✅ Dossier 'var' créé" -ForegroundColor Green
}

# Créer le fichier .env.local
$envLocalContent = @"
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
"@

if (Test-Path ".env.local") {
    $backup = ".env.local.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Copy-Item ".env.local" $backup
    Write-Host "💾 Sauvegarde de .env.local créée: $backup" -ForegroundColor Green
}

$envLocalContent | Out-File -FilePath ".env.local" -Encoding UTF8
Write-Host "✅ Fichier .env.local créé avec configuration SQLite" -ForegroundColor Green
Write-Host ""

# Vérifier que les clés JWT existent
if (-not ((Test-Path "config/jwt/private.pem") -and (Test-Path "config/jwt/public.pem"))) {
    Write-Host "⚠️  Clés JWT manquantes" -ForegroundColor Yellow
    Write-Host "   Génération des clés JWT..." -ForegroundColor Yellow
    php bin/console lexik:jwt:generate-keypair --no-interaction 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Clés JWT générées" -ForegroundColor Green
    } else {
        Write-Host "❌ Erreur lors de la génération des clés JWT" -ForegroundColor Red
        Write-Host "   Exécutez manuellement: php bin/console lexik:jwt:generate-keypair" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Créer la base de données
Write-Host "📦 Création de la base de données SQLite..." -ForegroundColor Yellow
php bin/console doctrine:database:create --if-not-exists --no-interaction 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Base de données créée" -ForegroundColor Green
} else {
    Write-Host "⚠️  La base de données existe peut-être déjà" -ForegroundColor Yellow
}

# Exécuter les migrations
Write-Host "📦 Exécution des migrations..." -ForegroundColor Yellow
php bin/console doctrine:migrations:migrate --no-interaction 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migrations exécutées" -ForegroundColor Green
} else {
    Write-Host "⚠️  Erreur lors des migrations" -ForegroundColor Yellow
}

# Charger les fixtures
Write-Host "📦 Chargement des utilisateurs de test..." -ForegroundColor Yellow
php bin/console doctrine:fixtures:load --no-interaction 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Utilisateurs de test chargés" -ForegroundColor Green
} else {
    Write-Host "⚠️  Erreur lors du chargement des fixtures" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Configuration terminée !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Prochaines étapes:" -ForegroundColor Yellow
Write-Host "   1. Redémarrez le serveur PHP:" -ForegroundColor White
Write-Host "      php -S 127.0.0.1:8080 -t public" -ForegroundColor Cyan
Write-Host ""
Write-Host "   2. Testez la connexion dans l'application avec:" -ForegroundColor White
Write-Host "      Email: gestionnaire@ocp.ma" -ForegroundColor Cyan
Write-Host "      Mot de passe: password123" -ForegroundColor Cyan
Write-Host ""

