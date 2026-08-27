---
name: "Movian Jellyfin (NEO)"
description: "Modern Jellyfin client plugin for Movian on PlayStation 3 — Jellyfin 10.9-10.11+, hardened HTTP/session layer, strict PS3 device profile."
version: "1.5.0"
updated: "2026-08-26"
license: "GPL-3.0-only"
repository: "https://github.com/FloStyle/m7-jellyfin"
contact:
  issues: "https://github.com/FloStyle/m7-jellyfin/issues"
agent_policy:
  external_agents_allowed: true
  authentication_required: false
  human_review_required: true
  auto_merge_allowed: false
  code_contributions: "mission_only"
state: "STATE.md"
tasks: "TASKS.md"
decisions: "DECISIONS.md"
testing: "TESTING.md"
capabilities:
  - code_review
  - documentation
  - issue_triage
  - testing
  - bug_report
  - feature_suggestion
permissions:
  allowed:
    - read_repository
    - comment_issues
    - propose_pull_requests
    - run_public_checks
  prohibited:
    - delete_branches
    - merge_pull_requests
    - modify_workflows
    - modify_secrets
    - access_private_data
resources:
  readme: "https://raw.githubusercontent.com/FloStyle/m7-jellyfin/main/README.md"
  agents: "https://raw.githubusercontent.com/FloStyle/m7-jellyfin/main/AGENTS.md"
  contributing: "https://raw.githubusercontent.com/FloStyle/m7-jellyfin/main/CONTRIBUTING.md"
  issues_api: "https://api.github.com/repos/FloStyle/m7-jellyfin/issues"
  releases: "https://github.com/FloStyle/m7-jellyfin/releases"
---

# AGENTS.md

Coordination document for AI agents and contributors on **m7-jellyfin (NEO)** — a Jellyfin client plugin for Movian on PlayStation 3.
Read this file completely before any code change. Update the relevant sections after completing work.

---

## §0 Project status

- **Status: SUSPENDED until the maintainer dispatches a mission.** Do not start code work on your own.
- **Read [`STATE.md`](STATE.md) first** (global state), then [`TASKS.md`](TASKS.md) (task index) and [`DECISIONS.md`](DECISIONS.md) (rationale).
- Summary: the PS3 runs the **old (working) zip**; the refactored code is **NOT deployable as-is** (playback stalls — see §8). No zip is deployed without the maintainer's go-ahead. Jellyfin transcoding needs free GPU VRAM on the server.

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
  - **External agents**: branch prefix `agent/<name>` for any proposed change.
- **One mission = one agent = one branch.** Check `docs/missions/` (local) for mission specs before starting.
- Commit messages: `feat(scope): description` / `fix(scope): description` / `refactor(scope): ...` / `docs(scope): ...`.
- After a mission: update the mission file + this file if needed, then report (files changed, tested, limits).
- Never force-push a shared branch. Rebase locally on `main` before opening a PR.

## §3 External agents — scope & rules

This repository is **open to external AI agents**, with conditions.

### Allowed
- Read the public repository.
- Open issues for bugs, and comment on issues labelled `agent-ready` / `good first issue` / `documentation` / `help wanted`.
- Propose pull requests (small, well-described, tests/lint passing) — **code contributions are mission-only**: no code PRs outside of the missions documented in §9 unless explicitly invited by the maintainer.
- Improve documentation (README, comments, i18n wording) — always welcome.

### Prohibited
- Merging pull requests, deleting branches, modifying `.github/workflows/`, `SECURITY.md`, `CODEOWNERS`, lockfiles, or anything that touches secrets/credentials.
- Running destructive commands, deploying to any device, or accessing private data.
- Introducing runtime dependencies (devDependencies only).

