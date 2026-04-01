

## Plan : Corriger le bridge budgétaire (labels + connecteurs)

### Problèmes identifiés

En regardant le rendu actuel :

```text
Actuel (FAUX)                     Attendu (CORRECT)
 12 000€   12 000€   7 000€       12 000€    0€      −5 000€    7 000€
 ████      ┊    ┊     ████         ████ ─ ─ ─┊    ┊─ ─ ████ ─ ─ ████
 ████      ┊    ┊     ████  7000€  ████       ┊    ┊   ████      ████
 ████      ┊    ┊     ████         ████       ┊    ┊   ████      ████
 Budget  Facturé Engagé Restant    Budget  Facturé Engagé  Restant
```

1. **Labels faux** : Facturé affiche 12 000€ (hauteur totale) au lieu de 0€. Engagé affiche 7 000€ (le restant) au lieu de −5 000€ (le montant soustrait).
2. **Pas de connecteurs** : Aucune ligne pointillée horizontale ne relie les niveaux entre les barres pour montrer la cascade.

### Corrections

**Fichier** : `src/components/budget/BudgetWaterfallChart.tsx`

1. **Labels corrigés** :
   - Budget → affiche le montant initial (ex: "12 000€")
   - Facturé → affiche le montant facturé avec signe négatif si > 0, sinon "0€"
   - Engagé → affiche "−5 000€" (le montant engagé soustrait)
   - Restant → affiche le montant disponible (ex: "7 000€")

2. **Connecteurs horizontaux** : Ajouter des lignes pointillées grises entre chaque paire de barres au niveau de transition (le bas de la barre qui descend = le haut de la barre qui suit). Implémentation via un composant SVG custom en `customized` layer du BarChart, qui trace des `line` en pointillés entre les coordonnées x/y des barres adjacentes.

3. **Couleur Engagé** : Passer de rouge (`COLORS.invoiced`) à orange (`COLORS.committed`) pour distinguer visuellement Facturé (rouge) et Engagé (orange).

### Aucun autre fichier impacté

Seul `BudgetWaterfallChart.tsx` est modifié.

