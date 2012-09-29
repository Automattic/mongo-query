
/**
 * Module dependencies.
 */

var eql = require('./eql')
  , debug = require('debug')('mongo-query')
  , type, keys, dot;

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
 * Performs a `$set`.
 *
 * @param {Object} object to modify
 * @param {String} path to alter
 * @param {String} value to set
 * @return {Function} transaction (unless noop)
 */

exports.$set = function $set(obj, path, val){
  var key = path.split('.').pop();
  obj = dot.parent(obj, path, true);

  switch (type(obj)) {
    case 'object':
      return function(){
        obj[key] = val;
      };

    case 'array':
      if (numeric(key)) {
        return function(){
          obj[key] = val;
        };
      } else {
        throw new Error('can\'t append to array using string field name [' + key + ']');
      }
      break;

    default:
      throw new Error('$set only supports object not ' + type(obj));
  }
};

/**
 * Performs an `$unset`.
 *
 * @param {Object} object to modify
 * @param {String} path to alter
 * @param {String} value to set
 * @return {Function} transaction (unless noop)
 */

exports.$unset = function $unset(obj, path){
  var key = path.split('.').pop();
  obj = dot.parent(obj, path);

  switch (type(obj)) {
    case 'array':
    case 'object':
      if (obj.hasOwnProperty(key)) {
        return function(){
          // reminder: `delete arr[1]` === `delete arr['1']` [!]
          delete obj[key];
        };
      } else {
        // we fail silently
        debug('ignoring unset of inexisting key');
      }
  }
};

/**
 * Performs a `$rename`.
 *
 * @param {Object} object to modify
 * @param {String} path to alter
 * @param {String} value to set
 * @return {Function} transaction (unless noop)
 */

exports.$rename = function $rename(obj, path, newKey){
  // target = source
  if (path == newKey) {
    throw new Error('$rename source must differ from target');
  }

  // target is parent of source
  if (0 === path.indexOf(newKey + '.')) {
    throw new Error('$rename target may not be a parent of source');
  }

  var p = dot.parent(obj, path);
  var t = type(p);

  if ('object' == t) {
    var key = path.split('.').pop();

    if (p.hasOwnProperty(key)) {
      return function(){
        var val = p[key];
        delete p[key];

        // target does initialize the path
        var newp = dot.parent(obj, newKey, true);

        // and also fails silently upon type mismatch
        if ('object' == type(newp)) {
          newp[newKey.split('.').pop()] = val;
        } else {
          debug('invalid $rename target path type');
        }
      };
    } else {
      debug('ignoring rename from inexisting source');
    }
  } else if ('undefined' != t) {
    throw new Error('$rename source field invalid');
  }
};

/**
 * Performs an `$inc`.
 *
 * @param {Object} object to modify
 * @param {String} path to alter
 * @param {String} value to set
 * @return {Function} transaction (unless noop)
 */

exports.$inc = function $inc(obj, path, inc){
  if ('number' != type(inc)) {
    throw new Error('Modifier $inc allowed for numbers only');
  }

  obj = dot.parent(obj, path, true);
  var key = path.split('.').pop();

  switch (type(obj)) {
    case 'array':
    case 'object':
      if (obj.hasOwnProperty(key)) {
        if ('number' != type(obj[key])) {
          throw new Error('Cannot apply $inc modifier to non-number');
        }

        return function(){
          obj[key] += inc;
        };
      } else if('object' == type(obj) || numeric(key)){
        return function(){
          obj[key] = inc;
        };
      } else {
        throw new Error('can\'t append to array using string field name [' + key + ']');
      }
      break;

    default:
      throw new Error('Cannot apply $inc modifier to non-number');
  }
};

/**
 * Performs an `$pop`.
 *
 * @param {Object} object to modify
 * @param {String} path to alter
 * @param {String} value to set
 * @return {Function} transaction (unless noop)
 */

exports.$pop = function $pop(obj, path, val){
  obj = dot.parent(obj, path);
  var key = path.split('.').pop();

  // we make sure the array is not just the parent of the main key
  switch (type(obj)) {
    case 'array':
    case 'object':
      if (obj.hasOwnProperty(key)) {
        switch (type(obj[key])) {
          case 'array':
            if (obj[key].length) {
              return function(){
                if (-1 == val) {
                  obj[key].shift();
                } else {
                  // mongodb allows any value to pop
                  obj[key].pop();
                }
              };
            }
            break;

          case 'undefined':
            debug('ignoring pop to inexisting key');
            break;

          default:
            throw new Error('Cannot apply $pop modifier to non-array');
        }
      } else {
        debug('ignoring pop to inexisting key');
      }
      break;

    case 'undefined':
      debug('ignoring pop to inexisting key');
      break;
  }
};

/**
 * Performs a `$push`.
 *
 * @param {Object} object to modify
 * @param {String} path to alter
 * @param {Object} value to push
 * @return {Function} transaction (unless noop)
 */

