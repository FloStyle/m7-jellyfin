# PLAN — Drop-in replacement + mises à jour rapides PS3 (m7-jellyfin NEO)

> **Statut** : plan validé par le mainteneur (26/08). Exécution = missions agent + scripts, pas avant GO.
> **Objectif** : (1) le plugin NEO remplace l'existant sur la PS3 **sans perte** (settings, données, habitudes) ; (2) les mises à jour arrivent **vite** sur la PS3 depuis le repo NEO.

---

## 1. Le drop-in est déjà prouvé (vérifié 26/08)

Comparaison des manifests `plugin.json` de l'ancien zip (fonctionnel) et du nouveau build :

| Champ | Ancien zip | Nouveau zip | Compat |
|---|---|---|---|
| `id` | `jellyfin` | `jellyfin` | ✅ identique |
| `title` / `apiversion` / `file` / `showtimeVersion` / `type` / `category` | identiques | identiques | ✅ |
| `version` | 1.1.4 | 1.1.4 | ⚠️ à bump à la 1ʳᵉ release NEO |
| Données | `settings/plugins/jellyfin/` | idem | ✅ conservées |

**Conséquence** : remplacer `installedplugins/jellyfin.zip` par le zip NEO = drop-in. Movian garde le même plugin (id), donc **host, user, password, préférences persistent**. Aucune reconfiguration.

## 2. Les 3 canaux de mise à jour

### Canal A — Upgrader intégré (utilisateur final, automatique)
- **État actuel** : pointe vers `LouisMarotta` (`src/upgrader.js:6-7` + `src/utils.js:57` — URL de download direct).
- **À faire (mission agent, petite)** :
  - `src/upgrader.js` : `author = 'FloStyle'`, `repo = 'm7-jellyfin'` → `api.github.com/repos/FloStyle/m7-jellyfin/releases/latest`
  - `src/utils.js` `getLatestPlugin()` : `https://github.com/FloStyle/m7-jellyfin/releases/latest/download/jellyfin.zip`
  - Garde-fous à conserver/vérifier : check toutes les 24 h + bouton manuel « Update » ; ne jamais écraser si la version locale ≥ version distante ; rate-limit GitHub (60 req/h) → le cache du check existe déjà
- **Comportement PS3** : au démarrage (check 24 h) ou via Réglages → Update : télécharge le zip depuis la release NEO, remplace `installedplugins/jellyfin.zip`, redémarre le plugin.

### Canal B — Releases GitHub (distribution)
- Workflow `release.yml` corrigé (pnpm) — tag `v*.*.*` → build CI → publie `dist/jellyfin.zip` dans la release.
- **Procédure de release (mainteneur)** :
  1. Bump version : `package.json` (+ `CHANGELOG.md`)
  2. Commit sur `main` + push
  3. `git tag v1.2.0 && git push origin v1.2.0`
  4. GitHub Actions build + release (~1-2 min) → zip dispo
  5. La PS3 le récupère via Canal A (auto 24 h ou bouton Update)
- **Versioning** : `v1.2.0` = première release NEO (après validation PS3 de stability-1). Puis semver : patch = fixes, minor = features.
- ⚠️ **Ne pas release tant que stability-1 n'est pas validé sur PS3** (le zip actuel bloque la lecture).

### Canal C — Déploiement dev rapide (mainteneur, tests) — script à créer
`scripts/deploy-ps3.fish` (ou `.sh`) :
```fish
# 1. build
pnpm run build
# 2. upload FTP (webMAN, anon) — remplacer PS3_HOST par l'IP de la PS3
curl -s -m 60 -T dist/jellyfin.zip \
  "ftp://PS3_HOST/dev_hdd0/game/HTSS00003/USRDIR/settings/installedplugins/jellyfin.zip" \
  -u anonymous:
# 3. vérification (hash + taille)
curl -s -m 30 "ftp://PS3_HOST/dev_hdd0/game/HTSS00003/USRDIR/settings/installedplugins/jellyfin.zip" \
  -u anonymous: -o /tmp/check.zip && sha256sum /tmp/check.zip dist/jellyfin.zip
# 4. rappel : relancer Movian sur la PS3 (XMB) pour recharger le plugin
```
- Variante `--rollback` : re-upload `backup/backup-jellyfin-ps3-ANCIEN.zip` (10 s).
- ⚠️ Ne PAS mettre le script dans le repo public (IP PS3 dedans) → `scripts/` local, ignoré par git (docs/ + scripts/ dans .gitignore).

## 3. Séquence d'implémentation

| # | Étape | Type | Qui |
|---|---|---|---|
| 1 | ✅ Workflow release.yml corrigé (pnpm) | déjà fait | — |
| 2 | ✅ Preuve drop-in (manifests comparés) | déjà fait | — |
| 3 | Mission agent : upgrader → FloStyle + vérif garde-fous | code | agent (mission `stability-2-updater`) |
| 4 | Script `scripts/deploy-ps3.fish` + `--rollback` | dev local | assistant (après GO) |
| 5 | stability-1 (URL Transcoding) validé sur PS3 | code+test | agent → assistant → mainteneur |
| 6 | Première release `v1.2.0` (canal B) | ops | mainteneur (assistant aide) |
| 7 | Test réel canal A : la PS3 se met à jour depuis la release | test | mainteneur |

## 4. Risques & garde-fous

- **Écraser un zip en cours de test** : l'upgrader ne doit jamais passer si version locale ≥ distante ; le bouton Update manuel est le seul moyen forcé.
- **Rate-limit GitHub** : le check 24 h suffit ; si le bouton manuel échoue (API limitée), l'URL de download direct (`/releases/latest/download/`) n'est PAS limitée — utilisable en fallback.
- **Perte de données** : impossible par construction (id stable), mais garder `backup/backup-jellyfin-ps3-ANCIEN.zip` comme filet.
- **Release avec zip cassé** : interdiction de release avant validation PS3 (checklist §7 du AGENTS.md).
- **Upstream** : les fixes stability partent aussi en PR upstream — ne pas casser l'upgrader de l'upstream (notre URL est dans NOTRE fork seulement).

## 5. Checklist de validation finale (après v1.2.0)

- [ ] Installer le zip NEO par-dessus l'ancien → settings conservés (host/user/préférences), zéro reconfiguration
- [ ] Lecture OK (PlaybackInfo 200, HLS démarre, VRAM libre)
- [ ] Bouton « Update » → détecte la release NEO, télécharge, remplace, redémarre
- [ ] Rollback testé (script `--rollback` ou zip backup)
- [ ] ESLint zéro erreur, CHANGELOG à jour
