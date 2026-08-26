# MISSION — stability-3 : reporting de session (position figée + 204 + auth)

> **Pour l'agent de code** — autonome, à lire entièrement avant de commencer.
> **Branche cible** : `stability` (fixes core → merge dans `main` + PR upstream).

---

## 1. Contexte

Le plugin possède un module de reporting de session (`src/session.js`) qui envoie à Jellyfin :
- `POST /Sessions/Playing` (début)
- `POST /Sessions/Playing/Progress` (toutes les 5 s)
- `POST /Sessions/Playing/Stopped` (fin)

**Les POST partent bien** (visibles dans les logs Movian) et la session apparaît dans le dashboard Jellyfin. **MAIS** trois problèmes sont observés :

1. **Position figée** : la session affiche une position initiale (ex. 2 s) qui ne progresse jamais. Cause racine déjà identifiée : `Session.updatePosition(ticks)` (`src/session.js` ~ligne 72) **n'est jamais appelé par aucun code** — personne ne remonte la position du player Movian au plugin.
2. **`invalid_json` cosmétique** : chaque réponse 204 (Jellyfin répond 204 SANS corps sur ces POST) déclenche `invalid_json` dans `src/http.js` (`JSON.parse` échoue sur un corps vide) → bruit dans les logs toutes les 5 s.
3. **« Authentication without realm »** (observé dans les logs PS3 avec le nouveau code) : certains POST échouent en `network_error` — probablement lié à des tokens révoqués pendant les re-logins (le serveur répond 401 sans header `WWW-Authenticate`). À investiguer et rendre silencieux/robuste.

## 2. Tâches

### Tâche 1 — Brancher la position du player
Objectif : la position rapportée à Jellyfin doit refléter la position réelle de lecture.

- **D'abord, investiguer le mécanisme Movian** : comment un plugin reçoit-il la position/les événements de lecture d'une vidéo lancée via `videoparams` ? Sources :
  - Documentation : https://buksa.github.io/movian-docs/ (chercher video / playback events / props)
  - Code existant du projet : chercher comment d'autres plugins Movian (ex. dans le repo Movian officiel) reçoivent les événements de lecture (rechercher `prop`, `eventSink`, `timeupdate`, `position` dans le code de référence — `src/navigator.js` utilise déjà `prop.sendEvent(eventSink, ...)` : voir comment les events sont écoutés)
  - Le player Movian peut exposer des events via `page.video` ou un `plugin` event emitter — à confirmer par la doc.
- **Si un mécanisme existe** : brancher `session.updatePosition()` dessus (appeler à intervalle ou à chaque événement ; garder le fire-and-forget, ne JAMAIS bloquer la lecture).
- **Si aucun mécanisme n'existe** (Movian ne remonte pas la position aux plugins) : le documenter dans le rapport ET dans `AGENTS.md` §9, et laisser la position à sa valeur initiale (le reporting reste correct pour start/stop). Ne pas inventer de polling sur l'API serveur.

### Tâche 2 — Réponses 204/empty dans http.js
`src/http.js` (`request()`, ~ligne 57-65) : quand le statut est 2xx mais que le corps est vide (204), retourner `{ ok: true, data: null }` au lieu de `invalid_json`.

- Vérifier que `response` (le retour de `http.request` de Movian) est une chaîne vide/undefined pour un 204.
- Ne PAS casser le parsing JSON normal (2xx avec body → parse comme aujourd'hui).
- Le log ne doit plus afficher `invalid_json` pour les POST de session.

### Tâche 3 — « Authentication without realm »
- Reproduire/comprendre : ce message vient du runtime Movian quand le serveur répond 401 sans header `WWW-Authenticate` (typiquement : token révoqué par un re-login concurrent).
- Rendre le reporting robuste : si le POST de session échoue en 401/network_error, arrêter proprement le reporting de cette session (le code a déjà un mécanisme « 401 → marquer la session invalide » dans `session.js` — vérifier qu'il est atteint) et ne PAS spammer les logs.
- Ne pas logguer le token/l'URL complète (règle §5 AGENTS.md).

## 3. Contraintes

- CommonJS, pas de dépendances runtime, `http.request()` synchrone (§4 AGENTS.md).
- ESLint zéro erreur (`pnpm lint`), build OK (`pnpm run build`).
- Le reporting ne doit jamais bloquer la lecture (fire-and-forget).
- Ne pas déployer sur la PS3 soi-même (l'assistant/le mainteneur s'en chargent).

## 4. Validations

1. `pnpm lint` → 0 erreur ; `pnpm run build` → zip généré.
2. Tests L1 (scripts locaux de repro, `docs/debug/scripts/`) : un POST `Sessions/Playing/Progress` avec les headers du plugin → 204 → le client http retourne `{ok: true}` sans `invalid_json`.
3. Rapport : le mécanisme de position Movian trouvé (ou l'absence prouvée), ce qui a été branché, le traitement des 204, le comportement 401.

## 5. Livrables

1. Commit(s) propres sur `stability` : `fix(session): ...`.
2. Rapport final : fichiers modifiés, mécanisme de position (avec preuve de la doc), tests faits, limites.
3. Mise à jour `AGENTS.md` §9 / `TASKS.md` (STAB-3) selon les résultats.

## 6. Rappel

- Le zip déployé sur la PS3 est le NOUVEAU (STAB-1, fonctionnel) — ne pas y toucher.
- Après ta livraison : l'assistant build + déploie + le mainteneur valide (dashboard Jellyfin : position qui avance pendant une lecture).
