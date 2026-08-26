# AGENTS.md

## 0. PROJECT STATUS (maintainer notes) — read BEFORE any work

> **Status: SUSPENDED / STATE CLEAN — 2026-08-26.** No code work requested until the maintainer gives the go-ahead.

### 🎯 The 2 goals (maintainer decision 26/08)

1. **Goal 1 — Stability + upstream PR** : make this fork (`FloStyle/m7-jellyfin`) a stable, performant base for **PS3/Movian + modern Jellyfin servers** (10.9 → 10.11+) → once tested and validated, **pull request to `LouisMarotta/m7-jellyfin`**.
2. **Goal 2 — NEO (personal)** : evolve this fork into a modern client — cleaner, leaner, faster, modern UI, modern features (multi-user accounts, **QR/QuickConnect identification**, etc.) — targeting parity with the **Jellyfin Android app**.

**Git organisation & workflow** (maintainer decisions 26/08) :
- Branch **`stability`** = core bugs + perf → **merged back into `main`**
- Branch **`main`** (GitHub default) = **NEO** baseline (modern features: accounts, QR/QuickConnect, UX...)
- **New feature** = dedicated branch `feat/<name>` → merged back into `main` (never direct)
- Stability fixes → also PR to upstream `LouisMarotta/m7-jellyfin`

- **PS3 currently runs the OLD zip (working)** — playback validated 26/08 (HLS transcode OK). **Do not replace without explicit approval.**
- The refactored code in this repo is **NOT deployable as-is**: playback stalls (« stuck on loading ») — the PS3 player refuses the raw `TranscodingUrl` (leading `?&`, duplicated `AudioStreamIndex`, unencoded commas, `imdbid`). Zero server-side fetch, zero player logs.
- **Full diagnostics**: local note (not versioned) + repro scripts under `docs/debug/`.
- **Transcode OOM**: when a heavy GPU service (e.g. an LLM) is loaded on the server (~11 GB VRAM), Jellyfin ffmpeg dies (exit 218, segment 500). Not a plugin bug — free the VRAM before Jellyfin tests.

### DONE (do not reopen)
- Fix 400 `VideoRange` + fix 500 NRE `StreamBuilder.ApplyTranscodingConditions` (DeviceProfile) — PlaybackInfo stable 4/4.
- Root-caused the VRAM OOM (initial « unable to open resource »).
- PS3 rolled back to the working old zip.

### BACKLOG — if the maintainer relaunches
> External audit (Qwen 3.8max, 26/08) analysed — full document + verdict kept in the local notes.

**Wave 1 — critical fixes (prerequisite: the fork becomes deployable again)**
1. **Stuck fix (mission v2)** — `src/api.js` (`selectMediaSource`) + `src/view.js`: sanitize `TranscodingUrl` (`?&` → `?`, dedupe `AudioStreamIndex`, encode commas, drop `imdbid`). Mission spec: `docs/missions/stability-1-transcoding-url.md` (local). After fix: `npm run build`, assistant deploys, maintainer re-tests (free VRAM).
2. **Trivial bugs (verified in code)**:
   - `view.js:594`: `atrack > 0` → `atrack >= 0` (audio track index 0 never sent; `-1` = default)
   - `view.js:610`: subtitles — use `stream.Index` instead of loop variable `j`
   - Audio codec normalization (`ac-3`/`eac3` → `ac3`) for `isDirectPlaySafe` — verify before fixing

**Wave 2 — quick wins**
3. **Audio/subtitle language preferences**: `GET /Users/{userId}` → pre-select `DefaultAudioLanguage`/`DefaultSubtitleLanguage` at playback start
4. **Ethernet/Wi-Fi mode**: plugin setting — Ethernet 40 Mbps, Wi-Fi 15 Mbps (`MaxStaticBitrate` already configurable in `deviceProfile.js`)

**Wave 3 — UX**
5. **Dynamic home**: rows Resume (`/Users/{userId}/Items/Resume`) + NextUp (`/Shows/NextUp`) + Recently Added, max 10 items
6. **Rich detail pages**: backdrop via `page.metadata.background` (max 1280px), overview, cast, chapters

**Far backlog — validate technically before any dev**
- Skip Intro (`/MediaSegments`): ONLY if programmatic player seek is proven on Movian
- QuickConnect: useful, medium effort
- ❌ Dropped: Trickplay (no Movian PS3 scrubbing overlay), Live TV (64 MB heap/blocking UI), WS remote control (no `movian/ws`)

**Careful optimisations**
- SegmentLength 6→10: ⚠️ test PS3 RAM first (longer segments = more RAM)
- Widen Direct Play (mpeg2/vc1/dts): ⚠️ codec by codec, real PS3 test each time — never in bulk
- Image cache: raise TTLs (already implemented in `cache.js`)

**Non-code**
- Disable « Automatically check for updates » in the plugin settings on PS3 (upgrader targets the upstream GitHub release — could overwrite the working zip)
- Remaining user tests (old zip): 5.1 audio, subtitles, resume, episode chaining

### Rules
- No code changes without explicit maintainer approval. Project SUSPENDED.
- The assistant only edits markdown/resources; code is changed only by an agent re-dispatched by the maintainer.
- Plugin paths on PS3: `settings/installedplugins/jellyfin.zip` (zip), `settings/plugins/jellyfin/` (data).

---

## 1. Purpose

This document defines the engineering rules, priorities, architecture constraints, and implementation plan for refactoring `m7-jellyfin`.

The project is a Jellyfin client plugin for Movian 7, primarily targeting PlayStation 3, and secondarily other Movian-supported low-power devices such as Raspberry Pi.

The current implementation is outdated and has serious problems with modern Jellyfin servers, especially when:

- The server has a large library.
- The server contains many movies, shows, episodes, or music items.
- The server contains modern large files, especially 4K HEVC/H.265, HDR, 10-bit video, TrueHD, DTS-HD, or high-bitrate media.
- The server is behind a reverse proxy with stricter request/response limitations.
- The client makes unbounded API requests that cause huge JSON responses and hangs.

The immediate refactoring focus is:

1. Technical robustness.
2. Security.
3. Compatibility with modern Jellyfin servers.
4. Reliable playback of large modern files, especially 4K content, through correct transcoding behavior.

UI parity with modern Jellyfin clients is intentionally deferred until these foundations are stable.

---

## 2. Primary Goals

Agents working on this repository must prioritize the following goals in this order:

### 2.1 Stability

The plugin must not hang when browsing large libraries.

The plugin must never fetch an unbounded list of items from Jellyfin.

All list views must use pagination, limits, and minimal fields.

### 2.2 Modern Jellyfin Compatibility

The plugin must work with modern Jellyfin installations, including:

- Jellyfin 10.8+.
- HTTPS servers.
- Reverse proxied servers.
- Multi-user servers.
- Large libraries.
- 4K media libraries.
- Modern codecs such as HEVC, AV1, VP9, TrueHD, DTS-HD, FLAC, Opus, etc.

The plugin must not assume that the client can directly play modern codecs.

### 2.3 Large File and 4K Support

The PS3 cannot reliably decode:

- 4K video.
- HEVC/H.265.
- AV1.
- VP9.
- 10-bit video.
- HDR video.
- TrueHD audio.
- DTS-HD MA audio.
- High-bitrate unrestricted streams.
- Bitmap subtitles such as PGS without conversion.

Therefore, the plugin must always request playback information using a strict `DeviceProfile` that forces Jellyfin to transcode unsupported media into a PS3-compatible format.

The target safe playback format is:

