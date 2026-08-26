# ROADMAP — m7-jellyfin NEO (branche `main`)

> **Vision** : un client Jellyfin pour Movian/PS3 moderne — propre, léger, rapide, UI soignée, features modernes (identification QR/QuickConnect, comptes multi-utilisateurs) — qui se rapproche de l'expérience de l'**app Android Jellyfin**, dans les limites du hardware PS3.
> **Branche** : `main` (base néo). Les bugs core vivent sur `stability` et sont mergés dans `main` régulièrement (`git merge stability`).
> **État** : SUSPENDU — chaque mission est lancée explicitement par le mainteneur.

---

## Règles de conception (valables pour toutes les missions)

1. **PS3 d'abord** : heap < 64 MB, `http.request()` synchrone/bloquant, pas de `Promise`/`fetch`, CommonJS.
2. **Conservatisme playback** : le direct play ne s'élargit JAMAIS en bloc — codec par codec, test PS3 réel à chaque fois.
3. **Sécurité** : jamais de token/api_key/password/URL complète dans les logs (`HttpClient.safeLogPath()`).
4. **Structure de réponses** : `{ ok, data, error, status }` partout, jamais de throw.
5. **UI** : `page.appendItem`, `page.options.createAction/Bool/MultiOpt`, jamais de page en loading permanent.
6. **Chaque mission livre** : commit propre sur `main` + rapport (testé, non testé, limites) + mise à jour de cette roadmap (cases cochées).

---

## Phase A — Fondations (gains rapides, faible risque)

### A1. Préférences langue audio/sous-titres
- **But** : pré-sélectionner automatiquement la langue audio et de sous-titres de l'utilisateur au lancement de la lecture.
- **API** : `GET /Users/{userId}` → champs `Configuration.DefaultAudioLanguage`, `Configuration.DefaultSubtitleLanguage` (+ `SubtitleMode`).
- **Fichiers** : `src/api.js` (nouvelle méthode user), `src/view.js` (sélection automatique au démarrage de lecture, avec override manuel possible).
- **Acceptance** : lancer un film avec une piste FR dispo → sélectionnée automatiquement ; l'utilisateur peut toujours changer à la main.

### A2. Mode connexion Ethernet / Wi-Fi
- **But** : adapter le bitrate max au réseau — Ethernet : 40 Mbps, Wi-Fi : 15 Mbps.
- **Fichiers** : `src/settings.js` (réglage `connection_type`), `src/deviceProfile.js` (`MaxStaticBitrate` — déjà paramétrable).
- **Acceptance** : le réglage change bien le `MaxStaticBitrate` envoyé dans PlaybackInfo (vérifiable dans la réponse serveur).

