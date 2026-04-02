
Objectif

Corriger le bridge pour qu’il soit un vrai waterfall :

```text
Budget total
   └─ variation 1 depuis le niveau courant
        └─ variation 2 depuis le nouveau niveau courant
             └─ total final
```

et non une succession de barres “posées au sol”.

Plan de correction

1. Recalculer le bridge comme une suite de niveaux cumulés
- Construire explicitement les niveaux :
  - niveau initial = `initialAmount`
  - après facturé = `initialAmount - invoicedAmount`
  - après engagé = `initialAmount - invoicedAmount - committedAmount`
  - total final = ce dernier niveau
- Utiliser ce total final calculé pour le chart afin de garantir visuellement :
  `Budget - Facturé - Engagé = Restant`

2. Refaire la géométrie des barres
- `Budget` : barre totale de `0 → initialAmount`
- `Facturé` :
  - si montant > 0 : barre de variation de `niveau précédent → nouveau niveau`
  - si montant = 0 : ne surtout pas dessiner un grand rectangle vide ; dessiner une “barre plate” au niveau courant
- `Engagé` : vraie marche descendante dont la hauteur vaut exactement `36k` dans l’exemple, avec :
  - top aligné sur le niveau courant précédent (`150k`)
  - bottom aligné sur le niveau d’arrivée (`114k`)
- `Restant` : barre totale de `0 → niveau final`, avec son top aligné visuellement sur le bas de la variation précédente via un connecteur

3. Corriger spécifiquement le cas “0 €”
- Remplacer l’actuel grand rectangle pointillé par un rendu dédié “zero change”
- Ce rendu devra montrer :
  - un connecteur horizontal pointillé au niveau courant
  - un petit segment / cap horizontal plein pour matérialiser la marche plate
  - le label `0 €` au-dessus
- Résultat attendu : on comprend qu’il ne se passe rien en hauteur, on reste au niveau de `150k`

4. Refaire les connecteurs horizontaux
- Tracer les connecteurs par niveau cumulatif réel, pas à partir d’une heuristique sur `bar.y/bar.height`
- Connecteurs attendus :
  - du top de `Budget` vers `Facturé`
  - de `Facturé` vers `Engagé` au niveau `150k`
  - du bas de `Engagé` vers le top de `Restant` au niveau `114k`
- Le dernier point est essentiel : montrer clairement que le bas du `-36k` arrive exactement sur le niveau du `Restant`

5. Simplifier le modèle interne du composant
- Remplacer la logique actuelle basée seulement sur `invisible/visible/isDashed` par un modèle plus explicite par step :
  - `type: total | change | zero-change`
  - `from`
  - `to`
  - `delta`
  - `anchorLevel`
- Ensuite dériver depuis ce modèle :
  - la hauteur visible
  - l’offset invisible
  - le type de shape à rendre
  - les labels
  - les connecteurs

Fichier impacté
- `src/components/budget/BudgetWaterfallChart.tsx`

Détails techniques
- Conserver Recharts, mais introduire un rendu custom plus strict pour :
  - les variations nulles
  - les connecteurs
- Les labels doivent afficher :
  - `Budget` = montant total
  - `Facturé` = `0 €` ou montant négatif
  - `Engagé` = montant négatif (`−36 000 €`)
  - `Restant` = total final
- La règle visuelle à respecter partout :
  - les totaux partent de 0
  - les variations partent du niveau cumulé précédent
  - une variation à 0 n’a pas de hauteur, seulement une marche plate
