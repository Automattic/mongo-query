
var query = require('..');
var expect = require('expect.js');

describe('query', function(){

  describe('helpers', function(){
    it('should expose #get', function(){
      expect(query.get({ a: { b: 'c' } }, 'a.b')).to.be('c');
    });

    it('should expose #set', function(){
      var obj = { a: 'b', c: { d: 'e' } };
      expect(query.get(obj, 'c.f')).to.be(undefined);
      query.set(obj, 'c.f', 'g');
      expect(query.get(obj, 'c.f')).to.be('g');
    });

    it('should expose filtering api', function(){
      var flt = query.filter({ 'c.f': 'g' });
      expect(flt.test({ e: { d: '' } })).to.eql([]);
      expect(flt.test({ c: { f: '' } })).to.eql([]);
      expect(flt.test([{ c: { f: 'g' } }])).to.eql([{ c: { f: 'g' } }]);
      expect(flt.test({ c: { f: 'g' } }, {
        type: 'single'
      })).to.eql(true);
    });

    it('should produce a empty changeset upon no match', function(){
      expect(query({}, {}, {})).to.eql([]);
      expect(query({ a: 'b' }, {}, {})).to.eql([]);
      expect(query({ a: 'b' }, { c: 'd' }, {})).to.eql([]);
    });
  });

  describe('$set', function(){
    it('should $set simple key', function(){
      var obj = { a: 'b' };
      var ret = query(obj, {}, { $set: { a: 'c' } });
      expect(obj.a).to.be('c');
    });

    it('should $set nested', function(){
      var obj = { a: { b: 'c' } };
      var ret = query(obj, {}, { $set: { 'a.b': 'e' } });
      expect(obj.a.b).to.be('e');
    });

    it('should initialize nested', function(){
      var obj = {};
      var ret = query(obj, {}, { $set: { 'a.b.c': 'd' } });
      expect(obj.a.b.c).to.be('d');
    });

    it('should $set in array items', function(){
      var obj = { a: [ { b: 'c' }, { d: 'e' } ] };
      var ret = query(obj, {}, { $set: { 'a.1.d': 'woot' } });
      expect(obj).to.eql({ a: [ { b: 'c' }, { d: 'woot' } ] });
    });

    it('should complain about array parent', function(){
      var obj = { a: { b: [ { c: 'd' }, { e: 'f' } ] } };
      expect(function(){
        query(obj, {}, { $set: { 'a.b.d': 'woot' } });
      }).to.throwError(/can\'t append to array/);
    });

    it('should complain about non-object parent', function(){
      var obj = { a: { b: 'test' } };
      expect(function(){
        query(obj, {}, { $set: { 'a.b.c': 'tobi' } });
      }).to.throwError(/only supports object not string/);
    });
  });

  describe('$unset', function(){
    it('should unset a simple key', function(){
      var obj = { a: 'b', c: 'd' };
      query(obj, {}, { $unset: { c: 1 } });
      expect(obj).to.eql({ a: 'b' });
    });

    it('should unset a nested key', function(){
      var obj = { a: 'b', c: { d: 'e', f: 'g' } };
      query(obj, {}, { $unset: { 'c.d': 1 } });
      expect(obj).to.eql({ a: 'b', c: { f: 'g' } });
    });

    it('should unset an array item', function(){
      var obj = { arr: [1, 2, 3] };
      query(obj, {}, { $unset: { 'arr.1': 1 } });
      expect(obj.arr[0]).to.be(1);
      expect(obj.arr[1]).to.be(undefined);
      expect(obj.arr[2]).to.be(3);
    });

    it('should fail silently (missing simple)', function(){
      var obj = { a: 'b' };
      query(obj, {}, { $unset: { c: 1 } });
      expect(obj).to.eql({ a: 'b' });
    });

    it('should fail silently and skip initialization (missing nested)', function(){
      var obj = { a: 'b' };
      query(obj, {}, { $unset: { 'c.d.e.f': 1 } });
      expect(obj).to.eql({ a: 'b' });
    });

    it('should fail silently (bad type)', function(){
      var obj = { a: 'b' };
      query(obj, {}, { $unset: { 'a.b.c': 1 } });
      expect(obj).to.eql({ a: 'b' });
    });
  });

  describe('transactions', function(){
    it('should not execute any transactions with faulty queries', function(){
      var obj = { a: 'b', c: 'd' };

      // run a query with a working and a faulty operation
      expect(function(){
        query(obj, {}, {
          $set: {
            a: 'woot',    // should work but not be applied
            'c.d': 'tobi' // should trigger the error
          }
        });
      }).to.throwError(/only supports object not string/);

      // make sure the object stayed intact
      expect(obj).to.eql({ a: 'b', c: 'd' });
    });
  });

});
