'use strict';
const common = require('../common');
const tmpdir = require('../common/tmpdir');
const fs = require('fs');
const assert = require('assert');
const util = require('util');
const { join } = require('path');
const { spawnSync } = require('child_process');

// Test that --prof also tracks Worker threads.
// Refs: https://github.com/nodejs/node/issues/24016

if (process.argv[2] === 'child') {
  console.log('child | in child');
  let files = fs.readdirSync(tmpdir.path);
  const plog = files.filter((name) => /\.log$/.test(name))[0];
  if (plog === undefined) {
    console.error('`--prof` did not produce a profile log for parent thread!');
    process.exit(1);
  }
  console.log('child | found plog');
  const pingpong = `
  let counter = 0;
  const { Worker, parentPort  } = require('worker_threads');
  console.log('worker | in worker')
  parentPort.on('message', (m) => {
    console.log('worker | received message')
    if (counter++ === 1024) {
      console.log('worker | end')
      process.exit(0);
     }
     parentPort.postMessage(
       m.toString().split('').reverse().toString().replace(/,/g, ''));
       console.log('worker | posted message')
  });
  `;

  const { Worker } = require('worker_threads');
  const data = 'x'.repeat(1024);
  const w = new Worker(pingpong, { eval: true });
  console.log('child | created worker');
  w.on('message', (m) => {
    console.log('child | received message');
    w.postMessage(m.toString().split('').reverse().toString().replace(/,/g, ''));
    console.log('child | posted message');
  });

  w.on('exit', common.mustCall(() => {
    console.log('child | worker exited');
    files = fs.readdirSync(tmpdir.path);
    const wlog = files.filter((name) => /\.log$/.test(name) && name !== plog)[0];
    if (wlog === undefined) {
      console.error('`--prof` did not produce a profile log' +
                    ' for worker thread!');
      process.exit(1);
    }
    console.log('child | done');
    process.exit(0);
  }));
  w.postMessage(data);
  console.log('child | posted first message');
} else {
  console.log('parent | in parent');
  tmpdir.refresh();
  const spawnResult = spawnSync(
    process.execPath, ['--prof', __filename, 'child'],
    { cwd: tmpdir.path, encoding: 'utf8', stdio: 'inherit' });
  console.log('parent | child terminated');
  // assert.strictEqual(spawnResult.stderr.toString(), '',
  //                    `child exited with an error: \
  //                    ${util.inspect(spawnResult)}`);
  assert.strictEqual(spawnResult.signal, null,
                     `child exited with signal: ${util.inspect(spawnResult)}`);
  assert.strictEqual(spawnResult.status, 0,
                     `child exited with non-zero status: \
                     ${util.inspect(spawnResult)}`);
  const files = fs.readdirSync(tmpdir.path);
  const logfiles = files.filter((name) => /\.log$/.test(name));
  assert.strictEqual(logfiles.length, 2);  // Parent thread + child thread.
  console.log('parent | verified logfiles are there');
  for (const logfile of logfiles) {
    const lines = fs.readFileSync(
      join(tmpdir.path, logfile), 'utf8').split('\n');
    const ticks = lines.filter((line) => /^tick,/.test(line)).length;

    // Test that at least 15 ticks have been recorded for both parent and child
    // threads. When not tracking Worker threads, only 1 or 2 ticks would
    // have been recorded.
    // When running locally on x64 Linux, this number is usually at least 200
    // for both threads, so 15 seems like a very safe threshold.
    assert(ticks >= 15, `${ticks} >= 15`);
  }
  console.log('parent | finish');
}
