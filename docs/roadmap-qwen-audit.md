# Roadmap Qwen 3.8max — audit externe (26/08/2026)

> **Source** : audit externe demandé par le mainteneur (Qwen 3.8max) sur le fork `FloStyle/m7-jellyfin` (fix Jellyfin 10.11 + hardening).
> **Statut** : référence — le projet est SUSPENDU. Rien de ce document n'est engagé.

---

## ⚖️ Verdict de l'assistant (26/08)

### Ce que l'audit apporte de réel
- **2 vrais bugs trouvés dans notre code** (vérifiés) :
  - `view.js:594` : `atrack > 0` → la piste audio index 0 n'est jamais envoyée (fix : `>= 0`, `-1` = défaut)
  - `view.js:610` : URL sous-titres utilise la variable de boucle `j` au lieu de `stream.Index` (index décalé si le tableau est filtré)
- **Confirme notre diagnostic** du stuck PS3 (TranscodingUrl avec `?&` refusée par le player) — même workaround que notre mission v2.
- Contraintes PS3 exactes (§2) : level 4.1, 8-bit SDR, pas de HEVC, Fast Ethernet 100 Mbps.

### Ce qui cloche
- **« m7-jellyfin-neo » n'existe pas** — Qwen invente un 3e repo + une architecture cible (`src/core/`, `src/api/`, `src/ui/`) qui n'est pas notre code (plat). L'adopter = refactor structurel majeur.
- **Ce n'est pas un audit du travail livré** : il ne critique pas le diff (qualité/régressions) — c'est une roadmap.
- **Ignore le `AGENTS.md` existant** (2628 lignes, plan de refactoring) → deux documents concurrents.
- **Erreurs techniques** :
  - §5.2/§5.3 : `AudioCodec: 'aac,ac3,dts,mp3'` — le serveur ne transcodera jamais VERS du DTS (DTS = passthrough). Notre profil (`aac,ac3,mp3`) est correct.
  - §5.1 : élargir le direct play (avi/wmv/dts/mpeg2/vc1) — risqué, à faire codec par codec avec test PS3.

### Décisions intégrées au backlog (AGENTS.md §0)
- **Vague 1** : mission v2 (URL Transcoding) + 3 bugs triviaux
- **Vague 2** : langues audio/ST + mode Ethernet/Wi-Fi
- **Vague 3** : home dynamique + détails enrichis
- **Lointain** : Skip Intro (si seek programmatique prouvé), QuickConnect
- **Écarté** : Trickplay, Live TV, contrôle à distance WS

---

## 📄 Document Qwen (copie intégrale)

# AGENTS.md — m7-jellyfin-neo

> **Purpose**: This file is the authoritative coordination document for all AI agents and contributors working on `m7-jellyfin-neo`. Read this file completely before making any code changes. Update the Progress Tracker after every completed task.

---

## §1 Project Identity

| Field | Value |
|-------|-------|
| **Repository** | `FloStyle/m7-jellyfin-neo` |
| **Upstream Root** | `LouisMarotta/m7-jellyfin` (read-only reference) |
| **Stability Fork** | `FloStyle/m7-jellyfin` (receives critical bugfixes only) |
| **Target Platform** | PlayStation 3 running Movian/M7 (ECMAScript plugin) |
| **Target Server** | Jellyfin 10.9.x through 10.11.x |
| **Primary Goal** | Feature parity with modern Jellyfin clients (Android TV, Web) while respecting PS3 hardware limits |
| **Secondary Goal** | Technical robustness: no silent failures, no unbounded queries, no token leaks |

### Relationship to Upstream
- This project **acknowledges** the original `LouisMarotta/m7-jellyfin` as its root.
- This project **diverges** with its own update path, architecture, and feature set.
- Critical bugfixes discovered here may be backported to `FloStyle/m7-jellyfin` (stability fork).
- We do NOT pull from upstream automatically. All upstream changes are reviewed and cherry-picked manually.

---

## §2 Hard Technical Constraints (NEVER VIOLATE)

These constraints are absolute. Any code that violates them will crash the PS3 or degrade the user experience catastrophically.

