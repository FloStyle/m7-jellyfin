# MISSION — stability-2 : upgrader → FloStyle/m7-jellyfin releases

> **Pour l'agent de code** — autonome, à lire entièrement avant de commencer.
> **Branche cible** : `stability`.

---

## 1. Contexte

Le plugin peut se mettre à jour tout seul : un `Upgrader` vérifie les releases GitHub du dépôt et propose de télécharger le nouveau zip. **Actuellement il pointe vers l'upstream `LouisMarotta/m7-jellyfin`** — ce qui est dangereux pour les utilisateurs de CE fork : l'upgrader leur proposerait d'écraser le zip NEO par celui de l'upstream (ancien, sans les fixes).

Objectif : pointer l'upgrader vers **`FloStyle/m7-jellyfin`** avec des garde-fous robustes.

## 2. Fichiers concernés (vérifiés)

- `src/upgrader.js` :
  - ligne 6 : `this.author = 'LouisMarotta';` → `'FloStyle'`
  - ligne 7 : `this.repo = 'm7-jellyfin';` → inchangé (nom identique)
  - ligne 8 : endpoint construit → deviendra `https://api.github.com/repos/FloStyle/m7-jellyfin/releases/latest`
- `src/utils.js` :
  - ligne 56-57 : `getLatestPlugin()` → URL de download direct
    `'https://github.com/LouisMarotta/m7-jellyfin/releases/latest/download/jellyfin.zip'`
    → `'https://github.com/FloStyle/m7-jellyfin/releases/latest/download/jellyfin.zip'`

## 3. Garde-fous à vérifier (et corriger si cassé)

1. **Ne jamais « downgrader »** : si la version locale ≥ version distante, ne rien proposer (le check `Upgrader.versionCompare` doit retourner false). Vérifier le code existant ; le comportement doit être conservé.
2. **Rate-limit GitHub** : l'API `/releases/latest` est limitée à ~60 req/h/IP sans token. Le check automatique a lieu toutes les 24 h (`shouldCheck`) — c'est suffisant. Le bouton manuel « Update » peut échouer si l'API est limitée → **fallback** : utiliser l'URL de download direct (`getLatestPlugin()`) qui n'est PAS soumise au rate-limit API. Si le code actuel n'a pas ce fallback, l'ajouter proprement.
3. **Ne jamais logger l'URL complète** : le check passe par `HttpClient` (log via `safeLogPath`) — vérifier qu'aucun `console.log` ne sort l'URL de download (elle ne contient pas de token, mais restons propres).
4. **Le check auto** : `shouldCheck` (24 h) + mise à jour de `lastCheck` après chaque check — conserver le comportement.

## 4. Contraintes

- CommonJS, pas de dépendances runtime, `http.request()` synchrone (§4 AGENTS.md).
- Toute réponse API doit être traitée défensivement : `response.ok && response.data && response.data.tag_name` — ne jamais supposer la forme de la réponse (rate-limit GitHub renvoie un JSON d'erreur !).
- ESLint zéro erreur (`pnpm lint`), build OK (`pnpm run build`).

## 5. Validations avant livraison

1. `pnpm lint` → 0 erreur.
2. `pnpm run build` → zip généré.
3. Test statique : l'endpoint de l'upgrader pointe bien vers `FloStyle/m7-jellyfin` (grep `FloStyle` dans `src/`), l'URL de download aussi.
4. (Optionnel, si réseau dispo) tester l'endpoint avec curl : `curl -s https://api.github.com/repos/FloStyle/m7-jellyfin/releases/latest` → doit répondre (actuellement pas de release → JSON `Not Found` ou 404 : le code doit gérer ce cas sans crash ! C'est un cas réel : pas encore de release NEO).

## 6. Livrables

1. Commit(s) propres sur `stability` : `fix(updater): point to FloStyle/m7-jellyfin releases + rate-limit fallback`.
2. Rapport : fichiers modifiés, garde-fous vérifiés/corrigés, comportement en l'absence de release (cas réel aujourd'hui).

## 7. Rappel

- NE PAS déployer sur la PS3 (l'assistant/le mainteneur s'en chargent après validation).
- Le zip actuellement sur la PS3 est l'ANCIEN (fonctionnel) — ne pas y toucher.
