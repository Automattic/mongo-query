
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

// run an operation and get changes
var changes = query(obj, { $set: { 'location.country': 'US' } });
```

## API

### query(obj, filter, modifier)

  Executes the `modifier` on `obj` provided they match `filter`.
  Returns an array of change objects (see below). If the modifier does
  not alter the object the array will be empty.

### query.filter(query)

  Returns a `Query` object to perform tests on.

  Example: `query.filter({ a: { $gt: 3 } }).test({ a: 1 })`. For the
  complete filter API refer to
  [filtr](https://github.com/logicalparadox/filtr/).

### query.get(obj, key)

  Gets the `key` from the given `obj`, which can use [dot
  notation](http://www.mongodb.org/display/DOCS/Dot+Notation+(Reaching+into+Objects)).

  Example: `query.get(obj, 'some.key')`.

### query.set(obj, key, val)

  Sets the `key` on `obj` with the given `val`. Key can use [dot
  notation](http://www.mongodb.org/display/DOCS/Dot+Notation+(Reaching+into+Objects)).

### change

  All change objects contain:
  - `key`: the key that was affected. If the positional operator was used,
    the key is rewritten with dot notation (eg: `comments.3.date`).
  - `type`: the type of operation that was performed
  - `before`: value of the key before it was changed (cloned)
  - `after`: new value of the key

  Depending on the type of operation they can contain extra fields.

#### $set

  - `value` that we set

#### $inc

  - `value` value that we increment by

#### $pop

  - `value` value that was popped
  - `shift` if true, it was a shift instead of a pop

#### $rename

  - `value` new name

#### $push

  - `value` value that was pushed

#### $pushAll

  - `value` array of values that were pushed

#### $pull

  - `value` value that was pulled

#### $pullAll

  - `value` array of values that were pulled

#### $unset

  - `value` (`undefined`)
