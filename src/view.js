var page = require('movian/page');
var service = require('movian/service');
var popup = require('movian/popup');
const Utils = require('./utils');
const Api = require('./api');
const Session = require('./session');

class View {
  constructor(plugin) {
    this.plugin = plugin;
    this.trans = plugin.trans;
    this.cache = plugin.cache;
    this.routes = [
      {
        path: `start`,
        // view: this.showDebug
        view: this.showHome,
      },
      {
        path: `favourites`,
        view: this.showFavourites,
      },
      {
        path: `search:(.*)`,
        view: this.showSearch,
      },
      {
        path: `library:(.*)`,
        view: this.showLibrary,
      },
      {
        path: `series:(.*)`,
        view: this.showSeries,
      },
      {
        path: `series:(.*):season:(.*)`,
        view: this.showSeason,
      },
      {
        path: 'album:(.*)',
        view: this.showAlbum,
      },
      {
        path: `video:(.*)`,
        view: this.trackSelect,
      },
      {
        path: `video:(.*):atrack:(.*)`,
        view: this.showVideo,
      },
      {
        path: 'credits',
        view: this.showCredits,
      },
    ];

    this.api = new Api();
    this.session = new Session(this.api);
    this.user = {};

    this.filters = {
      movies: 1,
      tvseries: 1,
      episodes: 1,
      music: 1,
    };
    this.sort_by = service.default_sort_by ?? null;
    this.sort_order = service.default_sort_order ?? null;
  }

  get prefix() {
    return this.plugin.id;
  }

  routing() {
    this.routes.forEach((route) => {
      new page.Route(`${this.prefix}:${route.path}`, route.view.bind(this));
    });
  }

  showHome(page) {
    page.options.createAction(
      'update',
      this.trans.l('action.update', { plugin_name: this.plugin.title }),
      () => {
        popup.notify(this.trans.l('plugin.updating', { plugin_name: this.plugin.title }), 5);
        page.redirect(Utils.getLatestPlugin());
      },
    );

    page.options.createAction('credits', this.trans.l('action.credits'), () => {
      page.redirect(`${this.prefix}:credits`);
    });

    this.setPageHeader(page, this.trans.l('plugin.loading'));
    page.model.contents = 'home';
    page.contents = 'home';
    page.type = 'home';

    if (!service.host || !service.username || !service.password) {
      page.metadata.name = this.trans.l('auth.missing_credentials.title');
      page.error(this.trans.l('auth.missing_credentials', { provider_name: 'Jellyfin' }));
      page.loading = false;
      return;
    }

    if (!service.access_token) {
      var authentication = this.api.authenticate();
      if (
        authentication.ok &&
        authentication.data &&
        typeof authentication.data.User !== 'undefined'
      ) {
        this.user = authentication.data.User;
        this.api.setUser(this.user);
        if (typeof authentication.data.AccessToken !== 'undefined') {
          service.access_token = authentication.data.AccessToken;
        }
      } else {
        // Login failed: never continue with an empty user, show a clear
        // error and let the user fix their settings (AGENTS.md §8.3, §10.2).
        page.loading = false;
        if (authentication.error === 'network_error' || authentication.error === 'no_response') {
          this.showApiError(page, authentication);
        } else {
          page.error(this.trans.l('auth.login_failed'));
        }
        return;
      }
    }

    // The home screen lists library folders from /Users/{id}/Views — a
    // small, bounded response. Library contents are only fetched when the
    // user opens a library (AGENTS.md §7.2, §18.1).
    var views = this.api.getViews();
    this.setPageHeader(page, this.api.host);
    page.appendItem(`${this.prefix}:search:`, 'search', { title: this.trans.l('') });

    if (!views.ok) {
      // Do not render an empty home screen as if the library were empty.
      this.showApiError(page, views);
      return;
    }

    var viewItems = views.data.Items ?? [];
    if (viewItems.length > 0) {
      page.appendItem('', 'separator', { title: this.trans.l('home.libraries') });
      viewItems.forEach((item) => {
        let { path, type } = this.getMediaPath(item);
        // Skip views we do not know how to browse (e.g. channels).
        if (!path) return;
        page.appendItem(path, type, {
          title: item.Name,
          icon: this.api.getItemImage(item.Id, 'Primary'),
        });
        // Cache the folder (Name + CollectionType) for library pages.
        this.cache.set(`library:${item.Id}`, item);
      });
    }

    // Favourite
    page.appendItem('', 'separator', { title: this.trans.l('home.groups') });
    page.appendItem(`${this.prefix}:favourites`, 'directory', {
      title: this.trans.l('home.favourites'),
      icon: Plugin.path + 'assets/icons/favourites.png',
    });

    page.appendItem('', 'separator', '');
    page.loading = false;
  }

