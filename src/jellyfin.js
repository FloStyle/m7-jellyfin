const service = require('movian/service');
const I18n = require('./i18n');
const View = require('./view');
const Settings = require('./settings');
const Cache = require('./cache');
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
  }
}

var jellyfin = new Jellyfin(Plugin.path, Plugin.manifest);
