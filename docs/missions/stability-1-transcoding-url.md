# MISSION — stability-1 : réparer la lecture PS3 (URL Transcoding) + bugs triviaux

> **Pour l'agent de code** — à lire entièrement avant de commencer. Autonome : ne nécessite pas d'autre contexte.
> **Branche cible** : `stability` (le travail se fait sur cette branche, pas `main`).

---

## 1. Contexte

Plugin **Jellyfin pour Movian sur PlayStation 3** (ECMAScript, CommonJS, `http.request()` synchrone et bloquant, pas de `Promise`/`fetch`). Le code a été refactoré et les erreurs PlaybackInfo 400/500 (Jellyfin 10.11) sont corrigées. **MAIS** : avec le code actuel, la lecture ne démarre pas sur la PS3 (« stuck sur loading »).

**Diagnostic établi (déjà validé par tests A/B sur la vraie PS3)** : le player Movian PS3 **refuse la source vidéo avant même de la fetch** (0 requête réseau, 0 log player). La cause est l'URL HLS passée au player :

- Le code actuel passe `TranscodingUrl` de Jellyfin **telle quelle** : `.../master.m3u8?&DeviceId=...&AudioStreamIndex=2&...&AudioStreamIndex=1`
- L'ancienne version (qui fonctionne) construisait une URL propre : `.../master.m3u8?api_key=...&static=false&...`
- Différences identifiées : **`?&` initial** (paramètre vide — suspect n°1), **`AudioStreamIndex` en double** (celui du serveur + celui ajouté par le plugin), **virgules non encodées** dans les valeurs (`aac,ac3,mp3` vs `aac%2Cac3%2Cmp3`), champ `imdbid` ajouté aux videoparams.

**Règles de sécurité (impératif)** : ne JAMAIS logger `api_key`, tokens, passwords, ni URLs complètes de lecture. Les logs passent par `HttpClient.safeLogPath()` (dépouille scheme/host/query).

## 2. Tâches

### Tâche 1 — Nettoyer l'URL de lecture avant de la passer au player
Fichiers : `src/api.js` (fonction `selectMediaSource`) + `src/view.js` (construction des videoparams).

- **`?&` initial** : si la `TranscodingUrl` commence par `?&`, la normaliser en `?` (ou reconstruire proprement host + path + query).
- **Dédupliquer `AudioStreamIndex`** : la `TranscodingUrl` contient déjà `AudioStreamIndex=N` (choix serveur). Ne PAS en ajouter un second côté plugin — soit garder celui du serveur, soit retirer celui du serveur et n'ajouter que le choix utilisateur (s'il est explicite).
- **Encoder les virgules** des listes de codecs : `aac,ac3,mp3` → `aac%2Cac3%2Cmp3` (alignement avec l'ancien zip qui encodait).
- **Retirer `imdbid`** des videoparams (l'ancien code ne l'envoyait jamais ; le champ est suspect).

### Tâche 2 — Piste audio index 0
`src/view.js` (~ligne 594) : `if (atrack > 0 && selection.method === 'Transcode')` → la piste audio index **0** n'est jamais ajoutée à l'URL. Corriger en `atrack >= 0`. Attention : `-1` = pas de sélection (défaut) — ne pas casser ce cas. Vérifier aussi la ligne ~652 (`audioStreamIndex: atrack > 0 ? atrack : null`) : passer à `atrack >= 0 ? atrack : null`.

### Tâche 3 — Index des sous-titres
`src/view.js` (~ligne 610) : l'URL des sous-titres utilise la variable de boucle `j` : `Subtitles/${j}/Stream...`. Utiliser l'index réel du flux Jellyfin **`stream.Index`** (si le tableau des pistes est filtré, `j` ne correspond plus à l'index serveur). Vérifier le contexte de la boucle avant correction.

### Tâche 4 — Normalisation des codecs audio
Jellyfin renvoie parfois `ac-3` ou `eac3` alors que `isDirectPlaySafe` attend `ac3`. **D'abord vérifier** dans `src/api.js` si le cas existe réellement (chercher la logique de comparaison des codecs), puis normaliser (enlever le tiret) si pertinent. Si le code utilise déjà une normalisation, ne rien faire et le signaler dans le rapport.

## 3. Contraintes techniques (NE PAS VIOLER)

- **CommonJS** : `require()` / `module.exports`. Pas de `import/export`, pas de `Promise`/`async/await`.
- **Pas de dépendances runtime** : npm = devDependencies (ESLint) uniquement.
- **Mémoire PS3** : < 64 MB heap. Pas de gros tableaux accumulés, pas de références retenues.
- **Structure de réponses** : toutes les appels API retournent `{ ok, data, error, status }` — ne jamais supposer `data` sans vérifier `ok`.
- **Logs** : jamais de `api_key`/token/password/URL complète (voir §1).
- **Références AGENTS.md** : commenter avec `// (AGENTS.md §X)` quand pertinent (le fichier AGENTS.md du repo est la référence).
- Le profil device PS3 (`src/deviceProfile.js`) **ne doit pas être modifié** — il est validé (fix 400/500) : pas de CodecProfile `Video`, pas de `VideoRange`.

## 4. Validations AVANT de livrer

1. `npm run build` passe sans erreur (produit `dist/jellyfin.zip`).
2. `npx eslint src/` — zéro erreur.
3. Tester l'URL produite : avec la config de repro locale (non versionnée — voir `TESTING.md` pour l'environnement), POST `/Items/{id}/PlaybackInfo` avec le profil du plugin, puis vérifier que l'URL de lecture est propre : **plus de `?&`**, **un seul `AudioStreamIndex`**, **virgules encodées**, pas d'`imdbid`. Item de test : n'importe quel film/série nécessitant un transcode HLS. Scripts d'aide : scripts de repro locaux (`docs/debug/scripts/`, non versionnés).
4. **Ne pas déployer sur la PS3 soi-même** : le déploiement et le test PS3 sont faits par l'assistant/le mainteneur après ton livrable.

## 5. Livrables

1. Commit(s) propres sur la branche `stability` (message conventionnel : `fix(playback): ...`).
2. Rapport final : fichiers modifiés, ce qui a été testé, les points non résolus, et confirmation que les logs restent sans tokens.

## 6. Rappel état

- ZIP déployé sur la PS3 actuellement : **ANCIEN** (fonctionnel) — ne pas y toucher.
- Le code que tu corriges est le nouveau (celui qui bloque) — c'est LE but de cette mission.
- Après ta livraison : l'assistant build + déploie + le mainteneur teste sur PS3 (exiger VRAM libre, sinon OOM transcode).