  showFavourites = (page, _query) => {
    this.setPageHeader(page, this.trans.l('plugin.loading'));
    page.metadata.title = this.trans.l('home.favourites');

    // Jellyfin's filter enum is "IsFavorite" — the old "isFavourite" was
    // silently ignored by the server (AGENTS.md §7.4).
    let extraParams = {
      Filters: 'IsFavorite',
      IncludeItemTypes: ['Movie', 'Series'].join(','),
    };

    var offset = 0;
    var limit = 50;
    var hasMore = true;

    function browse() {
      if (!hasMore) return;

      setTimeout(() => {
        var data = this.api.getItemsData(
          null,
          offset,
          limit,
          this.sort_by,
          this.sort_order,
          extraParams,
        );

        if (!data.ok) {
          // Stop pagination on error so the UI cannot hang or loop
          // (AGENTS.md §10.2, §10.3).
          hasMore = false;
          page.loading = false;
          popup.notify(this.trans.l(this.apiErrorMessageKey(data)), 5);
          return;
        }

        let items = data.data.Items ?? [];
        items.forEach((item) => {
          let mediaItem = this.api.parseItem(item);
          let { path, type } = this.getMediaPath(item);
          page.appendItem(path, type, mediaItem);
          if (item.Id && mediaItem) {
            this.cache.set(`item:${item.Id}`, mediaItem);
          }
        });

        offset += items.length;
        let totalEntries = data.data.TotalRecordCount;
        // Fall back to "page was full" when the server omits the count
        // (AGENTS.md §11.3).
        hasMore = typeof totalEntries === 'number' ? offset < totalEntries : items.length === limit;
        page.entries = typeof totalEntries === 'number' ? totalEntries : offset;
        page.haveMore(hasMore);
        page.loading = false;
      }, 125);
    }

    this.setSorting(page, () => {
      offset = 0;
      hasMore = true;
      browse.bind(this)();
    });

    page.asyncPaginator = browse.bind(this);
    browse.bind(this)();
  };

  showSearch = (page, query) => {
    this.setPageHeader(page, this.trans.l('plugin.loading'));

    page.model.contents = 'grid';
    page.contents = 'list';
    page.metadata.title = this.trans.l('search.title', { query: query });

    let search = () => {
      // Require at least 2 characters before hitting the server to avoid
      // one full-library query per keystroke (AGENTS.md §18.4).
      if (!query || String(query).trim().length < 2) {
        page.error(this.trans.l('search.min_chars'));
        return;
      }

      let data = this.api.getItems(query, 20, this.filters);
      if (!data.ok) {
        this.showApiError(page, data);
        return;
      }
      let items = data.data.Items ?? [];

      if (items.length > 0) {
        let categories = {
          movies: items.filter((item) => ['Movie'].indexOf(item.Type) > -1),
          series: items.filter((item) => ['Series'].indexOf(item.Type) > -1),
          episode: items.filter((item) => ['Episode'].indexOf(item.Type) > -1),
          music: items.filter((item) => ['MusicAlbum'].indexOf(item.Type) > -1),
        };

        Object.entries(categories).forEach(([key, categoryItems]) => {
          if (categoryItems.length > 0) {
            page.appendItem('', 'separator', { title: this.trans.l(`search.${key}`) });
            categoryItems.forEach((item) => {
              let mediaItem = this.api.parseItem(item);
              let { path, type } = this.getMediaPath(item);
              page.appendItem(path, type, mediaItem);
            });
          }
        });
      } else {
        page.error(this.trans.l('search.no_results', { query: query }));
      }
    };
    this.setFilters(page, search);

    // Run the initial search immediately: the filter callback alone only
    // fires when a checkbox changes, which left the results empty on first
    // render. The min-2-char guard above keeps short queries off the wire.
    search();

    page.loading = false;
  };

