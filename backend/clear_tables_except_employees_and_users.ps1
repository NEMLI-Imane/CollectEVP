# Script PowerShell pour vider toutes les tables sauf employees et users
# Utilise Doctrine pour vider les tables via Symfony

Write-Host "Vidage de toutes les tables sauf employees et users..." -ForegroundColor Yellow
Write-Host ""

# Aller dans le repertoire backend
Set-Location $PSScriptRoot

# Verifier si Symfony est disponible
if (-not (Test-Path "bin/console")) {
    Write-Host "Erreur: bin/console introuvable. Assurez-vous d'etre dans le repertoire backend." -ForegroundColor Red
    exit 1
}

# Liste des tables a vider (dans l'ordre pour respecter les contraintes de cles etrangeres)
$tables = @(
    "primes",
    "conges",
    "evp_submissions",
    "employee_requests"
)

Write-Host "Tables a vider:" -ForegroundColor Cyan
foreach ($table in $tables) {
    Write-Host "   - $table" -ForegroundColor Gray
}
Write-Host ""
Write-Host "Tables preservees:" -ForegroundColor Green
Write-Host "   - employees" -ForegroundColor Gray
Write-Host "   - users" -ForegroundColor Gray
Write-Host ""

# Verifier que la base de donnees est accessible
Write-Host "Verification de la connexion a la base de donnees..." -ForegroundColor Cyan
try {
    $testResult = php bin/console dbal:run-sql "SELECT 1" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erreur: Impossible de se connecter a la base de donnees" -ForegroundColor Red
        Write-Host $testResult -ForegroundColor Red
        exit 1
    }
    Write-Host "Connexion a la base de donnees reussie" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "Erreur lors de la verification de la connexion: $_" -ForegroundColor Red
    exit 1
}

# Vider chaque table
foreach ($table in $tables) {
    Write-Host "Suppression des donnees de la table $table..." -ForegroundColor Cyan
    try {
        $result = php bin/console dbal:run-sql "DELETE FROM $table" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   Table $table videe avec succes" -ForegroundColor Green
        } else {
            Write-Host "   Avertissement lors du vidage de $table (peut-etre que la table n'existe pas ou est deja vide)" -ForegroundColor Yellow
            Write-Host "   $result" -ForegroundColor Gray
        }
    } catch {
        Write-Host "   Avertissement: $_" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Vidage termine! Toutes les tables (sauf employees et users) ont ete videes." -ForegroundColor Green
Write-Host ""
Write-Host "Les tables 'employees' et 'users' ont ete preservees." -ForegroundColor Cyan
