
/**
 * Module dependencies.
 */

var eql = require('mongo-eql');
var type = require('component-type');

/**
 * $ne: not equal.
 */

exports.$ne = function $ne(matcher, val){
  return !eql(matcher, val);
};

/**
 * $gt: greater than.
 */

exports.$gt = function $gt(matcher, val){
  return type(matcher) === 'number' && val > matcher;
};

/**
 * $gte: greater than equal.
 */

exports.$gte = function $gte(matcher, val){
  return type(matcher) === 'number' && val >= matcher;
};

/**
 * $lt: less than.
 */

exports.$lt = function $lt(matcher, val){
  return type(matcher) === 'number' && val < matcher;
};

/**
 * $lte: less than equal.
 */

exports.$lte = function $lte(matcher, val){
  return type(matcher) === 'number' && val <= matcher;
};

/**
 * $regex: supply a regular expression as a string.
 */

exports.$regex = function $regex(matcher, val){
  // TODO: add $options support
  if ('regexp' != type('matcher')) matcher = new RegExp(matcher);
  return matcher.test(val);
};

/**
 * $exists: key exists.
 */

exports.$exists = function $exists(matcher, val){
  if (matcher) {
    return undefined !== val;
  } else {
    return undefined === val;
  }
};

/**
 * $in: value in array.
 */

exports.$in = function $in(matcher, val){
  if ('array' != type(matcher)) return false;
  for (var i = 0; i < matcher.length; i++) {
    if (eql(matcher[i], val)) return true;
  }
  return false;
};

/**
 * $nin: value not in array.
 */

exports.$nin = function $nin(matcher, val){
  return !exports.$in(matcher, val);
};

/**
 * @size: array length
 */

exports.$size = function(matcher, val){
  return Array.isArray(val) && matcher == val.length;
};