### §2.1 JavaScript Runtime (Movian ECMAScript Engine)
- **Module System**: CommonJS (`require()` / `module.exports`). No ES6 `import/export`.
- **Async Model**: Movian's `http.request()` is **synchronous and blocking**. There is no `Promise`, `async/await`, or `fetch`. All network calls block the UI thread.
- **Available Globals**: `Core`, `Plugin`, `require()`, `console.log()`. No `window`, no `document`, no `localStorage`.
- **Available Modules**: `movian/http`, `movian/service`, `movian/page`, `movian/popup`, `movian/image`, `movian/ws` (if available).
- **No External Dependencies**: Do NOT add npm packages that run at runtime. The only allowed devDependency is ESLint tooling.
- **Memory Limit**: Assume < 64MB available for the JS heap. Never accumulate large arrays or retain references to items no longer displayed.

### §2.2 PlayStation 3 Hardware Decoder
| Capability | Limit |
|-----------|-------|
| H.264/AVC | Level 4.1, High Profile, 1920×1080, 8-bit SDR only |
| MPEG-2 | Supported (DVD rips) |
| VC-1 / WMV | Supported (early Blu-ray) |
| HEVC / AV1 / VP9 | **NOT supported** — must transcode |
| HDR / 10-bit / 12-bit | **NOT supported** — must transcode |
| 4K / 8K | **NOT supported** — must transcode to 1080p |
| Audio: AAC, AC3, MP3 | Supported (up to 5.1 / 6 channels) |
| Audio: DTS | Supported (passthrough) |
| Audio: TrueHD, DTS-HD MA, FLAC, Opus | **NOT supported** — must transcode |
| Max Network (Ethernet) | 100 Mbps Fast Ethernet |
| Max Network (Wi-Fi) | 802.11b/g (~15-20 Mbps real-world) |

### §2.3 Jellyfin Server Compatibility
- Minimum supported server: **Jellyfin 10.9.0**
- Primary tested version: **Jellyfin 10.11.x**
- Known server bug: Jellyfin 10.11.x throws `NullReferenceException` in `StreamBuilder.ApplyTranscodingConditions` when a `Type: 'Video'` CodecProfile entry is present. **Do not include Video CodecProfile entries.** Use `VideoAudio` only.

### §2.4 Security Rules
- **NEVER** log `api_key`, `Token`, `X-Emby-Token`, passwords, or full playback URLs.
- **NEVER** include tokens in `console.log()` output.
- All HTTP logging must use `HttpClient.safeLogPath()` which strips scheme, host, and query string.
- Playback URLs containing `api_key` must be marked `// Sensitive URL` in comments.
- Passwords are sent in POST body only. Never in URL parameters.

---

## §3 Architecture

### §3.1 File Structure
```
m7-jellyfin-neo/
├── AGENTS.md              ← THIS FILE (source of truth)
├── package.json           ← Plugin manifest + devDependencies only
├── .eslintrc.json         ← Linting rules
├── locales/               ← i18n translation files (en, it)
│   ├── en.json
│   └── it.json
├── assets/                ← Static images (icons, backgrounds)
├── views/                 ← GLW view files (if any)
├── libs/                  ← API definition files (if any)
└── src/
    ├── main.js            ← Plugin entry point, service registration
    ├── core/
    │   ├── http.js        ← Central HTTP client (AGENTS.md §6.1)
    │   ├── ws.js          ← WebSocket client with polling fallback
    │   ├── session.js     ← Playback session reporting
    │   ├── deviceProfile.js ← PS3 device profile builder
    │   └── utils.js       ← Shared utilities (ticks, params, dates)
    ├── api/
    │   ├── auth.js        ← QuickConnect, login, token management
    │   ├── library.js     ← Views, items, search, pagination
    │   ├── playback.js    ← PlaybackInfo, MediaSegments, stream URLs
    │   └── user.js        ← User preferences, favorites
    ├── ui/
    │   ├── home.js        ← Dynamic home screen (rows)
    │   ├── library.js     ← Library browsing with pagination
    │   ├── search.js      ← Search with filters
    │   ├── detail.js      ← Item detail pages
    │   ├── player.js      ← Video playback, subtitles, audio tracks
    │   ├── settings.js    ← Plugin settings UI
    │   └── login.js       ← QuickConnect / credential login
    └── views/
        └── (legacy view.js if migration is incremental)
```

### §3.2 Design Patterns
- **Singleton API Client**: One `HttpClient` instance shared across all API modules.
- **Structured Error Returns**: All API calls return `{ ok: boolean, data?: Object, error?: string, status?: number }`. Never throw.
- **Fire-and-Forget Reporting**: Session progress, playback start/stop. Never block playback.
- **Defensive Parsing**: Always use `data?.Items ?? []`. Never assume response shape.
- **Bounded Queries**: Every list query MUST have `Limit` (max 50 for grids, max 200 for album tracks) and `StartIndex`.

