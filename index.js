
/**
 * Module dependencies.
 */

var filtr = require('./filtr')
  , type;

// dual `type` dependency
try {
  type = require('type');
} catch(e){
  type = require('type-component');
};

/**
 * Module exports.
 */

module.exports = exports = query;

/**
 * Filter exports.
 */

exports.get = get;
exports.set = set;
exports.filter = filter;

/**
 * Execute a query.
 */

function query(obj, query, modifier){
  obj = obj || {};
  query = query || {};
  modifier = modifier || {};

  var res = filter(query).test(obj);

  if (res.length) {

  } else {
    return [];
  }
}

/**
 * Gets the given key.
 *
 * @param {Object} object to query
 * @param {String} key
 * @api public
 */

function get(obj, key){
  return filtr.getPathValue(key, obj);
}

/**
 * Sets the given key.
 *
 * @param {Object} object to query
 * @param {String} key
 * @param {Object} value
 * @api public
 */

function set(obj, key, val){
  return filtr.setPathValue(key, val, obj);
}

/**
 * Creates a new filter.
 *
 * @param {Object] query
 * @api private
 */

function filter(obj){
  return filtr(obj);
}
