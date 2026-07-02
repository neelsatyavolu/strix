import test from 'node:test';
import assert from 'node:assert/strict';

import {
  scoreCalibratedSection,
  scoreCalibratedTotal,
  scoreAlbertSection,
  scoreAlbertTotal,
  scoreAlbertSectionFromQuestions,
} from '../lib/scoring/albert.mjs';

test('Albert SAT tables reproduce the public calculator default', () => {
  assert.equal(
    scoreAlbertTotal({
      rw: [
        { correct: 14, total: 27 },
        { correct: 14, total: 27 },
      ],
      math: [
        { correct: 11, total: 22 },
        { correct: 11, total: 22 },
      ],
    }),
    860,
  );
});

test('Albert section scoring maps synthetic scored totals onto Albert raw axes', () => {
  assert.equal(
    scoreAlbertSection('rw', [
      { correct: 25, total: 25 },
      { correct: 25, total: 25 },
    ]),
    800,
  );
  assert.equal(
    scoreAlbertSection('math', [
      { correct: 20, total: 20 },
      { correct: 20, total: 20 },
    ]),
    800,
  );
});

test('Albert section scoring can be recomputed from historical stored module answers', () => {
  const questions = [
    ...Array.from({ length: 14 }, (_, i) => ({ id: `m1-c${i}`, module: 'm1', isCorrect: true })),
    ...Array.from({ length: 13 }, (_, i) => ({ id: `m1-w${i}`, module: 'm1', isCorrect: false })),
    ...Array.from({ length: 14 }, (_, i) => ({ id: `m2-c${i}`, module: 'm2', isCorrect: true })),
    ...Array.from({ length: 13 }, (_, i) => ({ id: `m2-w${i}`, module: 'm2', isCorrect: false })),
    { id: 'pretest', module: 'm2', isCorrect: true, pretest: true },
  ];

  assert.equal(scoreAlbertSectionFromQuestions('rw', questions), 430);
});

test('calibrated SAT scoring matches the real lopsided-module anchor', () => {
  const rw = [
    { correct: 27, total: 27 },
    { correct: 0, total: 27 },
  ];
  const math = [
    { correct: 22, total: 22 },
    { correct: 0, total: 22 },
  ];

  assert.equal(scoreCalibratedSection('rw', rw), 510);
  assert.equal(scoreCalibratedSection('math', math), 530);
  assert.equal(scoreCalibratedTotal({ rw, math }), 1040);
});

test('calibrated SAT scoring preserves scale endpoints', () => {
  assert.equal(
    scoreCalibratedTotal({
      rw: [
        { correct: 0, total: 27 },
        { correct: 0, total: 27 },
      ],
      math: [
        { correct: 0, total: 22 },
        { correct: 0, total: 22 },
      ],
    }),
    400,
  );
  assert.equal(
    scoreCalibratedTotal({
      rw: [
        { correct: 27, total: 27 },
        { correct: 27, total: 27 },
      ],
      math: [
        { correct: 22, total: 22 },
        { correct: 22, total: 22 },
      ],
    }),
    1600,
  );
});
