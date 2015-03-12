
/**
 * Module dependencies.
 */

var mods = require('./mods');
var filter = require('./filter');
var dot = require('dot-component');
var type = require('component-type');
var object = require('object-component');
var debug = require('debug')('mongo-query');

/**
 * Module exports.
 */

module.exports = exports = query;

/**
 * Export filter helper.
 */

exports.filter = filter;

/**
 * Export modifiers.
 */

exports.mods = mods;

/**
 * Execute a query.
 *
 * Options:
 *  - `strict` only modify if query matches
 *
 * @param {Object} object to alter
 * @param {Object} query to filter modifications by
 * @param {Object} update object
 * @param {Object} options
 */

function query(obj, query, update, opts){
  obj = obj || {};
  opts = opts || {};
  query = query || {};
  update = update || {};

  // strict mode
  var strict = !!opts.strict;

  var match;
  var log = [];

  if (object.length(query)) {
    match = filter(obj, query);
  }

  if (!strict || false !== match) {
    var keys = object.keys(update);
    var transactions = [];

    for (var i = 0, l = keys.length; i < l; i++) {
      if (mods[keys[i]]) {
        debug('found modifier "%s"', keys[i]);
        for (var key in update[keys[i]]) {
          var pos = key.indexOf('.$.');

          if (~pos) {
            var prefix = key.substr(0, pos);
            var suffix = key.substr(pos + 3);

            if (match[prefix]) {
              debug('executing "%s" %s on first match within "%s"', key, keys[i], prefix);
              var fn = mods[keys[i]](match[prefix][0], suffix, update[keys[i]][key]);
              if (fn) {
                // produce a key name replacing $ with the actual index
                // TODO: this is unnecessarily expensive
                var index = dot.get(obj, prefix).indexOf(match[prefix][0]);
                fn.key = prefix + '.' + index + '.' + suffix;
                fn.op = keys[i];
                transactions.push(fn);
              }
            } else {
              debug('ignoring "%s" %s - no matches within "%s"', key, keys[i], prefix);
            }
          } else {
            var fn = mods[keys[i]](obj, key, update[keys[i]][key]);
            if (fn) {
              fn.key = key;
              fn.op = keys[i];
              transactions.push(fn);
            }
          }
        }
      } else {
        debug('skipping unknown modifier "%s"', keys[i]);
      }
    }

    if (transactions.length) {
      // if we got here error free we process all transactions
      for (var i = 0; i < transactions.length; i++) {
        var fn = transactions[i];
        var val = fn();
        log.push({ op: fn.op, key: fn.key, value: val });
      }
    }
  } else {
    debug('no matches for query %j', query);
  }

  return log;
}
