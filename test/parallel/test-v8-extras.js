'use strict';

// Flags: --expose-internals

// Check that extras are never available globally
if (global.v8Extras !== undefined) {
  throw new Error('v8 extras should not leak to the user script!');
}

const common = require('../common');
const assert = require('assert');
const v8Extras = require('internal/v8_extras');

const privateSymbol = v8Extras.createPrivateSymbol('private');
assert.strictEqual(typeof privateSymbol, 'symbol');

const o = {};
o[privateSymbol] = 42;
assert.strictEqual(o[privateSymbol], 42);
assert.deepStrictEqual(Object.getOwnPropertySymbols(o), []);

{
  const promise = v8Extras.createPromise();
  assert(promise instanceof Promise);
  promise.then(common.mustCall(function(result) {
    assert.strictEqual(result, 42);
  }));
  v8Extras.resolvePromise(promise, 42);
}

{
  const promise = v8Extras.createPromise();
  promise.catch(common.mustCall(function(error) {
    assert.strictEqual(error, 'error');
  }));
  v8Extras.rejectPromise(promise, 'error');
}
