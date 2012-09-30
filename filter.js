
/**
 * Module dependencies.
 */

var eql = require('./eql')
  , ops = require('./ops')
  , debug = require('debug')('mongo-query')
  , keys, type, dot;

try {
  dot = require('dot');
  type = require('type');
  keys = require('object').keys;
} catch(e){
  dot = require('dot-component');
  type = require('type-component');
  keys = require('object-component').keys;
}

/**
 * Module exports.
 */

module.exports = exports = filter;
exports.ops = ops;

/**
 * Filters an `obj` by the given `query` for subdocuments.
 *
 * @return {Object|Boolean} false if no match, or matched subdocs
 * @api public
 */

function filter(obj, query){
  obj = obj || {};
  var ret = {};

  for (var i in query) {
    if (!query.hasOwnProperty(i)) continue;

    var par = dot.parent(obj, i);

    switch (type(par)) {
      case 'array':
        // get the prefix for this document
        var keys = i.split('.');
        var ret = obj;
        var prefix, search;
        var target = par;

        for (var i = 0; i < keys.length; i++) {
          ret = ret[keys[i]];
          if (ret == par) {
            prefix = keys.slice(0, i).join('.');
            search = keys.slice(i + 1).join('.');
            break;
          }
        }

        // if we already have a subset, narrow it down to that
        if (ret[prefix]) target = ret[prefix];

        // search of subdocuments
        for (var i = 0; i < par.length; i++) {
          if (par[i]) {
            // get the key
            var val = dot.get(par[i], search);
            if (compare(query[i], val)) {
              if ('array' != type(ret[prefix])) ret[prefix] = [];
              ret[prefix].push(val);
            }
          }
        }

        if (!ret[prefix]) return false;
        break;

      case 'object':
        var val = dot.get(obj, i);
        if ('array' == type(val)) {
          // perform an array item search
          for (var i = 0; i < val.length; i++) {
            if (compare(query[i], val[i])) {
              break;
            }
          }
          break;
        } else if(!compare(query[i], val)) {
          return false;
        }
        break;

      case 'undefined':
        return false;
    }
  }

  return ret;
}

/**
 * Compares the given matcher with the document value.
 *
 * @param {Mixed} matcher
 * @param {Mixed} value
 * @api private
 */

function compare(matcher, val){
  if ('object' != type(matcher)) {
    return eql(matcher, val);
  }

  var keys = keys(matcher);
  if ('$' == keys[0][0]) {
    for (var i = 0; i < keys.length; i++) {
      // special case for sub-object matching
      if ('$elemMatch' == keys[i]) {
        return false !== filter(val, matcher.$elemMatch);
      } else {
        if (!ops[keys[i]](matcher[keys[i]], val)) return false;
      }
    }
    return true;
  } else {
    return eql(matcher, val);
  }
}
