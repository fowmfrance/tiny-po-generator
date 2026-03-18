
Objectif: corriger définitivement Google OAuth en production (après publication, encore KO).

Constat (depuis l’exploration)
- Le code actuel force parfois la redirection OAuth vers le domaine sans `www` (`getGoogleRedirectUri` dans `src/pages/Auth.tsx`).
- Le endpoint OAuth `/~oauth/initiate` fonctionne sur `sapajoo.fr` mais le comportement varie selon le domaine d’entrée.
- DNS observé:
  - `sapajoo.fr` -> `185.158.133.1` (Lovable Cloud)
  - `www.sapajoo.fr` -> `cname.vercel-dns.com` (Vercel)
- Donc le flux OAuth est cassé/incohérent selon le host, car `~oauth/*` doit être servi par la même infra que l’app.

Plan d’implémentation
1) Aligner les domaines (priorité absolue)
- Mettre `www.sapajoo.fr` sur la même infra que `sapajoo.fr` (retirer le CNAME Vercel).
- Avoir `sapajoo.fr` et `www.sapajoo.fr` connectés au même projet.
- Définir un domaine primaire (ex: `sapajoo.fr`) et redirection automatique de l’autre vers le primaire.

2) Simplifier le code OAuth (éviter les redirections cross-domain fragiles)
- Dans `src/pages/Auth.tsx`, supprimer la logique “strip `www`”.
- Utiliser `window.location.origin` tel quel pour `redirect_uri`.
- Conserver le flow iframe -> nouvel onglet, mais toujours sur l’origine courante.

3) Durcir la gestion d’erreur côté UI
- Ajouter des messages explicites pour:
  - `redirect_uri is not allowed`
  - `Authorization failed`
  - host non supporté / route OAuth introuvable
- Afficher une action claire: “ouvrir la connexion sur le domaine principal”.

4) Validation bout-en-bout (obligatoire)
- Tester Google login sur:
  - `https://sapajoo.fr/auth`
  - `https://www.sapajoo.fr/auth`
  - `https://sapajoo.lovable.app/auth`
- Vérifier la séquence réseau:
```text
/auth -> /~oauth/initiate -> /authorize (302) -> Google -> /~oauth/callback -> session -> /dashboard
```
- Tester aussi depuis contexte iframe (ouverture nouvel onglet).

5) Déploiement et vérifications post-déploiement
- Publier la mise à jour frontend.
- Re-tester en navigation privée (éviter cache/cookies parasites).
- Si DNS vient d’être modifié: attendre propagation et re-test.

Détails techniques (section technique)
- Fichier concerné: `src/pages/Auth.tsx`.
- Changement clé: supprimer `getGoogleRedirectUri()` (normalisation hostname), utiliser l’origine courante.
- Aucun changement base de données requis.
- Le blocage principal n’est pas la logique métier auth, mais une divergence d’infrastructure entre `root` et `www`.

Résultat attendu
- Login Google fonctionnel de manière stable en prod, indépendamment du point d’entrée.
- Plus de 404/NOT_FOUND sur `~oauth/*`.