- Video: H.264, High Profile, Level 4.1 or lower.
- Resolution: 1920x1080 or lower.
- Color range: SDR.
- Bit depth: 8-bit.
- Container: MPEG-TS/HLS or MP4 progressive fallback.
- Audio: AAC, AC3, or MP3.
- Audio channels: 2.0 or 5.1 maximum.
- Subtitles: external SRT/ASS/SSA where possible; image subtitles must be burned in, converted, or disabled.

### 2.4 Security

The plugin must handle authentication tokens responsibly.

The plugin must not leak credentials or tokens into logs.

The plugin must handle expired tokens gracefully.

The plugin should prefer HTTPS where configured.

---

## 3. Non-Goals for the Current Refactor

The following are explicitly out of scope until the robustness, security, and playback foundations are complete:

- Full visual parity with Jellyfin Web.
- Full visual parity with Jellyfin Android.
- Advanced theming.
- Custom fonts.
- Complex animated UI.
- Cast/crew carousels, unless they do not harm performance.
- Music visualization.
- Advanced subtitle styling.
- Emby support.
- Third-party scrobbling integrations.
- Experimental playback engines.

UI modernization may happen later, but only after the plugin is stable with large libraries and modern media files.

---

## 4. Hard Platform Constraints

Agents must respect the following constraints at all times.

### 4.1 Movian Constraints

Movian is not a web browser.

There is no DOM.

There is no CSS.

There is no React, Vue, or HTML rendering.

The plugin uses Movian JavaScript APIs such as:

- `movian/http`
- `movian/page`
- `movian/service`
- `movian/popup`

The JavaScript environment is limited.

Avoid assuming modern browser APIs exist unless polyfilled by the project.

Use CommonJS-style modules:

```js
var http = require('movian/http');
module.exports = Api;
```

### 4.2 PlayStation 3 Constraints

The PlayStation 3 has very limited:

- CPU power.
- RAM.
- GPU texture memory.
- Network buffering capacity.
- Video decoding capability.

Agents must avoid:

- Huge JSON responses.
- Large images.
- Unbounded lists.
- Synchronous heavy parsing.
- Direct playback of unsupported codecs.
- Memory-heavy caching.
- High-resolution posters or backdrops.

### 4.3 Blocking HTTP

Movian’s `http.request` can block the UI thread.

Therefore, the only reliable way to avoid hangs is to reduce request and response sizes.

Agents must not assume that adding a timeout alone solves the problem.

The correct solution is:

- Small API responses.
- Pagination.
- Minimal fields.
- Avoid recursive full-library queries.
- Chunked UI rendering where possible.

---

## 5. Critical Existing Problems

Agents must understand these known problems before modifying the codebase.

### 5.1 Unbounded Library Fetching

The old `getLibraries()` implementation is dangerous because it fetches `/Items` recursively with movie items.

This can return every movie in the library at once.

On a modern server with thousands of movies, this produces a huge JSON response and causes the plugin to hang.

This behavior must be removed.

### 5.2 Missing DeviceProfile

The old playback logic does not send a proper `DeviceProfile` to Jellyfin.

Without a `DeviceProfile`, Jellyfin may assume the client supports modern formats.

This can cause Jellyfin to return a direct play URL for a 4K HEVC file, which the PS3 cannot play.

The plugin must send a strict PS3-compatible `DeviceProfile` using `POST /Items/{itemId}/PlaybackInfo`.

### 5.3 Weak Error Handling

API calls currently lack consistent handling for:

- Network failures.
- Timeouts.
- HTTP 401 unauthorized.
- HTTP 404 not found.
- HTTP 500 server errors.
- Invalid JSON responses.
- Missing media sources.

Agents must centralize error handling.

### 5.4 Excessive Fields in Item Requests

Requests should not fetch heavy fields for grid views.

Fields such as:

- `Overview`
- `MediaSources`
- `People`
- `Chapters`
- `Studios`
- `Taglines`
- `Path`

should only be fetched when required, usually on the item detail page.

### 5.5 Deprecated Image Parameters

Image URLs should use modern Jellyfin image sizing parameters.

Prefer:

- `MaxWidth`
- `MaxHeight`
- `Quality`
- `Format`

Avoid relying on deprecated or ambiguous parameters such as:

- `fillWidth`
- `fillHeight`

where they may not strictly constrain the returned image size.

---

## 6. Required Architecture

Agents should move the code toward the following architecture.

### 6.1 Central HTTP Client

All Jellyfin HTTP requests must go through a centralized helper.

This helper must:

- Add default headers.
- Add authentication token.
- Handle JSON parsing safely.
- Detect HTTP 401.
- Detect non-200 responses.
- Return structured errors.
- Avoid throwing unhandled exceptions.
- Avoid logging tokens or passwords.

Suggested location:

```txt
src/http.js
```

If adding new files is undesirable, this helper can live inside `src/api.js`, but it must still be centralized.

Example structure:

```js
class HttpClient {
  constructor(api) {
    this.api = api;
  }

  request(url, options = {}) {
    try {
      var response = http.request(url, options);

      if (!response) {
        return { error: 'no_response' };
      }

      if (response.statuscode === 401) {
        return { error: 'unauthorized' };
      }

      if (response.statuscode === 404) {
        return { error: 'not_found' };
      }

      if (response.statuscode < 200 || response.statuscode >= 300) {
        return {
          error: 'http_error',
          status: response.statuscode
        };
      }

      try {
        return JSON.parse(response);
      } catch (e) {
        return { error: 'invalid_json' };
      }
    } catch (e) {
      return {
        error: 'network_error',
        message: String(e)
      };
    }
  }
}
```

### 6.2 API Layer

`src/api.js` should remain the Jellyfin API abstraction.

It should expose high-level methods such as:

- `authenticate()`
- `getViews()`
- `getLibraryItems()`
- `getLatestItems()`
- `getNextUpItems()`
- `getResumeItems()`
- `getItem()`
- `getSeasons()`
- `getEpisodes()`
- `getPlaybackInfo()`
- `reportPlaybackStart()`
- `reportPlaybackProgress()`
- `reportPlaybackStopped()`
- `markPlayed()`
- `unmarkPlayed()`
- `favorite()`
- `unfavorite()`

It must not contain UI rendering logic.

### 6.3 Device Profile Module

The PS3 device profile should be isolated from API transport logic.

Suggested location:

```txt
src/deviceProfile.js
```

If a separate file is not used, the profile must still be represented as a dedicated method or constant.

The profile must be strict enough to force transcoding of incompatible media.

### 6.4 Playback Session Module

Playback tracking should be isolated.

Suggested location:

```txt
src/session.js
```

This module should handle:

- Playback start.
- Playback progress.
- Playback stop.
- Resume position.
- Play session ID.
- Media source ID.
- Audio stream index.
- Subtitle stream index.

### 6.5 View Layer

`src/view.js` should remain responsible for Movian page rendering.

It must:

- Use pagination.
- Show loading states.
- Show errors.
- Avoid rendering huge lists at once.
- Avoid storing unbounded data in memory.
- Use cached metadata carefully.
- Render item grids with lightweight metadata only.

---

## 7. Jellyfin API Rules

Agents must follow these rules when calling Jellyfin.

### 7.1 No Unbounded Queries

Never request all items from the server.

Forbidden patterns include:

```txt
GET /Items?Recursive=true
GET /Items?IncludeItemTypes=Movie&Recursive=true
GET /Users/{userId}/Items?Recursive=true
```

unless all of the following are also true:

- `ParentId` is specified.
- `IncludeItemTypes` is specified.
- `Limit` is specified.
- `StartIndex` is specified.
- `Fields` is minimized.
- The response is paginated.

Default list limit:

```txt
Limit = 20
```

Maximum recommended list limit:

```txt
Limit = 50
```

Do not use limits greater than 50 for grid views.

### 7.2 Use Views for Libraries

