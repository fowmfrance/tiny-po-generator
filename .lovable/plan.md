
Objectif: corriger durablement l’ouverture des PDF, remplacer les ouvertures en nouvel onglet par une vraie modale, et rendre chaque facture cliquable dans l’onglet Aperçu de la fiche fournisseur.

1. Diagnostic et cause probable
- Aujourd’hui, les PDF sont affichés via un simple `<iframe>` sur un blob local (`PdfAttachmentPreview.tsx`).
- Ce mode dépend entièrement du viewer PDF natif du navigateur, qui peut échouer sur certains PDF “compressés” ou générés par des scanners/outils tiers.
- En plus, certaines zones utilisent encore `openInvoiceAttachmentInNewTab()` (`POInvoiceSection`, `VendorKYCReviewTab`), ce qui va à l’encontre du comportement demandé.

2. Correctif de fond pour les PDF
- Remplacer le rendu PDF natif par un rendu applicatif plus robuste basé sur le binaire téléchargé (pdf.js / rendu contrôlé côté app), au lieu d’un `<iframe>` brut.
- Conserver le téléchargement authentifié via storage `download()` déjà en place.
- Faire évoluer le helper d’attachment pour exposer ce qu’il faut au renderer PDF:
  - blob / arrayBuffer
  - mime réel détecté
  - nom de fichier propre
- Prévoir une gestion d’erreur explicite:
  - si le PDF est réellement illisible/corrompu, la modale doit l’indiquer clairement
  - garder un bouton “Télécharger” dans la modale comme fallback

3. Modale centralisée de preview
- Créer un composant réutilisable de preview modale unique pour les pièces jointes de facture.
- Cette modale servira partout:
  - liste des factures
  - onglet factures fournisseur
  - section factures des bons de commande
  - section KYC qui ouvre aujourd’hui en nouvel onglet
  - section Aperçu de la fiche fournisseur
- La modale affichera:
  - métadonnées facture
  - preview du document
  - bouton Télécharger
  - éventuellement bouton Ouvrir dans un nouvel onglet seulement en secours, plus comme flux principal

4. Rendre les factures cliquables dans l’overview fournisseur
- Dans `src/pages/VendorDetail.tsx`, transformer chaque ligne de la section “Factures” en item cliquable.
- Au clic:
  - ouverture de la modale
  - si pièce jointe absente, garder un état non cliquable ou afficher un message clair
- Ajouter un indicateur visuel de document joint pour éviter l’ambiguïté.

5. Harmoniser les autres points d’entrée
- `src/components/purchase-orders/POInvoiceSection.tsx`
  - remplacer “Voir” en nouvel onglet par ouverture de la même modale
  - conserver le bouton téléchargement
- `src/components/vendors/VendorKYCReviewTab.tsx`
  - remplacer l’ouverture nouvel onglet par la même modale
- `src/components/payments/InvoicesTable.tsx` et `src/components/vendors/VendorInvoicesTab.tsx`
  - réutiliser la modale centralisée au lieu d’avoir une logique de preview dispersée

6. Fichiers concernés
- `src/lib/invoice-attachments.ts`
- `src/components/payments/PdfAttachmentPreview.tsx`
- nouveau composant du type `src/components/payments/InvoiceAttachmentDialog.tsx`
- `src/components/purchase-orders/POInvoiceSection.tsx`
- `src/components/vendors/VendorKYCReviewTab.tsx`
- `src/components/vendors/VendorInvoicesTab.tsx`
- `src/components/payments/InvoicesTable.tsx`
- `src/pages/VendorDetail.tsx`

7. Résultat attendu
- Les PDF ne dépendent plus du viewer natif du navigateur.
- Plus d’ouverture par défaut dans un nouvel onglet.
- Une seule expérience de preview cohérente dans toute l’app.
- Depuis la fiche fournisseur > Aperçu, chaque facture devient consultable en un clic.

8. Détails techniques
- Pas de migration backend nécessaire.
- Le bucket privé et le téléchargement authentifié restent inchangés.
- Le vrai changement est côté front: abandon du `<iframe>` PDF natif au profit d’un renderer piloté par le fichier binaire.
- Je prévois aussi de centraliser l’état de preview pour éviter les comportements divergents entre pages.

9. Validation à faire après implémentation
- Tester plusieurs PDF “problématiques” déjà présents en base.
- Vérifier la preview depuis:
  - overview fournisseur
  - onglet factures fournisseur
  - détail de PO
  - encart KYC
- Vérifier téléchargement individuel + fermeture/réouverture de modale + affichage mobile.
