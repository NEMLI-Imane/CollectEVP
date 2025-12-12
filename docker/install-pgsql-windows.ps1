# Script d'installation de l'extension PostgreSQL pour PHP sur Windows
Write-Host "🔧 Installation de l'extension PostgreSQL pour PHP" -ForegroundColor Cyan
Write-Host ""

# Trouver le fichier php.ini
$phpIniPath = php --ini | Select-String "Loaded Configuration File" | ForEach-Object { ($_ -split ":")[1].Trim() }

if (-not $phpIniPath -or -not (Test-Path $phpIniPath)) {
    Write-Host "❌ Impossible de trouver php.ini" -ForegroundColor Red
    Write-Host "   Vérifiez que PHP est dans votre PATH" -ForegroundColor Yellow
    exit 1
}

Write-Host "📄 Fichier php.ini trouvé: $phpIniPath" -ForegroundColor Green
Write-Host ""

# Vérifier si les extensions sont déjà activées
$phpIniContent = Get-Content $phpIniPath -Raw

if ($phpIniContent -match "^\s*extension\s*=\s*pdo_pgsql" -and $phpIniContent -match "^\s*extension\s*=\s*pgsql") {
    Write-Host "✅ Les extensions PostgreSQL semblent déjà activées" -ForegroundColor Green
    Write-Host ""
    Write-Host "Vérification avec PHP:" -ForegroundColor Yellow
    php -r "echo 'pdo_pgsql: ' . (extension_loaded('pdo_pgsql') ? '✅ Activé' : '❌ Non activé') . PHP_EOL;"
    php -r "echo 'pgsql: ' . (extension_loaded('pgsql') ? '✅ Activé' : '❌ Non activé') . PHP_EOL;"
    exit 0
}

# Créer une sauvegarde
$backupPath = "$phpIniPath.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Copy-Item $phpIniPath $backupPath
Write-Host "💾 Sauvegarde créée: $backupPath" -ForegroundColor Green
Write-Host ""

# Lire le contenu ligne par ligne
$lines = Get-Content $phpIniPath
$newLines = @()
$modified = $false

foreach ($line in $lines) {
    # Décommenter pdo_pgsql
    if ($line -match "^\s*;\s*extension\s*=\s*pdo_pgsql") {
        $newLines += $line -replace "^\s*;\s*", ""
        $modified = $true
        Write-Host "✅ Extension pdo_pgsql activée" -ForegroundColor Green
    }
    # Décommenter pgsql
    elseif ($line -match "^\s*;\s*extension\s*=\s*pgsql") {
        $newLines += $line -replace "^\s*;\s*", ""
        $modified = $true
        Write-Host "✅ Extension pgsql activée" -ForegroundColor Green
    }
    else {
        $newLines += $line
    }
}

if (-not $modified) {
    Write-Host "⚠️  Les extensions PostgreSQL ne sont pas trouvées dans php.ini" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Ajout manuel nécessaire:" -ForegroundColor Yellow
    Write-Host "   1. Ouvrez: $phpIniPath" -ForegroundColor White
    Write-Host "   2. Ajoutez ces lignes dans la section [Extensions]:" -ForegroundColor White
    Write-Host "      extension=pdo_pgsql" -ForegroundColor Cyan
    Write-Host "      extension=pgsql" -ForegroundColor Cyan
    Write-Host "   3. Redémarrez votre serveur PHP" -ForegroundColor White
} else {
    # Écrire le nouveau contenu
    $newLines | Set-Content $phpIniPath
    Write-Host ""
    Write-Host "✅ php.ini modifié avec succès !" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Redémarrez votre serveur PHP pour que les changements prennent effet" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Vérification:" -ForegroundColor Yellow
    php -r "echo 'pdo_pgsql: ' . (extension_loaded('pdo_pgsql') ? '✅ Activé' : '❌ Non activé - Redémarrez PHP') . PHP_EOL;"
    php -r "echo 'pgsql: ' . (extension_loaded('pgsql') ? '✅ Activé' : '❌ Non activé - Redémarrez PHP') . PHP_EOL;"
}

Write-Host ""
Write-Host "💡 Si les extensions ne sont toujours pas activées après redémarrage:" -ForegroundColor Yellow
Write-Host "   1. Vérifiez que les DLL PostgreSQL sont dans le dossier 'ext' de PHP" -ForegroundColor White
Write-Host "   2. Téléchargez-les depuis: https://windows.php.net/downloads/pecl/releases/pgsql/" -ForegroundColor White

