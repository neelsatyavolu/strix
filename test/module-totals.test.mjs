import test from 'node:test';
import assert from 'node:assert/strict';
import { moduleTotalsForScore, OFFICIAL_MODULE_SIZE } from '../lib/scoring/moduleTotals.mjs';

function answers(module, correct, total) {
  return Array.from({ length: total }, (_, i) => ({
    module,
    isCorrect: i < correct,
  }));
}

test('saved module length counts skips that were not persisted', () => {
  const totals = moduleTotalsForScore({
    section: 'rw',
    config: { moduleScores: [{ correct: 18, total: 27 }, { correct: 20, total: 27 }] },
    answers: [...answers('m1', 18, 20), ...answers('m2', 20, 22)],
  });
  assert.deepEqual(totals, [
    { correct: 18, total: 27 },
    { correct: 20, total: 27 },
  ]);
});

test('a reported total cannot shrink below the stored answers or past the official length', () => {
  const totals = moduleTotalsForScore({
    section: 'math',
    config: { moduleScores: [{ total: 1 }, { total: 99 }] },
    answers: [...answers('m1', 10, 12), ...answers('m2', 8, 10)],
  });
  assert.deepEqual(totals, [
    { correct: 10, total: 12 },
    { correct: 8, total: 10 },
  ]);
  assert.equal(OFFICIAL_MODULE_SIZE.math, 22);
});

test('older fixed forms pad a short persisted module up to the official length', () => {
  const totals = moduleTotalsForScore({
    section: 'rw',
    config: { bluebookTest: 6 },
    answers: [...answers('m1', 20, 20), ...answers('m2', 15, 18)],
  });
  assert.deepEqual(totals, [
    { correct: 20, total: 27 },
    { correct: 15, total: 27 },
  ]);
});

test('a question-bank section without a saved length is not padded', () => {
  const totals = moduleTotalsForScore({
    section: 'math',
    config: { bluebookTest: null },
    answers: [...answers('m1', 10, 12), ...answers('m2', 8, 9)],
  });
  assert.deepEqual(totals, [
    { correct: 10, total: 12 },
    { correct: 8, total: 9 },
  ]);
});

test('an explicit served length beats fixed-form padding', () => {
  const totals = moduleTotalsForScore({
    section: 'rw',
    config: {
      strixTest: 2,
      moduleScores: [{ total: 25 }, { total: 27 }],
    },
    answers: [...answers('m1', 25, 25), ...answers('m2', 20, 24)],
  });
  assert.deepEqual(totals, [
    { correct: 25, total: 25 },
    { correct: 20, total: 27 },
  ]);
});
