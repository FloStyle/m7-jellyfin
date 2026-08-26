const service = require('movian/service');
// movian/popup is the SDK popup module used across this plugin (see view.js, settings.js).
const popup = require('movian/popup');

const I18n = require('./i18n');
const View = require('./view');
const Settings = require('./settings');
const Cache = require('./cache');

const Utils = require('./utils');
const Upgrader = require('./upgrader');
const Navigator = require('./navigator');

require('./polyfill');

class Jellyfin {
  constructor(path = '', manifest = {}) {
    this.path = path;
    this.metadata = typeof manifest === 'string' ? JSON.parse(manifest) : manifest;

    this.trans = new I18n(this.metadata.i18n, I18n.getSelectedLanguage());

    this.cache = new Cache();
    this.cache.cleanup();

    this.init();
  }

  get title() {
    return this.metadata.title ?? '';
  }

  get id() {
    return this.metadata.id ?? '';
  }

  get icon() {
    return this.path + this.metadata.icon ?? '';
  }

  init() {
    service.create(this.title, `${this.id}:start`, 'video', true, this.icon);

    var settings = new Settings(this);
    settings.init();

    var view = new View(this);
    view.routing();

    var upgrader = new Upgrader();
    var navigator = new Navigator();
    setTimeout(() => {
      if (upgrader.shouldCheck && service.check_updates) {
        let response = upgrader.checkUpdate();
        upgrader.setLastCheck();
        // The GitHub API can rate-limit or return non-JSON; never assume
        // a usable version is present (AGENTS.md §9.6).
        let version =
          response.ok && response.data && response.data.tag_name ? response.data.tag_name : null;

        if (!version) return;

        if (version.charAt(0) === 'v') version = version.slice(1);

        if (Upgrader.versionCompare(version, this.metadata.version)) {
          // Guard the message() call: it is optional in some Movian builds.
          let download =
            typeof popup.message === 'function'
              ? popup.message(
                  this.trans.l('plugin.update_available', {
                    plugin_name: this.metadata.title,
                    version: version,
                  }),
                  true,
                  true,
                )
              : false;

          if (download) {
            navigator.openUrl(Utils.getLatestPlugin());
          }
        }
      }
    }, 1500);
  }
}

new Jellyfin(Plugin.path, Plugin.manifest);