### §3.3 Routing Convention
Routes follow the pattern: `{pluginId}:{entity}:{id}:{sub_entity}:{id}`

Examples:
```
m7jellyfin:library:{collectionId}
m7jellyfin:series:{seriesId}
m7jellyfin:series:{seriesId}:season:{seasonId}
m7jellyfin:video:{itemId}
m7jellyfin:video:{itemId}:atrack:{audioIndex}
m7jellyfin:album:{albumId}
m7jellyfin:search:{query}
m7jellyfin:favourites
m7jellyfin:settings
m7jellyfin:login
```

---

## §4 API Patterns & Endpoints

### §4.1 Authentication
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/Users/AuthenticateByName` | Username/password login |
| POST | `/QuickConnect/Initiate` | Start QuickConnect session |
| GET | `/QuickConnect/Connect?secret={secret}` | Poll for QuickConnect auth |
| POST | `/QuickConnect/Authorize?code={code}` | Authorize from another device |

### §4.2 Library & Browsing
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/Users/{userId}/Views` | Library folders (home screen) |
| GET | `/Users/{userId}/Items` | Paginated item list |
| GET | `/Shows/NextUp` | Next Up row |
| GET | `/Users/{userId}/Items/Resume` | Continue Watching row |
| GET | `/Shows/{seriesId}/Seasons` | Season list |
| GET | `/Shows/{seriesId}/Episodes` | Episode list |

### §4.3 Playback
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/Items/{id}/PlaybackInfo` | Get playback URLs + device profile |
| GET | `/MediaSegments/{itemId}` | Intro/outro segments (Skip Intro) |
| GET | `/Videos/{id}/Trickplay/{width}/{file}` | Trickplay thumbnails |
| POST | `/Sessions/Playing` | Report playback start |
| POST | `/Sessions/Playing/Progress` | Report progress (every 5s) |
| POST | `/Sessions/Playing/Stopped` | Report playback end |

### §4.4 WebSocket (Real-time)
| Endpoint | Purpose |
|----------|---------|
| `ws://{host}/socket?api_key={token}` | Real-time commands & state sync |

**WebSocket Message Types to Handle:**
- `ForceKeepAlive` → Respond with `KeepAlive`
- `GeneralCommand` → Execute command (Play, Pause, Stop, Seek)
- `Playstate` → Update local playback state
- `UserDataChanged` → Refresh item metadata
- `LibraryChanged` → Refresh library views

**Fallback**: If WebSocket is unavailable or drops, poll `/Sessions/{sessionId}` every 30 seconds.

---

## §5 Device Profile Rules

### §5.1 Direct Play Conditions (ALL must be true)
1. Video codec is `h264`, `mpeg2video`, or `vc1`
2. Resolution ≤ 1920×1080
3. Video level ≤ 4.1 (for H.264)
4. Bit depth = 8
5. Video range = SDR (no HDR)
6. Audio codec is `aac`, `ac3`, `dts`, or `mp3`
7. Audio channels ≤ 6
8. Container is `mp4`, `m4v`, `mov`, `mkv`, `avi`, or `wmv`
9. File bitrate ≤ configured maximum (default 40 Mbps Ethernet, 15 Mbps Wi-Fi)

### §5.2 Transcode Profile (when Direct Play fails)
```javascript
{
    Container: 'ts',
    Type: 'Video',
    VideoCodec: 'h264',
    AudioCodec: 'aac,ac3,dts,mp3',
    Protocol: 'hls',
    Context: 'Streaming',
    MaxAudioChannels: '6',
    MinSegments: '1',
    SegmentLength: '10',  // 10s reduces HTTP overhead on PS3
    BreakOnNonKeyFrames: true,
    MaxWidth: 1920,
    MaxHeight: 1080,
}
```

### §5.3 CodecProfile (sent to server)
```javascript
// ONLY include VideoAudio. Do NOT include Type: 'Video'.
// Jellyfin 10.11.x crashes with Video CodecProfile entries.
CodecProfiles: [
    {
        Type: 'VideoAudio',
        Codec: 'aac,ac3,dts,mp3',
        Conditions: [
            {
                Condition: 'LessThanEqual',
                Property: 'AudioChannels',
                Value: '6',
                IsRequired: false,
            },
        ],
    },
]
```