The home screen or library root must use:

```txt
GET /Users/{userId}/Views
```

This returns library folders such as:

- Movies
- TV Shows
- Music
- Home Videos
- Playlists
- Collections

Do not use `/Items` to discover libraries.

### 7.3 Use ParentId for Library Browsing

When browsing a library, use:

```txt
GET /Users/{userId}/Items?ParentId={viewId}&Limit=20&StartIndex=0
```

Add appropriate filters:

For movies:

```txt
IncludeItemTypes=Movie
```

For TV shows:

```txt
IncludeItemTypes=Series
```

For episodes:

```txt
IncludeItemTypes=Episode
```

For music albums:

```txt
IncludeItemTypes=MusicAlbum
```

For music artists:

```txt
IncludeItemTypes=MusicArtist
```

For playlists:

```txt
IncludeItemTypes=Playlist
```

### 7.4 Use Latest and Next Up for Home Rows

For modern home behavior, use:

Latest media:

```txt
GET /Users/{userId}/Items/Latest?Limit=12
```

Optionally:

```txt
GET /Users/{userId}/Items/Latest?ParentId={libraryId}&Limit=12
```

Next up:

```txt
GET /Shows/NextUp?UserId={userId}&Limit=12
```

Resume items:

```txt
GET /Users/{userId}/Items?Filters=IsResumable&Limit=12&Recursive=true
```

All of these must remain limited.

### 7.5 Minimal Fields for Lists

For list views, request only lightweight fields.

Recommended fields:

```txt
PrimaryImageAspectRatio
BasicSyncInfo
ProductionYear
```

Optional if needed:

```txt
Genres
```

Avoid in list views:

```txt
Overview
MediaSources
Chapters
People
Studios
Taglines
Path
```

### 7.6 Item Detail Requests

For item detail pages, use:

```txt
GET /Users/{userId}/Items/{itemId}
```

or:

```txt
GET /Items/{itemId}?UserId={userId}
```

For detail pages, it is acceptable to request richer fields:

```txt
Fields=Overview,People,Studios,Genres,MediaSources,Chapters
```

But this must only happen when the user opens the detail view.

### 7.7 Avoid Large Query Strings

Do not construct extremely long URLs.

Avoid embedding large JSON blobs in query strings.

Avoid patterns such as:

```txt
/Items?request={...huge json...}
```

Use normal query parameters.

Keep query strings small and readable.

### 7.8 Use Encoding

All user-supplied or ID-supplied query values must be URL-encoded.

Example:

```js
var url = this.host + '/Users/' + encodeURIComponent(this.user.Id) + '/Items';
```

Do not concatenate unsafe values directly.

---

## 8. Authentication Rules

### 8.1 Username and Password Authentication

The existing endpoint may remain:

```txt
POST /Users/AuthenticateByName
```

The request must include:

```txt
X-Emby-Authorization: MediaBrowser Client="...", Device="...", DeviceId="...", Version="..."
Content-Type: application/json
```

Body:

```json
{
  "Username": "...",
  "Pw": "..."
}
```

After successful authentication:

- Store the access token.
- Store the user object or user ID.
- Do not log the password.
- Do not log the full authentication response if it contains tokens.

### 8.2 Token Header

Authenticated requests should include:

```txt
X-Emby-Token: {access_token}
```

and/or:

```txt
Authorization: MediaBrowser Client="Movian", Device="...", DeviceId="...", Version="...", Token="{access_token}"
```

Agents must ensure the token is not included in log output.

### 8.3 HTTP 401 Handling

If any request returns HTTP 401:

- Clear the stored access token if appropriate.
- Mark the session as unauthenticated.
- Redirect the user to login or display a re-login message.
- Do not infinite loop.
- Do not crash.
- Do not hang.

### 8.4 Password Storage

If Movian settings require storing credentials:

- Treat the password field as sensitive.
- Never log it.
- Never include it in error messages.
- Prefer token-based session continuation where possible.

If the platform allows avoiding persistent password storage, prefer that approach.

### 8.5 Quick Connect

Quick Connect is recommended but optional.

If implemented:

- Use Jellyfin Quick Connect endpoints.
- Display the code clearly.
- Poll at a reasonable interval, such as every 5 seconds.
- Stop polling after a reasonable timeout, such as 5 minutes.
- Do not store the Quick Connect secret after authentication.
- Do not log the secret or token.

---

## 9. Security Requirements

Agents must follow these security rules.

### 9.1 Logging

Never log:

- Passwords.
- Access tokens.
- Quick Connect secrets.
- Full authorization headers.
- Full playback URLs containing `api_key`.

Acceptable logs:

- Request method.
- Request path.
- HTTP status code.
- Error type.
- General diagnostics.

Example:

```txt
GET /Users/{userId}/Views -> 200
POST /Items/{itemId}/PlaybackInfo -> 401
```

Do not log:

```txt
X-Emby-Token: abc123...
api_key=abc123...
```

### 9.2 URLs

Prefer HTTPS when `service.is_secure` is enabled.

If the host already includes `http://` or `https://`, do not duplicate the scheme.

Normalize host URLs carefully.

Example:

```js
if (!/^https?:\/\//i.test(url)) {
  url = (service.is_secure ? 'https://' : 'http://') + url;
}
```

Remove trailing slashes where appropriate.

### 9.3 Query Secrets

Avoid placing tokens in query strings unless Jellyfin requires it for playback.

If a playback URL requires `api_key`, treat that URL as sensitive.

Do not write it to logs.

### 9.4 Certificate Handling

Do not disable TLS certificate validation.

If self-signed certificates are unsupported by Movian, surface a clear user-facing limitation rather than making the client insecure.

### 9.5 Input Validation

Validate or sanitize values used in URLs where practical.

Jellyfin IDs are commonly hexadecimal strings, but agents should not assume too strictly.

At minimum:

- Encode all parameters.
- Reject empty IDs.
- Avoid passing object references into URLs.

### 9.6 JSON Safety

Always parse JSON inside try/catch.

Do not assume a response body is valid JSON.

Do not assume expected fields exist.

Use defensive access:

```js
var items = response && response.Items ? response.Items : [];
```

---

## 10. Robustness Requirements

### 10.1 Structured Error Returns

API methods should return structured data.

Preferred success shape:

```js
{
  ok: true,
  data: response
}
```

Preferred error shape:

```js
{
  ok: false,
  error: 'unauthorized' | 'not_found' | 'network_error' | 'invalid_json' | 'http_error',
  status: optionalStatusCode,
  message: optionalSafeMessage
}
```

Alternatively, if preserving existing code style, methods may return raw Jellyfin responses for success and `{ error: ... }` for failure.

Whatever pattern is chosen, it must be used consistently.

### 10.2 No Silent Hangs

If an API call fails, the UI must not remain in a permanent loading state.

The view layer must handle:

- Empty results.
- Network errors.
- Unauthorized errors.
- Server errors.
- Missing items.
- Missing playback sources.

Show a popup or error message where appropriate.

### 10.3 Retries

Retries are allowed only for idempotent safe GET requests.

Do not automatically retry:

- Authentication.
- Playback start.
- Playback progress.
- Playback stop.
- Any POST that can change server state.

If retries are implemented:

- Use a maximum of 2 or 3 attempts.
- Use backoff.
- Do not retry on 401.
- Do not retry on 404.
- Do not retry if the UI has moved away.

### 10.4 Timeouts

If Movian supports request timeout options, use them.

If it does not, reduce payload size and avoid long-running requests.

Do not rely solely on timeouts to fix hangs.

### 10.5 Cache Limits

The cache must not grow unbounded.

Cache rules:

