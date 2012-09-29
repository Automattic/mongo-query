
/**
 * Test dependencies.
 */

var filter = require('../filter')
  , ops = filter.ops
  , expect = require('expect.js');

/**
 * Test.
 */

describe('filter', function(){

  describe('ops', function(){
    it('ne', function(){
      expect(ops.$ne(3, 4)).to.be(true);
      expect(ops.$ne(3, 3)).to.be(false);
      expect(ops.$ne({}, {})).to.be(false);
      expect(ops.$ne(null, undefined)).to.be(false);
    });

    it('gt', function(){
      expect(ops.$gt(4, 5)).to.be(true);
      expect(ops.$gt(4, 4)).to.be(false);
    });

    it('gte', function(){
      expect(ops.$gte(4, 5)).to.be(true);
      expect(ops.$gte(4, 4)).to.be(true);
      expect(ops.$gte(5, 4)).to.be(false);
    });

    it('lt', function(){
      expect(ops.$gt(4, 5)).to.be(true);
      expect(ops.$gt(4, 4)).to.be(false);
    });

    it('lte', function(){
      expect(ops.$gt(4, 5)).to.be(true);
      expect(ops.$gt(4, 4)).to.be(false);
    });

    it('exists', function(){
      expect(ops.$exists(true, true)).to.be(true);
      expect(ops.$exists(true, undefined)).to.be(false);
      expect(ops.$exists(false, true)).to.be(false);
      expect(ops.$exists(true, true)).to.be(true);
      expect(ops.$exists(false, null)).to.be(false);
      expect(ops.$exists(false, undefined)).to.be(true);
      expect(ops.$exists(false, 0)).to.be(false);
    });

    it('in', function(){
      expect(ops.$in([1,2,3], 1)).to.be(true);
      expect(ops.$in([1,2,3], '')).to.be(false);
      expect(ops.$in([1,null,3], undefined)).to.be(true);
      expect(ops.$in([], '')).to.be(false);
    });

    it('nin', function(){
      expect(ops.$nin([1,2,3], 1)).to.be(false);
      expect(ops.$nin([1,2,3], '')).to.be(true);
      expect(ops.$nin([1,null,3], undefined)).to.be(false);
      expect(ops.$nin([], '')).to.be(true);
    });

    it('regex', function(){
      expect(ops.$regex('test', 'testing')).to.be(true);
      expect(ops.$regex('[0-9]', 'testing')).to.be(false);
      expect(ops.$regex('[0-9]', 't3sting')).to.be(true);
    });
  });

});
