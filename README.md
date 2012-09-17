
# mongo-query

Component that implements the complete MongoDB query JSON API to operate
on individual documents.

## How to use

```javascript
var query = require('mongo-query');

// our sample document
var obj = {
  name: 'Tobi',
  age: 8,
  location: { country: 'Canada', zip: 123 }
  likes: [{ id: 1, name: 'Food' }, { id: 2, name: 'Stuff' }]
};

// operations return an array of modification objects
var changes;

// simple operation
changes = query(obj, { $set: { name: 'Jane', age: 8 } });
obj.name // 'changed'
changes // [{ key: 'name', type: '$set', before: 'Tobi', after: 'TJ' }]

// noop
changes = query(obj, { $set: {} });
changes // []

// target nested
changes = query(obj, { $set: { 'location.country': 'BC' } });
changes // [{ key: 'location.country', type: '$set', before: 'Canada', after: 'BC' }]

// $pop
changes = query(obj, { $pop: { 'likes.name': 'Food' } });
changes // [{ key: 'likes', type: '$pop', match: { name: 'Food' }, popped: [{ id: 1, name: 'Food' }] ]

// $rename
changes = query(obj, { $rename: { name: 'first' } });
changes = [{ key: 'name', type: '$rename', before: 'name', after: 'first' }]

// $push (to new array)
changes = query(obj, { $push: { inexistent: 1 } });
obj.inexistent // [1]
changes = [{ key: 'inexistent', type: $push, values: [1], init: true }]

// $push (to existing array)
changes = query(obj, { $push: { inexistent: 2 } });
obj.inexistent // [1, 2]
changes = [{ key: 'inexistent', type: $push, values: [2], init: false }]

// $pushAll
changes = query(obj, { $pushAll: { inexistent: [3, 4] } });
obj.inexistent // [1, 2, 3, 4]
changes = [{ key: 'inexistent', type: $push, values: [3, 4], init: false }]

// operation with a query (needed for the positional operator)
changes = query(obj, { $set: { 'likes.$.name': 'Dirt' } }, { 'likes.name': 'Food' });
```
