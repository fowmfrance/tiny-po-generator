

## Plan : Magic Links pour le portail fournisseur

### Contexte

Le système actuel demande au fournisseur de saisir son email puis un code OTP à 6 chiffres (affiché en toast en dev, jamais réellement envoyé par email). On va remplacer ce flux par un **magic link envoyé par email** : le fournisseur clique et accède directement à son espace.

### Prérequis : configurer un domaine email

Aucun domaine email n'est configuré sur ce projet. La première étape sera de configurer un domaine d'envoi via l'interface Lovable Cloud pour que les emails puissent effectivement être envoyés.

### Architecture

```text
Client (VendorDetail)                Edge Function                     Fournisseur
       │                          send-supplier-magic-link                  │
       │── génère token ──────────────────────────────────────>│            │
       │   (ou utilise l'existant)     │                      │            │
       │                               │── envoie email ──────────────────>│
       │                               │   avec lien direct                │
       │                               │   /supplier/portal/{token}        │
       │                                                                   │
       │                                          │── clic sur le lien ──>│
       │                                          │                       │
       │                          SupplierPortalAccess.tsx                 │
       │                          ── vérifie token ──> accès direct       │
```

### Changements

**1. Edge Function `send-supplier-magic-link`**
- Reçoit `supplier_id` en paramètre
- Vérifie que l'appelant est authentifié
- Récupère ou crée un `supplier_access_token` actif pour ce fournisseur
- Récupère l'email du fournisseur depuis la table `suppliers`
- Marque le token comme `email_verified = true` (le clic sur le lien suffit comme preuve)
- Envoie un email au fournisseur contenant le lien `/supplier/portal/{token}` via le système d'email transactionnel Lovable
- Retourne le lien généré

**2. Modifier `SupplierPortalAccess.tsx`**
- Supprimer les étapes `verify-email` et `enter-code` (plus de formulaire email + OTP)
- Quand le token est valide et actif : marquer `email_verified = true` automatiquement et rediriger vers le dashboard fournisseur
- Quand le token est invalide/expiré : afficher l'erreur

**3. Modifier `useSupplierAccessToken.ts`**
- Ajouter une méthode `sendMagicLink(supplierId)` qui appelle la edge function
- Modifier `copyPortalLink` pour aussi proposer l'envoi par email

**4. Ajouter un bouton "Envoyer le magic link" dans l'UI fournisseur**
- Sur la fiche fournisseur (VendorDetail), ajouter un bouton "Envoyer le lien d'accès par email" à côté du bouton "Copier le lien"

**5. Nettoyer l'ancien système**
- Supprimer `SupplierLoginForm.tsx`, `TestCredentialsInfo.tsx` (login mock)
- Simplifier `SupplierPortal.tsx` (supprimer l'onglet "Connexion" mock)

### Détails techniques

- L'envoi d'email nécessite d'abord de configurer le domaine email via le setup dialog Lovable
- Puis scaffolder l'infrastructure email transactionnelle via `scaffold_transactional_email`
- La edge function utilisera le système d'email transactionnel intégré (pas de service tiers)
- Le token existant dans `supplier_access_tokens` est réutilisé — pas de compte Supabase Auth créé pour les fournisseurs
- RLS : la politique `anon` existante permet déjà la lecture/update des tokens

