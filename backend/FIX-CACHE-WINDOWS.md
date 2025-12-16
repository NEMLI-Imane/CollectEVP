# 🔧 Fix Cache Permissions - Windows

## Problème
Erreur Symfony : "Unable to write in the cache directory var/cache/dev"

## Solution Rapide

### Option 1 : Exécuter le script PowerShell (RECOMMANDÉ)
```powershell
cd backend
.\fix-cache-permissions.ps1
```

**Si vous avez une erreur d'exécution**, exécutez d'abord :
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Option 2 : Commandes manuelles

1. **Créer les dossiers** :
```powershell
cd backend
New-Item -ItemType Directory -Path var -Force
New-Item -ItemType Directory -Path var/cache -Force
New-Item -ItemType Directory -Path var/cache/dev -Force
New-Item -ItemType Directory -Path var/log -Force
```

2. **Corriger les permissions** :
```powershell
$varDir = "var"
$acl = Get-Acl $varDir
$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$permission = $currentUser, "FullControl", "ContainerInherit,ObjectInherit", "None", "Allow"
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule $permission
$acl.SetAccessRule($accessRule)
Set-Acl $varDir $acl
```

3. **Vider le cache** :
```powershell
Remove-Item -Path "var/cache/dev/*" -Recurse -Force -ErrorAction SilentlyContinue
```

## Démarrer Symfony

Après avoir corrigé les permissions :
```powershell
cd backend
php -S 127.0.0.1:8080 -t public
```

## Vérification

Si vous avez encore des erreurs, vérifiez que :
- ✅ Les dossiers `var/cache/dev` et `var/log` existent
- ✅ Vous avez les permissions d'écriture (exécutez le script en tant qu'administrateur si nécessaire)
- ✅ Le cache est vide (supprimez manuellement le contenu de `var/cache/dev`)

