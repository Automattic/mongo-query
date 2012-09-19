
/**
 * Module dependencies.
 */

var filter = require('./filter')
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
exports.get = get;
exports.set = set;

/**
 * Execute a query.
 */

function query(){

}

/**
 * Gets the given key.
 *
 * @param {Object} object to query
 * @param {String} key
 * @api public
 */

function get(obj, key){
  return filter.getPathValue(key, obj);
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
  return filter.setPathValue(key, val, obj);
}
