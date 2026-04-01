
## Plan : Corriger le bridge budgétaire + afficher reconnaissance/jalons

### 1. Refonte du Waterfall Chart (bridge soustractif)

Le graphique actuel ne montre pas clairement le passage **Budget initial → Disponible**. Il sera transformé en vrai bridge soustractif :

```text
 ████ Budget initial (100k)
 │
 ▼▼▼▼ − Facturé (−30k)         ← barre descendante
 │
 ▼▼▼▼ − Engagé non facturé (−20k) ← barre descendante
 │
 ████ = Disponible (50k)        ← barre résultante
```

- Barres 2 et 3 positionnées en cascade (le bas de chaque barre touche le haut de la suivante)
- Labels avec signe négatif (−30k€, −20k€)
- Connecteurs pointillés entre les barres
- Couleurs : bleu (initial), vert (facturé), orange (engagé), bleu clair (disponible)

**Fichier** : `src/components/budget/BudgetWaterfallChart.tsx`

### 2. Afficher la méthode de reconnaissance et les jalons sur la page de détail du budget

Actuellement `BudgetDetails.tsx` ne montre ni la méthode de reconnaissance ni les jalons, alors qu'ils sont définis lors de la création.

- Enrichir la requête Supabase pour récupérer `recognition_method_id`, `milestone_mode`, `resale_price`
- Joindre `recognition_methods` (nom de la méthode)
- Récupérer les `budget_milestones` associés
- Ajouter une section UI avec :
  - Nom de la méthode de reconnaissance
  - Si méthode milestone : liste des jalons avec date cible, avancement, statut
  - Bouton pour modifier les jalons (réutilise `MilestoneTimelineDialog`)

**Fichier** : `src/pages/BudgetDetails.tsx`

### Fichiers impactés

| Fichier | Modification |
|---------|-------------|
| `BudgetWaterfallChart.tsx` | Refonte logique bridge soustractif |
| `BudgetDetails.tsx` | Requête enrichie + sections reconnaissance/jalons |
