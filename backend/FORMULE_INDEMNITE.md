# 📊 Formule de Calcul de l'Indemnité de Congé

## Formule actuelle

```php
indemnite = (nombreJours × indemniteForfaitaire × tranche) / 10
```

## Explication

- **nombreJours** : Nombre de jours de congé (calculé automatiquement entre date début et date fin)
- **indemniteForfaitaire** : Montant forfaitaire par jour (en DH)
- **tranche** : Coefficient multiplicateur (1, 2, 3, ou 4 selon la tranche)
- **Division par 10** : Facteur de conversion/réduction

## Exemple

Si :
- nombreJours = 10 jours
- indemniteForfaitaire = 100 DH/jour
- tranche = 2

Alors :
```
indemnite = (10 × 100 × 2) / 10 = 2000 / 10 = 200 DH
```

## Question

Cette formule est-elle correcte ? Si vous souhaitez une formule différente, indiquez-la et je la modifierai.

