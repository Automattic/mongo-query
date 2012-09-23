
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
 * @return {Function} transaction
 */

exports.$set = function $set(obj, key, val){
  switch (type(obj)) {
    case 'object':
      return function(){
        obj[key] = val;
      };

    case 'array':
      throw new Error('can\'t append to array using string field name');

    default:
      throw new Error('$set only supports object not ' + type(obj));
  }
};

/**
 * Performs an `$unset`
 *
 * @param {Object} object to modify
 * @param {String} key to alter
 * @param {String} value to set
 * @return {Function} transaction
 */

exports.$unset = function $unset(obj, key){
  switch (type(obj)) {
    case 'array':
    case 'object':
      if (obj.hasOwnProperty(key)) {
        return function(){
          // reminder: `delete arr[1]` === `delete arr['1']` [!]
          delete obj[key];
        };
      }
  }
};
