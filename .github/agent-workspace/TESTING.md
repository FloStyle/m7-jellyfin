# TESTING.md — Testing Protocol

How this project validates changes, at which level, and on which versions.

## Why no unit-test framework (yet)

The plugin runs on Movian's ECMAScript engine (PS3): CommonJS, synchronous blocking `http.request()` returning a string with a `statuscode` property, globals `Core`/`Plugin`, modules `movian/*`. A Jest/Vitest harness would require mocking the whole runtime, and the failures we actually hit (PlaybackInfo 400/500, PS3 player rejecting a malformed HLS URL, GPU VRAM OOM) were **integration/hardware issues no unit test would have caught**. The real gate is the device.

We use instead: static checks (L0), live API validation against a real server (L1), and on-device testing (L2/L3).

## Test levels

| Level | What | When | Who |
|---|---|---|---|
| **L0 — Static** | `pnpm lint` (zero errors), `pnpm format:check`, `pnpm run build` produces `dist/jellyfin.zip` | Every delivery, always | Agent |
| **L1 — API validation** | Exercise the Jellyfin endpoints the change touches against a real server (PlaybackInfo, HLS chain master→main→segment, auth, items) | Any change touching API/playback/device profile | Agent or assistant (scripts in local `docs/debug/scripts/`) |
| **L2 — On-device (PS3)** | Full manual checklist on real hardware (see below) | **Mandatory** for any change touching playback, device profile, HTTP, upgrader | Maintainer, with assistant doing deploy/logs |
| **L3 — User acceptance** | Real-world usage: 5.1 audio, subtitles, resume, episode chaining, update flow | Before any release | Maintainer |

## When to apply which level

| Change type | L0 | L1 | L2 | L3 |
|---|---|---|---|---|
| Documentation / i18n strings | ✅ | — | — | — |
| UI rendering only (pages, lists) | ✅ | ✅ (light) | ✅ (smoke) | — |
| API layer, pagination, cache | ✅ | ✅ | ✅ | — |
| Playback, device profile, HTTP, session | ✅ | ✅ | ✅ **mandatory** | ✅ before release |
| Upgrader / update flow | ✅ | ✅ | ✅ | ✅ before release |
| **Release (tag v\*.\*.\*)** | ✅ | ✅ | ✅ | ✅ **blocking** |

A release must never happen without a green L2 on the exact zip being released.

## Version matrix (what we validate against)

| Component | Validated | Target | Notes |
|---|---|---|---|
| Jellyfin server | **10.11.11** ✅ (PlaybackInfo 200, HLS chain 200, TS segments) | 10.9.x → 10.11.x | 10.9/10.10 declared but not yet re-tested after the DeviceProfile fixes |
| Jellyfin ≥ 10.12 | not tested | — | re-validate before claiming support |
| Movian / M7 | PS3 build (headers: client `Movian`, device `PS3`) | — | manifest `showtimeVersion` 5.0.462 |
| PS3 | CFW + webMAN (FTP deployment) | — | Fast Ethernet / Wi-Fi b/g |
| GPU / transcode | RTX 4070 Ti (12 GB) | — | ffmpeg OOM (exit 218) when VRAM is occupied by another service — free VRAM before L1/L2 |

## L2 — On-device checklist (playback/device-profile/HTTP changes)

Environment: **server VRAM free** (unload any LLM/GPU service first), latest zip deployed to `settings/installedplugins/jellyfin.zip`, Movian restarted.

- [ ] Plugin loads without errors in Movian console
- [ ] No log line contains tokens/keys/passwords/full playback URLs
- [ ] Libraries browse, pages never stay in permanent loading
- [ ] Playback starts within ~5 s of selection (HLS transcode, free VRAM)
- [ ] Direct play used for PS3-safe files; transcode otherwise (server log check)
- [ ] Audio track selection (incl. track 0) works; subtitles load with correct track index
- [ ] Progress reported to the Jellyfin dashboard (Sessions/Playing)
- [ ] Resume position accurate after stopping
- [ ] 30+ min stability: memory stable, no HTTP 500s
- [ ] Update flow (if upgrader touched): detects release, downloads, replaces zip, reloads

Deploy procedure: `pnpm run build` → FTP upload to the PS3 → verify hash → restart Movian. Rollback: re-upload the backup zip (local `backup/`).

## Delivery contract for agents

Every mission delivery must state, in the report: L0 result (lint/build), L1 result (which endpoints validated, with statuses), any L2/L3 steps done, and the exact commit(s). If a level was skipped, say why. Never claim "tested" without naming the level and the environment.

## Automated harness (scripts/test-ps3.sh)

The repo ships a small automation harness for the L0-L2 loop (see `scripts/test-ps3.sh` — usage in its header):

- `status` — environment probe (PS3 FTP, Jellyfin API, backup zip)
- `build` — L0 (lint + build)
- `deploy` — L2a: FTP upload + hash verification
- `logs` — L2b: pull Movian logs, scan the **current** log only (rotation keeps history in movian-1..5 — scanning them produces false positives)
- `watch [secs]` — L2c: watch Jellyfin `/Sessions` for a Movian session with an **advancing PositionTicks** (playback confirmed) and reports the PlayMethod

**Private environment**: hosts/keys are read from `scripts/.ps3-test.env` (git-ignored, not shipped). The public script has placeholder defaults only.

**Validation status**: harness exercised end-to-end on real hardware 2026-08-26 (deploy + hash + logs + watch). `watch` confirmed live playback by detecting the server-side ffmpeg HLS transcode (old zip does not report session positions; the session-position sensor becomes active with the new code once STAB-3 is fixed).

**Security note**: the Movian player itself logs full playback URLs including the `api_key` (`Settings initialized for URL ...?api_key=...`) — PS3 logs are therefore sensitive and must never be shared raw; the harness only greps patterns, it does not publish logs.

**Known limitation**: remotely launching Movian via webMAN `load.ps3` returns OK but does not reliably start the app on this setup — Movian is launched manually from the XMB, then the plugin is opened and a title started; the harness validates everything else automatically.
