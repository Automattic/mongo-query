
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

  Depending on the type of operation they can contain extra fields.

#### $set

  - `before` value before it was changed
  - `after` new value

#### $pop

  - `value` value that was popped
  - `shift` if true, it was a shift instead of a pop

#### $rename

  - `before` name of the key to be renamed
  - `after` new name

#### $push

  - `value` value that was pushed
  - `init` whether the array was initialized as a result of this op

#### $pushAll

  - `values` values that were pushed
  - `init` whether the array was initialized as a result of this op

#### $pull

  - `value` value that was pulled

#### $pullAll

  - `values` values that were pulled

#### $unset

  - no extra fields

// operation with a query (needed for the positional operator)
changes = query(obj, { 'likes.name': 'Food' }, { $set: { 'likes.$.name': 'Dirt' } });
