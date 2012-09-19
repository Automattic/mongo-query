
// based on filtr (MIT)
// Copyright (c) 2011-2012 Jake Luer jake@alogicalparadox.com

var filter = require('../filter');
var operators = filter.operators;
var expect = require('expect.js');

describe('filter operators', function(){

  it('$gt should work', function () {
    expect(operators.$gt(1,0)).to.be(true);
    expect(operators.$gt(0,1)).to.be(false);
  });

  it('$gte should work', function () {
    expect(operators.$gte(1,0)).to.be(true);
    expect(operators.$gte(1,1)).to.be(true);
    expect(operators.$gte(0,1)).to.be(false);
  });

  it('$lt should work', function () {
    expect(operators.$lt(0,1)).to.be(true);
    expect(operators.$lt(1,0)).to.be(false);
  });

  it('$lte should work', function () {
    expect(operators.$lte(0,1)).to.be(true);
    expect(operators.$lte(1,1)).to.be(true);
    expect(operators.$lte(1,0)).to.be(false);
  });

  it('$all should work', function () {
    expect(operators.$all([1,2],[1,2])).to.be(true);
    expect(operators.$all([1], [1,2])).to.be(false);
    expect(operators.$all([1,2,3],[1,2])).to.be(true);
  });

  it('$exists should work', function () {
    var a;
    var b = {c: 'hi'};
    expect(operators.$exists(a, false)).to.be(true);
    expect(operators.$exists(a, true)).to.be(false);
    expect(operators.$exists(b, true)).to.be(true);
    expect(operators.$exists(b.c, false)).to.be(false);
    expect(operators.$exists(b.a, false)).to.be(true);
    expect(operators.$exists('hi', true)).to.be(true);
  });

  it('$mod should work', function () {
    expect(operators.$mod(12, [12, 0])).to.be(true);
    expect(operators.$mod(24, [12, 0])).to.be(true);
    expect(operators.$mod(15, [12, 0])).to.be(false);
  });

  it('$ne should work', function () {
    expect(operators.$ne(12,12)).to.be(false);
    expect(operators.$ne(12,11)).to.be(true);
  });

  it('$in should work', function () {
    expect(operators.$in(1,[0,1,2])).to.be(true);
    expect(operators.$in(4,[0,1,2])).to.be(false);
  });

  it('$nin should work', function () {
    expect(operators.$nin(1,[0,1,2])).to.be(false);
    expect(operators.$nin(4,[0,1,2])).to.be(true);
  });

  it('$size should work', function () {
    expect(operators.$size([0,1,2], 3)).to.be(true);
    expect(operators.$size('foo', 3)).to.be(true);
    expect(operators.$size({ a: 1}, 1)).to.be(false);
    expect(operators.$size({ length: 3}, 3)).to.be(true);
  });

  it('$or should work', function () {
    var a = [0,1,2]
      , t1 = operators.$size(a, 2) // fail
      , t2 = operators.$in(1, a) // pass
      , t3 = operators.$in(4, a); // fail
    expect(operators.$or([ t1, t2 ])).to.be(true);
    expect(operators.$or([ t1, t3 ])).to.be(false);
  });

  it('$nor should work', function () {
    var a = [0,1,2]
      , t1 = operators.$size(a, 2) // fail
      , t2 = operators.$in(1, a) // pass
      , t3 = operators.$in(4, a); // fail
    expect(operators.$nor([ t1, t2 ])).to.be(false);
    expect(operators.$nor([ t1, t3 ])).to.be(true);
  });

  it('$and should work', function () {
    var a = [0,1,2]
      , t1 = operators.$size(a, 3) // pass
      , t2 = operators.$in(1, a) // pass
      , t3 = operators.$in(4, a); // fail
    expect(operators.$and([ t1, t2 ])).to.be(true);
    expect(operators.$and([ t1, t3 ])).to.be(false);
  });
});
