import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(
  new URL('../components/sixteen/screens/ExamBreak.jsx', import.meta.url),
  'utf8',
);

test('ExamBreak labels the completed section without referencing undefined state', () => {
  assert.equal(source.includes('justDone'), false);
  assert.match(source, /previousSection/);
  assert.match(source, /exam\.results/);
});
