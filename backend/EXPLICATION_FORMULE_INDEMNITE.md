# 📊 Explication de la Formule de Calcul de l'Indemnité de Congé

## Formule actuelle dans le code

```php
indemniteCalculee = (nombreJours × indemniteForfaitaire × tranche) / 10
```

## Détail des variables

1. **nombreJours** (integer)
   - Nombre de jours de congé
   - Calculé automatiquement : `(dateFin - dateDebut) + 1`
   - Exemple : Du 15/12/2024 au 20/12/2024 = 6 jours

2. **indemniteForfaitaire** (decimal)
   - Montant forfaitaire par jour en DH
   - Saisi par l'utilisateur
   - Exemple : 100 DH/jour

3. **tranche** (integer)
   - Coefficient multiplicateur
   - Valeurs possibles : 1, 2, 3, ou 4
   - Saisi par l'utilisateur

4. **Division par 10**
   - Facteur de réduction/conversion
   - Pourquoi ? Probablement pour convertir en unités appropriées ou appliquer un taux

## Exemple de calcul

**Données :**
- nombreJours = 10 jours
- indemniteForfaitaire = 100 DH/jour
- tranche = 2

**Calcul :**
```
indemniteCalculee = (10 × 100 × 2) / 10
                  = 2000 / 10
                  = 200 DH
```

## Question

Cette formule est-elle correcte pour votre cas d'usage ? 

Si vous souhaitez une formule différente, par exemple :
- `indemniteCalculee = nombreJours × indemniteForfaitaire × tranche` (sans division par 10)
- `indemniteCalculee = (nombreJours × indemniteForfaitaire) / tranche`
- Autre formule spécifique

Indiquez-moi la formule exacte et je la modifierai dans le code.