- Cache item metadata only when useful.
- Avoid caching full API responses for large lists.
- Avoid caching images in JavaScript memory.
- Evict old entries.
- Prefer small metadata objects.
- Do not store playback URLs containing secrets in long-lived caches.

Recommended cache policy:

- Maximum entries: 200 to 500 depending on memory usage.
- TTL: 5 minutes for library views.
- TTL: 10 minutes for item metadata.
- No persistent storage of tokens outside Movian settings.

---

## 11. Pagination Requirements

All browsable lists must be paginated.

### 11.1 Default Page Size

Default:

```txt
Limit = 20
```

Allowed maximum:

```txt
Limit = 50
```

### 11.2 StartIndex

Use:

```txt
StartIndex = offset
```

Increment offset by the number of returned items.

Example:

```js
offset += items.length;
hasMore = offset < totalRecordCount;
```

### 11.3 TotalRecordCount

Use `TotalRecordCount` only if the server returns it.

If absent, fall back to:

```js
hasMore = items.length === limit;
```

### 11.4 UI Rendering

Do not render hundreds of items at once.

Append items in small batches where possible.

Use `setTimeout` to yield to the Movian UI thread if necessary.

Example pattern:

```js
setTimeout(renderNextBatch, 0);
```

---

## 12. Image Rules

Images are a major memory risk on PS3.

### 12.1 Use Server-Side Resizing

Always request resized images from Jellyfin.

For posters:

```txt
MaxWidth=266
MaxHeight=400
Quality=80
Format=Jpg
```

For episode thumbs:

```txt
MaxWidth=320
MaxHeight=180
Quality=80
Format=Jpg
```

For backdrops:

```txt
MaxWidth=1280
MaxHeight=720
Quality=70
Format=Jpg
```

For detail backdrops:

```txt
MaxWidth=1920
MaxHeight=1080
Quality=70
Format=Jpg
```

For logos:

```txt
MaxWidth=500
MaxHeight=200
Format=Png
```

### 12.2 Avoid Huge Images

Never request original-size images.

Avoid:

```txt
Quality=100
```

for large images.

Avoid full-resolution backdrops unless absolutely necessary.

### 12.3 Prefer JPEG for Photos

Use JPEG for posters, thumbs, and backdrops.

Use PNG only when transparency is required, such as logos.

### 12.4 Image Types

For lists, prefer:

```txt
EnableImageTypes=Primary
```

For detail pages, you may request:

```txt
EnableImageTypes=Primary,Backdrop,Logo,Thumb
```

Do not request unnecessary image types for grids.

---

## 13. Playback Requirements

This is the most important modernization area.

### 13.1 Never Assume Direct Play

The client must not assume it can play a media file just because Jellyfin returns it.

The client must always request playback info using a device profile.

### 13.2 Use POST PlaybackInfo

Use:

```txt
POST /Items/{itemId}/PlaybackInfo
```

Include:

```txt
Content-Type: application/json
X-Emby-Token: {access_token}
```

Body must include:

```json
{
  "UserId": "...",
  "DeviceProfile": {},
  "MaxStreamingBitrate": 20000000,
  "StartTimeTicks": 0,
  "EnableDirectPlay": true,
  "EnableDirectStream": true,
  "EnableTranscoding": true,
  "AutoOpenLiveStream": false
}
```

If a setting forces transcoding, set:

```json
{
  "EnableDirectPlay": false,
  "EnableDirectStream": false,
  "EnableTranscoding": true
}
```

or remove direct play profiles from the device profile.

### 13.3 PlaybackInfo Response

The response may include:

```json
{
  "MediaSources": [],
  "PlaySessionId": "..."
}
```

Agents must handle:

- Missing `MediaSources`.
- Empty `MediaSources`.
- Missing `PlaySessionId`.
- Missing streams.
- Unsupported sources.

### 13.4 Selecting a Media Source

Prefer the first compatible media source.

If `TranscodingUrl` exists, prefer it when direct play is not safe.

If direct play is allowed and safe, use the direct stream URL.

Never use direct play when:

- Video codec is not H.264.
- Width is greater than 1920.
- Height is greater than 1080.
- Bit depth is greater than 8.
- Video range is HDR.
- Audio codec is not AAC, AC3, or MP3.
- Audio channels exceed 6.
- Container is unsupported.
- Bitrate exceeds configured maximum.

### 13.5 Constructing Playback URLs

If the media source provides:

```txt
TranscodingUrl
```

then use:

```js
playbackUrl = host + mediaSource.TranscodingUrl;
```

If `TranscodingUrl` starts with `http://` or `https://`, use it as-is.

If direct play is chosen, use a Jellyfin stream URL such as:

```txt
/Videos/{itemId}/stream?MediaSourceId={mediaSourceId}&Static=true&api_key={token}
```

or the equivalent server-provided direct stream URL.

Do not use `Static=true` for unsupported 4K files.

### 13.6 PlaySessionId

Store the `PlaySessionId` returned by `PlaybackInfo`.

It is required for playback reporting.

Do not fabricate a play session ID.

---

## 14. DeviceProfile Requirements

The device profile must represent the real capabilities of the PS3/Movian client.

The profile must be conservative.

If in doubt, prefer transcoding over direct play.

### 14.1 Recommended PS3 DeviceProfile

Use the following as the baseline.

```json
{
  "Name": "Movian PlayStation 3",
  "Id": "{deviceId}",
  "MaxStaticBitrate": 20000000,
  "MusicStreamingTranscodingBitrate": 320000,
  "DirectPlayProfiles": [
    {
      "Container": "mp4,m4v,mov",
      "Type": "Video",
      "VideoCodec": "h264",
      "AudioCodec": "aac,ac3,mp3"
    },
    {
      "Container": "mkv",
      "Type": "Video",
      "VideoCodec": "h264",
      "AudioCodec": "aac,ac3,mp3"
    },
    {
      "Container": "mp3",
      "Type": "Audio",
      "AudioCodec": "mp3"
    },
    {
      "Container": "aac,m4a",
      "Type": "Audio",
      "AudioCodec": "aac"
    }
  ],
  "TranscodingProfiles": [
    {
      "Container": "ts",
      "Type": "Video",
      "VideoCodec": "h264",
      "AudioCodec": "aac,ac3,mp3",
      "Protocol": "hls",
      "Context": "Streaming",
      "MaxAudioChannels": "6",
      "MinSegments": "1",
      "SegmentLength": "6",
      "BreakOnNonKeyFrames": true
    },
    {
      "Container": "mp4",
      "Type": "Video",
      "VideoCodec": "h264",
      "AudioCodec": "aac,ac3,mp3",
      "Protocol": "http",
      "Context": "Streaming",
      "MaxAudioChannels": "6"
    }
  ],
  "CodecProfiles": [
    {
      "Type": "Video",
      "Codec": "h264",
      "Conditions": [
        {
          "Condition": "LessThanEqual",
          "Property": "Width",
          "Value": "1920",
          "IsRequired": false
        },
        {
          "Condition": "LessThanEqual",
          "Property": "Height",
          "Value": "1080",
          "IsRequired": false
        },
        {
          "Condition": "LessThanEqual",
          "Property": "VideoLevel",
          "Value": "41",
          "IsRequired": false
        },
        {
          "Condition": "LessThanEqual",
          "Property": "VideoBitDepth",
          "Value": "8",
          "IsRequired": false
        },
        {
          "Condition": "Equals",
          "Property": "VideoRange",
          "Value": "SDR",
          "IsRequired": false
        }
      ]
    },
    {
      "Type": "VideoAudio",
      "Codec": "aac,ac3,mp3",
      "Conditions": [
        {
          "Condition": "LessThanEqual",
          "Property": "AudioChannels",
          "Value": "6",
          "IsRequired": false
        }
      ]
    }
  ],
  "SubtitleProfiles": [
    {
      "Format": "srt",
      "Method": "External"
    },
    {
      "Format": "subrip",
      "Method": "External"
    },
    {
      "Format": "ass",
      "Method": "External"
    },
    {
      "Format": "ssa",
      "Method": "External"
    },
    {
      "Format": "pgs",
      "Method": "Encode"
    },
    {
      "Format": "pgssub",
      "Method": "Encode"
    },
    {
      "Format": "dvbsub",
      "Method": "Encode"
    },
    {
      "Format": "dvdsub",
      "Method": "Encode"
    }
  ],
  "ResponseProfiles": []
}
```

