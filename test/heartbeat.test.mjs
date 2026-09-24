import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createHeartbeat, ENDPOINT } = require('../electron/heartbeat.cjs');

const INFO = { version: '0.2.8', platform: 'macos', os_version: '26.0.0', arch: 'arm64', channel: 'release' };
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function setup({ status = 204, fail = false, day = '2026-09-23T12:00:00Z' } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'strix-hb-'));
  const stateFile = path.join(dir, 'analytics.json');
  const calls = [];
  let now = new Date(day);
  const fetchImpl = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) });
    if (fail) throw new Error('offline');
    return { ok: status >= 200 && status < 300, status };
  };
  const hb = createHeartbeat({ stateFile, info: INFO, fetchImpl, now: () => now });
  return { hb, calls, stateFile, setNow: (d) => { now = new Date(d); } };
}

test('sends one heartbeat per UTC day with only anonymous fields', async () => {
  const { hb, calls, setNow } = setup();
  assert.equal(await hb.tick(), true);
  assert.equal(await hb.tick(), false);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, ENDPOINT);
  assert.equal(calls[0].init.method, 'POST');
  const body = calls[0].body;
  assert.deepEqual(Object.keys(body).sort(), ['arch', 'channel', 'install_id', 'os_version', 'platform', 'product', 'version']);
  assert.equal(body.product, 'strix');
  assert.match(body.install_id, UUID_V4);

  setNow('2026-09-24T00:00:01Z');
  assert.equal(await hb.tick(), true);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].body.install_id, body.install_id, 'install ID is stable across days');
});

test('opting out sends nothing and persists', async () => {
  const { hb, calls, stateFile } = setup();
  assert.equal(hb.isEnabled(), true, 'on by default');
  hb.setEnabled(false);
  assert.equal(await hb.tick(), false);
  assert.equal(calls.length, 0);
  const again = createHeartbeat({ stateFile, info: INFO, fetchImpl: async () => { throw new Error('should not send'); } });
  assert.equal(again.isEnabled(), false);
  assert.equal(await again.tick(), false);
});

test('failures are silent and retried on a later tick, not marked sent', async () => {
  const offline = setup({ fail: true });
  assert.equal(await offline.hb.tick(), false);
  assert.equal(await offline.hb.tick(), false);
  assert.equal(offline.calls.length, 2);

  const rejected = setup({ status: 400 });
  assert.equal(await rejected.hb.tick(), false);
  const saved = JSON.parse(fs.readFileSync(rejected.stateFile, 'utf8'));
  assert.equal(saved.lastSentDay, undefined);
  assert.match(saved.installId, UUID_V4);
});
