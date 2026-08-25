/**
 * Playback session reporting module (AGENTS.md §16).
 *
 * Tracks playback state and reports to Jellyfin's session endpoints:
 * - POST /Sessions/Playing — start playback
 * - POST /Sessions/Playing/Progress — progress updates every 5-10s
 * - POST /Sessions/Playing/Stopped — stop playback
 *
 * Reporting is fire-and-forget and never blocks playback startup.
 * If reporting fails with 401, the session is marked invalid and
 * reporting stops (AGENTS.md §16.4).
 */
class Session {
  constructor(api) {
    this.api = api;
    this.playSessionId = null;
    this.itemId = null;
    this.mediaSourceId = null;
    this.playMethod = null; // 'DirectPlay' | 'DirectStream' | 'Transcode'
    this.audioStreamIndex = null;
    this.subtitleStreamIndex = null;
    this.positionTicks = 0;
    this.isPaused = false;
    this.isMuted = false;
    this.canSeek = true;
    this.reportInterval = 5000; // 5 seconds (AGENTS.md §16.2)
    this.timerId = null;
    this.isReporting = false;
    this.isStopped = false;
  }

  /**
   * Start reporting playback. Called when playback begins.
   * @param {Object} sessionData - Data from selectMediaSource result
   * @param {string} sessionData.playSessionId - PlaySessionId from server
   * @param {string} sessionData.itemId - Item ID being played
   * @param {string} sessionData.mediaSourceId - MediaSource ID
   * @param {string} sessionData.method - 'DirectPlay' | 'Transcode'
   * @param {number} [sessionData.audioStreamIndex] - Selected audio track
   * @param {number} [sessionData.subtitleStreamIndex] - Selected subtitle track
   */
  start(sessionData) {
    if (this.isReporting) {
      this.stop();
    }

    this.playSessionId = sessionData.playSessionId;
    this.itemId = sessionData.itemId;
    this.mediaSourceId = sessionData.mediaSourceId;
    this.playMethod = sessionData.playMethod;
    this.audioStreamIndex = sessionData.audioStreamIndex;
    this.subtitleStreamIndex = sessionData.subtitleStreamIndex;
    this.positionTicks = 0;
    this.isPaused = false;
    this.isMuted = false;
    this.isStopped = false;
    this.isReporting = true;

    // Report playback start (AGENTS.md §16.1)
    this._reportPlaying();

    // Start progress reporting interval
    this.timerId = setInterval(() => {
      this._reportProgress();
    }, this.reportInterval);
  }

  /**
   * Update playback position. Called periodically by the player.
   * @param {number} ticks - Current position in 100ns ticks
   */
  updatePosition(ticks) {
    if (!this.isReporting || this.isStopped) return;
    this.positionTicks = ticks;
  }

  /**
   * Pause playback.
   */
  pause() {
    if (!this.isReporting || this.isStopped) return;
    this.isPaused = true;
    this._reportProgress();
  }

  /**
   * Resume playback.
   */
  resume() {
    if (!this.isReporting || this.isStopped) return;
    this.isPaused = false;
    this._reportProgress();
  }

  /**
   * Stop playback reporting. Called when playback ends or user exits.
   */
  stop() {
    if (!this.isReporting) return;
    this.isStopped = true;
    this.isReporting = false;

    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }

    // Report final position (AGENTS.md §16.3)
    this._reportStopped();

    // Clear session data
    this.playSessionId = null;
    this.itemId = null;
    this.mediaSourceId = null;
    this.playMethod = null;
    this.audioStreamIndex = null;
    this.subtitleStreamIndex = null;
    this.positionTicks = 0;
  }

  /**
   * Check if session is active.
   * @returns {boolean}
   */
  isActive() {
    return this.isReporting && !this.isStopped;
  }

  /**
   * Report playback start to Jellyfin (AGENTS.md §16.1).
   * Fire-and-forget — never blocks playback.
   * @private
   */
  _reportPlaying() {
    if (!this.itemId || !this.playSessionId) return;

    this.api.request(this.api.host + '/Sessions/Playing', {
      method: 'POST',
      headers: this.api.getDefaultHeaders(),
      postdata: JSON.stringify({
        ItemId: this.itemId,
        MediaSourceId: this.mediaSourceId,
        PlaySessionId: this.playSessionId,
        PlayMethod: this.playMethod,
        CanSeek: this.canSeek,
        IsPaused: this.isPaused,
        IsMuted: this.isMuted,
        PositionTicks: this.positionTicks,
        AudioStreamIndex: this.audioStreamIndex,
        SubtitleStreamIndex: this.subtitleStreamIndex,
      }),
    });
  }

  /**
   * Report playback progress to Jellyfin (AGENTS.md §16.2).
   * Fire-and-forget — never blocks playback.
   * @private
   */
  _reportProgress() {
    if (!this.itemId || !this.playSessionId) return;

    this.api.request(this.api.host + '/Sessions/Playing/Progress', {
      method: 'POST',
      headers: this.api.getDefaultHeaders(),
      postdata: JSON.stringify({
        ItemId: this.itemId,
        MediaSourceId: this.mediaSourceId,
        PlaySessionId: this.playSessionId,
        PlayMethod: this.playMethod,
        CanSeek: this.canSeek,
        IsPaused: this.isPaused,
        IsMuted: this.isMuted,
        PositionTicks: this.positionTicks,
      }),
    });
  }

  /**
   * Report playback stopped to Jellyfin (AGENTS.md §16.3).
   * Fire-and-forget — never blocks playback.
   * @private
   */
  _reportStopped() {
    if (!this.itemId || !this.playSessionId) return;

    this.api.request(this.api.host + '/Sessions/Playing/Stopped', {
      method: 'POST',
      headers: this.api.getDefaultHeaders(),
      postdata: JSON.stringify({
        ItemId: this.itemId,
        MediaSourceId: this.mediaSourceId,
        PlaySessionId: this.playSessionId,
        PlayMethod: this.playMethod,
        PositionTicks: this.positionTicks,
        Failed: false,
      }),
    });
  }
}

module.exports = Session;