### 14.2 DeviceProfile Rules

Agents must ensure:

- The device profile is not hardcoded to allow HEVC.
- The device profile does not allow 4K direct play.
- The device profile does not allow 10-bit direct play.
- The device profile does not allow HDR direct play.
- The device profile does not allow TrueHD direct play.
- The device profile does not allow DTS-HD direct play.
- The device profile does not allow unlimited bitrate.
- The device profile is sent with playback info requests.

### 14.3 Configurable Bitrate

The maximum streaming bitrate should be configurable.

Recommended default:

```txt
20000000
```

Equivalent to 20 Mbps.

Suggested settings:

- Low: `8000000`
- Default: `20000000`
- High: `40000000`

Do not set unlimited by default.

### 14.4 Force Transcode Option

Add or support a setting such as:

```txt
force_transcode = true|false
```

When enabled:

- Direct play should be disabled.
- Direct stream should be disabled.
- Transcoding should be forced.
- The device profile may omit direct play profiles.

This is useful for troubleshooting and for users with large incompatible libraries.

---

## 15. Subtitle Requirements

### 15.1 Prefer Text Subtitles

Prefer:

- SRT
- SUBRIP
- ASS
- SSA

These should be delivered externally where Movian supports them.

### 15.2 Bitmap Subtitles

Bitmap subtitles are problematic.

These include:

- PGS
- PGSSUB
- DVBSUB
- DVDSUB

Preferred behavior:

1. If the server can burn them into the transcoded video, use `Method: Encode`.
2. If burning is too expensive or disabled, disable the subtitle track.
3. Do not attempt to render bitmap subtitles directly unless explicitly supported.

### 15.3 Subtitle Selection

If implementing subtitle selection:

- Read subtitle streams from `MediaSource.MediaStreams`.
- Show only supported or convertible subtitle streams.
- Allow disabling subtitles.
- Pass selected `SubtitleStreamIndex` to playback info or playback URL where appropriate.

---

## 16. Playback Reporting / Scrobbling

The plugin should implement playback reporting to modern Jellyfin session endpoints.

This is required for:

- Continue Watching.
- Watched status.
- Resume position.
- Server-side playback tracking.
- Plugin-based scrobbling.

### 16.1 Start Playback

When playback begins:

```txt
POST /Sessions/Playing
```

Body example:

```json
{
  "ItemId": "{itemId}",
  "MediaSourceId": "{mediaSourceId}",
  "PlaySessionId": "{playSessionId}",
  "PlayMethod": "Transcode",
  "CanSeek": true,
  "IsPaused": false,
  "IsMuted": false,
  "PositionTicks": 0,
  "AudioStreamIndex": 1,
  "SubtitleStreamIndex": null
}
```

`PlayMethod` should be one of:

- `DirectPlay`
- `DirectStream`
- `Transcode`

### 16.2 Progress

During playback, report progress every 5 to 10 seconds.

```txt
POST /Sessions/Playing/Progress
```

Body example:

```json
{
  "ItemId": "{itemId}",
  "MediaSourceId": "{mediaSourceId}",
  "PlaySessionId": "{playSessionId}",
  "PlayMethod": "Transcode",
  "CanSeek": true,
  "IsPaused": false,
  "IsMuted": false,
  "PositionTicks": 123456789
}
```

### 16.3 Stop Playback

When playback stops:

```txt
POST /Sessions/Playing/Stopped
```

Body example:

```json
{
  "ItemId": "{itemId}",
  "MediaSourceId": "{mediaSourceId}",
  "PlaySessionId": "{playSessionId}",
  "PlayMethod": "Transcode",
  "PositionTicks": 123456789,
  "Failed": false
}
```

### 16.4 Reporting Rules

Playback reporting must not block playback startup.

Use fire-and-forget requests where possible.

Do not crash the player if reporting fails.

If reporting fails with 401, stop reporting and mark session invalid.

Do not send progress more often than once per second.

Recommended interval:

```txt
5 seconds
```

or:

```txt
10 seconds
```

---

## 17. Resume Playback Requirements

Resume playback must be supported using Jellyfin user data.

### 17.1 Detect Resume Position

Item metadata may include:

```json
{
  "UserData": {
    "PlaybackPositionTicks": 123456789
  }
}
```

If `PlaybackPositionTicks` is greater than zero, show resume behavior.

### 17.2 Start Playback at Position

When requesting playback info, set:

```json
{
  "StartTimeTicks": 123456789
}
```

If the player supports starting at a position, pass the position to Movian as well.

### 17.3 UI Labels

Where possible, show:

```txt
Resume
```

and:

```txt
Play from beginning
```

If the UI cannot support both, default to resume when position exists.

---

## 18. Library Browsing Requirements

### 18.1 Home Screen

The home screen should show libraries from:

```txt
GET /Users/{userId}/Views
```

It may optionally show:

- Continue Watching
- Next Up
- Recently Added
- Favorites

Each row must be limited.

Recommended:

```txt
Limit = 12
```

### 18.2 Library View

When opening a library:

- Use `ParentId`.
- Use `Limit`.
- Use `StartIndex`.
- Use sorting.
- Use minimal fields.
- Use paginated rendering.

### 18.3 Sorting

Supported safe sorting fields:

```txt
SortName
PremiereDate
DateCreated
DatePlayed
ProductionYear
CommunityRating
```

Default sorting should remain conservative.

Do not request complex sorting if it increases server cost significantly.

### 18.4 Search

Search must be limited.

Use:

```txt
GET /Users/{userId}/Items?SearchTerm=...&Limit=20
```

or:

```txt
GET /Items?SearchTerm=...&UserId={userId}&Limit=20
```

Do not fetch unlimited search results.

Debounce user input where possible.

Require at least 2 or 3 characters before querying.

---

## 19. Music Playback Rules

Music playback exists in the current codebase.

Agents must ensure music requests are also limited and safe.

### 19.1 Music Lists

Use limits for:

- Albums
- Artists
- Songs
- Playlists

Recommended:

```txt
Limit = 50
```

For album song lists, a higher limit may be acceptable:

```txt
Limit = 200
```

But do not use unlimited queries.

### 19.2 Audio Streaming

Audio streaming should use Jellyfin universal audio or playback info.

Avoid assuming Opus or advanced codecs are supported.

Safe audio target:

- MP3
- AAC

If using universal audio, prefer conservative codecs and bitrate.

Example maximum music transcoding bitrate:

```txt
320000
```

---

## 20. Settings Requirements

The plugin should expose settings that improve reliability and security.

Required or strongly recommended settings:

```txt
host
is_secure
username
password
access_token
user_id
default_sort_by
default_sort_order
max_streaming_bitrate
force_transcode
subtitle_mode
log_level
```

### 20.1 max_streaming_bitrate

Type: integer.

Default:

```txt
20000000
```

Unit: bits per second.

### 20.2 force_transcode

Type: boolean.

Default:

```txt
false
```

When true, direct play is disabled.

### 20.3 subtitle_mode

Suggested values:

```txt
external
burn
disable
```

