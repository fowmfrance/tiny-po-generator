Objet : basculer l’isolation des données de `user_id` (chaque utilisateur seul) à `organization_id` (tous les utilisateurs d’une même société client se partagent leurs données). Cela permettra à Sapajoo d’héberger plusieurs clients sur la même base, chacun avec plusieurs utilisateurs.

````text
État actuel
-----------
• organisations + profiles.organization_id existent déjà.
• L’invitation d’utilisateur via /backoffice/organizations crée un profil rattaché à l’organisation.
• En revanche, les données opérationnelles (fournisseurs, BC, factures, budgets, etc.) sont filtrées par user_id = auth.uid().
• Conséquence : deux collègues de FLEURON ne se verraient pas leurs données.

Tables concernées
-----------------
article_types, bank_connections, bank_label_mappings, budget_milestones,
budget_types, budgets, expense_categories, payment_batches, payment_batch_invoices,
purchase_order_items, purchase_orders, supplier_agreements, supplier_bank_accounts,
supplier_contacts, supplier_invoices, supplier_kyc_documents, supplier_ratings,
supplier_types, suppliers, teams, transactions.

1. Schéma : ajouter organization_id
------------------------------------
• Ajouter organization_id UUID REFERENCES public.organizations(id) à chaque table opérationnelle.
• Laisser user_id en place (historique/audit) mais le rendre nullable au besoin.
• Rétro-remplir organization_id depuis profiles.organization_id via jointure sur user_id.
• Les lignes sans organisation resteront associées à l’organisation de leur créateur ; en l’absence d’organisation, on peut les lier à une organisation technique par défaut ou les laisser invisibles aux autres utilisateurs.

2. Fonctions helper
------------------
• Créer/maj une fonction SECURITY DEFINER public.current_user_organization_id() retournant profiles.organization_id de auth.uid().
• Créer/maj une fonction public.is_same_org(target_org_id uuid) pour simplifier les RLS.

3. RLS : scoper par organisation
-------------------------------
• Remplacer auth.uid() = user_id par organization_id = public.current_user_organization_id() sur les tables opérationnelles.
• Conserver les politiques admin-sapajoo (lecture globale cross-tenant).
• Conserver les politiques de gestion pour les utilisateurs authentifiés de l’organisation.
• Supprimer les anciennes politiques user-scoped obsolètes.

4. Backoffice & edge functions
------------------------------
• invite-org-user : continuer à lier le profil à organization_id ; le nouveau user hérite de l’org automatiquement grâce aux RLS.
• delete-user : au lieu de réaffecter user_id, réaffecter organization_id (et éventuellement user_id) aux autres utilisateurs de l’org, ou simplement garder organization_id et mettre user_id à NULL.
• handle_new_user : lors de la création automatique d’un profil, si raw_user_meta_data contient organization_id (invitation), le stocker. Sinon, l’utilisateur reste sans org jusqu’à ce que le backoffice l’affecte.
• Les fonctions d’initialisation des données par défaut (catégories, types fournisseurs, équipes, etc.) doivent utiliser organization_id au lieu de user_id pour les ressources partagées, tout en conservant user_id pour l’audit.

5. Frontend : requêtes par org
------------------------------
• Créer un hook useOrganization() qui charge profiles.organization_id au login et le met à jour en cas de changement.
• Remplacer, dans les hooks suivants, les filtres .eq('user_id', user.id) par .eq('organization_id', orgId) :
  - useSuppliers
  - usePurchaseOrders
  - useSupplierInvoices
  - useBudgetsData
  - useSupplierContacts
  - useSupplierAccessToken
  - useSupplierDashboard
  - les pages Banks, CreatePO, CreateBudget, MilestoneReport, VendorDetail
  - les onglets Settings (SupplierCatalogTab, BankMappingTab, ExpenseCategoriesTab, KYCSettingsTab)
  - les composants PaymentGenerationDialog, InviteVendorQuickDialog, POInvoiceSection
• Les inserts doivent désormais envoyer organization_id en plus de user_id.

6. Gestion des utilisateurs sans organisation
---------------------------------------------
• Utilisateurs auto-inscrits (signup public) : pas d’organization_id → ils ne voient que leurs propres données (comportement actuel, acceptable en mode essai solo).
• Backoffice : action de rattachement à une org via BackofficeUsers reste fonctionnelle.

7. Sécurité et nettoyage
------------------------
• Vérifier qu’aucune table n’expose de données cross-tenant par oubli.
• S’assurer que service_role a toujours ALL sur les tables pour les edge functions.
• Réviser les politiques de stockage (buckets invoice-attachments, kyc-documents) pour s’assurer qu’ils sont scopés par org si nécessaire.

8. Vérification
---------------
• Créer deux utilisateurs dans l’organisation FLEURON et vérifier qu’ils partagent les mêmes fournisseurs/budgets/factures.
• Vérifier qu’un utilisateur d’une autre organisation ne voit pas les données FLEURON.
• Vérifier que les anciens utilisateurs sans org conservent l’accès à leurs propres données.
• Lancer le build et les tests vitest si disponibles.

Risques principaux
------------------
• Migration volumineuse : beaucoup de tables et de politiques à toucher.
• Requêtes front oubliées en user_id : fuites ou données vides pour les seconds utilisateurs.
• Risque de régression sur les rôles admin-sapajoo et admin (client).

Approche recommandée
--------------------
Déployer en une seule migration SQL complète (schema + RLS + backfill + fonctions), puis une PR front qui bascule les hooks. Éviter les migrations partielles qui laisseraient l’app en état incohérent.
