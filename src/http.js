var http = require('movian/http');

/**
 * Central HTTP client for all Jellyfin requests (AGENTS.md §6.1).
 *
 * Movian's http.request blocks the UI thread and can throw on network
 * failures, so every call is wrapped in try/catch. Responses are handled
 * defensively:
 *
 * - HTTP 401  -> { ok: false, error: 'unauthorized' }
 * - HTTP 404  -> { ok: false, error: 'not_found' }
 * - other !2xx -> { ok: false, error: 'http_error', status }
 * - bad body  -> { ok: false, error: 'invalid_json' } (reverse proxies can
 *   return HTML error pages; never assume the body is JSON)
 * - throw     -> { ok: false, error: 'network_error', message }
 * - 2xx       -> { ok: true, data: <parsed body> }
 *
 * Logging is restricted to method + path + status. Query strings are
 * stripped from log output because playback URLs may embed an api_key
 * (AGENTS.md §9.1). No tokens or passwords are ever logged.
 */
class HttpClient {
  request(url, options = {}) {
    var method = options.method || 'GET';
    var logPath = HttpClient.safeLogPath(url);

    var response;
    try {
      response = http.request(url, options);
    } catch (e) {
      console.log('[http] ' + method + ' ' + logPath + ' -> network_error: ' + String(e));
      return { ok: false, error: 'network_error', message: String(e) };
    }

    if (!response) {
      console.log('[http] ' + method + ' ' + logPath + ' -> no_response');
      return { ok: false, error: 'no_response' };
    }

    var status = response.statuscode;

    if (status === 401) {
      console.log('[http] ' + method + ' ' + logPath + ' -> 401');
      return { ok: false, error: 'unauthorized', status: 401 };
    }

    if (status === 404) {
      console.log('[http] ' + method + ' ' + logPath + ' -> 404');
      return { ok: false, error: 'not_found', status: 404 };
    }

    if (typeof status !== 'number' || status < 200 || status >= 300) {
      console.log('[http] ' + method + ' ' + logPath + ' -> ' + status);
      return { ok: false, error: 'http_error', status: status };
    }

    try {
      // Movian's http.request returns the body string with a statuscode
      // property attached, so the response itself is parsed here.
      var data = JSON.parse(response);
      return { ok: true, data: data };
    } catch (e) {
      console.log('[http] ' + method + ' ' + logPath + ' -> invalid_json');
      return { ok: false, error: 'invalid_json' };
    }
  }

  /**
   * Reduce a URL to a log-safe path: drop the scheme, host and query string
   * so tokens or api_key parameters never reach the log (AGENTS.md §9.1).
   */
  static safeLogPath(url) {
    try {
      var noQuery = String(url).split('?')[0];
      var protoEnd = noQuery.indexOf('://');
      if (protoEnd > -1) {
        var hostEnd = noQuery.indexOf('/', protoEnd + 3);
        return hostEnd > -1 ? noQuery.slice(hostEnd) : '/';
      }
      return noQuery;
    } catch (e) {
      return '[invalid url]';
    }
  }
}

module.exports = HttpClient;
