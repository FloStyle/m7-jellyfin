class Tracking {
  constructor() {
    // Reserved for future scrobbling integration (see AGENTS.md §16).
    var videoscrobbler = require('movian/videoscrobbler');
    this.scrobbler = new videoscrobbler.VideoScrobbler();
  }

  static canScrobble() {
    return !(Core.currentVersionInt < 50000241);
  }
}

module.exports = Tracking;
