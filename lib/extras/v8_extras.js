(function(global, binding, v8) {
  'use strict';
  const Object = global.Object;
  Object.defineProperty(global, 'v8Extras', {
    value: v8,
    configurable: true
  });
});