  showLibrary = (page, id) => {
    this.setPageHeader(page, this.trans.l('plugin.loading'));

    let pageData = null;
    try {
      pageData = this.cache.get(`library:${id}`);
    } catch (e) {}

    // Cache miss (e.g. direct navigation): fetch the single folder item
    // for its name and CollectionType — one small request, never a list.
    if (!pageData || typeof pageData.Name === 'undefined') {
      let result = this.api.getLibraryData(id);
      if (!result.ok) {
        this.showApiError(page, result);
        return;
      }
      pageData = result.data;
      this.cache.set(`library:${id}`, pageData);
    }

    page.model.contents = 'grid';
    page.contents = 'list';
    page.metadata.title = pageData.Name || '';

    // Browse the right item type for each library kind (AGENTS.md §7.3).
    // Playlists and unknown folder types are browsed unfiltered but remain
    // bounded by ParentId + Limit.
    let extraParams = {};
    let itemTypes = this.libraryItemTypes(pageData.CollectionType);
    if (itemTypes) {
      extraParams.IncludeItemTypes = itemTypes.join(',');
    }

    var offset = 0;
    var limit = 20;
    var hasMore = true;

    function browse() {
      if (!hasMore) return;

      setTimeout(() => {
        var data = this.api.getItemsData(
          id,
          offset,
          limit,
          this.sort_by,
          this.sort_order,
          extraParams,
        );

        if (!data.ok) {
          // Stop pagination on error so the UI cannot hang or loop
          // (AGENTS.md §10.2, §10.3). Already-rendered items are kept and
          // the problem is surfaced as a notification.
          hasMore = false;
          page.loading = false;
          popup.notify(this.trans.l(this.apiErrorMessageKey(data)), 5);
          return;
        }

        let items = data.data.Items ?? [];
        items.forEach((item) => {
          let mediaItem = this.api.parseItem(item);
          let { path, type } = this.getMediaPath(item);
          page.appendItem(path, type, mediaItem);

          if (item.Id && mediaItem) {
            this.cache.set(`item:${item.Id}`, mediaItem);
          }
        });

        offset += items.length;
        let totalEntries = data.data.TotalRecordCount;
        // Fall back to "page was full" when the server omits the count
        // (AGENTS.md §11.3).
        hasMore = typeof totalEntries === 'number' ? offset < totalEntries : items.length === limit;
        page.entries = typeof totalEntries === 'number' ? totalEntries : offset;
        page.haveMore(hasMore);
        page.loading = false;
      }, 125);
    }

    this.setSorting(page, () => {
      offset = 0;
      hasMore = true;
      browse.bind(this)();
    });

    page.asyncPaginator = browse.bind(this);
    browse.bind(this)();
  };

  /**
   * Map a Jellyfin library CollectionType to the item types it contains
   * (AGENTS.md §7.3). Returns null for folders that are browsed
   * unfiltered (playlists, unknown types).
   */
  libraryItemTypes = (collectionType) => {
    switch (typeof collectionType === 'string' ? collectionType.toLowerCase() : '') {
      case 'movies':
        return ['Movie'];
      case 'tvshows':
        return ['Series'];
      case 'music':
        return ['MusicAlbum'];
      case 'homevideos':
        return ['Video'];
      case 'photos':
        return ['Photo'];
      default:
        return null;
    }
  };

