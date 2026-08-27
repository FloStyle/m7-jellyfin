# GitHub Copilot Instructions — m7-jellyfin (NEO)

## Project Overview

Modern Jellyfin client plugin for Movian on PlayStation 3. Hardened for Jellyfin 10.9–10.11+, strict PS3 device profile, HLS transcoding pipeline.

## Technical Constraints

### Runtime Environment
- **Target**: Movian 7 on PlayStation 3
- **Language**: ECMAScript (CommonJS only — `require()`/`module.exports`, NO `import/export`)
- **No modern JS**: No `Promise`, `async/await`, or `fetch`. Movian's `http.request()` is synchronous and blocks the UI thread.
- **Globals**: `Core`, `Plugin`, `require()`, `console.log()`
- **Modules**: `movian/http`, `movian/service`, `movian/page`, `movian/popup`, `movian/image`

### Memory & Performance
- **Heap limit**: < 64 MB JS heap
- **No unbounded arrays**: Every list query MUST have `Limit` (≤ 50 grids, ≤ 200 album tracks) and `StartIndex`
- **No retained references** to off-screen items

### PS3 Decoder Profile
- **Video**: H.264 level 4.1 / 1080p / 8-bit SDR direct play only
- **Transcode required**: HEVC/AV1/VP9/4K/HDR/10-bit → server HLS `ts`
- **Audio**: AAC/AC3/MP3 ≤ 6ch direct play; DTS passthrough; TrueHD/DTS-HD/FLAC/Opus → transcode
- **Network**: Ethernet ~40 Mbps cap, Wi-Fi ~15 Mbps cap

### Jellyfin 10.11+ Compatibility
- **DO NOT** include `Type: 'Video'` CodecProfile entries (server `NullReferenceException`)
- **Use `VideoAudio` only** for CodecProfile
- **DO NOT** reintroduce `VideoRange` conditions (removed in 10.11)

## Build & Test Workflow

```bash
pnpm install
pnpm run build    # → dist/jellyfin.zip
pnpm lint         # MUST pass with zero errors
```

## Security Rules
- NEVER log `api_key`, tokens, passwords, or full playback URLs
- Use `HttpClient.safeLogPath()` for all HTTP logging
- Mark sensitive URLs with `// Sensitive URL` comments

## Agent Permissions
For full agent permissions and mission protocols, read: `.github/agent-workspace/AGENTS.md`

## Branch Policy
- `main` — NEO baseline (default)
- `stability` — core fixes, merged back to `main` and upstream
- `feat/<name>` — one branch per feature
- **No direct commits to `main`**