---

## §6 Coding Standards

### §6.1 HTTP Requests
- ALL requests go through `HttpClient.request()`. Never call `http.request()` directly.
- Always handle the structured return: `if (!result.ok) { handleError(result); return; }`
- Never assume `result.data` exists without checking `result.ok` first.

### §6.2 Error Handling
```javascript
// CORRECT: Structured error handling
var result = this.api.getItemsData(id, offset, limit);
if (!result.ok) {
    this.showApiError(page, result);
    return;
}
var items = result.data.Items ?? [];

// WRONG: No error handling
var items = this.api.getItemsData(id).data.Items;
```

### §6.3 UI Rendering
- Always call `page.loading = false` when done rendering or on error.
- Use `page.appendItem()` for lists. Use `page.appendPassiveItem()` for headers.
- Use `page.options.createAction()` for buttons.
- Use `page.options.createBool()` for toggles.
- Use `page.options.createMultiOpt()` for dropdowns.
- Never leave a page in a permanent loading state.

### §6.4 Pagination
```javascript
// All grid views MUST use this pattern:
var offset = 0;
var limit = 20;  // Hard cap: 50
var hasMore = true;

function browse() {
    if (!hasMore) return;
    var data = api.getItemsData(id, offset, limit);
    if (!data.ok) { hasMore = false; return; }
    var items = data.data.Items ?? [];
    items.forEach(function(item) { page.appendItem(...); });
    offset += items.length;
    var total = data.data.TotalRecordCount;
    hasMore = (typeof total === 'number') ? offset < total : items.length === limit;
    page.haveMore(hasMore);
    page.loading = false;
}
page.asyncPaginator = browse;
browse();
```