  showSeries = (page, series) => {
    this.setPageHeader(page, this.trans.l('plugin.loading'));

    let title = '';
    try {
      let pageData = this.cache.get(`item:${series}`);
      title = pageData.title;
    } catch (e) {}

    page.model.contents = 'grid';
    page.contents = 'list';
    page.metadata.title = title;

    var response = this.api.getSeriesSeasons(series);
    if (!response.ok) {
      this.showApiError(page, response);
      return;
    }
    var seasons = response.data.Items ?? [];

    seasons.forEach((season) => {
      this.cache.set(`series:${series}:season:${season.Id}`, season);
      var mediaItem = {
        title: season.Name,
        icon: this.api.getItemImage(season.Id, 'Primary', {
          MaxHeight: 319,
          MaxWidth: 221,
          Quality: 80,
          Format: 'Jpg',
        }),
      };

      let { path, type } = this.getMediaPath(season, { series: series, season: season.Id });
      page.appendItem(path, type, mediaItem);
    });

    page.loading = false;
  };

  showSeason = (page, series, season) => {
    this.setPageHeader(page, this.trans.l('plugin.loading'));

    let title = '';
    try {
      let pageData = this.cache.get(`series:${series}:season:${season}`);
      title = pageData.Name;
    } catch (e) {}

    page.model.contents = 'grid';
    page.contents = 'grid';
    page.metadata.title = title;

    var response = this.api.getSeasonEpisodes(series, season);
    if (!response.ok) {
      this.showApiError(page, response);
      return;
    }
    var episodes = response.data.Items ?? [];

    episodes.forEach((episode) => {
      var mediaItem = this.api.parseItem(episode);
      var { path, type } = this.getMediaPath(episode);
      page.appendItem(path, type, mediaItem);
    });

    page.loading = false;
  };

  showAlbum = (page, album) => {
    this.setPageHeader(page, this.trans.l('plugin.loading'));

    let title = '';
    try {
      let pageData = this.cache.get(`item:${album}`);
      title = pageData.Name;
    } catch (e) {}

    page.model.contents = 'list';
    page.contents = 'list';
    page.metadata.title = title;

    let songsResult = this.api.getAlbumSongs(album);
    if (!songsResult.ok) {
      this.showApiError(page, songsResult);
      return;
    }
    let songs = songsResult.data['Items'] ?? [];
    songs.forEach((song) => {
      var mediaItem = this.api.parseItem(song);
      var { path, type } = this.getMediaPath(song, { album: album });
      page.appendItem(path, type, mediaItem);
    });

    page.loading = false;
  };

  trackSelect = (page, id) => {
    this.setPageHeader(page, this.trans.l('plugin.loading'));
    page.model.contents = 'list';
    page.contents = 'list';

    const itemResult = this.api.getItemData(id);
    if (!itemResult.ok) {
      this.showApiError(page, itemResult);
      return;
    }
    const item = itemResult.data;
    const streams = item.MediaStreams ?? [];

    const audios = streams.filter((s) => s.Type === 'Audio');

    if (audios.length > 1) {
      audios.forEach((stream) =>
        page.appendItem(`${this.prefix}:video:${id}:atrack:${stream.Index}`, 'default', {
          title: stream.DisplayTitle || stream.Title,
          icon: 'skin://icons/ic_audiotrack_48px.svg',
        }),
      );
      page.metadata.title = this.trans.l('action.select.audio');
      page.loading = false;
    } else {
      page.redirect(`${this.prefix}:video:${id}:atrack:-1`);
    }
  };