Default:

```txt
external
```

Behavior:

- `external`: Prefer external text subtitles.
- `burn`: Request server burn-in where possible.
- `disable`: Disable subtitles by default.

### 20.4 log_level

Suggested values:

```txt
error
warn
info
debug
```

Default:

```txt
info
```

Debug logging must still redact secrets.

---

## 21. Code Style Rules

Agents must follow the existing project style unless there is a strong reason not to.

### 21.1 Modules

Use CommonJS:

```js
var http = require('movian/http');
module.exports = Api;
```

Do not introduce ES module syntax unless the build system clearly supports and transpiles it.

### 21.2 Variables

Prefer `var` if older Movian compatibility is required.

Use `let`/`const` only if the build toolchain reliably transpiles them.

### 21.3 No New Dependencies

Do not add npm dependencies unless absolutely necessary.

The plugin must remain lightweight.

Avoid:

- Large polyfills.
- UI frameworks.
- HTTP abstraction libraries.
- Promise-heavy libraries unless already supported.

### 21.4 Defensive Coding

Always check object existence.

Example:

```js
var items = response && response.Items ? response.Items : [];
```

Avoid deep optional chaining if not supported by the runtime or build pipeline.

### 21.5 Functions

Keep functions small and focused.

API functions should not render UI.

View functions should not construct raw HTTP requests directly if an API method exists.

### 21.6 Comments

Comment non-obvious behavior.

Especially comment:

- Playback URL selection.
- Device profile decisions.
- Token handling.
- Workarounds for Movian limitations.

Do not leave outdated comments.

---

## 22. File Map

Current important files:

```txt
src/api.js
src/cache.js
src/i18n.js
src/jellyfin.js
src/navigator.js
src/polyfill.js
src/settings.js
src/tracking.js
src/upgrader.js
src/utils.js
src/view.js
```

Suggested future files:

```txt
src/http.js
src/deviceProfile.js
src/session.js
src/playback.js
```

If new files are added, ensure they are required correctly and included in the build process.

---

## 23. Refactoring Plan

Agents should implement changes in the following order.

### Phase 1: Central HTTP Client and Error Handling

Tasks:

1. Add centralized request helper.
2. Add safe JSON parsing.
3. Add HTTP status handling.
4. Add 401 handling.
5. Replace direct `http.request` calls where practical.
6. Remove noisy or unsafe logging.
7. Ensure no tokens are logged.

Definition of done:

- API errors no longer crash the plugin.
- Unauthorized responses are detected.
- Invalid JSON does not hang the plugin.
- Logs contain no secrets.

### Phase 2: Fix Library Fetching

Tasks:

1. Replace `getLibraries()` with `/Users/{userId}/Views`.
2. Update home view to render library folders.
3. Remove recursive full-library fetching.
4. Add pagination to library browsing.
5. Reduce fields in list requests.
6. Add loading and error states.

Definition of done:

- Home screen loads quickly on large libraries.
- No request fetches all movies.
- Browsing a large library uses pages of 20 items.
- Memory usage remains stable while scrolling.

### Phase 3: PlaybackInfo and DeviceProfile

Tasks:

1. Add PS3 device profile.
2. Change playback info to `POST`.
3. Send `DeviceProfile`.
4. Send `MaxStreamingBitrate`.
5. Send `StartTimeTicks`.
6. Parse `MediaSources`.
7. Select safe media source.
8. Prefer `TranscodingUrl` when direct play is unsafe.
9. Add force transcode setting.
10. Do not direct play 4K, HEVC, HDR, 10-bit, TrueHD, or DTS-HD.

Definition of done:

- 4K HEVC file triggers transcoding.
- Jellyfin dashboard shows a transcode session.
- PS3 receives a playable stream.
- Compatible 1080p H.264 file may direct play.
- Unsupported file never direct plays.

### Phase 4: Playback Reporting

Tasks:

1. Store `PlaySessionId`.
2. Report playback start.
3. Report playback progress.
4. Report playback stop.
5. Use resume position.
6. Handle pause state where possible.
7. Handle playback failure where possible.

Definition of done:

- Jellyfin shows item as playing.
- Jellyfin updates watched progress.
- Continue Watching works.
- Resume position is retained.
- Stopping playback sends final position.

### Phase 5: Security and Token Lifecycle

Tasks:

1. Clear token on repeated 401 errors.
2. Redirect to login when unauthenticated.
3. Avoid logging tokens.
4. Avoid logging passwords.
5. Avoid logging playback URLs with API keys.
6. Validate host URL.
7. Prefer HTTPS when configured.

Definition of done:

- Expired token does not hang the app.
- User is prompted to log in again.
- Logs are safe.
- No credentials appear in UI errors.

### Phase 6: Memory and Image Optimization

Tasks:

1. Replace deprecated image sizing parameters.
2. Use `MaxWidth` and `MaxHeight`.
3. Use JPEG for opaque images.
4. Use PNG only for transparent logos.
5. Limit cache size.
6. Avoid caching full API responses.
7. Avoid storing large objects in page metadata.

Definition of done:

- Browsing multiple pages does not crash.
- Images load reasonably quickly.
- Memory usage does not grow without bound.
- Logos and posters render without excessive memory use.

### Phase 7: Optional Quick Connect

Tasks:

1. Add Quick Connect initiate flow.
2. Display code.
3. Poll for completion.
4. Store token after success.
5. Handle timeout.
6. Handle cancellation.

Definition of done:

- User can log in without typing password.
- Token is stored securely.
- Secrets are not logged.
- Flow times out cleanly.

---

## 24. API Endpoint Reference

Agents should prefer these endpoints.

### Authentication

```txt
POST /Users/AuthenticateByName
```

### User Views

```txt
GET /Users/{userId}/Views
```

### Items

```txt
GET /Users/{userId}/Items
```

### Latest Items

```txt
GET /Users/{userId}/Items/Latest
```

### Next Up

```txt
GET /Shows/NextUp
```

### Item Details

```txt
GET /Users/{userId}/Items/{itemId}
```

or:

```txt
GET /Items/{itemId}
```

### Seasons

```txt
GET /Shows/{seriesId}/Seasons
```

### Episodes

```txt
GET /Shows/{seriesId}/Episodes
```

### Playback Info

```txt
POST /Items/{itemId}/PlaybackInfo
```

### Playback Reporting

```txt
POST /Sessions/Playing
POST /Sessions/Playing/Progress
POST /Sessions/Playing/Stopped
```

### Played State

```txt
POST /Users/{userId}/PlayedItems/{itemId}
DELETE /Users/{userId}/PlayedItems/{itemId}
```

### Favorite State

```txt
POST /Users/{userId}/FavoriteItems/{itemId}
DELETE /Users/{userId}/FavoriteItems/{itemId}
```

---

## 25. Required Request Headers

Authenticated requests should include:

```txt
Accept: application/json
Content-Type: application/json
X-Emby-Token: {access_token}
```

For authentication by name, include:

```txt
X-Emby-Authorization: MediaBrowser Client="Movian", Device="{device}", DeviceId="{deviceId}", Version="{version}"
Content-Type: application/json
```

For authenticated requests, the authorization header may include the token:

```txt
Authorization: MediaBrowser Client="Movian", Device="{device}", DeviceId="{deviceId}", Version="{version}", Token="{token}"
```

Agents must avoid duplicating headers in a way that confuses servers.

---

## 26. Large File Test Matrix

Agents must verify behavior against these scenarios.

### 26.1 Small Library

- 100 movies.
- 20 shows.
- Music library.

Expected:

- Plugin loads quickly.
- Browsing works.
- Playback works.

### 26.2 Large Library

- 5,000+ movies.
- 1,000+ shows.
- 20,000+ episodes.