### §6.5 Naming Conventions
- Files: `camelCase.js` (e.g., `deviceProfile.js`, `session.js`)
- Classes: `PascalCase` (e.g., `HttpClient`, `DeviceProfile`)
- Methods: `camelCase` (e.g., `getPlaybackInfo`, `selectMediaSource`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_GRID_LIMIT`)
- i18n keys: `dot.separated.keys` (e.g., `auth.login_failed`, `error.network`)

### §6.6 Comments
- Reference AGENTS.md sections in comments: `// (AGENTS.md §6.1)`
- Mark sensitive URLs: `// Sensitive URL (contains api_key): never log (§9.3)`
- Explain WHY, not WHAT: `// Cap at 50 to prevent PS3 memory exhaustion (§2.1)`

---

## §7 Progress Tracker

> **Instructions for agents**: When you complete a task, change its status from `[ ]` to `[x]` and add your agent name + date. If a task is blocked, mark it `[!]` and explain why.

### Phase 0: Foundation (COMPLETED in stability fork)
- [x] Central HTTP client with defensive error handling — `src/core/http.js`
- [x] Token/key scrubbing from logs — `HttpClient.safeLogPath()`
- [x] Playback session reporting (Playing/Progress/Stopped) — `src/core/session.js`
- [x] Strict PS3 device profile — `src/core/deviceProfile.js`
- [x] HLS playback flow via PlaybackInfo TranscodingUrl
- [x] Paginated browsing with bounded queries
- [x] Defensive media-source selection (`isDirectPlaySafe`)
- [x] Jellyfin 10.11.11 compatibility fix (removed Video CodecProfile)
- [x] ESLint configuration + i18n en/it

### Phase 1: Modern Authentication
- [ ] **Task 1.1**: Implement QuickConnect login flow
  - Agent: _unassigned_
  - Status: _not started_
  - Spec: POST `/QuickConnect/Initiate` → display 6-digit code → poll `/QuickConnect/Connect?secret=X` every 3s → on success, extract `AccessToken` and `User`
  - Files: `src/api/auth.js`, `src/ui/login.js`
  - Acceptance: User sees a 6-digit code. Entering it on their phone authenticates the PS3. No password typing required.

- [ ] **Task 1.2**: Server discovery & saved servers
  - Agent: _unassigned_
  - Status: _not started_
  - Spec: Store last-used server URL in `service.host`. Add "Add Server" option in settings. Validate connectivity with GET `/System/Info/Public` before saving.
  - Files: `src/ui/settings.js`, `src/api/auth.js`

- [ ] **Task 1.3**: Token refresh & multi-user support
  - Agent: _unassigned_
  - Status: _not started_
  - Spec: On 401, clear token and redirect to login. Support switching users without restarting the plugin.
  - Files: `src/core/http.js`, `src/api/auth.js`, `src/ui/login.js`

### Phase 2: Playback Parity
- [ ] **Task 2.1**: Skip Intro / Media Segments
  - Agent: _unassigned_
  - Status: _not started_
  - Spec: Fetch `GET /MediaSegments/{itemId}`. During playback, if `positionTicks` enters a segment with `Type: 'Intro'`, show "Skip Intro" button via `page.options.createAction`. On press, seek to segment end.
  - Files: `src/api/playback.js`, `src/ui/player.js`
  - Constraint: Button must use Movian's `page.options` API. Cannot overlay HTML on video.

- [ ] **Task 2.2**: Trickplay / Scrubbing thumbnails
  - Agent: _unassigned_
  - Status: _not started_
  - Spec: Fetch Trickplay data from `GET /Videos/{id}/Trickplay/{width}/{file}`. Map seek position to thumbnail URL. Display in seek UI if Movian supports custom seek overlays.
  - Files: `src/api/playback.js`, `src/ui/player.js`
  - Constraint: Downscale thumbnails to max 320px width to save memory.

- [ ] **Task 2.3**: Audio/Subtitle language preferences
  - Agent: _unassigned_
  - Status: _not started_
  - Spec: Fetch user preferences from `GET /Users/{userId}`. Auto-select audio track matching `DefaultAudioLanguage` and subtitle matching `DefaultSubtitleLanguage`. Override with manual selection.
  - Files: `src/api/user.js`, `src/ui/player.js`

- [ ] **Task 2.4**: Adaptive bitrate (Ethernet vs Wi-Fi)
  - Agent: _unassigned_
  - Status: _not started_
  - Spec: Add plugin setting "Connection Type" (Ethernet / Wi-Fi). Ethernet: max 40 Mbps. Wi-Fi: max 15 Mbps. Auto-detect if Movian exposes network interface info.
  - Files: `src/core/deviceProfile.js`, `src/ui/settings.js`

### Phase 3: UI/UX Parity
- [ ] **Task 3.1**: Dynamic Home Screen
  - Agent: _unassigned_
  - Status: _not started_
  - Spec: Replace static library list with dynamic rows: "Continue Watching" (GET `/Users/{userId}/Items/Resume`), "Next Up" (GET `/Shows/NextUp`), "Recently Added" (GET `/Items?SortBy=DateCreated&Limit=10`), then library folders.
  - Files: `src/ui/home.js`, `src/api/library.js`
  - Constraint: Max 10 items per row. Use `page.appendItem` with separator headers.

- [ ] **Task 3.2**: Rich Detail Pages
  - Agent: _unassigned_
  - Status: _not started_
  - Spec: Show Backdrop image (max 1280px), overview, cast/crew, chapters, and "Play" / "Trailer" buttons. Use `page.metadata.background` for backdrop.
  - Files: `src/ui/detail.js`, `src/api/library.js`

- [ ] **Task 3.3**: Season/Episode navigation improvements
  - Agent: _unassigned_
  - Status: _not started_
  - Spec: Add episode thumbnails, watched indicators, and "Play Next" functionality. Show episode number and air date.
  - Files: `src/ui/library.js`, `src/ui/player.js`

### Phase 4: Real-time & Advanced
- [ ] **Task 4.1**: WebSocket integration
  - Agent: _unassigned_
  - Status: _not started_
  - Spec: Connect to `ws://{host}/socket?api_key={token}`. Handle `ForceKeepAlive`, `GeneralCommand`, `Playstate`, `UserDataChanged`. Implement polling fallback (30s) if WS drops.
  - Files: `src/core/ws.js`, `src/ui/player.js`
  - Constraint: Movian may not support WebSocket natively. Check for `require('movian/ws')` availability. If unavailable, skip WS and use polling only.

- [ ] **Task 4.2**: Remote control support
  - Agent: _unassigned_
  - Status: _not started_
  - Spec: Listen for `GeneralCommand` messages (Play, Pause, Stop, Seek, SetAudioStreamIndex, SetSubtitleStreamIndex). Execute commands on the active player.
  - Files: `src/core/ws.js`, `src/ui/player.js`

- [ ] **Task 4.3**: Live TV & DVR support
  - Agent: _unassigned_
  - Status: _not started_
  - Spec: Add Live TV library browsing (GET `/LiveTv/Channels`, `/LiveTv/Programs`). Handle `.ts` stream containers. Add recording management if feasible.
  - Files: `src/api/library.js`, `src/ui/library.js`, `src/core/deviceProfile.js`

### Phase 5: Performance & Polish
- [ ] **Task 5.1**: Aggressive image caching
  - Agent: _unassigned_
  - Status: _not started_
  - Spec: Cache poster/backdrop URLs in `plugin.cache` to avoid re-requesting. Set appropriate cache TTL (1 hour for posters, 24 hours for backdrops).
  - Files: `src/core/utils.js`, `src/ui/home.js`, `src/ui/library.js`

- [ ] **Task 5.2**: Reduce HTTP request count
  - Agent: _unassigned_
  - Status: _not started_
  - Spec: Batch item metadata requests where possible. Use `Fields` parameter to request only needed fields. Avoid fetching `MediaSources` in list views.
  - Files: `src/api/library.js`

- [ ] **Task 5.3**: Startup time optimization
  - Agent: _unassigned_
  - Status: _not started_
  - Spec: Defer non-critical API calls (Next Up, Recently Added) until after the library folders are rendered. Show skeleton/loading state for deferred content.
  - Files: `src/ui/home.js`

---

## §8 Testing Checklist

Before marking any task as complete, verify:

- [ ] Plugin loads without errors in Movian console
- [ ] No `console.log` output contains tokens, API keys, or passwords
- [ ] All API calls return structured `{ ok, data, error }` responses
- [ ] Error states show user-friendly messages via `page.error()` or `popup.notify()`
- [ ] Pages never get stuck in a permanent loading state
- [ ] Pagination works correctly (scroll to bottom loads more items)
- [ ] Playback starts within 5 seconds of selection
- [ ] Playback reports progress to Jellyfin dashboard
- [ ] "Continue Watching" position is accurate after stopping
- [ ] Direct Play is used when file is PS3-compatible
- [ ] Transcoding is used when file is NOT PS3-compatible
- [ ] No HTTP 500 errors from Jellyfin server during playback
- [ ] Memory usage remains stable during 30+ minutes of browsing
- [ ] ESLint passes with zero errors

---

## §9 Known Issues & Workarounds

| Issue | Workaround | Section |
|-------|-----------|---------|
| Jellyfin 10.11.x NullReferenceException on Video CodecProfile | Remove `Type: 'Video'` from CodecProfiles. Use `VideoAudio` only. | §5.3 |
| PS3 stalls on raw TranscodingUrl with leading `?&` | Parse URL before appending query params. Check for existing params. | §6.1 |
| Subtitle index mismatch | Use `stream.Index` not loop variable `j` for subtitle URLs. | §4.3 |
| PS3 Wi-Fi max ~15 Mbps | Cap bitrate at 15 Mbps when connection type is Wi-Fi. | §2.2 |
| Movian blocks UI thread during HTTP | Keep requests fast. Show loading state. Use `setTimeout` for pagination. | §2.1 |
| Audio track index 0 not sent | Check `atrack >= 0` not `atrack > 0`. | §6.4 |

---

## §10 Agent Operating Procedures

### Before Starting Work
1. Read this entire file.
2. Check the Progress Tracker (§7) for your assigned task.
3. Verify no other agent is already working on the same task.
4. Review the relevant source files listed in the task spec.

### While Working
1. Follow all coding standards in §6.
2. Respect all constraints in §2.
3. Add inline comments referencing AGENTS.md sections.
4. Test your changes against the Testing Checklist (§8).

### After Completing Work
1. Update the Progress Tracker: change `[ ]` to `[x]`.
2. Add your agent name and completion date.
3. Write a brief summary of what was implemented.
4. Note any new issues discovered in §9.
5. Commit with message format: `feat(scope): description (AGENTS.md §X.Y)`

### Commit Message Convention
```
feat(auth): implement QuickConnect login flow (AGENTS.md §7 Task 1.1)
fix(playback): use stream.Index for subtitle URLs (AGENTS.md §9)
refactor(http): extract safe URL logging to utility (AGENTS.md §6.1)
docs(agents): update progress tracker for Phase 2
```

---

## §11 Version History

| Version | Date | Description |
|---------|------|-------------|
| 0.1.0 | 2026-08-26 | Initial AGENTS.md creation. Phase 0 completed in stability fork. |

---

*This file is maintained by the project lead. Agents may update §7 (Progress Tracker) and §9 (Known Issues) but must not modify §1-§6 or §10 without explicit approval.*
