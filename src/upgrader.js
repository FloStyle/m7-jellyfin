const kvstore = require('native/kvstore');
const HttpClient = require('./http');

class Upgrader {
  constructor() {
    this.author = 'FloStyle';
    this.repo = 'm7-jellyfin';
    this.endpoint = `https://api.github.com/repos/${this.author}/${this.repo}/releases/latest`;
    this.kvurl = 'jellyfin:upgrader';
    this.http = new HttpClient();
  }

  get shouldCheck() {
    let date = this.lastCheck;

    if (date === null) {
      return true;
    }

    try {
      date = new Date(date);
    } catch (e) {
      this.lastCheck = new Date();
      return false;
    }

    // Check if atleast a day has passed
    return Date.now() - date > 24 * 60 * 60 * 1000;
  }

  get lastCheck() {
    try {
      return kvstore.getString(this.kvurl, 'plugin', 'last_check');
    } catch (e) {
      return null;
    }
  }

  setLastCheck(date = new Date()) {
    kvstore.set(this.kvurl, 'plugin', 'last_check', date);
  }

  checkUpdate() {
    return this.http.request(this.endpoint, {
      method: 'GET',
    });
  }

  static versionCompare(v1, v2) {
    var vnum1 = 0,
      vnum2 = 0;
    for (var i = 0, j = 0; i < v1.length || j < v2.length; ) {
      while (i < v1.length && v1[i] != '.') {
        vnum1 = vnum1 * 10 + (v1[i] - '0');
        i++;
      }
      while (j < v2.length && v2[j] != '.') {
        vnum2 = vnum2 * 10 + (v2[j] - '0');
        j++;
      }

      if (vnum1 > vnum2) return 1;
      if (vnum2 > vnum1) return -1;

      vnum1 = vnum2 = 0;
      i++;
      j++;
    }
    return 0;
  }
}

module.exports = Upgrader;
