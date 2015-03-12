
/**
 * Module dependencies.
 */

var ops = require('./ops');
var eql = require('mongo-eql');
var dot = require('dot-component');
var type = require('component-type');
var object = require('object-component');
var debug = require('debug')('mongo-query');

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

  for (var key in query) {
    if (!query.hasOwnProperty(key)) continue;

    // search value
    var val = query[key];

    // split the key into prefix and suffix
    var keys = key.split('.');
    var target = obj;
    var prefix, search;
    var matches = [];

    walk_keys:
    for (var i = 0; i < keys.length; i++) {
      target = target[keys[i]];

      switch (type(target)) {
        case 'array':
          // if it's an array subdocument search we stop here
          prefix = keys.slice(0, i + 1).join('.');
          search = keys.slice(i + 1).join('.');

          debug('searching array "%s"', prefix);

          // we special case operators that don't walk the array
          if (val.$size && !search.length) {
            return compare(val, target);
          }

          // walk subdocs
          var subset = ret[prefix] || target;

          for (var ii = 0; ii < subset.length; ii++) {
            if (search.length) {
              var q = {};
              q[search] = val;
              if ('object' == type(subset[ii])) {
                debug('attempting subdoc search with query %j', q);
                if (filter(subset[ii], q)) {
                  // we ignore the ret value of filter
                  if (!ret[prefix] || !~ret[prefix].indexOf(subset[ii])) {
                    matches.push(subset[ii]);
                  }
                }
              }
            } else {
              debug('performing simple array item search');
              if (compare(val, subset[ii])) {
                if (!ret[prefix] || !~ret[prefix].indexOf(subset[ii])) {
                  matches.push(subset[ii]);
                }
              }
            }
          }

          if (matches.length) {
            ret[prefix] = ret[prefix] || [];
            ret[prefix].push.apply(ret[prefix], matches);
          }

          // we don't continue the key search
          break walk_keys;

        case 'undefined':
          // if we can't find the key
          return false;

        case 'object':
          if (null != keys[i + 1]) {
            continue;
          } else if (!compare(val, target)) {
            return false;
          }
          break;

        default:
          if (!compare(val, target)) return false;
      }
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

  var keys = object.keys(matcher);
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
