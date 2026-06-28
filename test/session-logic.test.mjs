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

test('moduleRoutingStats excludes questions explicitly marked as pretest', () => {
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

  assert.deepEqual(stats, { correct: 1, total: 2 });
});

test('modulePretestIds uses explicit generated pretest items', () => {
  const questions = [
    { id: 'op1' },
    { id: 'pt1', pretest: true },
    { id: 'op2' },
    { id: 'pt2', pretest: true },
  ];

  assert.deepEqual(modulePretestIds(questions), ['pt1', 'pt2']);
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
  assert.equal(moduleTimerIsRunning({ status: 'loading', timing: 'total', hasQuestion: false }), false);
  assert.equal(moduleTimerIsRunning({ status: 'active', timing: 'total', hasQuestion: true }), true);
  assert.equal(moduleTimerIsRunning({ status: 'active', timing: 'untimed', hasQuestion: true }), false);
});

test('moduleTimerResetKey changes between modules in the same section', async () => {
  const logic = await import('../lib/practice/sessionLogic.mjs');
  assert.equal(typeof logic.moduleTimerResetKey, 'function');
  assert.notEqual(
    logic.moduleTimerResetKey({ section: 'rw', moduleKey: 'm1' }),
    logic.moduleTimerResetKey({ section: 'rw', moduleKey: 'm2' }),
  );
});

test('exam break cannot advance before the 10-minute break expires', async () => {
  const logic = await import('../lib/practice/sessionLogic.mjs');
  assert.equal(typeof logic.examBreakCanBegin, 'function');
  assert.equal(logic.examBreakCanBegin({ seconds: 1, status: 'submitted', starting: false }), false);
  assert.equal(logic.examBreakCanBegin({ seconds: 0, status: 'submitted', starting: false }), true);
  assert.equal(logic.examBreakCanBegin({ seconds: 0, status: 'loading', starting: false }), false);
  assert.equal(logic.examBreakCanBegin({ seconds: 0, status: 'submitted', starting: true }), false);
});

test('only full sections and exams receive section estimates', async () => {
  const logic = await import('../lib/practice/sessionLogic.mjs');
  assert.equal(typeof logic.isSectionEstimateMode, 'function');
  assert.equal(logic.isSectionEstimateMode('mock-full'), true);
  assert.equal(logic.isSectionEstimateMode('mock-exam'), true);
  assert.equal(logic.isSectionEstimateMode('mock-m1'), false);
  assert.equal(logic.isSectionEstimateMode('drill'), false);
});

test('module domain ranges cannot drift outside official full-section ranges', async () => {
  const logic = await import('../lib/practice/sessionLogic.mjs');
  assert.ok(logic.SAT_MODULE_DOMAIN_RANGES);
  const official = {
    rw: { CAS: [13, 15], INI: [12, 14], SEC: [11, 15], EOI: [8, 12] },
    math: { H: [13, 15], P: [13, 15], Q: [5, 7], S: [5, 7] },
  };

  for (const section of Object.keys(official)) {
    for (const range of logic.SAT_MODULE_DOMAIN_RANGES[section]) {
      const [min, max] = official[section][range.code];
      assert.equal(range.min * 2 >= min, true, `${section} ${range.code} min drifts below official range`);
      assert.equal(range.max * 2 <= max, true, `${section} ${range.code} max drifts above official range`);
    }
  }
});

test('allocateDomainCounts respects range bounds and exact module totals', async () => {
  const logic = await import('../lib/practice/sessionLogic.mjs');
  assert.equal(typeof logic.allocateDomainCounts, 'function');
  const counts = logic.allocateDomainCounts(logic.SAT_MODULE_DOMAIN_RANGES.math, 20);

  assert.equal(Object.values(counts).reduce((sum, n) => sum + n, 0), 20);
  for (const range of logic.SAT_MODULE_DOMAIN_RANGES.math) {
    assert.equal(counts[range.code] >= range.min, true);
    assert.equal(counts[range.code] <= range.max, true);
  }
});

test('selectPretestQuestions can balance Math pretest question types', async () => {
  const logic = await import('../lib/practice/sessionLogic.mjs');
  assert.equal(typeof logic.selectPretestQuestions, 'function');
  const selected = logic.selectPretestQuestions([
    { id: 'spr1', type: 'spr', stemHtml: '<p>1</p>' },
    { id: 'spr2', type: 'spr', stemHtml: '<p>2</p>' },
    { id: 'mcq1', type: 'mcq', stemHtml: '<p>3</p>' },
    { id: 'mcq2', type: 'mcq', stemHtml: '<p>4</p>' },
  ], { limit: 2, sprTarget: 1 });

  assert.equal(selected.length, 2);
  assert.equal(selected.filter((q) => q.type === 'spr').length, 1);
  assert.equal(selected.filter((q) => q.type !== 'spr').length, 1);
});
