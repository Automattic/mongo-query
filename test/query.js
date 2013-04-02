
var query = require('..');
var expect = require('expect.js');

describe('query', function(){

  describe('$set', function(){
    it('should $set simple key', function(){
      var obj = { a: 'b' };
      var ret = query(obj, {}, { $set: { a: 'c' } });
      expect(obj).to.eql({ a: 'c' });
      expect(ret).to.eql([{ op: '$set', key: 'a', value: 'c' }]);
    });

    it('should $set nested', function(){
      var obj = { a: { b: 'c' } };
      var ret = query(obj, {}, { $set: { 'a.b': 'e' } });
      expect(obj).to.eql({ a: { b: 'e' } });
      expect(ret).to.eql([{ op: '$set', key: 'a.b', value: 'e' }]);
    });

    it('should initialize nested', function(){
      var obj = {};
      var ret = query(obj, {}, { $set: { 'a.b.c': 'd' } });
      expect(obj).to.eql({ a: { b: { c: 'd' } } });
    });

    it('should set array members', function(){
      var obj = { a: [1, 2, 3] };
      var ret = query(obj, {}, { $set: { 'a.1': 'd' } });
      expect(obj).to.eql({ a: [1, 'd', 3] });
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

    it('should work with positional operator', function(){
      var obj = {
        pets: [
          { id: 1, name: 'tobi' },
          { id: 2, name: 'loki' },
          { id: 3, name: 'jane' }
        ]
      };

      var ret = query(obj, { 'pets.id': 2 }, { $set: { 'pets.$.name': 'LOKI' } });
      expect(ret).to.eql([{ op: '$set', key: 'pets.1.name', value: 'LOKI' }]);

      expect(obj).to.eql({
        pets: [
          { id: 1, name: 'tobi' },
          { id: 2, name: 'LOKI' },
          { id: 3, name: 'jane' }
        ]
      });
    });

    it('should not log noops', function(){
      var obj = { a: 'b' };
      expect(query(obj, {}, { $set: { a: 'b' } })).to.eql([]);
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
      expect(ret).to.eql([{ op: '$rename', key: 'a', value: 'b' }]);
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

    it('should inc array members', function(){
      var obj = { a: [3] };
      var ret = query(obj, {}, { $inc: { 'a.0': -3 } });
      expect(obj).to.eql({ a: [0] });
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
    it('should pop', function(){
      var obj = { a: [1,2,3] };
      var ret = query(obj, {}, { $pop: { a: 1 } });
      expect(obj).to.eql({ a: [1, 2] });
    });

    it('should shift', function(){
      var obj = { a: [1,2,3] };
      var ret = query(obj, {}, { $pop: { a: -1 } });
      expect(obj).to.eql({ a: [2, 3] });
    });

    it('should pop nested', function(){
      var obj = { a: { hello: [1,2,3] } };
      var ret = query(obj, {}, { $pop: { 'a.hello': -1 } });
      expect(obj).to.eql({ a: { hello: [2, 3] } });
    });

    it('should work with empty arrays', function(){
      var obj = { a: [] };
      var ret = query(obj, {}, { $pop: { a: 1 } });
      expect(obj).to.eql({ a: [] });
    });

    it('should ignore inexisting keys', function(){
      var obj = { a: [1,2,3] };
      var ret = query(obj, {}, { $pop: { b: -1 } });
      expect(obj).to.eql({ a: [1, 2, 3] });
    });

    it('should complain about non-array types', function(){
      var obj = { a: 'string' };
      expect(function(){
        query(obj, {}, { $pop: { a: 1 } });
      }).to.throwError(/Cannot apply \$pop modifier to non-array/);
      expect(obj).to.eql({ a: 'string' });
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

  describe('$push', function(){
    it('should push', function(){
      var obj = { a: [] };
      var ret = query(obj, {}, { $push: { a: 1 } });
      expect(obj).to.eql({ a: [1] });
    });

    it('should push nested', function(){
      var obj = { a: { b: [] } };
      var ret = query(obj, {}, { $push: { 'a.b': [{ a: 1 }] } });
      expect(obj).to.eql({ a: { b: [[{ a: 1 }]] } });
    });

    it('should initialize', function(){
      var obj = {};
      var ret = query(obj, {}, { $push: { 'a.b': 1 } });
      expect(obj).to.eql({ a: { b: [1] } });
    });

    it('should push to array member', function(){
      var obj = { a: { b: [[]] } };
      var ret = query(obj, {}, { $push: { 'a.b.0': 'test' } });
      expect(obj).to.eql({ a: { b: [['test']] } });
    });

    it('should initialize array member', function(){
      var obj = { a: { b: [] } };
      var ret = query(obj, {}, { $push: { 'a.b.1': 'test' } });
      var arr = [];
      arr[1] = ['test'];
      expect(obj).to.eql({ a: { b: arr } });
    });

    it('should complain about non-array', function(){
      var obj = { a: 'hello' };
      expect(function(){
        query(obj, {}, { $push: { a: 'test' } });
      }).to.throwError(/Cannot apply \$push\/\$pushAll modifier to non-array/);
      expect(obj).to.eql({ a: 'hello' });
    });

    it('should complain about array field', function(){
      var obj = { a: [] };
      expect(function(){
        query(obj, {}, { $push: { 'a.test': 1 } });
      }).to.throwError(/can\'t append to array using string field name \[test\]/);
      expect(obj).to.eql({ a: [] });
    });

    it('should complain about non-array array member', function(){
      var obj = { a: [1, 2] };
      expect(function(){
        query(obj, {}, { $push: { 'a.1': 'test' } });
      }).to.throwError(/Cannot apply \$push\/\$pushAll modifier to non-array/);
      expect(obj).to.eql({ a: [1, 2] });
    });
  });

  describe('$pushAll', function(){
    it('should push', function(){
      var obj = { a: [] };
      var ret = query(obj, {}, { $pushAll: { a: [1, 2] } });
      expect(obj).to.eql({ a: [1, 2] });
    });

    it('should push nested', function(){
      var obj = { a: { b: [] } };
      var ret = query(obj, {}, { $pushAll: { 'a.b': [1, [{ a: 1 }]] } });
      expect(obj).to.eql({ a: { b: [1, [{ a: 1 }]] } });
    });

    it('should initialize', function(){
      var obj = {};
      var ret = query(obj, {}, { $pushAll: { 'a.b': [1] } });
      expect(obj).to.eql({ a: { b: [1] } });
    });

    it('should push to array member', function(){
      var obj = { a: { b: [[]] } };
      var ret = query(obj, {}, { $pushAll: { 'a.b.0': ['hello', 'world'] } });
      expect(obj).to.eql({ a: { b: [['hello', 'world']] } });
    });

    it('should initialize array member', function(){
      var obj = { a: { b: [] } };
      var ret = query(obj, {}, { $pushAll: { 'a.b.1': ['this', 'is', 'a', 'test'] } });
      var arr = [];
      arr[1] = ['this', 'is', 'a', 'test'];
      expect(obj).to.eql({ a: { b: arr } });
    });

    it('should complain about non-array', function(){
      var obj = { a: 'hello' };
      expect(function(){
        query(obj, {}, { $pushAll: { a: ['a', 'test'] } });
      }).to.throwError(/Cannot apply \$push\/\$pushAll modifier to non-array/);
      expect(obj).to.eql({ a: 'hello' });
    });

    it('should complain about array field', function(){
      var obj = { a: [] };
      expect(function(){
        query(obj, {}, { $pushAll: { 'a.test': [1] } });
      }).to.throwError(/can\'t append to array using string field name \[test\]/);
      expect(obj).to.eql({ a: [] });
    });

    it('should complain about non-array array member', function(){
      var obj = { a: [1, 2] };
      expect(function(){
        query(obj, {}, { $pushAll: { 'a.1': ['a', 'test'] } });
      }).to.throwError(/Cannot apply \$push\/\$pushAll modifier to non-array/);
      expect(obj).to.eql({ a: [1, 2] });
    });

    it('should complain about non-array value', function(){
      var obj = { a: [] };
      expect(function(){
        query(obj, {}, { $pushAll: { 'a.1': 'woot' } });
      }).to.throwError(/Modifier \$pushAll\/pullAll allowed for arrays only/);
      expect(obj).eql({ a: [] });
    });
  });

  describe('$pull', function(){
    it('should pull a number', function(){
      var obj = { arr: [1, '1', 2] };
      var ret = query(obj, {}, { $pull: { arr: 1 } });
      expect(obj).to.eql({ arr: ['1', 2] });
    });

    it('should pull multiple values', function(){
      var obj = { arr: [1, '1', 2, 1, 1, 1] };
      var ret = query(obj, {}, { $pull: { arr: 1 } });
      expect(obj).to.eql({ arr: ['1', 2] });
    });

    it('should treat nulls and undefined equally', function(){
      var obj = { arr: [null, undefined, 1, 2, null, 3, undefined] };
      query(obj, {}, { $pull: { arr: null } });
      expect(obj).to.eql({ arr: [1, 2, 3] });
    });

    it('should operate on the existing array instead of a new one', function(){
      var obj = { arr: ["aaa", "bbb"] };
      var ref = obj.arr;
      query(obj, {}, { $pull: { arr: "bbb" } });
      expect(ref).to.eql(["aaa"]);
    });

    it('should pull arrays based on exact match', function(){
      var obj = { arr: [ [{ 1: 2, 3: 4}], [true] ] };

      // attemp to pull first item of array
      var ret = query(obj, {}, { $pull: { arr: [{ 1: 2 }] } });
      expect(ret).to.eql([]);
      expect(obj).to.eql({ arr: [ [{ 1: 2, 3: 4}], [true] ] });

      // pull first item
      var ret = query(obj, {}, { $pull: { arr: [{ 1: 2, 3: 4 }] } });
      expect(obj).to.eql({ arr: [ [true] ] });

      // pull remaining item
      var ret = query(obj, {}, { $pull: { arr: [true] } });
      expect(obj).to.eql({ arr: [] });
    });

    it('should strip objects based on partial object matches', function(){
      var obj = {
        arr: [
          { hello: 'world' },
          { hello: 'world', extra: 'sth' },
          {},
          { a: 'b' },
          5
        ]
      };

      var ret = query(obj, {}, { $pull: { arr: { hello: 'world' } } });
      expect(obj).to.eql({ arr: [{}, { a: 'b' }, 5] });

      expect(ret).to.eql([{ op: '$pull', key: 'arr', value: [
        { hello: 'world' },
        { hello: 'world', extra: 'sth' }
      ]}]);

      var ret = query(obj, {}, { $pull: { arr: {} } });
      expect(obj).to.eql({ arr: [{ a: 'b' }, 5] });
    });

    it('should work with array members', function(){
      var obj = {
        arr: [
          500,
          [
            { hello: 'world' },
            { hello: 'world', extra: 'sth' },
            {},
            { a: 'b' },
            5
          ]
        ]
      };
      query(obj, {}, { $pull: { 'arr.1': { hello: 'world' } } });
      expect(obj).to.eql({ arr: [500, [{}, { a: 'b' }, 5]] });
      query(obj, {}, { $pull: { 'arr.1': {} } });
      expect(obj).to.eql({ arr: [500, [{ a: 'b' }, 5]] });
    });

    it('should fail silently when targetting non-array array member', function(){
      var obj = { a: [] };
      var ret = query(obj, {}, { $pull: { 'a.a': 'test' } });
      expect(ret).to.eql([]);
      expect(obj).to.eql({ a: [] });
    });

    it('should complain about non-array target', function(){
      var obj = { hello: 'world' };
      expect(function(){
        query(obj, {}, { $pull: { hello: 'world' } });
      }).to.throwError(/Cannot apply \$pull\/\$pullAll modifier to non-array/);
      expect(obj).to.eql({ hello: 'world' });
    });

    it('should complain about non-array subtarget', function(){
      var obj = { hello: 'world' };
      expect(function(){
        query(obj, {}, { $pull: { 'hello.a': 'world' } });
      }).to.throwError(/LEFT_SUBFIELD only supports Object: hello not:/);
      expect(obj).to.eql({ hello: 'world' });
    });

    it('should work transactionally', function(){
      var obj = { a: ['woot', 'woot'], hello: 'world' };
      expect(function(){
        query(obj, {}, {
          $pull: { 'a': 'woot' },
          $set: { 'hello.a': 'asdasd' }
        });
      }).to.throwError(/only supports object not string/);
      expect(obj).eql({ a: ['woot', 'woot'], hello: 'world' });
    });
  });

  describe('$pullAll', function(){
    it('should pull a number', function(){
      var obj = { arr: [1, '1', 2] };
      var ret = query(obj, {}, { $pullAll: { arr: [1, 2] } });
      expect(ret[0].value).to.eql([1, 2]);
      expect(obj).to.eql({ arr: ['1'] });
    });

    it('should pull multiple values', function(){
      var obj = { arr: [1, '1', 2, 1, 1, 1] };
      var ret = query(obj, {}, { $pullAll: { arr: [1, '1'] } });
      expect(ret[0].value).to.eql([1, '1', 1, 1, 1]);
      expect(obj).to.eql({ arr: [2] });
    });

    it('should treat nulls and undefined equally', function(){
      var obj = { arr: [null, undefined, 1, 2, null, 3, undefined] };
      query(obj, {}, { $pullAll: { arr: [null] } });
      expect(obj).to.eql({ arr: [1, 2, 3] });
    });

    it('should pull arrays based on exact match', function(){
      var obj = { arr: [ [{ 1: 2, 3: 4}], [true] ] };

      // attemp to pull first item of array
      var ret = query(obj, {}, { $pullAll: { arr: [[{ 1: 2 }]] } });
      expect(ret).to.eql([]);
      expect(obj).to.eql({ arr: [ [{ 1: 2, 3: 4}], [true] ] });

      // pull first item
      var ret = query(obj, {}, { $pullAll: { arr: [[{ 1: 2, 3: 4 }]] } });
      expect(obj).to.eql({ arr: [ [true] ] });

      // pull remaining item
      var ret = query(obj, {}, { $pullAll: { arr: [[true]] } });
      expect(obj).to.eql({ arr: [] });
    });

    it('should strip objects based on partial object matches', function(){
      var obj = {
        arr: [
          { hello: 'world' },
          { hello: 'world', extra: 'sth' },
          {},
          { a: 'b' },
          5
        ]
      };
      query(obj, {}, { $pullAll: { arr: [{ hello: 'world' }] } });
      expect(obj).to.eql({ arr: [{}, { a: 'b' }, 5] });
      query(obj, {}, { $pullAll: { arr: [{}] } });
      expect(obj).to.eql({ arr: [{ a: 'b' }, 5] });
    });

    it('should work with array members', function(){
      var obj = {
        arr: [
          500,
          [
            { hello: 'world' },
            { hello: 'world', extra: 'sth' },
            {},
            { a: 'b' },
            5
          ]
        ]
      };
      query(obj, {}, { $pullAll: { 'arr.1': [{ hello: 'world' }] } });
      expect(obj).to.eql({ arr: [500, [{}, { a: 'b' }, 5]] });
      query(obj, {}, { $pullAll: { 'arr.1': [{}] } });
      expect(obj).to.eql({ arr: [500, [{ a: 'b' }, 5]] });
    });

    it('should fail silently when targetting non-array array member', function(){
      var obj = { a: [] };
      var ret = query(obj, {}, { $pullAll: { 'a.a': ['test'] } });
      expect(ret).to.eql([]);
      expect(obj).to.eql({ a: [] });
    });

    it('should complain about non-array target', function(){
      var obj = { hello: 'world' };
      expect(function(){
        query(obj, {}, { $pullAll: { hello: ['world'] } });
      }).to.throwError(/Cannot apply \$pull\/\$pullAll modifier to non-array/);
      expect(obj).to.eql({ hello: 'world' });
    });

    it('should complain about non-array subtarget', function(){
      var obj = { hello: 'world' };
      expect(function(){
        query(obj, {}, { $pullAll: { 'hello.a': ['world'] } });
      }).to.throwError(/LEFT_SUBFIELD only supports Object: hello not:/);
      expect(obj).to.eql({ hello: 'world' });
    });

    it('should complain about non-array value', function(){
      var obj = { a: [] };
      expect(function(){
        query(obj, {}, { $pullAll: { 'a.1': 'woot' } });
      }).to.throwError(/Modifier \$pushAll\/pullAll allowed for arrays only/);
      expect(obj).eql({ a: [] });
    });

    it('should work transactionally', function(){
      var obj = { a: ['woot', 'woot'], hello: 'world' };
      expect(function(){
        query(obj, {}, {
          $pullAll: { 'a': ['woot'] },
          $set: { 'hello.a': 'asdasd' }
        });
      }).to.throwError(/only supports object not string/);
      expect(obj).eql({ a: ['woot', 'woot'], hello: 'world' });
    });
  });

  describe('$addToSet', function(){
    it('should add to set', function(){
      var obj = { a: ['a', 'b'] };
      query(obj, {}, { $addToSet: { a: 'c' } });
      expect(obj).to.eql({ a: ['a', 'b', 'c'] });
      query(obj, {}, { $addToSet: { a: 'c' } });
      expect(obj).to.eql({ a: ['a', 'b', 'c'] });
      query(obj, {}, { $addToSet: { a: { $each: ['a', 'b'] } } });
      expect(obj).to.eql({ a: ['a', 'b', 'c'] });
      query(obj, {}, { $addToSet: { a: { $each: ['d', 'e'] } } });
      expect(obj).to.eql({ a: ['a', 'b', 'c', 'd', 'e'] });
    });

    // TODO: missing tests (see `$push`)
  });

});
