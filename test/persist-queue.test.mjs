import test from 'node:test';
import assert from 'node:assert/strict';
import { enqueuePending, flushPending, readPending } from '../lib/practice/persistQueue.mjs';

function fakeStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

test('enqueue stores payloads and caps the queue at its max, keeping newest', () => {
  const storage = fakeStorage();
  for (let i = 0; i < 12; i++) enqueuePending(storage, { n: i }, 1000 + i);
  const entries = readPending(storage);
  assert.equal(entries.length, 8);
  assert.equal(entries[0].body.n, 4);
  assert.equal(entries[7].body.n, 11);
});

test('flush delivers entries and removes them from the queue', async () => {
  const storage = fakeStorage();
  enqueuePending(storage, { n: 1 }, 1000);
  enqueuePending(storage, { n: 2 }, 1001);
  const sent = [];
  const res = await flushPending(storage, async (body) => {
    sent.push(body.n);
    return { ok: true };
  }, 2000);
  assert.deepEqual(sent, [1, 2]);
  assert.deepEqual(res, { sent: 2, kept: 0 });
  assert.equal(readPending(storage).length, 0);
});

test('flush keeps transient failures for the next attempt', async () => {
  const storage = fakeStorage();
  enqueuePending(storage, { n: 1 }, 1000);
  const res = await flushPending(storage, async () => ({ ok: false, permanent: false }), 2000);
  assert.deepEqual(res, { sent: 0, kept: 1 });
  assert.equal(readPending(storage)[0].body.n, 1);
});

test('flush drops permanent rejections and thrown posts stay queued', async () => {
  const storage = fakeStorage();
  enqueuePending(storage, { n: 1 }, 1000);
  enqueuePending(storage, { n: 2 }, 1001);
  const res = await flushPending(storage, async (body) => {
    if (body.n === 1) return { ok: false, permanent: true };
    throw new Error('network');
  }, 2000);
  assert.deepEqual(res, { sent: 0, kept: 1 });
  assert.equal(readPending(storage)[0].body.n, 2);
});

test('flush expires entries older than the max age', async () => {
  const storage = fakeStorage();
  const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;
  enqueuePending(storage, { n: 1 }, 1000);
  const res = await flushPending(storage, async () => ({ ok: true }), 1000 + twoWeeksMs + 1);
  assert.deepEqual(res, { sent: 0, kept: 0 });
  assert.equal(readPending(storage).length, 0);
});

test('a corrupt queue reads as empty instead of throwing', () => {
  const storage = fakeStorage();
  storage.setItem('strix-pending-sessions', '{not json');
  assert.deepEqual(readPending(storage), []);
});
