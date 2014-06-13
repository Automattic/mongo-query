
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
      expect(ops.$gt(false, 4)).to.be(false);
    });

    it('gte', function(){
      expect(ops.$gte(4, 5)).to.be(true);
      expect(ops.$gte(4, 4)).to.be(true);
      expect(ops.$gte(5, 4)).to.be(false);
      expect(ops.$gte(false, 4)).to.be(false);
    });

    it('lt', function(){
      expect(ops.$gt(4, 5)).to.be(true);
      expect(ops.$gt(4, 4)).to.be(false);
      expect(ops.$gt(false, 4)).to.be(false);
    });

    it('lte', function(){
      expect(ops.$lte(4, 5)).to.be(false);
      expect(ops.$lte(4, 4)).to.be(true);
      expect(ops.$lte(false, 4)).to.be(false);
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

    it('size', function(){
      expect(ops.$size(1, [1])).to.be(true);
      expect(ops.$size(3, [1,2,3])).to.be(true);
      expect(ops.$size(0, [1])).to.be(false);
      expect(ops.$size(0, [])).to.be(true);
    });
  });

  describe('simple', function(){
    it('single key', function(){
      var obj = { a: 'b', c: 'd' };
      expect(filter(obj, { a: 'b' })).to.eql({});
      expect(filter(obj, { a: 'c' })).to.be(false);
    });

    it('custom operators', function(){
      var obj = { name: 'tobi', age: 5 };
      expect(filter(obj, { name: /t/ })).to.eql({});
      expect(filter(obj, { age: { $gt: 3 } })).to.eql({});
      expect(filter(obj, { age: { $gt: 10 } })).to.eql(false);
    });

    it('multiple keys', function(){
      var obj = { a: 'b', c: 'd' };
      expect(filter(obj, { a: 'b', c: 'd' })).to.eql({});
      expect(filter(obj, { a: { $in: ['b', 'c'] }, c: 'd' })).to.eql({});
      expect(filter(obj, { a: { $in: ['b', 'c'] }, c: false })).to.eql(false);
    });
  });

  describe('arrays', function(){
    it('simple', function(){
      var ret = filter({
        a: {
          b: [1, 2, 3, 1]
        }
      }, { 'a.b': 1 });

      expect(ret).to.eql({ 'a.b': [1, 1] });
    });

    it('subdocuments', function(){
      var ret = filter({
        a: {
          b: {
            c: [
              { d: 5, hello: 'world' },
              { d: 3, hello: 'world 2' },
              { d: 5, tobi: 'ferret' },
            ]
          }
        }
      }, { 'a.b.c.d': 5 });

      expect(ret).to.eql({ 'a.b.c': [
        { d: 5, hello: 'world' },
        { d: 5, tobi: 'ferret' }
      ] });
    });

    it('subdocuments nested', function(){
      var ret = filter({
        a: {
          b: [
            { name: { first: 'Guillermo', last: 'Rauch' } },
            { name: { first: 'Guillermo', last: 'Ranch' } },
            { name: { first: 'Thianh', last: 'Lu' } }
          ]
        }
      }, { 'a.b.name.first': /^G/ });

      expect(ret).to.eql({
        'a.b': [
          { name: { first: 'Guillermo', last: 'Rauch' } },
          { name: { first: 'Guillermo', last: 'Ranch' } }
        ]
      });
    });

    it('query operators', function(){
      var ret = filter({
        ferrets: [
          { name: 'tobi', likes: [] },
          { name: 'loki', likes: [] },
          { name: 'jane', likes: ['food'] }
        ]
      }, { 'ferrets.likes': { $size: 1 } });

      expect(ret).to.eql({
        ferrets: [{ name: 'jane', likes: ['food'] }]
      });
    });

    it('query subset narrow down', function(){
      var ret = filter({
        ferrets: [
          { name: 'tobi', age: 5 },
          { name: 'tobo', age: 4 },
          { name: 'tomas', age: 10 }
        ]
      }, { 'ferrets.name': /^t/, 'ferrets.age': { $lt: 8 } });

      expect(ret).to.eql({
        ferrets: [
          { name: 'tobi', age: 5 },
          { name: 'tobo', age: 4 },
          { name: 'tomas', age: 10 }
        ]
      });
    });

    it('$elemMatch', function(){
      var ret = filter({
        ferrets: [
          { name: 'tobi', age: 5 },
          { name: 'tobo', age: 4 },
          { name: 'tomas', age: 10 }
        ]
      }, {
        ferrets: {
          $elemMatch: {
            name: /to/,
            age: 4
          }
        }
      });

      expect(ret).to.eql({
        ferrets: [
          { name: 'tobo', age: 4 }
        ]
      });
    });

    it('multiple matches', function(){
      var ret = filter({
        ferrets: [
          { name: 'tobi', age: 5 },
          { name: 'loki', age: 3 },
          { name: 'jane', age: 8 }
        ],
        people: [
          { name: 'tj', programmer: true },
          { name: 'marco', programmer: true },
          { name: 'thianh', programmer: false },
          { name: 'meredith', programmer: false }
        ]
      }, { 'ferrets.age': { $gte: 5 }, 'people.programmer': true });

      expect(ret).to.eql({
        ferrets: [
          { name: 'tobi', age: 5 },
          { name: 'jane', age: 8 }
        ],
        people: [
          { name: 'tj', programmer: true },
          { name: 'marco', programmer: true }
        ]
      });
    });

    it('conflicting matches', function(){
      var ret = filter({
        a: [{ b: 'c' }],
        hello: 'world'
      }, { 'a.b': 'c', hello: 'test' });

      expect(ret).to.be(false);
    });
  });

});
