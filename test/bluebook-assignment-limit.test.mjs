import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const routeSource = fs.readFileSync(new URL('../app/api/tutor/assignments/route.ts', import.meta.url), 'utf8');
const migrationSource = fs.readFileSync(new URL('../supabase/migrations/0008_assignment_full_tests.sql', import.meta.url), 'utf8');
const upgradeMigrationSource = fs.readFileSync(
  new URL('../supabase/migrations/0009_bluebook_11_assignment_constraint.sql', import.meta.url),
  'utf8',
);

test('tutor assignment validation accepts Bluebook practice test 11', () => {
  assert.match(routeSource, /bluebookTest:\s*z\.number\(\)\.int\(\)\.min\(5\)\.max\(11\)/);
});

test('assignments table constraint accepts Bluebook practice test 11', () => {
  assert.match(migrationSource, /bluebook_test between 5 and 11/);
});

test('existing assignments table constraint is upgraded for Bluebook practice test 11', () => {
  assert.match(upgradeMigrationSource, /drop constraint if exists assignments_bluebook_test_check/);
  assert.match(upgradeMigrationSource, /bluebook_test between 5 and 11/);
});
