# 🚀 QUICK FIX - Cache Symfony Windows

## ✅ SOLUTION RAPIDE (1 minute)

### Étape 1 : Exécuter dans PowerShell
```powershell
cd "C:\Users\hp\OneDrive\Bureau\EMINES_CI1A\projet info\CollectEVP Front\backend"
icacls var /grant "${env:USERNAME}:(OI)(CI)F" /T
php bin/console cache:clear
```

### Étape 2 : Démarrer Symfony
```powershell
php -S 127.0.0.1:8080 -t public
```

## ✅ C'EST TOUT !

Le cache devrait maintenant fonctionner. Si vous avez encore des erreurs, exécutez PowerShell **en tant qu'administrateur**.

## 🔧 Script Automatique

Vous pouvez aussi exécuter le script :
```powershell
cd backend
.\fix-cache-permissions.ps1
```

**Si erreur d'exécution** :
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

