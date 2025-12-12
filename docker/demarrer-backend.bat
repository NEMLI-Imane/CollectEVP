@echo off
echo ========================================
echo   Demarrage du Backend CollectEVP
echo ========================================
echo.

REM Vérifier que Docker est installé
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Docker n'est pas installe ou n'est pas dans le PATH
    echo Installez Docker Desktop depuis https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo [1/6] Verification de Docker... OK
echo.

REM Vérifier que docker-compose est disponible
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] docker-compose n'est pas disponible
    echo Essayez avec: docker compose up -d
    pause
    exit /b 1
)

echo [2/6] Demarrage des conteneurs Docker...
docker-compose up -d
if errorlevel 1 (
    echo [ERREUR] Impossible de demarrer les conteneurs
    pause
    exit /b 1
)

echo [3/6] Attente du demarrage des services (15 secondes)...
timeout /t 15 /nobreak >nul

echo [4/6] Verification des conteneurs...
docker-compose ps

echo.
echo [5/6] Installation des dependances (si necessaire)...
docker-compose exec -T php composer install --no-interaction 2>nul

echo [6/6] Verification de l'API...
timeout /t 2 /nobreak >nul
curl -s -o nul -w "%%{http_code}" http://127.0.0.1:8080/api/login >nul 2>&1
if errorlevel 1 (
    echo [ATTENTION] L'API ne semble pas repondre encore
    echo Attendez quelques secondes de plus et testez: http://127.0.0.1:8080/api/login
) else (
    echo [SUCCES] L'API est accessible !
)

echo.
echo ========================================
echo   Backend demarre !
echo ========================================
echo.
echo L'API est accessible sur: http://127.0.0.1:8080/api
echo.
echo Pour voir les logs: docker-compose logs -f php
echo Pour arreter: docker-compose down
echo.
pause

