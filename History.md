
0.5.7 / 2015-03-12
==================

  * package: update "mongo-eql" to v1.0.0

0.5.6 / 2015-03-12
==================

  * ops: fix "component-type" require call
  * package: add "repository" field
  * remove component

0.5.5 / 2014-08-22
==================

  * ops: more component fixing
  * attempt to fix component build

0.5.4 / 2014-08-22
==================

  * package: use github version of mongo-eql v0.1.2

0.5.3 / 2014-08-22
==================

  * package: update "mongo-eql" to v0.1.2
  * Check for type in $gt, $lt, etc. and fix tests for $lte (#21, @vkarpov15)
  * remove duplicate manifest

0.5.2 / 2014-01-27
==================

  * fix type dep for browserify

0.5.1 / 2014-01-27
==================

  * package: bump dot

0.5.0 / 2014-01-27
==================

  * fix require madness
  * use new `mongo-eql` component

0.4.2 / 2013-04-02
==================

  * mods: fix `$pullAll` return value
  * test: added tests for `pullAll` `value` log entries

0.4.1 / 2013-02-24
==================

  * mods: (scary) fix for #15

0.4.0 / 2012-10-15
==================

  * filter: special case array ops (`$size`)
  * ops: added `$size`

0.3.3 / 2012-10-15
==================

  * package: fixed `ops.js` file declaration
  * *: replaced `object-component-2`

0.3.2 / 2012-10-14
==================

  * package: temporarily use `object-component-2`

0.3.1 / 2012-10-14
==================

  * package: added missing files

0.3.0 / 2012-10-12
==================

  * index: introduce `strict` mode (GH-8)
  * mods: added `$addToSet` (GH-9)

0.2.0 / 2012-10-05
==================

  * mods: avoid noop transactions (GH-6)
  * index: implement logging (GH-5)

0.1.0 / 2012-10-04
==================

  * *: initial release
