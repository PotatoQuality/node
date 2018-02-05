'use strict';

const { makeRequireFunction } = require('internal/module');
const { URL } = require('internal/url');
const Module = require('module');

const {
  setInitializeImportMetaObjectCallback
} = internalBinding('module_wrap');
const { defineProperty } = Object;

function initializeImportMetaObject(wrap, meta) {
  meta.url = wrap.url;
  let req;
  defineProperty(meta, 'require', {
    enumerable: true,
    configurable: true,
    get() {
      if (req !== undefined)
        return req;
      const url = new URL(meta.url);
      const path = url.pathname;
      const mod = new Module(path, null);
      mod.filename = path;
      req = makeRequireFunction(mod);
      return req;
    }
  });
}

function setupModules() {
  setInitializeImportMetaObjectCallback(initializeImportMetaObject);
}

module.exports = {
  setup: setupModules
};
