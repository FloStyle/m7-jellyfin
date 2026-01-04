var prop = require('movian/prop');

class Navigator {
  /**
   * Get the navigator's event sink.
   * @returns {Object|null} Navigator event sink or null.
   */
  static getEventSink() {
    try {
      var navigators = prop.global.navigators;
      if (!navigators) {
        console.error('[NAV] prop.global.navigators not found');
        return null;
      }

      // Get the first navigator via nodes[0]
      if (navigators.nodes) {
        var nav = navigators.nodes[0];
        if (nav && nav.eventSink) {
          return nav.eventSink;
        }
      }

      console.error('[NAV] navigator.eventSink not found');
      return null;
    } catch (e) {
      console.error('[NAV] Error getting navigator eventSink:', e);
      return null;
    }
  }

  /**
   * Open a URL while preserving the navigation history.
   *
   * @param {string} url - URL to open.
   * @param {Object} options - Options
   * @param {string} options.view - View type (video, directory, etc).
   * @param {string} options.how - Opening method (newTab, newPage, etc)
   * @param {string} options.parenturl - Parent page URL
   * @returns {boolean}
   *
   * @example
   * // Simple usage
   * navigation.openUrl(“myapp:video:123”);
   *
   * @example
   * // With options
   * navigation.openUrl(“myapp:video:123”, {
   *   view: “video”,
   *   parenturl: “myapp:list”
   * });
   */
  openUrl(url, options = {}) {
    var eventSink = Navigator.getEventSink();
    if (!eventSink) {
      console.error('[NAV] Cannot open URL: navigator eventSink not found');
      return false;
    }

    var args = { url: url };
    if (options.view) args.view = options.view;
    if (options.how) args.how = options.how;
    if (options.parenturl) args.parenturl = options.parenturl;

    try {
      prop.sendEvent(eventSink, "openurl", args);
      return true;
    } catch (e) {
      console.error('[NAV] Error sending openurl event:', e);
      return false;
    }
  }
}

module.exports = Navigator;