### Contribution format (external agents)
1. Branch: `agent/<name>`, from `main`.
2. Describe the goal clearly in the PR body (what/why/how).
3. `pnpm lint` must pass with zero errors; add tests where relevant.
4. Never touch sensitive files (see Prohibited).
5. PR title: `agent: <short description>` — label `agent-submission`.
6. Human review is required before any merge. No auto-merge.

## §4 Hard constraints (NEVER violate)

- **CommonJS only**: `require()` / `module.exports`. No `import/export`, no `Promise`/`async/await`/`fetch`. Movian's `http.request()` is synchronous and blocks the UI thread.
- **Globals**: `Core`, `Plugin`, `require()`, `console.log()`. Modules: `movian/http`, `movian/service`, `movian/page`, `movian/popup`, `movian/image`.
- **No runtime dependencies**: npm packages are devDependencies only (ESLint/Prettier/build tooling).
- **Memory**: assume < 64 MB JS heap. No unbounded arrays, no retained references to off-screen items. Every list query MUST have `Limit` (≤ 50 grids, ≤ 200 album tracks) and `StartIndex`.
- **PS3 decoder**: H.264 level 4.1 / 1080p / 8-bit SDR direct play only; HEVC/AV1/VP9/4K/HDR/10-bit → server transcode to HLS `ts`. Audio: AAC/AC3/MP3 ≤ 6ch; DTS passthrough; TrueHD/DTS-HD/FLAC/Opus → transcode.
- **Network**: Ethernet 100 Mbps (cap ~40 Mbps), Wi-Fi ~15 Mbps.
- **Jellyfin 10.11 bug**: do NOT include `Type: 'Video'` CodecProfile entries (server `NullReferenceException`). `VideoAudio` only. Do NOT reintroduce `VideoRange` conditions (removed in 10.11).

## §5 Security (logging)

- NEVER log `api_key`, tokens, passwords, or full playback URLs.
- All HTTP logging goes through `HttpClient.safeLogPath()` (strips scheme, host, query).
- Playback URLs with `api_key` are marked `// Sensitive URL` in comments.
- Passwords travel in POST bodies only, never in URL params.
- Never commit secrets, `.env` files, local credentials, or private IPs/paths.

## §6 Coding conventions

- **Structured results**: every API call returns `{ ok, data?, error?, status? }`. Never throw; never assume `data` without checking `ok` first.
- **Error handling**: `if (!result.ok) { showApiError(page, result); return; }` — user-friendly messages via `page.error()`/`popup.notify()`.
- **UI**: `page.appendItem()` lists, `page.appendPassiveItem()` headers, `page.options.createAction/Bool/MultiOpt()`. Never leave a page in permanent loading (`page.loading = false` on done/error).
- **Defensive parsing**: `data?.Items ?? []`. Never assume response shape.
- **Naming**: `camelCase.js` files, `PascalCase` classes, `UPPER_SNAKE_CASE` constants, i18n keys `dot.separated`.
- **Comments**: explain WHY not WHAT; reference sections `// (AGENTS.md §4)`; mark sensitive URLs.
- `pnpm lint` must pass with **zero errors** before delivery. `pnpm format` available.

## §7 Mission workflow

1. Read the mission spec in `docs/missions/<mission>.md` (versioned; local environment details are in the unversioned `docs/debug/` + `scripts/.ps3-test.env`) — it is self-contained.
2. Create your branch (`stability` for fixes, `feat/<name>` for features, `agent/<name>` for external agents).
3. Implement following §4-§6.
4. Validate locally: `pnpm lint` zero errors, `pnpm run build` produces `dist/jellyfin.zip`.
5. Commit + push your branch. Report: files changed, what was tested, known limits.
6. The maintainer (or the assistant) deploys to the PS3 and runs the on-device test. **Never deploy to the PS3 yourself.**

## §8 Testing checklist (on-device, after any playback/device-profile/HTTP change)

