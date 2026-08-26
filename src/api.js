var plugin = JSON.parse(Plugin.manifest);
var service = require('movian/service');
const HttpClient = require('./http');
const DeviceProfile = require('./deviceProfile');
const Utils = require('./utils');

const utils = new Utils();

class Api {
  static defaultSorting = 'SortName';
  static sortOptions = {
    name: 'SortName',
    release_date: 'PremiereDate',
    date_added: 'DateCreated',
    last_played: 'DatePlayed',
  };
  static mediaMap = {
    collectionfolder: '{{prefix}}:library:{{id}}',
    manualplaylistsfolder: '{{prefix}}:library:{{id}}',
    playlist: '{{prefix}}:library:{{id}}',
    series: '{{prefix}}:series:{{id}}',
    season: '{{prefix}}:series:{{id}}:season:{{season}}',
    episode: '{{prefix}}:video:{{episode}}',
    musicalbum: '{{prefix}}:album:{{id}}',
  };

  constructor(user = {}) {
    this.user = user;
    this.http = new HttpClient();
    this.unauthorized = false;
  }

  setUser = function (user) {
    this.user = user;
  };

  get host() {
    let url = service.host.trim();

    let hasHttpPrefix = new RegExp('^(http|https)://', 'i');
    if (!hasHttpPrefix.test(url)) {
      url = `${service.is_secure ? 'https' : 'http'}://${url}`;
    }

    // Avoid double slashes in endpoint paths (AGENTS.md §9.2).
    url = url.replace(/\/+$/, '');

    return url;
  }

  getHeaders = function (authorization = false) {
    var deviceId = Core.deviceId;
    var header = `MediaBrowser Client="Movian", Device="${utils.getDevice()}", DeviceId="${deviceId}", Version="${plugin.version}"`;
    if (authorization) {
      header += `, Token="${service.access_token}"`;
    }

    return header;
  };

  getDefaultHeaders = function () {
    return {
      'Content-Type': 'application/json',
      Authorization: this.getHeaders(true),
      'X-Emby-Token': service.access_token,
    };
  };

  /**
   * Central request entry point: every Jellyfin request goes through here
   * (AGENTS.md §6.1). Returns the structured result from HttpClient.
   *
   * On HTTP 401 the stored token is cleared and the session is marked
   * unauthenticated so the view layer can prompt for re-login instead of
   * silently failing (AGENTS.md §8.3).
   */
  request = function (url, options = {}) {
    var result = this.http.request(url, options);
    if (!result.ok && result.error === 'unauthorized') {
      this.handleUnauthorized();
    }
    return result;
  };

  handleUnauthorized = function () {
    if (!this.unauthorized) {
      this.unauthorized = true;
      console.log('[api] HTTP 401 received; clearing stored access token');
    }
    // Never log the token itself (AGENTS.md §9.1).
    service.access_token = '';
  };

  /**
   * Reset the unauthorized state after successful re-authentication.
   * Called by authenticate() on success so subsequent requests use
   * the new token (AGENTS.md §8.3).
   */
  resetUnauthorized = function () {
    this.unauthorized = false;
  };