  showVideo = (page, id, atrack) => {
    page.type = 'video';
    this.setPageHeader(page, this.trans.l('plugin.loading'));

    var mediaResult = this.api.getItemData(id);
    if (!mediaResult.ok) {
      this.showApiError(page, mediaResult);
      return;
    }
    var media = mediaResult.data;

    page.options.createAction(
      'update',
      this.trans.l('action.update', { plugin_name: this.plugin.title }),
      () => {
        popup.notify(this.trans.l('plugin.updating', { plugin_name: this.plugin.title }), 5);
        page.redirect(Utils.getLatestPlugin());
      },
    );

    page.options.createAction('credits', this.trans.l('action.credits'), () => {
      page.redirect(`${this.prefix}:credits`);
    });

    // Resume support (AGENTS.md §17): start where the user left off when a
    // saved position exists. The UI does not offer "play from beginning"
    // yet, so resume is the default in that case (§17.3).
    var startPositionTicks = 0;
    if (
      media.UserData &&
      typeof media.UserData.PlaybackPositionTicks === 'number' &&
      media.UserData.PlaybackPositionTicks > 0
    ) {
      startPositionTicks = media.UserData.PlaybackPositionTicks;
    }

    // Ask the server for playback info using the strict PS3 device profile.
    // The server decides between direct play and transcoding — the client
    // never assumes it can play a file directly (AGENTS.md §13.1).
    var playbackResult = this.api.getPlaybackInfo(id, startPositionTicks);
    if (!playbackResult.ok) {
      this.showApiError(page, playbackResult);
      return;
    }

    var selection = this.api.selectMediaSource(playbackResult.data, id);
    if (!selection.ok) {
      page.loading = false;
      page.error(
        this.trans.l(
          selection.error === 'no_media_sources'
            ? 'error.no_media_sources'
            : 'error.no_playable_source',
        ),
      );
      return;
    }

    atrack = parseInt(atrack);
    var url = selection.url;
    // For transcoded streams, ask the server for the selected audio track.
    // `>= 0` so track index 0 is honored (-1 = default). The TranscodingUrl
    // may already carry an AudioStreamIndex from the server: remove it first
    // to avoid duplicates (AGENTS.md §9).
    if (atrack >= 0 && selection.method === 'Transcode') {
      url = url.replace(/([?&])AudioStreamIndex=[^&]*/, '$1').replace(/\?&/, '?');
      url += (url.indexOf('?') > -1 ? '&' : '?') + 'AudioStreamIndex=' + atrack;
    }

    // Subtitles come from the selected media source's streams. Use the
    // stream's own Index (Jellyfin's global stream index), not the loop
    // variable — they diverge when streams are filtered (AGENTS.md §9).
    var subtitles = [];
    var mediaSource = selection.mediaSource;
    var sourceStreams = mediaSource.MediaStreams ?? [];
    for (var j = 0; j < sourceStreams.length; j++) {
      var stream = sourceStreams[j];
      if (stream.Type === 'Subtitle') {
        subtitles.push({
          title: stream.DisplayTitle || stream.Title,
          url: `${this.api.host}/Videos/${id}/${mediaSource.Id}/Subtitles/${stream.Index}/Stream.${service.subtitle_format || 'srt'}?api_key=${service.access_token}`,
          language: stream.Language,
          source: 'Jellyfin',
        });
      }
    }

    // Sensitive URL (may contain api_key): never log it (§9.3).
    var isHls = selection.method === 'Transcode';
    var container = (mediaSource.Container || '').toLowerCase();
    var mimetype = isHls
      ? 'hls'
      : ['mp4', 'm4v', 'mov'].indexOf(container) > -1
        ? 'video/mp4'
        : 'video/x-matroska';

    var videoParams = {
      title: media.Name,
      icon: this.api.getMediaLogo(id),
      canonicalUrl: url,
      sources: [
        {
          url: url,
          extension: isHls ? 'm3u8' : container,
          mimetype: mimetype,
          mime: mimetype,
        },
      ],
      no_subtitle_scan: true,
      no_fs_scan: true,
      subtitles: subtitles,
    };

    // Store session data for playback reporting (AGENTS.md §16).
    this.activePlaySession = {
      itemId: id,
      mediaSourceId: mediaSource.Id,
      playSessionId: selection.playSessionId,
      playMethod: selection.method,
      audioStreamIndex: atrack >= 0 ? atrack : null,
    };

    // Start reporting playback to Jellyfin (AGENTS.md §16.1).
    this.session.start(this.activePlaySession);

    page.source = 'videoparams:' + JSON.stringify(videoParams);
    page.loading = false;
  };

  /**
   * Stop playback reporting when leaving the video view.
   * Called when the user exits playback or the page is destroyed.
   */
  stopPlayback = function () {
    if (this.session && this.session.isActive()) {
      this.session.stop();
    }
  };

