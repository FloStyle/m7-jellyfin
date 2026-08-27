/**
 * Playback tracking module — wires Movian's VideoScrobbler to the Session.
 *
 * Receives video playback events from Movian and forwards them to the
 * Session so that Jellyfin's dashboard reflects the real playback state:
 * - onstart  → starts a position-polling interval (prop.currenttime → session.updatePosition)
 * - onpause  → session.pause()
 * - onresume → session.resume()
 * - onstop   → session.stop() + clears the polling interval
 *
 * Position is reported in 100ns ticks (Movian gives seconds via prop.currenttime).
 *
 * (AGENTS.md §16)
 */
class Tracking {
  /**
   * @param {import('./session').default} session — Session instance to forward events to.
   */
  constructor(session) {
    this.session = session;
    this.pollTimerId = null;
    this._prop = null; // current video prop (kept alive for polling)

    var videoscrobbler = require('movian/videoscrobbler');
    this.scrobbler = new videoscrobbler.VideoScrobbler();

    this.scrobbler.onstart = (_data, prop, _origin) => {
      this._prop = prop;
      this._startPolling();
    };

    this.scrobbler.onpause = (_data, _prop, _origin) => {
      this.session.pause();
    };

    this.scrobbler.onresume = (_data, _prop, _origin) => {
      this.session.resume();
    };

    this.scrobbler.onstop = (_data, _prop, _origin) => {
      this._stopPolling();
      this.session.stop();
    };
  }

  /**
   * Poll prop.currenttime every second and forward to session.updatePosition.
   * @private
   */
  _startPolling() {
    this._stopPolling();
    this.pollTimerId = setInterval(() => {
      if (!this._prop || this.session.isStopped) {
        this._stopPolling();
        return;
      }
      var seconds = this._prop.currenttime;
      if (typeof seconds === 'number' && seconds >= 0) {
        // Convert seconds to 100ns ticks (1 tick = 100 nanoseconds = 10^-7 seconds)
        this.session.updatePosition(Math.round(seconds * 10000000));
      }
    }, 1000);
  }

  /**
   * Clear the polling interval.
   * @private
   */
  _stopPolling() {
    if (this.pollTimerId !== null) {
      clearInterval(this.pollTimerId);
      this.pollTimerId = null;
    }
    this._prop = null;
  }

  /**
   * Clean up scrobbler and polling timer.
   */
  destroy() {
    this._stopPolling();
    if (this.scrobbler) {
      this.scrobbler.destroy();
      this.scrobbler = null;
    }
  }

  static canScrobble() {
    return !(Core.currentVersionInt < 50000241);
  }
}

module.exports = Tracking;
