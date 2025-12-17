# Script PowerShell pour vider les tables EVP
# Utilise Doctrine pour vider les tables via Symfony

Write-Host "Vidage des tables EVP..." -ForegroundColor Yellow

# Aller dans le répertoire backend
Set-Location $PSScriptRoot

# Vérifier si Symfony est disponible
if (-not (Test-Path "bin/console")) {
    Write-Host "Erreur: bin/console introuvable. Assurez-vous d'être dans le répertoire backend." -ForegroundColor Red
    exit 1
}

# Exécuter la commande Doctrine pour vider les tables
Write-Host "Suppression des données de la table primes..." -ForegroundColor Cyan
php bin/console dbal:run-sql "DELETE FROM primes"

Write-Host "Suppression des données de la table conges..." -ForegroundColor Cyan
php bin/console dbal:run-sql "DELETE FROM conges"

Write-Host "Suppression des données de la table evp_submissions..." -ForegroundColor Cyan
php bin/console dbal:run-sql "DELETE FROM evp_submissions"

Write-Host "`nTables vidées avec succès!" -ForegroundColor Green