  showCredits = (page) => {
    this.setPageHeader(page, 'Credits');
    page.contents = 'list';
    page.type = 'directory';
    page.model.contents = 'grid';

    page.loading = false;
    page.appendPassiveItem(
      'directory',
      { url: '' },
      {
        title: this.trans.l('credits.github'),
        icon: Plugin.path + 'assets/github.png',
      },
    );
    page.appendPassiveItem(
      'directory',
      { url: '' },
      {
        title: this.trans.l('credits.kofi'),
        icon: Plugin.path + 'assets/kofi.png',
      },
    );
  };

  showDebug = (page) => {
    page.metadata.glwview = Plugin.path + 'views/loading.view';
    page.type = 'raw';
    page.loading = false;

    page.model.metadata.progress = 10;
  };

  setPageHeader(page, title) {
    if (page.metadata) {
      page.metadata.title = title;
      page.metadata.icon = this.plugin.logo;
      page.metadata.background = this.plugin.path + 'assets/jellyfin_bg.png';
    }
    page.type = 'directory';
    page.contents = 'items';
    page.entries = 0;
    page.loading = true;
  }

  setFilters(page, callback = {}) {
    let filters = {};
    Object.entries(this.filters).forEach(([key, value]) => {
      filters[key] = { title: this.trans.l(`search.filters.${key}`), value: value };
    });

    let optionChanged = (value, type) => {
      this.filters[type] = value;
      page.flush();
      if (typeof callback === 'function') {
        callback(value);
      }
    };

    page.options.createDivider(this.trans.l('search.filters.title'));
    Object.entries(filters).forEach(([key, data]) => {
      page.options.createBool(key, data.title, data.value, (value) => {
        optionChanged(value, key);
      });
    });
  }

  setSorting(page, callback = false) {
    let sortByOpts = [];
    let sortOrderOpts = [
      ['asc', this.trans.l('sort.order_asc'), false],
      ['desc', this.trans.l('sort.order_desc'), false],
    ];

    Object.entries(Api.sortOptions).forEach(([key, value]) => {
      sortByOpts.push([value, this.trans.l('sort.' + key), false]);
    });

    sortByOpts.forEach((opt, index) => {
      if (opt[0] == this.sort_by) {
        sortByOpts[index][2] = true;
      }
    });

    sortOrderOpts.forEach((opt, index) => {
      if (opt[0] == this.sort_order) {
        sortOrderOpts[index][2] = true;
      }
    });

    let optionChanged = (value, type) => {
      this[type] = value;
      page.flush();
      if (typeof callback === 'function') {
        callback(value);
      }
    };

    page.options.createMultiOpt('sort_by', this.trans.l('page.sort_by'), sortByOpts, (value) => {
      optionChanged(value, 'sort_by');
    });

    page.options.createMultiOpt(
      'sort_order',
      this.trans.l('page.sort_order'),
      sortOrderOpts,
      (value) => {
        optionChanged(value, 'sort_order');
      },
    );
  }

  getMediaPath(item, context = {}) {
    context = { prefix: this.prefix, ...context };
    return this.api.getMediaPath(item, context);
  }

  /**
   * Translate a structured API error (see src/http.js) into the i18n key
   * of the user-facing message.
   */
  apiErrorMessageKey = (result) => {
    switch (result && result.error) {
      case 'unauthorized':
        return 'error.unauthorized';
      case 'not_found':
        return 'error.not_found';
      case 'network_error':
      case 'no_response':
        return 'error.network';
      case 'invalid_json':
        return 'error.invalid_response';
      case 'http_error':
        return 'error.http';
      default:
        return 'error.generic';
    }
  };

  /**
   * Show a user-facing error for a failed API call and make sure the page
   * does not stay in a permanent loading state (AGENTS.md §10.2).
   */
  showApiError = (page, result) => {
    page.loading = false;
    page.error(this.trans.l(this.apiErrorMessageKey(result)));
  };
}

module.exports = View;
