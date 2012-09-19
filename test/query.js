
var query = require('..');
var expect = require('expect.js');

describe('query', function(){

  it('should expose #get', function(){
    expect(query.get({ a: { b: 'c' } }, 'a.b')).to.be('c');
  });

});