### A3. Gestion des sessions / multi-utilisateurs
- **But** : sur 401, retour login propre ; pouvoir changer d'utilisateur sans redémarrer le plugin.
- **Fichiers** : `src/http.js` (propagation 401), `src/view.js`/navigation, `src/settings.js` (bouton « changer d'utilisateur »).
- **Acceptance** : un token expiré → écran login ; re-login → retour à la position précédente.

### A4. Amélioration du cache
- **But** : moins de requêtes réseau (UI plus rapide).
- **Fichiers** : `src/cache.js` — TTL différenciés (posters 1 h, backdrops 24 h), bornage propre (300 entrées max).
- **Acceptance** : naviguer 2 fois dans la même bibliothèque → 2e fois sans requête API (vérifiable dans les logs serveur).

---

## Phase B — UX moderne

### B1. Écran d'accueil dynamique
- **But** : remplacer la liste statique des bibliothèques par des rangées : « Reprendre la lecture » (`/Users/{userId}/Items/Resume`), « À suivre » (`/Shows/NextUp`), « Récemment ajouté » (`/Items?SortBy=DateCreated&Limit=10`), puis les bibliothèques.
- **Fichiers** : `src/view.js` (ou nouveau `home.js`), `src/api.js`.
- **Contraintes** : max 10 items par rangée ; chargement différé (les rangées non critiques après la première) pour ne pas bloquer le démarrage.
- **Acceptance** : accueil qui montre du contenu pertinent (resume/nextup) sans ralentir l'ouverture du plugin.

### B2. Pages de détails enrichies
- **But** : backdrop en fond (via `page.metadata.background`, max 1280 px), synopsis, casting, chapitres, boutons Lecture/Trailer.
- **Fichiers** : `src/view.js` (page détail), `src/api.js` (fields ciblés : `Fields=Overview,People,Chapters,BackdropImageTags`).
- **Acceptance** : fiche film visuellement riche, navigation OK, pas de ralentissement perceptible.

### B3. Navigation séries améliorée
- **But** : vignettes d'épisodes, indicateurs « vu », « jouer le suivant ».
- **Fichiers** : `src/view.js`, `src/api.js`.
- **Acceptance** : parcours série fluide avec état vu correct.

### B4. Look modernisé
- **But** : styles/icônes plus proches de l'app Android (sans casser les pages existantes).
- **Fichiers** : `assets/`, `views/` (GLW si utilisées), CSS du plugin.
- **Acceptance** : rendu vérifié sur PS3 (pas de régression visuelle majeure).

---

## Phase C — Modernité (comptes & identification)

### C1. QuickConnect / identification QR
- **But** : connexion sans mot de passe — la PS3 affiche un code 6 chiffres, l'utilisateur le saisit sur son téléphone/PC (Jellyfin QuickConnect), la PS3 se connecte.
- **API** : `POST /QuickConnect/Initiate` → `POST /QuickConnect/Authorize?code={code}` (à partir du serveur) → polling `GET /QuickConnect/Connect?secret={secret}` (3 s).
- **Fichiers** : `src/view.js` (écran login), `src/api.js`.
- **Acceptance** : code affiché sur la PS3, validation depuis un autre appareil → connexion automatique.
- **Note** : un QR-code n'est pas affichable nativement sur Movian (pas de rendu d'image dynamique fiable) → privilégier le code 6 chiffres (mécanisme QuickConnect standard).

### C2. Refactor structurel (leaner)
- **But** : passer d'un `src/` plat à une organisation par domaine (`src/core/`, `src/api/`, `src/ui/`) — la cible de l'audit Qwen, adaptée à notre code réel. À faire incrémentalement, fichier par fichier, SANS changement de comportement.
- **Contrainte forte** : chaque étape doit rester buildable et testable (refactor pur = zéro changement fonctionnel).

### C3. Nettoyage / dette technique
- **But** : supprimer le code mort, normaliser les styles (quotes, virgules), homogénéiser les erreurs utilisateur (`page.error()`/`popup.notify()`).
- **Acceptance** : ESLint zéro erreur, code plus court.

---

## Phase D — Backlog lointain (à valider techniquement AVANT tout dev)

| Feature | Bloqueur technique à lever |
|---|---|
| Skip Intro (`/MediaSegments`) | Prouver qu'un seek programmatique du player Movian est possible |
| Trickplay (miniatures scrubbing) | Movian PS3 n'a pas d'overlay de scrubbing — à confirmer |
| Contrôle à distance (WebSocket) | Pas de `movian/ws` fiable → polling 30 s, à évaluer |
| Live TV | Heap 64 MB + UI bloquée : EPG trop lourd — probablement écarté définitivement |

---

## Ordre d'exécution conseillé

1. **stability-1** (mission séparée — prérequis : la lecture doit marcher avec le nouveau code avant tout le reste)
2. A1 → A2 → A3 → A4 (fondations, chacune testable seule)
3. B1 → B2 → B3 → B4 (UX)
4. C1 (QuickConnect) → C2 (refactor incrémental) → C3
5. D : décision après preuves techniques

**Après chaque vague** : build + déploiement PS3 + test réel (VRAM libre !) — le gate est toujours le test PS3, pas le test théorique.

---

*Maintenu par le mainteneur. Les missions sont rédigées dans `docs/missions/` — une par livrable agent.*
