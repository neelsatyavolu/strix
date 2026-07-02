import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const studentAssignmentsRoute = fs.readFileSync(
  new URL('../app/api/assignments/route.ts', import.meta.url),
  'utf8',
);
const tutorAssignmentsRoute = fs.readFileSync(
  new URL('../app/api/tutor/assignments/route.ts', import.meta.url),
  'utf8',
);

test('student assignment list returns scores recomputed with the current curve', () => {
  assert.match(studentAssignmentsRoute, /rescoreAssignments/);
});

test('tutor assignment list returns scores recomputed with the current curve', () => {
  assert.match(tutorAssignmentsRoute, /rescoreAssignments/);
});