Expected:

- Home screen loads.
- Libraries load.
- No recursive full-library fetch.
- Pagination works.
- No hangs.

### 26.3 1080p H.264 File

Media:

- H.264
- 1080p
- 8-bit
- SDR
- AAC or AC3

Expected:

- Direct play or direct stream is acceptable.
- Playback starts quickly.

### 26.4 4K HEVC File

Media:

- HEVC/H.265
- 4K
- 10-bit
- HDR or SDR
- TrueHD or AAC

Expected:

- Direct play is not attempted.
- Server transcodes to 1080p H.264.
- Audio is transcoded to AAC or AC3.
- Playback works.

### 26.5 4K AV1 File

Expected:

- Server transcodes.
- Client does not direct play.

### 26.6 4K VP9 File

Expected:

- Server transcodes.
- Client does not direct play.

### 26.7 PGS Subtitles

Expected:

- Subtitles are burned in, converted, or disabled.
- Playback does not fail.

### 26.8 Expired Token

Expected:

- API returns 401.
- Plugin does not hang.
- User is prompted to log in again.

### 26.9 Unreachable Server

Expected:

- Plugin shows error.
- Plugin does not hang indefinitely.

### 26.10 Reverse Proxy

Test behind:

- Nginx.
- Traefik.
- Caddy.
- Cloudflare Tunnel, if applicable.

Expected:

- No request body size failures.
- No huge query string failures.
- Playback URLs resolve correctly.

---

## 27. Acceptance Criteria

A refactor is considered complete when all of the following are true.

### 27.1 Stability

- The plugin does not hang on startup with a large library.
- The plugin does not fetch all items recursively.
- List views use pagination.
- API errors are displayed or handled gracefully.
- Invalid JSON does not crash the plugin.

### 27.2 Security

- Passwords are not logged.
- Tokens are not logged.
- Playback URLs with API keys are not logged.
- HTTP 401 triggers re-authentication behavior.
- HTTPS is used when configured.

### 27.3 Playback

- Playback info uses POST.
- A PS3 device profile is sent.
- 4K HEVC media is transcoded.
- HDR media is not directly played.
- 10-bit media is not directly played.
- TrueHD audio is not directly played.
- DTS-HD audio is not directly played.
- The selected playback URL is compatible with Movian.
- Playback start, progress, and stop are reported.
- Resume positions work.

### 27.4 Performance

- Grid pages contain no more than 50 items.
- List requests use minimal fields.
- Images are resized by the server.
- Cache usage is bounded.
- Memory usage remains stable while browsing.

### 27.5 Build

The project must build successfully:

```sh
pnpm install
pnpm run build
```

If linting exists, it should pass:

```sh
pnpm run lint
```

or equivalent.

---

## 28. Definition of Done for Pull Requests

Agents must ensure every pull request:

1. Builds successfully.
2. Does not introduce unbounded API requests.
3. Does not log secrets.
4. Does not break playback.
5. Does not increase memory usage significantly.
6. Includes defensive error handling.
7. Includes comments for non-obvious behavior.
8. Updates this document if architecture changes.

Pull requests that fetch all library items, disable transcoding safeguards, or log tokens must be rejected.

---

## 29. Known Dangerous Patterns

Agents must avoid these patterns.

### Forbidden

```js
this.host + '/Items?request=' + JSON.stringify(params)
```

when `params` includes recursive full-library queries.

### Forbidden

```js
Recursive: true
```

without:

```js
ParentId
Limit
StartIndex
```

### Forbidden

```js
Limit: 100000
```

or similarly unbounded limits.

### Forbidden

Direct playback of:

```txt
hevc
h265
av1
vp9
hdr
10-bit
truehd
dts-hd
```

without transcoding.

### Forbidden

Logging:

```txt
service.password
service.access_token
api_key=...
Authorization: MediaBrowser ... Token=...
```

---

## 30. Recommended Safe Patterns

### Safe Library Fetch

```js
var url = this.host + '/Users/' + encodeURIComponent(this.user.Id) + '/Views';
```

### Safe Paginated Items

```js
var params = {
  ParentId: id,
  StartIndex: offset,
  Limit: 20,
  SortBy: 'SortName',
  SortOrder: 'Ascending',
  Recursive: true,
  Fields: 'PrimaryImageAspectRatio,BasicSyncInfo,ProductionYear',
  ImageTypeLimit: 1,
  EnableImageTypes: 'Primary'
};
```

### Safe Image URL

```js
var params = {
  MaxWidth: 266,
  MaxHeight: 400,
  Quality: 80,
  Format: 'Jpg'
};

var url = this.host + '/Items/' + encodeURIComponent(id) + '/Images/Primary?' + utils.paramsToString(params);
```

### Safe Playback Info

```js
var response = this.request(this.host + '/Items/' + encodeURIComponent(id) + '/PlaybackInfo', {
  method: 'POST',
  headers: this.getDefaultHeaders(),
  postdata: JSON.stringify({
    UserId: this.user.Id,
    DeviceProfile: this.getDeviceProfile(),
    MaxStreamingBitrate: service.max_streaming_bitrate || 20000000,
    StartTimeTicks: startPositionTicks || 0,
    EnableDirectPlay: !service.force_transcode,
    EnableDirectStream: !service.force_transcode,
    EnableTranscoding: true,
    AutoOpenLiveStream: false
  })
});
```

---

## 31. Manual Testing Checklist

Before considering any playback-related change complete, test:

- [ ] Login works.
- [ ] Login with wrong credentials fails gracefully.
- [ ] Home screen loads.
- [ ] Libraries load.
- [ ] Movie library paginates.
- [ ] TV show library paginates.
- [ ] Season view loads.
- [ ] Episode view loads.
- [ ] Search does not hang.
- [ ] 1080p H.264 file plays.
- [ ] 4K HEVC file transcodes and plays.
- [ ] TrueHD audio file transcodes and plays.
- [ ] Subtitle selection does not crash playback.
- [ ] Resume playback works.
- [ ] Watched status updates.
- [ ] Stopping playback reports progress.
- [ ] Expired token does not hang.
- [ ] Unreachable server shows error.
- [ ] Logs contain no secrets.

---

## 32. Future Work

After the above requirements are met, future work may include:

- UI parity with modern Jellyfin clients.
- Hero-style detail pages.
- Backdrop-based themes.
- Collections and box sets.
- Cast and crew browsing.
- Quick Connect.
- Multi-user selection.
- Music improvements.
- Emby compatibility.
- Advanced subtitle styling.
- Better search UX.
- Favorites and playlists.

These must not be prioritized over stability, security, and playback compatibility.

---

## 33. Agent Summary

When modifying this repository, agents must always ask:

1. Will this hang on a library with 10,000 items?
2. Will this request too much data?
3. Will this leak a token or password?
4. Will this attempt to play an unsupported 4K file directly?
5. Will this fail gracefully if the server is unavailable?
6. Will this work on a PlayStation 3 with limited memory?
7. Will this still build with the existing Movian plugin toolchain?

If the answer to any of these is unknown, the change is not ready.

---

## 34. Session Progress Log

This section tracks the state of the refactoring across agent sessions so that context is preserved between interruptions.

### 34.1 Current State

**Last updated:** 2025-08-25 (Session 2 — Steps 0 through 6)

**Build status:** ✅ `npm run build` produces `dist/jellyfin.zip` (0.14 MB)
**Lint status:** ✅ `npm run lint` passes with zero errors
**Test status:** ✅ 21 API URL tests + 39 playback selection tests + 21 session reporting tests all pass

### 34.2 Completed Steps

