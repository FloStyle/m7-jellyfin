"use strict";

if (typeof Object !== 'undefined') {
  if (typeof Object.entries !== 'function') {
    Object.entries = function (obj) {
      if (obj === null || obj === undefined) {
        throw new TypeError('Object.entries called on non-object');
      }

      var entries = [];
      var keys = Object.keys(Object(obj));

      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        entries.push([key, obj[key]]);
      }

      return entries;
    };
  }

  if (typeof Object.values !== 'function') {
    Object.values = function (obj) {
      if (obj === null || obj === undefined) {
        throw new TypeError('Object.values called on non-object');
      }

      var values = [];
      var keys = Object.keys(Object(obj));

      for (var i = 0; i < keys.length; i++) {
        values.push(obj[keys[i]]);
      }

      return values;
    };
  }
}


module.exports = {
  entries: Object.entries,
  values: Object.values,
};
