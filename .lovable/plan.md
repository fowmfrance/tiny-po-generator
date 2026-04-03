## 1. Table de liaison Factures ↔ BC (many-to-many)

Actuellement `supplier_invoices.purchase_order_id` ne supporte que 1:1. On crée une table de jonction `invoice_purchase_orders` pour supporter :
- 1 facture → N bons de commande
- 1 bon de commande → N factures

Colonnes : `invoice_id`, `purchase_order_id`, `amount_allocated` (répartition du montant)

On garde `purchase_order_id` sur `supplier_invoices` pour compatibilité, mais la relation riche passe par la jonction.

## 2. Tab "Factures" sur la fiche fournisseur

Nouveau tab entre "Aperçu" et "KPIs" qui affiche :
- Liste des factures du fournisseur
- Pour chaque facture : les BC liés (via la table de jonction)
- Lien cliquable vers le détail du BC
- Statut de paiement et actions de mise en règlement

## 3. Tab KPIs global (nouvelle page ou section Settings)

Nouveau tab/page "Analyse prix" accessible globalement qui montre :
- Par métier (supplier_type) puis par livrable (article_type) :
  - Prix moyen constaté
  - Min / Max / Écart-type
  - Évolution sur les N derniers mois (graphique sparkline ou courbe)
- Données issues de `purchase_order_items` jointé avec `article_types` et `supplier_types`

## 4. Table `supplier_agreements` (accords-cadres)

Nouvelle table pour gérer les contrats annuels :
- `supplier_id`, `title`, `start_date`, `end_date`, `status` (draft, active, expired)
- `total_amount`, `currency`, `terms`, `attachment_url`
- `signed_at`, `signed_by` (pour future e-signature)
- RLS : user_id based

Pas de table existante → création complète.

## Ordre d'exécution
1. Migration DB (table jonction + accords-cadres)
2. Code : tab Factures sur VendorDetail
3. Code : page/tab KPIs global
