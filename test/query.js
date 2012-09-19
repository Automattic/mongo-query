
var query = require('..');
var expect = require('expect.js');

describe('query', function(){

  it('should expose #get', function(){
    expect(query.get({ a: { b: 'c' } }, 'a.b')).to.be('c');
  });

  it('should expose #set', function(){
    var obj = { a: 'b', c: { d: 'e' } };
    expect(query.get(obj, 'c.f')).to.be(undefined);
    query.set(obj, 'c.f', 'g');
    expect(query.get(obj, 'c.f')).to.be('g');
  });

});
