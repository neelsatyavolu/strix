import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const appSource = fs.readFileSync(
  new URL('../components/sixteen/SixteenApp.jsx', import.meta.url),
  'utf8',
);
const routeSource = fs.readFileSync(
  new URL('../app/api/questions/route.ts', import.meta.url),
  'utf8',
);
const officialFormsSource = fs.readFileSync(
  new URL('../lib/cb/officialForms.ts', import.meta.url),
  'utf8',
);
const lookupSource = fs.readFileSync(
  new URL('../lib/cb/lookup.ts', import.meta.url),
  'utf8',
);
const officialForms = JSON.parse(
  fs.readFileSync(new URL('../lib/cb/official-forms.json', import.meta.url), 'utf8'),
);
const screenUrl = new URL('../components/sixteen/screens/QuestionBank.jsx', import.meta.url);
const screenExists = fs.existsSync(screenUrl);
const screenSource = screenExists ? fs.readFileSync(screenUrl, 'utf8') : '';

test('Question Bank is wired into Strix navigation and routing', () => {
  assert.match(appSource, /QuestionBank/);
  assert.match(appSource, /id:\s*'question-bank'/);
  assert.match(appSource, /case 'question-bank'/);
  assert.match(appSource, /'question-bank': 'question-bank'/);
});

test('questions API supports direct lookup by question ID', () => {
  assert.match(routeSource, /findQuestionById/);
  assert.match(lookupSource, /getQuestionByExternalId/);
  assert.match(routeSource, /id:\s*z\.string\(\)\.optional\(\)/);
  assert.match(routeSource, /Question not found/);
});

test('direct lookup includes official Bluebook result external IDs', () => {
  const hasResultOnlyId = Object.values(officialForms).some((form) =>
    ['rw', 'math'].some((section) =>
      ['m1', 'easy', 'hard'].some((moduleKey) =>
        form[section][moduleKey].some((ref) =>
          typeof ref === 'object' &&
          ref !== null &&
          ref.externalId === '90748ee0-e643-48d5-b69f-c05398fbe6c2',
        ),
      ),
    ),
  );

  assert.equal(hasResultOnlyId, true);
  assert.match(officialFormsSource, /getOfficialQuestionByExternalId/);
  assert.match(lookupSource, /getOfficialQuestionByExternalId/);
});

test('Question Bank screen searches by ID and keeps answers hidden until requested', () => {
  assert.equal(screenExists, true);
  assert.match(screenSource, /Question Bank/);
  assert.match(screenSource, /\/api\/questions\?/);
  assert.match(screenSource, /showAnswer/);
  assert.match(screenSource, /Show answer/);
  assert.match(screenSource, /question\.correct/);
});
