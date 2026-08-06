import test from 'node:test';
import assert from 'node:assert/strict';
import { isValueCorrect, normalizeSpr, parseSprNumber, questionHasKey, sprsMatch } from '../lib/practice/grading.mjs';

const mcq = { type: 'mcq', correct: ['B'] };
const spr = { type: 'spr', correct: ['3/4', '.75'] };
const sprDotOnly = { type: 'spr', correct: ['.48', '12/25'] };

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

test('spr grading accepts 0.48 when the key only lists .48 or 12/25', () => {
  assert.equal(isValueCorrect(sprDotOnly, '0.48'), true);
  assert.equal(isValueCorrect(sprDotOnly, '.48'), true);
  assert.equal(isValueCorrect(sprDotOnly, '12/25'), true);
  assert.equal(isValueCorrect(sprDotOnly, '0.480'), true);
  assert.equal(isValueCorrect(sprDotOnly, '48/100'), true);
  assert.equal(isValueCorrect(sprDotOnly, '0.49'), false);
});

test('grading a question with no key is never correct', () => {
  assert.equal(isValueCorrect({ type: 'mcq' }, 'A'), false);
  assert.equal(isValueCorrect({ type: 'mcq', correct: [] }, 'A'), false);
});

test('normalizeSpr strips whitespace and lowercases', () => {
  assert.equal(normalizeSpr('  1 2 '), '12');
  assert.equal(normalizeSpr(null), '');
});

test('parseSprNumber handles decimals and fractions', () => {
  assert.equal(parseSprNumber('.48'), 0.48);
  assert.equal(parseSprNumber('0.48'), 0.48);
  assert.equal(parseSprNumber('12/25'), 0.48);
  assert.equal(parseSprNumber('abc'), null);
});

test('sprsMatch equates decimal/fraction forms', () => {
  assert.equal(sprsMatch('0.48', '.48'), true);
  assert.equal(sprsMatch('0.48', '12/25'), true);
  assert.equal(sprsMatch('3/4', '.75'), true);
  assert.equal(sprsMatch('1', '2'), false);
});

test('questionHasKey detects a usable answer key', () => {
  assert.equal(questionHasKey(mcq), true);
  assert.equal(questionHasKey({ type: 'mcq', correct: [] }), false);
  assert.equal(questionHasKey({}), false);
  assert.equal(questionHasKey(null), false);
});