exports.$push = function $push(obj, path, val){
  obj = dot.parent(obj, path, true);
  var key = path.split('.').pop();

  switch (type(obj)) {
    case 'object':
      if (obj.hasOwnProperty(key)) {
        if ('array' == type(obj[key])) {
          return function(){
            obj[key].push(val);
          };
        } else {
          throw new Error('Cannot apply $push/$pushAll modifier to non-array');
        }
      } else {
        return function(){
          obj[key] = [val];
        };
      }
      break;

    case 'array':
      if (obj.hasOwnProperty(key)) {
        if ('array' == type(obj[key])) {
          return function(){
            obj[key].push(val);
          };
        } else {
          throw new Error('Cannot apply $push/$pushAll modifier to non-array');
        }
      } else if (numeric(key)) {
        return function(){
          obj[key] = [val];
        };
      } else {
        throw new Error('can\'t append to array using string field name [' + key + ']');
      }
      break;
  }
};

/**
 * Performs a `$pushAll`.
 *
 * @param {Object} object to modify
 * @param {String} path to alter
 * @param {Array} values to push
 * @return {Function} transaction (unless noop)
 */

exports.$pushAll = function $pushAll(obj, path, val){
  if ('array' != type(val)) {
    throw new Error('Modifier $pushAll/pullAll allowed for arrays only');
  }

  obj = dot.parent(obj, path, true);
  var key = path.split('.').pop();

  switch (type(obj)) {
    case 'object':
      if (obj.hasOwnProperty(key)) {
        if ('array' == type(obj[key])) {
          return function(){
            obj[key].push.apply(obj[key], val);
          };
        } else {
          throw new Error('Cannot apply $push/$pushAll modifier to non-array');
        }
      } else {
        return function(){
          obj[key] = val;
        };
      }
      break;

    case 'array':
      if (obj.hasOwnProperty(key)) {
        if ('array' == type(obj[key])) {
          return function(){
            obj[key].push.apply(obj[key], val);
          };
        } else {
          throw new Error('Cannot apply $push/$pushAll modifier to non-array');
        }
      } else if (numeric(key)) {
        return function(){
          obj[key] = val;
        };
      } else {
        throw new Error('can\'t append to array using string field name [' + key + ']');
      }
      break;
  }
};

/**
 * Performs a `$pull`.
 */

exports.$pull = function $pull(obj, path, val){
  obj = dot.parent(obj, path, true);
  var key = path.split('.').pop();
  var t = type(obj);

  switch (t) {
    case 'object':
      if (obj.hasOwnProperty(key)) {
        if ('array' == type(obj[key])) {
          return function(){
            obj[key] = obj[key].filter(pull([val]));
          };
        } else {
          throw new Error('Cannot apply $pull/$pullAll modifier to non-array');
        }
      }
      break;

    case 'array':
      if (obj.hasOwnProperty(key)) {
        if ('array' == type(obj[key])) {
          return function(){
            obj[key] = obj[key].filter(pull([val]));
          };
        } else {
          throw new Error('Cannot apply $pull/$pullAll modifier to non-array');
        }
      } else {
        debug('ignoring pull to non array');
      }
      break;

    default:
      if ('undefined' != t) {
        throw new Error('LEFT_SUBFIELD only supports Object: hello not: ' + t);
      }
  }
};

/**
 * Performs a `$pullAll`.
 */

exports.$pullAll = function $pullAll(obj, path, val){
  if ('array' != type(val)) {
    throw new Error('Modifier $pushAll/pullAll allowed for arrays only');
  }

  obj = dot.parent(obj, path, true);
  var key = path.split('.').pop();
  var t = type(obj);

  switch (t) {
    case 'object':
      if (obj.hasOwnProperty(key)) {
        if ('array' == type(obj[key])) {
          return function(){
            obj[key] = obj[key].filter(pull(val));
          };
        } else {
          throw new Error('Cannot apply $pull/$pullAll modifier to non-array');
        }
      }
      break;

    case 'array':
      if (obj.hasOwnProperty(key)) {
        if ('array' == type(obj[key])) {
          return function(){
            obj[key] = obj[key].filter(pull(val));
          };
        } else {
          throw new Error('Cannot apply $pull/$pullAll modifier to non-array');
        }
      } else {
        debug('ignoring pull to non array');
      }
      break;

    default:
      if ('undefined' != t) {
        throw new Error('LEFT_SUBFIELD only supports Object: hello not: ' + t);
      }
  }
};

/**
 * Pull helper.
 *
 * @param {Array} array of values to match
 * @return {Function} that you can .filter an array with
 */

function pull(vals){
  return function(val){
    for (var i = 0; i < vals.length; i++) {
      var matcher = vals[i];
      if ('object' == type(matcher)) {
        // we only are only interested in obj <-> obj comparisons
        if ('object' == type(val)) {
          var match = false;

          if (keys(matcher).length) {
            for (var i in matcher) {
              if (matcher.hasOwnProperty(i)) {
                // we need at least one matching key to pull
                if (eql(matcher[i], val[i])) {
                  match = true;
                } else {
                  // if a single key doesn't match we move on
                  match = false;
                  break;
                }
              }
            }
          } else if (!keys(val).length) {
            // pull `{}` matches [{}]
            match = true;
          }

          if (match) return false;
        } else {
          debug('ignoring pull match against object');
        }
      } else {
        if (eql(matcher, val)) return false;
      }
    }
    return true;
  };
}

/**
 * Helper to determine if a value is numeric.
 *
 * @param {String|Number} value
 * @return {Boolean} true if numeric
 * @api private
 */

function numeric(val){
  return 'number' == type(val) || Number(val) == val;
}