> Full protocol (levels L0-L3, version matrix, deployment procedure): **[TESTING.md](TESTING.md)**.
> Minimum contract: L0 (lint/build) always; L1 (API validation) for API changes; L2 (on-device) mandatory for playback/device-profile/HTTP/upgrader changes.

- [ ] Plugin loads without errors in Movian console
- [ ] No log line contains tokens/keys/passwords/full URLs
- [ ] Pages never stay in permanent loading
- [ ] Playback starts within ~5 s of selection (free VRAM on server!)
- [ ] Direct play used for PS3-safe files, transcode otherwise
- [ ] Progress reported to the Jellyfin dashboard
- [ ] Resume position accurate
- [ ] ESLint zero errors

## §9 Known issues & workarounds

| Issue | Workaround |
|---|---|
| PS3 stalls on raw `TranscodingUrl` (leading `?&`, duplicated `AudioStreamIndex`, unencoded commas) | ✅ **FIXED (STAB-1)** — `sanitizePlaybackUrl` normalizes `?&`/`&&` + comma-encodes; `page.type='video'` re-asserted before source (the missing piece: playback never initialized) |
| Jellyfin 10.11 NRE on `Video` CodecProfile | Keep `VideoAudio` only (§4) |
| `atrack > 0` skips audio track index 0 (`view.js`) | Use `atrack >= 0` (`-1` = default) |
| Subtitle URL uses loop var `j` (`view.js`) | Use `stream.Index` |
| Server ffmpeg OOM when GPU is busy | Free VRAM before Jellyfin tests (environmental) |
| `POST /Sessions/Playing/Progress` → « Authentication without realm » / `invalid_json` on 204 | ✅ **FIXED (STAB-3)** — http.js returns `{ok:true, data:null}` for empty 2xx bodies (no more `invalid_json` spam); session stops reporting cleanly on 401/network_error via `_handleReportError`; position now wired via VideoScrobbler polling `prop.currenttime` every 1s → `session.updatePosition(ticks)` |
| `HLS [E] Unsupported estype 0x6 on pid 257` → no picture/sound | Audio codec copied into the HLS TS is unsupported by Movian (opus/flac in TS = stream_type 0x6). Cause: old profile declares `aac,opus,flac` → server copies opus. **Fixed in the new profile (`aac,ac3,mp3` only)** — verify STAB-1 keeps it that way. Proof: same title, `AudioCodec=aac` → TS h264+AAC plays; `aac,opus,flac` → TS with opus → player rejects |
| Updater targets upstream GitHub | ✅ **FIXED (STAB-2)** — upgrader + download URL point to `FloStyle/m7-jellyfin` releases; `scripts/release.sh` cuts releases (tag → GH Actions → zip); upgrader stays silent when no release exists (404 handled) |

## §10 Backlog (short)

See `docs/missions/` for full specs:
- **stability-1**: TranscodingUrl sanitization + trivial playback bugs (blocking — the fork stays undeployable until done)
- **stability-2**: upgrader → `FloStyle/m7-jellyfin` releases (drop-in update plan: `docs/plans/plan-drop-in-updates.md`)
- **NEO roadmap**: language prefs, Ethernet/Wi-Fi mode, dynamic home, rich details, QuickConnect/QR, multi-user, structural refactor (phased)

## §11 Labels used by this repo

- `agent-ready` — issues open for external agents
- `agent-submission` — PRs submitted by external agents
- `agent-review-required` — agent work waiting for human review
- `needs-human-review` — anything needing a maintainer decision
- `good first issue` / `help wanted` / `documentation` / `bug` — standard triage

External agents should only work on issues carrying `agent-ready` (or the standard triage labels above) and must tag their PRs `agent-submission`.

## §12 Security reporting

Found a vulnerability? Open an issue (private if possible) — do NOT post tokens, credentials or full playback URLs anywhere. See `SECURITY.md`.

---

*Maintained by the project lead. Agents update §8/§9/§10 and the mission files; structural sections (§1-§6) change only with maintainer approval.*
