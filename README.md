<p align="center">
  <img src="assets/logo.png" alt="logo" title="Jellyfin" height="45px" width="45px" />
</p>

# Movian Jellyfin (NEO)

A modern, hardened **Jellyfin client for Movian** — designed for **PlayStation 3**, tested against **Jellyfin 10.9 → 10.11+**.

Fork of [LouisMarotta/m7-jellyfin](https://github.com/LouisMarotta/m7-jellyfin) with a reworked playback pipeline, a strict PS3 device profile, and a hardened HTTP/session layer.

[![GPLv3 License](https://img.shields.io/badge/License-GPL%20v3-yellow.svg)](./LICENSE.md)
[![Jellyfin](https://img.shields.io/badge/Jellyfin-10.9--10.11-blue)](https://jellyfin.org)
[![Platform](https://img.shields.io/badge/Platform-PS3%20%2F%20Movian-green)](https://movian.tv)

## Features

- **Stable playback on modern Jellyfin servers** (10.11.11 validated): fixed PlaybackInfo HTTP 400/500 caused by outdated DeviceProfile fields
- **Strict PS3 device profile**: H.264 ≤ 1080p (level 4.1, 8-bit SDR), AAC/AC3/MP3 ≤ 5.1 direct play; HEVC/4K/HDR/10-bit/TrueHD/DTS-HD → server-side HLS transcode
- **Hardened HTTP layer**: centralized client, structured errors, `api_key`/token scrubbing from logs
- **Playback session reporting** to the Jellyfin dashboard (Playing / Progress / Stopped)
- Bounded caching and pagination (PS3 memory-safe)
- Subtitles (SRT/ASS external, bitmap burned-in via transcode), music playback
- i18n: English, Italian

## Installing (PlayStation 3)

1. Build the plugin zip (see below) or grab a release zip
2. Copy `jellyfin.zip` to `/dev_hdd0/game/HTSS00003/USRDIR/settings/installedplugins/` (FTP or USB)
3. Restart Movian — the plugin loads from the new zip
4. In the plugin settings, enter your Jellyfin server address and credentials

Other Movian-capable devices work the same way (drop the zip into `settings/installedplugins`).

## Building

```bash
pnpm i
pnpm run build
```

Generates `dist/jellyfin.zip`.

Dev helpers: `pnpm lint` (ESLint, zero errors required), `pnpm format` (Prettier), `libs/` holds Movian type definitions for IDE support.

## Contributing

1. Branch from `main`: `feat/<name>` for features, or work on `stability` for core bugfixes
2. Follow the rules in [`AGENTS.md`](AGENTS.md) (PS3 constraints, security, structured errors)
3. `pnpm lint` must pass with zero errors
4. Commit messages: `feat(scope): description`, `fix(scope): description`
5. Open a PR to `main` (features) — stability fixes are also forwarded upstream

PS3 testing is the real gate: not every code change survives the real hardware. Changes touching playback, device profile or HTTP are tested on-device before merge.

## Branches

| Branch | Purpose |
|---|---|
| `main` | **NEO** — modern development baseline (new features, UI, QuickConnect, multi-user) |
| `stability` | Core bugfixes & performance — merged back into `main`, and upstream via pull request |

## Compatibility

| Capability | PS3 / Movian |
|---|---|
| H.264/AVC | Level 4.1, High Profile, 1080p, 8-bit SDR |
| MPEG-2, VC-1 | Decodable (handled conservatively — direct play kept strict) |
| HEVC / AV1 / VP9 / 4K / HDR / 10-bit | **Not supported** — server transcodes to 1080p H.264 HLS |
| Audio | AAC, AC3, MP3 (≤ 5.1); DTS passthrough; others transcoded |
| Server | Jellyfin 10.9.0 minimum, 10.11.x primary target |

## Known limitations

- Jellyfin 10.11.x throws a server-side `NullReferenceException` when a `Video` CodecProfile entry is present — the profile intentionally ships `VideoAudio` only
- PS3 heap is < 64 MB: list queries are bounded, caches are capped
- Jellyfin transcoding needs free GPU VRAM on the server (an LLM loaded on the same GPU starves ffmpeg → segment 500)

## Acknowledgements

- [Movian Documentation](https://buksa.github.io/movian-docs/) ([Buksa](https://github.com/Buksa))
- [Jellyfin Documentation](https://api.jellyfin.org/)

## License

[GNU General Public License v3.0 ©](./LICENSE.md)
