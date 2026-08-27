<p align="center">
  <img src="assets/logo.png" alt="logo" title="Jellyfin" height="45px" width="45px" />
</p>

# Movian Jellyfin (NEO)

A modern, hardened **Jellyfin client for Movian** — built for **PlayStation 3**, tested against **Jellyfin 10.11+**.

Fork of [LouisMarotta/m7-jellyfin](https://github.com/LouisMarotta/m7-jellyfin) with a reworked playback pipeline, a strict PS3 device profile, and a hardened HTTP/session layer.

[![GitHub Release](https://img.shields.io/github/v/release/FloStyle/m7-jellyfin?display_name=tag&sort=semver)](https://github.com/FloStyle/m7-jellyfin/releases)
[![GitHub Downloads](https://img.shields.io/github/downloads/FloStyle/m7-jellyfin/total)](https://github.com/FloStyle/m7-jellyfin/releases)
[![CI Status](https://img.shields.io/github/actions/workflow/status/FloStyle/m7-jellyfin/release.yml?branch=main)](https://github.com/FloStyle/m7-jellyfin/actions)
[![License: GPL v3](https://img.shields.io/badge/License-GPL%20v3-yellow.svg)](./LICENSE.md)
[![Jellyfin](https://img.shields.io/badge/Jellyfin-10.9--10.11-blue)](https://jellyfin.org)
[![Platform](https://img.shields.io/badge/Platform-PS3%20%2F%20Movian-green)](https://movian.tv)

## 📦 Install (PlayStation 3)

1. Download the latest `jellyfin.zip` from [Releases](https://github.com/FloStyle/m7-jellyfin/releases) <!-- RENAME-TRACKER: Update to m7-jellyfin-neo -->
2. Copy to `/dev_hdd0/game/HTSS00003/USRDIR/settings/installedplugins/` (FTP or USB)
3. Restart Movian, then enter your Jellyfin server address + credentials in the plugin settings

> **Drop-in safe:** The plugin ID is unchanged (`jellyfin`). Your settings survive updates.

## 🔧 Build

```bash
pnpm i
pnpm run build   # → dist/jellyfin.zip
```

Dev: `pnpm lint` (zero errors), `pnpm format`, `libs/` = Movian type definitions for IDE.

## 🌿 Branches

| Branch | Purpose |
|---|---|
| `main` | NEO baseline (default) — modern features |
| `stability` | Core fixes & performance → merged into `main` + upstream PR |

## 🤝 Contributing & agents

- Humans: see [CONTRIBUTING.md](CONTRIBUTING.md)
- External AI agents: read [AGENTS.md](AGENTS.md) — scope, permissions, mission workflow
- Project state/tasks/decisions: [STATE.md](STATE.md) · [TASKS.md](TASKS.md) · [DECISIONS.md](DECISIONS.md)
- Testing protocol & validated versions: [TESTING.md](TESTING.md)

## 🔌 Compatibility

H.264 ≤ 1080p (level 4.1, 8-bit SDR) direct play; AAC/AC3/MP3 ≤ 5.1. HEVC/AV1/VP9/4K/HDR/10-bit → server HLS transcode. See [AGENTS.md](AGENTS.md) §4 for the full constraint list.

## 📄 License

[GNU General Public License v3.0 ©](./LICENSE.md)
