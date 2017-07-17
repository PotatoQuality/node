'use strict';
require('../common');
const assert = require('assert');

// Changing the value of the global process property should not break Node.
global.process = null;
assert.strictEqual(process, null);
