---
name: "Decisions"
type: adr_log
version: "1.0.0"
updated: "2026-08-27"
---

# DECISIONS.md — Architecture Decision Records

> Format follows Michael Nygard's ADR standard. Append-only. Agents may add entries only with maintainer approval.

---

## ADR-0001 — Project suspended (STATE CLEAN)

**Status**: accepted  
**Date**: 2026-08-26

### Context

After the Jellyfin 10.11 compatibility fixes (HTTP 400/500), the refactored zip stalls on real PS3 hardware. The Movian player refuses the raw `TranscodingUrl` (leading `?&`, duplicated `AudioStreamIndex`, unencoded commas). Repeated agent dispatches consumed time without a validated result on actual hardware.

### Decision

Freeze all code work. Keep the old (working) zip deployed on the PS3. Document all findings. Dispatch new missions only on explicit maintainer request with validated test criteria.

### Consequences

- **Positive**: Zero risk of regressions on the deployed plugin; all future work is mission-based and test-gated on real hardware.
- **Negative**: NEO feature development is paused until the maintainer provides a test window.

---

## ADR-0002 — Git branch structure: `main` + `stability` + `feat/*`

**Status**: accepted  
**Date**: 2026-08-26

### Context

Two parallel goals require a non-conflicting branch layout:
1. Forward core fixes to upstream `LouisMarotta/m7-jellyfin` via PR
2. Develop NEO modernization features independently

### Decision

- `main` — NEO baseline (default branch), receives feature merges
- `stability` — core bugfixes/performance, merged back into `main` AND forwarded upstream via PR
- `feat/<name>` — one branch per feature, branched from `main`
- `master` — deleted (redundant)

### Consequences

- Clean separation of concerns
- Upstream PRs always originate from `stability`
- NEO features never pollute the upstream PR
- External agents use `agent/<name>` prefix

---

## ADR-0003 — Drop-in replacement proven (plugin id `jellyfin`)

**Status**: accepted  
**Date**: 2026-08-26

### Context

The PS3 plugin system stores settings in `settings/plugins/jellyfin/`. Replacing the zip must not lose user configuration. The plugin identity is defined in `plugin.json`: `id`, `title`, `apiversion`, `file`.

### Decision

Verify that `plugin.json` identity is identical between old and new builds. Confirmed: `id: jellyfin`, title, apiversion, and file path are unchanged. The update channel points to `FloStyle/m7-jellyfin` releases via the built-in upgrader.

### Consequences

- No reconfiguration required on updates
- First NEO release (`v1.5.0`) only after PS3 validation
- Users can safely swap zips via FTP/USB

---

## ADR-0004 — Agent-friendly public structure

**Status**: accepted  
**Date**: 2026-08-26

### Context

External AI agents should be able to read, audit, and contribute safely without access to private data or the ability to modify sensitive repository elements.

### Decision

- `AGENTS.md` with YAML frontmatter + explicit external-agent policy (`mission_only` code contributions, human review required, no auto-merge)
- `llms.txt` for LLM discovery
- `CONTRIBUTING.md` for human contributors
- `SECURITY.md` for vulnerability reporting
- Dedicated GitHub labels: `agent-ready`, `agent-submission`, `agent-review-required`, `needs-human-review`
- Relocated agent workspace to `.github/agent-workspace/` to keep root directory clean

### Consequences

- Bots can discover and contribute safely via labeled issues
- Code contributions remain mission-gated
- Repository stays clean of private data in the root
- AI tools (Copilot, Cursor) can read `.github/copilot-instructions.md` and `.cursorrules`

---

## ADR-0005 — "Agent OS" guide: adapted, not adopted wholesale

**Status**: accepted  
**Date**: 2026-08-26

### Context

External advice (Qwen audit) proposed a full multi-agent orchestration system with `ORCHESTRATOR/`, `PROTOCOL/`, `SESSIONS/`, `MEMORY/`, `KNOWLEDGE/`, `.agents/*`.

### Decision

Adopt only the practical documents: `STATE.md`, `TASKS.md`, `DECISIONS.md`. Reject the rest:
- Our model is sequential missions (1 agent = 1 branch)
- Memory stays local/private (`docs/`, vault)
- No parallel orchestration needed for a single-maintainer project

### Consequences

- Low ceremony, truthful repo state
- No dead state files from abandoned parallel tracks
- Phase remains "suspended" until maintainer dispatches a mission

---

## ADR-0006 — CommonJS only, no modern ECMAScript

**Status**: accepted  
**Date**: 2026-08-26

### Context

Movian 7 on PS3 runs an older JavaScript engine that does not support `import`/`export`, `async`/`await`, or `Promise`. The `http.request()` API is synchronous and blocks the UI thread.

### Decision

- Use `require()` / `module.exports` exclusively
- No `import`/`export` statements
- No `async`/`await` — use callbacks and synchronous patterns
- No `fetch` — use `movian/http` module

### Consequences

- Code is compatible with Movian 7's JS engine
- HTTP calls block UI but are acceptable for plugin architecture
- Build tool (SWC) transpiles nothing — source IS the target

---

## ADR-0007 — PS3 device profile: strict direct play + transcode fallback

**Status**: accepted  
**Date**: 2026-08-26

### Context

PS3 hardware decoder has fixed capabilities. Sending unsupported codecs causes playback stalls or "no picture/sound" errors.

### Decision

- **Video**: H.264 level 4.1 / 1080p / 8-bit SDR → direct play
- **Video transcode**: HEVC/AV1/VP9/4K/HDR/10-bit → server HLS `ts`
- **Audio**: AAC/AC3/MP3 ≤ 6ch → direct play; DTS → passthrough; TrueHD/DTS-HD/FLAC/Opus → transcode
- **Device profile**: Only advertise `aac,ac3,mp3` for HLS to prevent server from copying unsupported codecs into TS container

### Consequences

- `HLS [E] Unsupported estype 0x6` errors eliminated
- Server must have free GPU VRAM for transcoding
- Network cap: Ethernet ~40 Mbps, Wi-Fi ~15 Mbps

---

## ADR-0008 — Release pipeline: Corepack + Node 22 + git archive

**Status**: accepted  
**Date**: 2026-08-27

### Context

Legacy pipeline used `npm install -g pnpm` which caused version mismatches and Exit Code 1 failures. Source tarballs were created with `cp -r` + `tar` which risked bundling unwanted files.

### Decision

- Use `corepack enable` to read `packageManager` field from `package.json`
- Node 22 LTS (Node 20 reached EOL April 2026)
- `git archive` for pristine source tarballs (no `node_modules`, `.git`, etc.)
- SHA256 checksums for release verification

### Consequences

- Deterministic builds across environments
- No more "Invalid package.json" or version mismatch errors
- Clean source releases without build artifacts

---

## ADR-0009 — Agent documentation relocation

**Status**: accepted  
**Date**: 2026-08-27

### Context

Root directory contained agent-specific files (`AGENTS.md`, `STATE.md`, `TASKS.md`, `TESTING.md`, `DECISIONS.md`, `agent.md`) that cluttered the public-facing repository layout.

### Decision

- Relocate agent meta-docs to `.github/agent-workspace/`
- Relocate ADRs to `docs/adr/`
- Delete redundant `agent.md`
- Create tool-specific context files: `.github/copilot-instructions.md`, `.cursorrules`
- Update `llms.txt` with new paths
- Add "AI Agent Integration" section to `README.md`

### Consequences

- Pristine root directory with standard files only
- AI tools can still discover documentation via standard paths
- Human contributors see a clean README without agent scaffolding
