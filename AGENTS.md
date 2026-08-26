# AGENTS.md

> Coordination document for AI agents and contributors on **m7-jellyfin (NEO)** — a Jellyfin client plugin for Movian on PlayStation 3.
> Read this file completely before any code change. Update the relevant sections after completing work.

---

## §0 Project status

- **Status: SUSPENDED until the maintainer dispatches a mission.** Do not start work on your own.
- The PS3 currently runs the **old (working) zip**. The refactored code in this repo is **NOT deployable as-is** (playback stalls — see §8). No zip is deployed without the maintainer's go-ahead.
- Jellyfin transcoding needs free GPU VRAM on the server; a heavy GPU service (e.g. an LLM) causes ffmpeg OOM (exit 218, segment 500). Not a plugin bug.

## §1 Project identity & goals

| Field | Value |
|---|---|
| Repository | `FloStyle/m7-jellyfin` (public fork) |
| Upstream | `LouisMarotta/m7-jellyfin` (root; fixes forwarded via PR) |
| Target | PS3 / Movian 7 (ECMAScript plugin, CommonJS) |
| Server | Jellyfin 10.9.x → 10.11.x (primary tested: 10.11.11) |
| Goal 1 | Stability fork: core fixes + performance, merged back to `main` and upstream |
| Goal 2 | NEO: modern client (multi-user, QuickConnect/QR, modern UX) — parity with the Jellyfin Android app, within PS3 limits |

## §2 Git workflow (multi-agent rules)

- Branches:
  - `main` — NEO baseline (default). Features land here.
  - `stability` — core bugfixes/perf. Merged back into `main` AND forwarded upstream via PR.
  - `feat/<name>` — one branch per feature, from `main`. Never commit directly to `main`.
- **One mission = one agent = one branch.** Check `docs/missions/` (local) for mission specs before starting.
- Commit messages: `feat(scope): description` / `fix(scope): description` / `refactor(scope): ...` / `docs(scope): ...`.
- After a mission: update the mission file + this file if needed, then report (files changed, tested, limits).
- Never force-push a shared branch. Rebase locally on `main` before opening a PR.

## §3 Hard constraints (NEVER violate)

- **CommonJS only**: `require()` / `module.exports`. No `import/export`, no `Promise`/`async/await`/`fetch`. Movian's `http.request()` is synchronous and blocks the UI thread.
- **Globals**: `Core`, `Plugin`, `require()`, `console.log()`. Modules: `movian/http`, `movian/service`, `movian/page`, `movian/popup`, `movian/image`.
- **No runtime dependencies**: npm packages are devDependencies only (ESLint/Prettier/build tooling).
- **Memory**: assume < 64 MB JS heap. No unbounded arrays, no retained references to off-screen items. Every list query MUST have `Limit` (≤ 50 grids, ≤ 200 album tracks) and `StartIndex`.
- **PS3 decoder**: H.264 level 4.1 / 1080p / 8-bit SDR direct play only; HEVC/AV1/VP9/4K/HDR/10-bit → server transcode to HLS `ts`. Audio: AAC/AC3/MP3 ≤ 6ch; DTS passthrough; TrueHD/DTS-HD/FLAC/Opus → transcode.
- **Network**: Ethernet 100 Mbps (cap ~40 Mbps), Wi-Fi ~15 Mbps.
- **Jellyfin 10.11 bug**: do NOT include `Type: 'Video'` CodecProfile entries (server `NullReferenceException`). `VideoAudio` only. Do NOT reintroduce `VideoRange` conditions (removed in 10.11).

## §4 Security (logging)

- NEVER log `api_key`, tokens, passwords, or full playback URLs.
- All HTTP logging goes through `HttpClient.safeLogPath()` (strips scheme, host, query).
- Playback URLs with `api_key` are marked `// Sensitive URL` in comments.
- Passwords travel in POST bodies only, never in URL params.

## §5 Coding conventions

- **Structured results**: every API call returns `{ ok, data?, error?, status? }`. Never throw; never assume `data` without checking `ok` first.
- **Error handling**: `if (!result.ok) { showApiError(page, result); return; }` — user-friendly messages via `page.error()`/`popup.notify()`.
- **UI**: `page.appendItem()` lists, `page.appendPassiveItem()` headers, `page.options.createAction/Bool/MultiOpt()`. Never leave a page in permanent loading (`page.loading = false` on done/error).
- **Defensive parsing**: `data?.Items ?? []`. Never assume response shape.
- **Naming**: `camelCase.js` files, `PascalCase` classes, `UPPER_SNAKE_CASE` constants, i18n keys `dot.separated`.
- **Comments**: explain WHY not WHAT; reference sections `// (AGENTS.md §3)`; mark sensitive URLs.
- `pnpm lint` must pass with **zero errors** before delivery. `pnpm format` available.

## §6 Mission workflow

1. Read the mission spec in `docs/missions/<mission>.md` (local, not versioned) — it is self-contained.
2. Create your branch (`stability` for fixes, `feat/<name>` for features).
3. Implement following §3-§5.
4. Validate locally: `pnpm lint` zero errors, `pnpm run build` produces `dist/jellyfin.zip`.
5. Commit + push your branch. Report: files changed, what was tested, known limits.
6. The maintainer (or the assistant) deploys to the PS3 and runs the on-device test. **Never deploy to the PS3 yourself.**

## §7 Testing checklist (on-device, after any playback/device-profile/HTTP change)

- [ ] Plugin loads without errors in Movian console
- [ ] No log line contains tokens/keys/passwords/full URLs
- [ ] Pages never stay in permanent loading
- [ ] Playback starts within ~5 s of selection (free VRAM on server!)
- [ ] Direct play used for PS3-safe files, transcode otherwise
- [ ] Progress reported to the Jellyfin dashboard
- [ ] Resume position accurate
- [ ] ESLint zero errors

## §8 Known issues & workarounds

| Issue | Workaround |
|---|---|
| PS3 stalls on raw `TranscodingUrl` (leading `?&`, duplicated `AudioStreamIndex`, unencoded commas) | Sanitize the URL before handing it to the player (mission stability-1) |
| Jellyfin 10.11 NRE on `Video` CodecProfile | Keep `VideoAudio` only (§3) |
| `atrack > 0` skips audio track index 0 (`view.js`) | Use `atrack >= 0` (`-1` = default) |
| Subtitle URL uses loop var `j` (`view.js`) | Use `stream.Index` |
| Server ffmpeg OOM when GPU is busy | Free VRAM before Jellyfin tests (environmental) |
| Updater targets upstream GitHub | Point to `FloStyle/m7-jellyfin` releases (plan: drop-in updates) |

## §9 Backlog (short)

See `docs/missions/` for full specs:
- **stability-1**: TranscodingUrl sanitization + trivial playback bugs (blocking — the fork stays undeployable until done)
- **stability-2**: upgrader → `FloStyle/m7-jellyfin` releases (drop-in update plan: `docs/plans/plan-drop-in-updates.md`)
- **NEO roadmap**: language prefs, Ethernet/Wi-Fi mode, dynamic home, rich details, QuickConnect/QR, multi-user, structural refactor (phased)

---

*Maintained by the project lead. Agents update §6/§7/§8 and the mission files; structural sections (§1-§5) change only with maintainer approval.*