| Step | Description | Status | Notes |
|------|-------------|--------|-------|
| 0 | Repo hygiene — fix syntax errors, ESLint config, pnpm install | ✅ Done | Fixed duplicate `var service` in `jellyfin.js`, shadowed `item` in `api.js`, added `@guarapi/eslint-config-guarapi`, pnpm store at `.pnpm-store/` (workspace-local due to read-only `~/.npm`) |
| 1 | Central HTTP client + structured error handling | ✅ Done | New `src/http.js`; `api.js` routes all requests through it; 401 clears token; logs only `METHOD /path -> status` (no secrets) |
| 2 | Fix library fetching | ✅ Done | `getLibraries()` → `getViews()` (`GET /Users/{id}/Views`); `getItemsData` capped at 20/50; search params fixed; favourites uses `IsFavorite` + real pagination; `showLibrary` per-CollectionType filter + hasMore fallback |
| 3 | DeviceProfile + POST PlaybackInfo | ✅ Done | New `src/deviceProfile.js`; `getPlaybackInfo` now POSTs with strict PS3 profile; `selectMediaSource` never direct-plays 4K/HEVC/HDR/10-bit/TrueHD/DTS-HD; `showVideo` rewritten around server-driven URL; `max_streaming_bitrate` + `force_transcode` settings added |
| 4 | Playback Reporting | ✅ Done | New `src/session.js`; POST `/Sessions/Playing`/`/Progress`/`/Stopped`; 5s progress interval; pause/resume support; wired into `showVideo` via `this.session.start()` / `stopPlayback()` |
| 5 | Security & Token Lifecycle | ✅ Done | Enhanced 401 handling with `resetUnauthorized()`; URL encoding verified on all IDs; host normalization with HTTPS; logging audit confirms no secrets; `handleUnauthorized()` clears token and sets flag; view layer shows `error.unauthorized` message |
| 6 | Memory & Image Optimization | ✅ Done | Replaced deprecated `fillWidth/fillHeight` with `MaxWidth/MaxHeight` + `Quality: 80` + `Format: 'Jpg'`; added cache entry cap (300) with TTL eviction; logos use `MaxWidth: 500, MaxHeight: 200, Format: 'Png'` |

### 34.3 Remaining Steps

| Step | Description | Priority | Notes |
|------|-------------|----------|-------|
| 7 | Quick Connect | 🟢 Optional | AGENTS.md §7; only after on-device verification of Steps 1–6 |

### 34.4 Key Learnings

1. **npm cache is read-only** in this environment (`~/.npm` → EROFS). Use `pnpm install --store-dir .pnpm-store` with the store inside the workspace. Add `.pnpm-store/` and `.npm-cache/` to `.gitignore`.

2. **The "Upgrade notification" commit (10e1100) introduced a syntax error**: duplicate `const service` + `var service` in `jellyfin.js` and `native/popup` (which doesn't exist — `movian/popup` is the correct module). Always `node --check` on every source file before assuming the build works.

3. **ESLint `@guarapi/eslint-config-guarapi` is stricter than the codebase style**: prettier normalized 326 errors automatically. Config additions needed: `globals: { Plugin: 'readonly', Core: 'readonly' }`, `no-shadow: off` (Movian `page`-param convention), `allowEmptyCatch: true`.

4. **Movian's `http.request` returns a string body with a `statuscode` property attached** (JS boxes the string). Always handle `JSON.parse` in try/catch — reverse proxies return HTML error pages.

5. **`typeof x === 'array'` is always false** in JavaScript; use `Array.isArray(x)`. This bug was in `getItemsData` and caused `SortBy` to be set to an array instead of a comma-joined string (worked by coincidence because `paramsToString` expanded arrays).

6. **Jellyfin API parameter names are case-sensitive**: `userId` → `UserId`, `limit` → `Limit`, etc. The old search code sent lowercase params that Jellyfin silently ignored.

7. **`Filters: 'isFavourite'` is wrong** — Jellyfin uses `IsFavorite` (American spelling). The old code effectively returned all items instead of just favourites.

8. **`page.loading = false` must be called on every exit path** (including errors and early returns) to prevent a permanent spinner.

9. **`getMediaPath` crashes on library folders** because `item.MediaType` is undefined for `CollectionFolder` items. Always use `typeof x === 'string'` guards before calling `.toLowerCase()` on optional fields.

10. **The hand-rolled `master.m3u8` URL in `showVideo` was wrong**: `h264-level: 52` (PS3-safe max is 4.1), `AudioCodec: aac,opus,flac` (opus/flac not PS3-safe), `VideoBitrate: source bitrate` (4K files → insane transcoding bitrate). The new PlaybackInfo-driven flow lets the server decide the correct stream.

11. **`ProviderIds.Imdb` vs `ProviderIds.Imbd` typo** in the old code caused `imdbid` to never be set. Fixed in Step 3.

12. **pnpm 11 auto-generates `pnpm-workspace.yaml`** with a build-script-approval template. Set `allowBuilds: { '@swc/core': false, unrs-resolver: false }` since neither package needs its postinstall for this build.

13. **401 handling must clear the token AND set a flag** — just clearing `service.access_token` isn't enough; the view layer needs to know to re-prompt for login. The `handleUnauthorized()` pattern clears the token and sets `this.unauthorized = true`, while `resetUnauthorized()` is called on successful re-auth.

14. **URL encoding is non-negotiable** — all IDs and user-supplied values must be `encodeURIComponent`'d before being concatenated into URLs. The audit confirmed all current code follows this pattern.

15. **Logging must never include secrets** — the `safeLogPath()` helper strips query strings and host prefixes from URLs before logging. Playback URLs with `api_key` are safe because only the path is logged.

16. **Deprecated image parameters `fillWidth/fillHeight` must be replaced** with `MaxWidth/MaxHeight` + `Quality` + `Format`. Quality should cap at 80 for JPEG to save memory on PS3. Logos should use PNG with transparency.

### 34.5 New Files Added

- `src/http.js` — Central HTTP client (structured results, redacted logging)
- `src/deviceProfile.js` — Strict PS3 device profile
- `src/session.js` — Playback session reporting (start/progress/stop)

### 34.6 Files Modified (Summary)

| File | Key Changes |
|------|-------------|
| `src/api.js` | All requests via `HttpClient`; POST `getPlaybackInfo`; `isDirectPlaySafe` + `selectMediaSource`; `getViews` replaces `getLibraries`; bounded `getItemsData`; fixed search params |
| `src/view.js` | `showHome` renders Views; `showFavourites` paginated; `showLibrary` per-type filter; `showVideo` PlaybackInfo-driven; error helpers; min-2-char search guard; wired `session.start()` / `stopPlayback()` |
| `src/jellyfin.js` | Fixed syntax error; `movian/popup` instead of `native/popup`; null-safe upgrader |
| `src/settings.js` | Added `max_streaming_bitrate` + `force_transcode` settings |
| `src/upgrader.js` | Routes through `HttpClient`; null-safe version check |
| `src/tracking.js` | Export class; fix unused vars |
| `src/utils.js` | `hasOwnProperty` safety; removed dead `getOptimalBitrate` stub |
| `.eslintrc.json` | Added globals + rule overrides for Movian conventions |
| `locales/en.json`, `locales/it.json` | Added error strings, setting labels, search min-chars message |

### 34.7 What to Do Next

1. **Commit the current changes** (Steps 0–6).
2. **Step 7 (Quick Connect) is optional** — only implement after on-device verification of Steps 1–6.
3. **Test on a real Jellyfin server** with the manual checklist in §31 — especially 4K HEVC transcoding, expired-token handling, and playback reporting.

### 34.8 Known Outstanding Issues

- **Quick Connect** is not implemented (Step 7).

If the answer to any of these is unknown, the change is not ready.