  authenticate = function () {
    var url = `${this.host}/Users/AuthenticateByName`;
    // The password is sent in the body only; it is never logged
    // (AGENTS.md §9.1).
    var result = this.http.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Emby-Authorization': this.getHeaders(),
      },
      postdata: JSON.stringify({
        Username: service.username,
        Pw: service.password,
      }),
    });

    if (result.ok) {
      this.resetUnauthorized();
    }

    return result;
  };

  /**
   * Get the user's library folders (AGENTS.md §7.2). This is the only
   * allowed way to discover libraries — never /Items with a recursive
   * full-library query (§5.1, §29). The response is small and bounded:
   * one entry per library folder (Movies, TV Shows, Music, ...).
   */
  getViews = function () {
    var url = `${this.host}/Users/${encodeURIComponent(this.user.Id)}/Views`;

    return this.request(url, {
      method: 'GET',
      headers: this.getDefaultHeaders(),
    });
  };

  getLibraryData = function (id) {
    var url = `${this.host}/Items/${encodeURIComponent(id)}`;

    return this.request(url, {
      method: 'GET',
      headers: this.getDefaultHeaders(),
    });
  };

  /**
   * Paginated item list (AGENTS.md §7.1, §7.3, §7.5).
   *
   * Bounding rules enforced here:
   * - Limit defaults to 20 and is hard-capped at 50 for grid views.
   * - StartIndex is always present; callers must pass ParentId (or a
   *   Filters value such as IsFavorite) so the query is never unbounded.
   * - Only lightweight fields are requested; heavy fields (Overview,
   *   MediaSources, People, ...) belong to detail pages only (§7.6).
   * - IncludeItemTypes is only sent when the caller asks for it, so a
   *   browse of an arbitrary folder is not silently filtered.
   */
  getItemsData = function (
    id = null,
    offset = 0,
    limit = 20,
    sortBy = null,
    sortOrder = 'Ascending',
    extraParams = {},
  ) {
    let sort = ['SortName', 'ProductionYear'];
    sortBy = sortBy ? sortBy : Api.defaultSorting;

    if (sort.indexOf(sortBy) === -1) {
      sort.unshift(sortBy);
    }

    sortOrder = typeof sortOrder === 'string' ? sortOrder : 'Ascending';
    switch (sortOrder.toLowerCase()) {
      case 'descending':
      case 'desc':
        sortOrder = 'Descending';
        break;
      case 'ascending':
      case 'asc':
      default:
        sortOrder = 'Ascending';
        break;
    }

    // Never allow unbounded grid queries (AGENTS.md §7.1, §29).
    limit = Math.min(limit || 20, 50);

    let params = {
      SortBy: Array.isArray(sort) ? sort.join(',') : sort,
      SortOrder: sortOrder,
      StartIndex: offset,
      Limit: limit,
      Recursive: true,
      Fields: ['PrimaryImageAspectRatio', 'ProductionYear', 'CommunityRating'].join(','),
      ImageTypeLimit: 1,
      EnableImageTypes: 'Primary',
    };

    if (id) {
      params['ParentId'] = id;
    }

    params = {
      ...params,
      ...extraParams,
    };

    params = utils.paramsToString(params);
    var url = `${this.host}/Users/${encodeURIComponent(this.user.Id)}/Items?${params}`;

    return this.request(url, {
      method: 'GET',
      headers: this.getDefaultHeaders(),
    });
  };

  /**
   * Search the user's library (AGENTS.md §18.4).
   *
   * Parameter names are Jellyfin-cased (SearchTerm, Limit, ...) — the old
   * lowercase variants were silently ignored by the server. The query is
   * always bounded: Limit defaults to 20, capped at 50, and callers must
   * require a minimum of 2-3 characters before calling this.
   */
  getItems = (query = '', limit = 20, itemTypes = {}) => {
    let types = {
      movies: 'Movie',
      tvseries: 'Series',
      episodes: 'Episode',
      music: 'MusicAlbum',
    };

    let includedItemTypes = [];
    Object.entries(itemTypes).forEach(([key, value]) => {
      if (typeof types[key] !== 'undefined' && value) {
        includedItemTypes.push(types[key]);
      }
    });

    limit = Math.min(limit || 20, 50);

    let params = {
      SearchTerm: query,
      Limit: limit,
      StartIndex: 0,
      Recursive: true,
      Fields: ['PrimaryImageAspectRatio', 'ProductionYear', 'CommunityRating'].join(','),
      ImageTypeLimit: 1,
      EnableImageTypes: 'Primary',
    };

    if (includedItemTypes.length > 0) {
      params.IncludeItemTypes = includedItemTypes.join(',');
    }

    params = utils.paramsToString(params);
    let url = `${this.host}/Users/${encodeURIComponent(this.user.Id)}/Items?${params}`;

    return this.request(url, {
      method: 'GET',
      headers: this.getDefaultHeaders(),
    });
  };

  getSeriesSeasons = function (id) {
    let params = {
      userId: this.user.Id,
      Fields: ['ItemCounts', 'PrimaryImageAspectRatio', 'MediaSourceCount'].join(','),
    };

    var url = `${this.host}/Shows/${encodeURIComponent(id)}/Seasons?${utils.paramsToString(params)}`;

    return this.request(url, {
      method: 'GET',
      headers: this.getDefaultHeaders(),
    });
  };

  getSeasonEpisodes = function (series, season) {
    let params = {
      seasonId: season,
      userId: this.user.Id,
      Fields: ['ItemCounts', 'PrimaryImageAspectRatio', 'MediaSourceCount', 'Overview'].join(','),
    };

    var url = `${this.host}/Shows/${encodeURIComponent(series)}/Episodes?${utils.paramsToString(params)}`;

    return this.request(url, {
      method: 'GET',
      headers: this.getDefaultHeaders(),
    });
  };

  getAlbumSongs = function (album) {
    let params = {
      ParentId: album,
      // Album track lists are short; 200 is the max allowed by AGENTS.md §19.1.
      Limit: 200,
      Fields: ['PrimaryImageAspectRatio', 'ProductionYear'].join(','),
      SortBy: ['ParentIndexNumber', 'IndexNumber', 'SortName'].join(','),
    };

    var url = `${this.host}/Users/${encodeURIComponent(this.user.Id)}/Items?${utils.paramsToString(params)}`;

    return this.request(url, {
      method: 'GET',
      headers: this.getDefaultHeaders(),
    });
  };

  getMediaLogo = function (id) {
    let params = {
      MaxWidth: 500,
      MaxHeight: 200,
      Format: 'Png',
    };

    let url = `${this.host}/Items/${encodeURIComponent(id)}/Images/Logo?${utils.paramsToString(params)}`;
    return url.trim();
  };

  getItemImage = function (
    id,
    type,
    parameters = { MaxHeight: 177, MaxWidth: 315, Quality: 80, Format: 'Jpg' },
  ) {
    if (['Primary', 'Thumb', 'Logo'].indexOf(type) === -1) {
      throw 'Invalid type';
    }

    parameters = utils.paramsToString(parameters);
    let url = `${this.host}/Items/${encodeURIComponent(id)}/Images/${type}?${parameters}`;
    return url.trim();
  };

  getItemData = function (id) {
    var url = `${this.host}/Users/${encodeURIComponent(this.user.Id)}/Items/${encodeURIComponent(id)}`;

    return this.request(url, {
      method: 'GET',
      headers: this.getDefaultHeaders(),
    });
  };

  /**
   * Request playback information using POST with the strict PS3 device
   * profile (AGENTS.md §13.2). The server decides between direct play and
   * transcoding based on the declared capabilities — the client never
   * assumes it can play a file directly (§13.1).
   *
   * @param {string} id - item ID
   * @param {number} [startTimeTicks] - resume position in 100ns ticks
   */
  getPlaybackInfo = function (id, startTimeTicks = 0) {
    var url = `${this.host}/Items/${encodeURIComponent(id)}/PlaybackInfo`;

    // Bitrate is configurable; never unlimited by default (§14.3).
    var maxBitrate = parseInt(service.max_streaming_bitrate, 10);
    if (isNaN(maxBitrate) || maxBitrate <= 0) {
      maxBitrate = 20000000;
    }

    return this.request(url, {
      method: 'POST',
      headers: this.getDefaultHeaders(),
      postdata: JSON.stringify({
        UserId: this.user.Id,
        DeviceProfile: DeviceProfile.build({
          forceTranscode: !!service.force_transcode,
          maxBitrate: maxBitrate,
        }),
        MaxStreamingBitrate: maxBitrate,
        StartTimeTicks: startTimeTicks || 0,
        // force_transcode disables direct play and direct stream (§14.4).
        EnableDirectPlay: !service.force_transcode,
        EnableDirectStream: !service.force_transcode,
        EnableTranscoding: true,
        AutoOpenLiveStream: false,
      }),
    });
  };

  /**
   * Check whether a media source can be played directly on this client
   * (AGENTS.md §13.4). Returns true only when EVERY video and audio stream
   * is within PS3/Movian capabilities; anything else must be transcoded:
   *
   * - video codec must be H.264 (never HEVC/AV1/VP9, §14.2)
   * - resolution at most 1920x1080, level at most 4.1
   * - 8-bit SDR only (no HDR, no 10-bit)
   * - audio codec must be AAC/AC3/MP3 with at most 6 channels
   *   (never TrueHD/DTS-HD/Opus/FLAC)
   * - container must match a direct play profile
   * - reported bitrate must not exceed the configured maximum
   */
  isDirectPlaySafe = function (source, maxBitrate) {
    // Forced transcode: never direct play (§14.4).
    if (service.force_transcode) {
      return false;
    }

    var streams = source.MediaStreams ?? [];
    var videoChecked = false;

    for (var i = 0; i < streams.length; i++) {
      var stream = streams[i];

      if (stream.Type === 'Video') {
        videoChecked = true;
        if ((stream.Codec || '').toLowerCase() !== 'h264') return false;
        if (stream.Width > 1920 || stream.Height > 1080) return false;
        if (stream.VideoBitDepth && stream.VideoBitDepth > 8) return false;
        // HDR variants (PQ/HLG) are not decodable on PS3.
        if (stream.VideoRange && stream.VideoRange !== 'SDR') return false;
        var level = parseFloat(stream.VideoLevel);
        if (!isNaN(level) && level > 4.1) return false;
      } else if (stream.Type === 'Audio') {
        // Normalize codec names: Jellyfin may report 'ac-3' or 'eac3'
        // instead of 'ac3' (AGENTS.md §9).
        var codec = (stream.Codec || '').toLowerCase().replace('-', '');
        if (['aac', 'ac3', 'mp3'].indexOf(codec) === -1) return false;
        if (stream.Channels && stream.Channels > 6) return false;
      }
    }

    // A playable video source must actually contain a video stream.
    if (!videoChecked) return false;

    var container = (source.Container || '').toLowerCase();
    if (['mp4', 'm4v', 'mov', 'mkv'].indexOf(container) === -1) return false;

    // Respect the configured bitrate ceiling when the server reports one.
    if (typeof source.Bitrate === 'number' && maxBitrate && source.Bitrate > maxBitrate) {
      return false;
    }

    return true;
  };

  /**
   * Sanitize a server-provided playback URL before handing it to the PS3
   * player (AGENTS.md §9 — "PS3 stalls on raw TranscodingUrl"):
   *
   * 1. Jellyfin 10.11 TranscodingUrl starts with `?&` (empty first query
   *    parameter) — the old Movian player rejects the source before any
   *    fetch. Normalize `?&` to `?`.
   * 2. Encode raw commas in query values (aac,ac3 -> aac%2Cac3) to match
   *    the legacy working URL format; unencoded commas are another suspect
   *    for the old player's URL parser.
   *
   * Already-encoded sequences (%2C, %20, ...) are left untouched.
   */
  sanitizePlaybackUrl = function (url) {
    url = url.replace(/\?&/, '?');
    // Jellyfin 10.11 also inserts empty params mid-query (`&&`) — the old
    // player's URL parser can trip on them too.
    url = url.replace(/&&/g, '&');
    url = url.replace(/(%[0-9A-Fa-f]{2})|,/g, function (m, enc) {
      return enc || '%2C';
    });
    return url;
  };

  /**
   * Pick a playable media source from a PlaybackInfo response
   * (AGENTS.md §13.3, §13.4, §13.5).
   *
   * Preference order per source:
   *   1. Direct play — only when every stream passes isDirectPlaySafe().
   *   2. TranscodingUrl — the server-provided transcode (HLS per profile).
   *
   * Returns a structured result and never throws:
   *   { ok: true, method: 'DirectPlay'|'Transcode', mediaSource, url,
   *     playSessionId }
   *   { ok: false, error: 'no_media_sources'|'no_playable_source' }
   */
  selectMediaSource = function (data, itemId) {
    var sources = data && data.MediaSources ? data.MediaSources : [];
    if (sources.length === 0) {
      return { ok: false, error: 'no_media_sources' };
    }

    var maxBitrate = parseInt(service.max_streaming_bitrate, 10);
    if (isNaN(maxBitrate) || maxBitrate <= 0) {
      maxBitrate = 20000000;
    }

    for (var i = 0; i < sources.length; i++) {
      var source = sources[i];

      if (this.isDirectPlaySafe(source, maxBitrate)) {
        // Direct stream URL. Contains the token as api_key — sensitive,
        // never log it (§9.3). Static=true is fine here because this path
        // is only taken for PS3-safe files (§13.5).
        var directUrl =
          `${this.host}/Videos/${encodeURIComponent(itemId)}/stream` +
          `?MediaSourceId=${encodeURIComponent(source.Id)}&Static=true&api_key=${service.access_token}`;

        return {
          ok: true,
          method: 'DirectPlay',
          mediaSource: source,
          url: directUrl,
          playSessionId: data.PlaySessionId || null,
        };
      }

      var transcodeUrl = source.TranscodingUrl;
      if (transcodeUrl) {
        // Relative URLs are resolved against the server host (§13.5).
        var url = /^https?:\/\//i.test(transcodeUrl) ? transcodeUrl : this.host + transcodeUrl;
        // Sanitize before handing to the player: `?&` quirk + comma encoding
        // (AGENTS.md §9).
        url = this.sanitizePlaybackUrl(url);

        return {
          ok: true,
          method: 'Transcode',
          mediaSource: source,
          url: url,
          playSessionId: data.PlaySessionId || null,
        };
      }
    }

    // No source was direct-play safe and none offered a transcode.
    return { ok: false, error: 'no_playable_source' };
  };

  favoriteItem = function (_item) {
    // POST TO /Users/{userId}/FavoriteItems/5bf7c2bd8ed30f8d6f96f4dc119260f6
    // DELETE TO SAME
  };

  parseItem = function (item) {
    var mediaItem = {
      title: item.Name,
    };

    let type = item.Type;
    let icon = null;
    switch (type) {
      case 'Episode':
        icon = this.getItemImage(item.Id, 'Primary', {
          MaxWidth: 600,
          MaxHeight: 600,
          Quality: 80,
          Format: 'Jpg',
        });
        break;
      case 'Audio':
      case 'MusicAlbum':
        icon = this.getItemImage(item.Id, 'Primary', {
          MaxHeight: 175,
          MaxWidth: 175,
          Quality: 80,
          Format: 'Jpg',
          format: 'Jpg',
        });
        break;
      case 'Movie':
      default:
        icon = this.getItemImage(item.Id, 'Thumb', {
          MaxHeight: 177,
          MaxWidth: 315,
          Quality: 80,
          Format: 'Jpg',
          format: 'Jpg',
        });
        break;
    }

    if (icon) {
      mediaItem.icon = icon;
    }

    if (['Series'].indexOf(item.Type) < 0) {
      let totalTicks = item.RunTimeTicks ?? 0;
      if (totalTicks > 0) {
        mediaItem.duration = utils.getTotalDuration(utils.ticksToDate(totalTicks));
      }
    }

    if (['Episode'].indexOf(item.Type)) {
      if (typeof item.IndexNumber !== 'undefined' && !isNaN(item.IndexNumber)) {
        mediaItem.title = item.IndexNumber + '. ' + mediaItem.title;
        mediaItem.episode = parseInt(item.IndexNumber);
      }
    }

    if (typeof item.ProductionYear !== 'undefined') {
      mediaItem.year = item.ProductionYear;
    }

    if (typeof item.CommunityRating !== 'undefined') {
      mediaItem.rating = Math.round(item.CommunityRating * 10);
    }

    if (typeof item.Genres !== 'undefined') {
      mediaItem.genres = item.Genres.join(', ');
    }

    if (typeof item.Overview !== 'undefined') {
      mediaItem.description = item.Overview;
    }

    if (['Audio'].indexOf(item.Type) > -1) {
      mediaItem.artist = item.AlbumArtist;
      mediaItem.track = item.IndexNumber;
      mediaItem.album = item.Album;
      mediaItem.sources = [];
      mediaItem.sources.push({
        url: this.getSongUrl(item.Id),
        mimetype: 'audio/mpeg',
      });
    }

    return mediaItem;
  };

  getSongUrl = function (id) {
    let params = {
      UserId: this.user.Id,
      MaxStreamingBitrate: 140000000,
      Container: 'opus,webm|opus,ts|mp3,mp3,aac,m4a|aac,m4b|aac,flac,webma,webm|webma,wav,ogg',
      TranscodingContainer: 'mp4',
      TranscodingProtocol: 'hls',
      ApiKey: service.access_token,
      AudioCodec: 'aac',
      EnableRedirection: true,
      EnableRemoteMedia: false,
      EnableAudioVbrEncoding: true,
    };
    params = utils.paramsToString(params);
    // Sensitive URL (contains ApiKey): never log it (AGENTS.md §9.3).
    return `${this.host}/Audio/${encodeURIComponent(id)}/universal?${params}`;
  };

  getMediaPath = function (item, context = {}) {
    let path = null;

    // Library folders (CollectionFolder) and other non-media views have no
    // MediaType — access defensively so the home screen cannot crash
    // (AGENTS.md §9.6).
    let id = item.Id ?? 0;
    let type = typeof item.Type === 'string' ? item.Type.toLowerCase() : '';
    let mediaType = typeof item.MediaType === 'string' ? item.MediaType.toLowerCase() : null;

    if (mediaType == 'video') {
      path = '{{prefix}}:video:{{id}}';
    }

    if (mediaType == 'audio') {
      path = this.getSongUrl(id);
    }

    if (!path && typeof Api.mediaMap[type] !== 'undefined') {
      path = Api.mediaMap[type];
    }

    context.id = id;
    if (path) {
      path = path.replace(/\{\{(\w+)\}\}/g, (match, placeholder) => {
        return typeof context[placeholder] !== 'undefined' ? context[placeholder] : match;
      });
    }

    let viewType = 'directory';
    if (['movie', 'episode'].indexOf(type) > -1) {
      viewType = 'video';
    }
    if (['audio'].indexOf(type) > -1) {
      viewType = 'audio';
    }

    return { path, type: viewType };
  };
}

module.exports = Api;
