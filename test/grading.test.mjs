import test from 'node:test';
import assert from 'node:assert/strict';
import { isValueCorrect, normalizeSpr, questionHasKey } from '../lib/practice/grading.mjs';

const mcq = { type: 'mcq', correct: ['B'] };
const spr = { type: 'spr', correct: ['3/4', '.75', '0.75'] };

test('mcq grading matches the correct letter exactly', () => {
  assert.equal(isValueCorrect(mcq, 'B'), true);
  assert.equal(isValueCorrect(mcq, 'A'), false);
  assert.equal(isValueCorrect(mcq, ''), false);
  assert.equal(isValueCorrect(mcq, null), false);
  assert.equal(isValueCorrect(mcq, undefined), false);
});

test('spr grading accepts any listed form, ignoring whitespace and case', () => {
  assert.equal(isValueCorrect(spr, '3/4'), true);
  assert.equal(isValueCorrect(spr, ' 0.75 '), true);
  assert.equal(isValueCorrect(spr, '.75'), true);
  assert.equal(isValueCorrect(spr, '3 / 4'), true);
  assert.equal(isValueCorrect(spr, '4/3'), false);
  assert.equal(isValueCorrect(spr, ''), false);
});

test('grading a question with no key is never correct', () => {
  assert.equal(isValueCorrect({ type: 'mcq' }, 'A'), false);
  assert.equal(isValueCorrect({ type: 'mcq', correct: [] }, 'A'), false);
});

test('normalizeSpr strips whitespace and lowercases', () => {
  assert.equal(normalizeSpr('  1 2 '), '12');
  assert.equal(normalizeSpr(null), '');
});

test('questionHasKey detects a usable answer key', () => {
  assert.equal(questionHasKey(mcq), true);
  assert.equal(questionHasKey({ type: 'mcq', correct: [] }), false);
  assert.equal(questionHasKey({}), false);
  assert.equal(questionHasKey(null), false);
});
