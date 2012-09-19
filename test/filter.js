
var filter = require('../filter');
var expect = require('expect.js');

describe('filter', function () {
  it('should parse a single query', function () {
    var query = { $lt: 10 }
      , Q = filter(query);
    expect(Q.stack).to.have.length(1);
    expect(Q.test(8, { type: 'single' })).to.be(true);
    expect(Q.test(11, { type: 'single' })).to.be(false);
  });

  it('should parse a lengthed query', function () {
    var query = { $lt: 10, $gt: 5 }
      , Q = filter(query);
    expect(Q.stack).to.have.length(2);
    expect(Q.test(8, { type: 'single' })).to.be(true);
    expect(Q.test(4, { type: 'single' })).to.be(false);
    expect(Q.test(11, { type: 'single' })).to.be(false);
  });

  it('should parse a nested query', function () {
    var query = { $and: [ { $size: 3 }, { $all: [ 1, 2 ] } ] }
      , Q = filter(query);
    expect(Q.stack).to.have.length(1);
    expect(Q.stack[0].test).to.be.an('array');
    expect(Q.test([0,1,2], { type: 'single' })).to.be(true);
    expect(Q.test([0,1,2,3], { type: 'single' })).to.be(false);
  });

  it('should parse a complex nested query', function () {
    var query = { $or: [ { $size: 3, $all: [ 4 ] }, { $all: [ 1, 2 ] } ] }
      , Q = filter(query);
    expect(Q.stack).to.have.length(1);
    expect(Q.test([ 2, 3, 4], { type: 'single' })).to.be(true);
    expect(Q.test([ 1, 2 ], {type: 'single' })).to.be(true);
  });

  it('should support multiple statements', function () {
    var query = { 'test': 'hello', world: { $in: [ 'universe' ] } }
      , Q = filter(query);
    expect(Q.stack).to.have.length(2);
    expect(Q.test({ test: 'hello', world: 'universe' }, { type: 'single' })).to.be(true);
    expect(Q.test({ test: 'hello', world: 'galaxy' }, { type: 'single' })).to.be(false);
  });

  describe('getPathValue', function () {
    it('can get value for simple nested object', function () {
      var obj = { hello: { universe: 'world' }}
        , val = filter.getPathValue('hello.universe', obj);
      expect(val).to.equal('world');
    });

    it('can get value for simple array', function () {
      var obj = { hello: [ 'zero', 'one' ] }
        , val = filter.getPathValue('hello[1]', obj);
      expect(val).to.equal('one');
    });

    it('can get value of nested array', function () {
      var obj = { hello: [ 'zero', [ 'a', 'b' ] ] }
        , val = filter.getPathValue('hello[1][0]', obj);
      expect(val).to.equal('a');
    });

    it('can get value of array only', function () {
      var obj = [ 'zero', 'one' ]
        , val = filter.getPathValue('[1]', obj);
      expect(val).to.equal('one');
    });

    it('can get value of array only nested', function () {
      var obj = [ 'zero', [ 'a', 'b' ] ]
        , val = filter.getPathValue('[1][1]', obj);
      expect(val).to.equal('b');
    });
  });

  describe('setPathValue', function () {
    it('should allow value to be set in simple object', function () {
      var obj = {};
      filter.setPathValue('hello', 'universe', obj);
      expect(obj).to.eql({ hello: 'universe' });
    });

    it('should allow nested object value to be set', function () {
      var obj = {};
      filter.setPathValue('hello.universe', 'filter', obj);
      expect(obj).to.eql({ hello: { universe: 'filter' }});
    });

    it('should allow nested array value to be set', function () {
      var obj = {};
      filter.setPathValue('hello.universe[1].filter', 'galaxy', obj);
      var arr = [];
      arr[1] = { filter: 'galaxy' };
      expect(obj).to.eql({ hello: { universe: arr }});
    });

    it('should allow value to be set in simple object', function () {
      var obj = { hello: 'world' };
      filter.setPathValue('hello', 'universe', obj);
      expect(obj).to.eql({ hello: 'universe' });
    });

    it('should allow value to be set in complex object', function () {
      var obj = { hello: { }};
      filter.setPathValue('hello.universe', 42, obj);
      expect(obj).to.eql({ hello: { universe: 42 }});
    });

    it('should allow value to be set in complex object', function () {
      var obj = { hello: { universe: 100 }};
      filter.setPathValue('hello.universe', 42, obj);
      expect(obj).to.eql({ hello: { universe: 42 }});
    });

    it('should allow for value to be set in array', function () {
      var obj = { hello: [] };
      filter.setPathValue('hello[0]', 1, obj);
      expect(obj).to.eql({ hello: [1] });
      filter.setPathValue('hello[2]', 3, obj);
      var arr = [1]
      arr[2] = 3;
      expect(obj).to.eql({ hello: arr });
    });

    it('should allow for value to be set in array', function () {
      var obj = { hello: [ 1, 2, 4 ] };
      filter.setPathValue('hello[2]', 3, obj);
      expect(obj).to.eql({ hello: [ 1, 2, 3 ] });
    });
  });

  describe('comparator assumptions', function () {
    it('should assume $eq if no operator provided - string', function () {
      var query = { 'hello': 'universe' }
        , Q = filter(query);
      expect(Q.stack).to.have.length(1);
      expect(Q.test({ hello: 'universe' }, { type: 'single' })).to.be(true);
    });

    it('should assume $eq if no operator provided - number', function () {
      var query = { 'hello': 42 }
        , Q = filter(query);
      expect(Q.stack).to.have.length(1);
      expect(Q.test({ hello: 42 }, { type: 'single' })).to.be(true);
    });

    it('should assume $eq if no comparator provided - boolean', function () {
      var query = { 'hello': true }
        , Q = filter(query);
      expect(Q.stack).to.have.length(1);
      expect(Q.test({ hello: true }, { type: 'single' })).to.be(true);
    });

    it('should assume $eq if no comparator provide - nested', function () {
      var query = { $or : [ { 'hello': true }, { 'universe': true } ] }
        , Q = filter(query);
      expect(Q.stack).to.have.length(1);
      expect(Q.test({ hello: true }, { type: 'single' })).to.be(true);
      expect(Q.test({ universe: true }, { type: 'single' })).to.be(true);
      expect(Q.test({ hello: false, universe: true }, { type: 'single' })).to.be(true);
      expect(Q.test({ hello: false, universe: false }, { type: 'single' })).to.be(false);
    });
  });

  // TODO: All nesting options.
});
