const service = require('movian/service');
const popup = require('native/popup');
var service = require('movian/service');

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
    this.metadata = typeof manifest === 'string'
      ? JSON.parse(manifest)
      : manifest;

    this.trans = new I18n(
      this.metadata.i18n,
      I18n.getSelectedLanguage()
    );

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
        let version = response.tag_name ?? null;

        if (version.charAt(0) === 'v')
          version = version.slice(1);

        if (version && Upgrader.versionCompare(version, this.metadata.version)) {
          let download = popup.message(
            "A new update for Jellyfin is available! Press 'Ok' to download it",
            true,
            true
          );

          if (download) {
            navigator.openUrl(Utils.getLatestPlugin());
          }
        }
      }
    }, 1500);

  }
}

var jellyfin = new Jellyfin(Plugin.path, Plugin.manifest);
