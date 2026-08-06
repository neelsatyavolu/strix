import test from 'node:test';
import assert from 'node:assert/strict';

import {
  arrangeMathQuestions,
  modulePretestIds,
  moduleReviewAction,
  moduleRoutingStats,
  moduleSubmitDisabled,
  moduleTimerIsRunning,
  moduleTimerSeconds,
  questionViewForSection,
} from '../lib/practice/sessionLogic.mjs';

test('moduleRoutingStats counts every item in the module', () => {
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

  const stats = moduleRoutingStats(questions, responses, ['q3', 'q4'], (q, r) => r.value === 'A');

  assert.deepEqual(stats, { correct: 1, total: 4 });
});

test('moduleRoutingStats ignores legacy pretest flags', () => {
  const questions = [
    { id: 'q1' },
    { id: 'q2', pretest: true },
    { id: 'q3' },
  ];
  const responses = {
    q1: { value: 'A' },
    q2: { value: 'A' },
    q3: { value: 'B' },
  };

  const stats = moduleRoutingStats(questions, responses, [], (q, r) => r.value === 'A');

  assert.deepEqual(stats, { correct: 2, total: 3 });
});

test('modulePretestIds is always empty (all items scored)', () => {
  const questions = [
    { id: 'op1' },
    { id: 'pt1', pretest: true },
    { id: 'op2' },
    { id: 'pt2', pretest: true },
  ];

  assert.deepEqual(modulePretestIds(questions), []);
});

test('arrangeMathQuestions keeps one easiest-to-hardest ramp across MCQ and SPR', () => {
  const questions = [
    { id: 'hard-mcq', difficulty: 'H', type: 'mcq' },
    { id: 'easy-spr', difficulty: 'E', type: 'spr' },
    { id: 'medium-mcq', difficulty: 'M', type: 'mcq' },
    { id: 'easy-mcq', difficulty: 'E', type: 'mcq' },
  ];

  const arranged = arrangeMathQuestions(questions);

  assert.deepEqual(arranged.map((q) => q.difficulty), ['E', 'E', 'M', 'H']);
  assert.equal(arranged.findIndex((q) => q.id === 'easy-spr') < arranged.findIndex((q) => q.id === 'hard-mcq'), true);
});

test('moduleSubmitDisabled allows blanks in scored modules', () => {
  assert.equal(moduleSubmitDisabled({ isDrill: false, blocked: false }), false);
});

test('moduleSubmitDisabled still blocks unsolved drill questions', () => {
  assert.equal(moduleSubmitDisabled({ isDrill: true, blocked: true }), true);
});

test('moduleReviewAction opens review instead of submitting scored modules', () => {
  assert.equal(moduleReviewAction({ isDrill: false, blocked: false }), 'review');
  assert.equal(moduleReviewAction({ isDrill: true, blocked: true }), 'blocked');
});

test('questionViewForSection selects the right question screen for direct module transition', () => {
  assert.equal(questionViewForSection('rw'), 'rw-question');
  assert.equal(questionViewForSection('math'), 'math-question');
});

test('moduleTimerSeconds returns the official per-module timing by section', () => {
  assert.equal(moduleTimerSeconds('rw'), 32 * 60);
  assert.equal(moduleTimerSeconds('math'), 35 * 60);
});

test('moduleTimerIsRunning waits until an active module has loaded', () => {
  assert.equal(moduleTimerIsRunning({ status: 'active', timing: 'timed', hasQuestion: false }), false);
  assert.equal(moduleTimerIsRunning({ status: 'active', timing: 'timed', hasQuestion: true }), true);
  assert.equal(moduleTimerIsRunning({ status: 'active', timing: 'untimed', hasQuestion: true }), false);
});
