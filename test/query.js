
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
      }).to.throwError(/can\'t append to array using string field name \[d\]/);
    });

    it('should complain about non-object parent', function(){
      var obj = { a: { b: 'test' } };
      expect(function(){
        query(obj, {}, { $set: { 'a.b.c': 'tobi' } });
      }).to.throwError(/only supports object not string/);
    });

    it('should work transactionally', function(){
      var obj = { a: 'b', c: 'd' };
      expect(function(){
        query(obj, {}, {
          $set: {
            // works
            a: 'tobi',
            // fails
            'c.d': 'tobi'
          }
        });
      }).to.throwError(/only supports object not string/);
      expect(obj).to.eql({ a: 'b', c: 'd' });
    });
  });

  describe('$unset', function(){
    it('should unset a simple key', function(){
      var obj = { a: 'b', c: 'd' };
      var ret = query(obj, {}, { $unset: { c: 1 } });
      expect(obj).to.eql({ a: 'b' });
    });

    it('should unset a nested key', function(){
      var obj = { a: 'b', c: { d: 'e', f: 'g' } };
      var ret = query(obj, {}, { $unset: { 'c.d': 1 } });
      expect(obj).to.eql({ a: 'b', c: { f: 'g' } });
    });

    it('should unset an array item', function(){
      var obj = { arr: [1, 2, 3] };
      var ret = query(obj, {}, { $unset: { 'arr.1': 1 } });
      expect(obj.arr[0]).to.be(1);
      expect(obj.arr[1]).to.be(undefined);
      expect(obj.arr[2]).to.be(3);
    });

    it('should fail silently (missing simple)', function(){
      var obj = { a: 'b' };
      var ret = query(obj, {}, { $unset: { c: 1 } });
      expect(obj).to.eql({ a: 'b' });
    });

    it('should fail silently and skip initialization (missing nested)', function(){
      var obj = { a: 'b' };
      var ret = query(obj, {}, { $unset: { 'c.d.e.f': 1 } });
      expect(obj).to.eql({ a: 'b' });
    });

    it('should fail silently (bad type)', function(){
      var obj = { a: 'b' };
      var ret = query(obj, {}, { $unset: { 'a.b.c': 1 } });
      expect(obj).to.eql({ a: 'b' });
    });

    it('should work transactionally', function(){
      var obj = { a: 'b', c: 'd' };
      expect(function(){
        query(obj, {}, {
          // works
          $unset: { a: 1 },
          // fails
          $set: { 'c.d': 'tobi' }
        });
      }).to.throwError(/only supports object not string/);
      expect(obj).to.eql({ a: 'b', c: 'd' });
    });
  });

  describe('$rename', function(){
    it('should rename a simple key', function(){
      var obj = { a: 'b' };
      var ret = query(obj, {}, { $rename: { a: 'b' } });
      expect(obj).to.eql({ b: 'b' });
    });

    it('should rename nested keys', function(){
      var obj = { a: { b: 'c' } };
      var ret = query(obj, {}, { $rename: { 'a.b': 'a.c' } });
      expect(obj).to.eql({ a: { c: 'c' } });
    });

    it('should rename nested and initialize', function(){
      var obj = { a: { b: 'c' } };
      var ret = query(obj, {}, { $rename: { 'a.b': 'd.a.b' } });
      expect(obj).to.eql({ a: { }, d: { a: { b: 'c' } } });
    });

    it('should remove source when target is invalid', function(){
      var obj = { a: 'b', c: 'hello' };
      var ret = query(obj, {}, { $rename: { a: 'c.d' } });
      expect(obj).to.eql({ c: 'hello' });
    });

    it('should fail silently (missing simple)', function(){
      var obj = { a: 'b' };
      var ret = query(obj, {}, { $rename: { c: 'b' } });
      expect(obj).to.eql({ a: 'b' });
      expect(ret).to.eql([]);
    });

    it('should fail silently (missing nested)', function(){
      var obj = { a: 'b' };
      var ret = query(obj, {}, { $rename: { 'w.b.c': 'b' } });
      expect(obj).to.eql({ a: 'b' });
      expect(ret).to.eql([]);
    });

    it('should complain about same source and target', function(){
      var obj = { a: 'b' };

      expect(function(){
        query(obj, {}, { $rename: { a: 'a' } });
      }).to.throwError(/\$rename source must differ from target/);

      // even when the key doesn't exist
      expect(function(){
        query(obj, {}, { $rename: { r: 'r' } });
      }).to.throwError(/\$rename source must differ from target/);
    });

    it('shuld complain about target comprised within source', function(){
      var obj = { a: { b: 'c' } };

      expect(function(){
        query(obj, {}, { $rename: { 'a.b': 'a' } });
      }).to.throwError(/\$rename target may not be a parent of source/);

      // even when the key doesn't exist
      expect(function(){
        query(obj, {}, { $rename: { 'r.r': 'r' } });
      }).to.throwError(/\$rename target may not be a parent of source/);
    });

    it('should complain about non-object parent', function(){
      var obj = { a: 'b' };
      expect(function(){
        query(obj, {}, { $rename: { 'a.b.c': 'b' } });
      }).to.throwError(/\$rename source field invalid/);
      expect(obj).to.eql({ a: 'b' });
    });

    it('should work transactionally', function(){
      var obj = { a: 'b', c: 'd' };
      expect(function(){
        query(obj, {}, {
          // works
          $rename: { a: 'b' },
          // fails
          $set: { 'c.d': 'tobi' }
        });
      }).to.throwError(/only supports object not string/);
      expect(obj).to.eql({ a: 'b', c: 'd' });
    });
  });

  describe('$inc', function(){
    it('should inc', function(){
      var obj = { a: 3 };
      var ret = query(obj, {}, { $inc: { a: 1 } });
      expect(obj).to.eql({ a: 4 });
    });

    it('should inc (custom)', function(){
      var obj = { a: 3 };
      var ret = query(obj, {}, { $inc: { a: -3 } });
      expect(obj).to.eql({ a: 0 });
    });

    it('should inc nested', function(){
      var obj = { a: { b: 3 } };
      var ret = query(obj, {}, { $inc: { 'a.b': -3 } });
      expect(obj).to.eql({ a: { b: 0 } });
    });

    it('should initialize to the provided value', function(){
      var obj = { hello: 'world' };
      var ret = query(obj, {}, { $inc: { a: 3 } });
      expect(obj).to.eql({ hello: 'world', a: 3 });
    });

    it('should initialize to the provided value nested', function(){
      var obj = { hello: 'world' };
      var ret = query(obj, {}, { $inc: { 'a.b': -3 } });
      expect(obj).to.eql({ hello: 'world', a: { b: -3 } });
    });

    it('should complain about non-numeric increments', function(){
      var obj  = { a: 5 };
      expect(function(){
        query(obj, {}, { $inc: { a: '1' } });
      }).to.throwError(/Modifier \$inc allowed for numbers only/);
      expect(obj).to.eql({ a: 5 });
    });

    it('should complain about non-numeric targets', function(){
      var obj  = { hello: 'world' };
      expect(function(){
        query(obj, {}, { $inc: { hello: 1 } });
      }).to.throwError(/Cannot apply \$inc modifier to non-number/);
      expect(obj).to.eql({ hello: 'world' });
    });

    it('should complain about array target', function(){
      var obj  = { hello: [{ a: 1 }, { a: 2 }] };
      expect(function(){
        query(obj, {}, { $inc: { 'hello.a': 1 } });
      }).to.throwError(/can\'t append to array using string field name \[a\]/);
      expect(obj).to.eql({ hello: [{ a: 1 }, { a: 2 }] });
    });

    it('should work transactionally', function(){
      var obj = { a: 1, c: 'd' };
      expect(function(){
        query(obj, {}, {
          // works
          $inc: { a: 1 },
          // fails
          $set: { 'c.d': 'tobi' }
        });
      }).to.throwError(/only supports object not string/);
      expect(obj).to.eql({ a: 1, c: 'd' });
    });
  });

  describe('$pop', function(){

  });

  describe('$push', function(){

  });

  describe('$pull', function(){

  });

  describe('$pullAll', function(){

  });

});
