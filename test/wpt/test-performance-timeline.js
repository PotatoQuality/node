'use strict';

// Flags: --expose-internals

require('../common');
const { WPTRunner } = require('../common/wpt');
const { performance, PerformanceObserver } = require('perf_hooks');

const runner = new WPTRunner('performance-timeline');

runner.defineGlobal('performance', {
  get() {
    return performance;
  }
});
runner.defineGlobal('PerformanceObserver', {
  value: PerformanceObserver
});

runner.runJsTests();
