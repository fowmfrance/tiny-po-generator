## Plan: Corriger le bridge budgétaire et afficher reconnaissance/jalons

### Problème 1 — Le bridge (waterfall) ne montre pas le passage du budget initial au disponible

Le graphique actuel affiche 4 barres mais la logique visuelle ne montre pas clairement la **décomposition soustractive** :
`Budget initial − Facturé − Engagé = Disponible`

**Correction dans `BudgetWaterfallChart.tsx`** :
- Transformer le graphique en vrai bridge avec 4 barres :
  1. **Budget initial** : barre pleine partant de 0 (bleue)
  2. **− Facturé** : barre rouge/verte descendante montrant la soustraction du montant facturé (label avec signe négatif)
  3. **− Engagé non facturé** : barre orange descendante montrant la soustraction des BC émis non encore facturés (label avec signe négatif)
  4. **= Disponible** : barre résultante partant de 0 jusqu'au montant restant

Les barres intermédiaires (Facturé et Engagé) seront positionnées en cascade : le haut de "Facturé" touche le haut de "Initial", et le bas de "Facturé" devient le haut de "Engagé", et le bas de "Engagé" touche le haut de "Disponible". Des connecteurs visuels (lignes pointillées) relieront les barres entre elles pour rendre le pont lisible.

La légende sera mise à jour en conséquence.

### Problème 2 — La méthode de reconnaissance et les jalons ne sont pas visibles sur la page de détail du budget

La création de budget permet déjà de définir la méthode de reconnaissance et les jalons (milestones). Cependant, la page `BudgetDetails.tsx` ne les affiche pas.

**Modifications dans `BudgetDetails.tsx`** :
- Enrichir la requête Supabase pour récupérer `recognition_method_id`, `milestone_mode`, `resale_price`, `status` depuis la table `budgets`
- Joindre la table `recognition_methods` pour afficher le nom de la méthode
- Récupérer les `budget_milestones` associés
- Ajouter une section sous le waterfall chart affichant :
  - **Méthode de reconnaissance** : nom + description
  - **Jalons** (si méthode milestone) : timeline ou liste des jalons avec statut de complétion, date cible, pourcentage d'avancement
  - Bouton pour modifier les jalons (réutiliser `MilestoneTimelineDialog`)

### Fichiers modifiés

| Fichier | Changement |
|---------|-----------|
| `src/components/budget/BudgetWaterfallChart.tsx` | Refonte logique bridge soustractif avec connecteurs |
| `src/pages/BudgetDetails.tsx` | Ajout requête recognition_methods + milestones, sections UI correspondantes |
