# Script PowerShell pour corriger les permissions du cache Symfony sur Windows

Write-Host "🔧 Correction des permissions du cache Symfony..." -ForegroundColor Cyan

# Chemin du projet
$projectRoot = $PSScriptRoot
$varDir = Join-Path $projectRoot "var"
$cacheDir = Join-Path $varDir "cache"
$devCacheDir = Join-Path $cacheDir "dev"
$prodCacheDir = Join-Path $cacheDir "prod"
$logDir = Join-Path $varDir "log"

# Créer les dossiers s'ils n'existent pas
Write-Host "📁 Création des dossiers..." -ForegroundColor Yellow
if (-not (Test-Path $varDir)) {
    New-Item -ItemType Directory -Path $varDir -Force | Out-Null
    Write-Host "✅ Créé: $varDir" -ForegroundColor Green
}

if (-not (Test-Path $cacheDir)) {
    New-Item -ItemType Directory -Path $cacheDir -Force | Out-Null
    Write-Host "✅ Créé: $cacheDir" -ForegroundColor Green
}

if (-not (Test-Path $devCacheDir)) {
    New-Item -ItemType Directory -Path $devCacheDir -Force | Out-Null
    Write-Host "✅ Créé: $devCacheDir" -ForegroundColor Green
}

if (-not (Test-Path $prodCacheDir)) {
    New-Item -ItemType Directory -Path $prodCacheDir -Force | Out-Null
    Write-Host "✅ Créé: $prodCacheDir" -ForegroundColor Green
}

if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    Write-Host "✅ Créé: $logDir" -ForegroundColor Green
}

# Donner les permissions complètes à l'utilisateur actuel
Write-Host "🔐 Attribution des permissions avec icacls..." -ForegroundColor Yellow

$currentUser = $env:USERNAME

try {
    # Utiliser icacls qui est plus fiable sur Windows
    # (OI) = Object Inherit, (CI) = Container Inherit, F = Full Control, /T = récursif
    $result = icacls $varDir /grant "${currentUser}:(OI)(CI)F" /T 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Permissions attribuées avec succès!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Certaines permissions n'ont pas pu être appliquées" -ForegroundColor Yellow
        Write-Host "💡 Essayez d'exécuter PowerShell en tant qu'administrateur" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Erreur lors de l'attribution des permissions: $_" -ForegroundColor Red
    Write-Host "💡 Essayez d'exécuter PowerShell en tant qu'administrateur" -ForegroundColor Yellow
}

# Vider le cache Symfony
Write-Host "🧹 Nettoyage du cache Symfony..." -ForegroundColor Yellow
if (Test-Path $devCacheDir) {
    Remove-Item -Path "$devCacheDir\*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Cache vidé" -ForegroundColor Green
}

Write-Host "`n✨ Terminé! Vous pouvez maintenant démarrer Symfony." -ForegroundColor Cyan
Write-Host "💡 Commande: php -S 127.0.0.1:8080 -t public" -ForegroundColor Yellow

