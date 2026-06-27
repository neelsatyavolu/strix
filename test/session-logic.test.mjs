import test from 'node:test';
import assert from 'node:assert/strict';

import {
  moduleRoutingStats,
  moduleSubmitDisabled,
  moduleTimerSeconds,
  questionViewForSection,
} from '../lib/practice/sessionLogic.mjs';

test('moduleRoutingStats excludes pretest questions from module 2 routing', () => {
  const questions = [
    { id: 'q1' },
    { id: 'q2' },
    { id: 'q3' },
    { id: 'q4' },
  ];
  const responses = {
    q1: { value: 'A' },
    q2: { value: 'B' },
    q3: { value: 'C' },
    q4: { value: 'D' },
  };
  const pretestIds = ['q3', 'q4'];

  const stats = moduleRoutingStats(questions, responses, pretestIds, (q, r) => r.value === 'A');

  assert.deepEqual(stats, { correct: 1, total: 2 });
});

test('moduleSubmitDisabled allows blanks in scored modules', () => {
  assert.equal(moduleSubmitDisabled({ isDrill: false, blocked: false }), false);
});

test('moduleSubmitDisabled still blocks unsolved drill questions', () => {
  assert.equal(moduleSubmitDisabled({ isDrill: true, blocked: true }), true);
});

test('questionViewForSection selects the right question screen for direct module transition', () => {
  assert.equal(questionViewForSection('rw'), 'rw-question');
  assert.equal(questionViewForSection('math'), 'math-question');
});

test('moduleTimerSeconds returns the official per-module timing by section', () => {
  assert.equal(moduleTimerSeconds('rw'), 32 * 60);
  assert.equal(moduleTimerSeconds('math'), 35 * 60);
});
