
/**
 * Module dependencies.
 */

try {
  var type = require('type');
} catch(e){
  var type = require('type-component');
}

/**
 * Performs a `$set`
 *
 * @param {Object} object to modify
 * @param {String} key to alter
 * @param {String} value to set
 * @return {Boolean} false if noop
 */

exports.$set = function $set(obj, key, val){
  switch (type(obj)) {
    case 'object':
      obj[key] = val;
      break;

    case 'array':
      throw new Error('can\'t append to array using string field name');

    default:
      throw new Error('$set only supports object not ' + type(obj));
  }
};
