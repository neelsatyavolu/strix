import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const appSource = fs.readFileSync(
  new URL('../components/sixteen/SixteenApp.jsx', import.meta.url),
  'utf8',
);
const practiceHubSource = fs.readFileSync(
  new URL('../components/sixteen/screens/practice/PracticeHub.jsx', import.meta.url),
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
const screenUrl = new URL('../components/sixteen/screens/practice/QuestionBank.jsx', import.meta.url);
const resultUrl = new URL('../components/sixteen/screens/practice/QuestionResult.jsx', import.meta.url);
const screenExists = fs.existsSync(screenUrl);
const screenSource = screenExists ? fs.readFileSync(screenUrl, 'utf8') : '';
const resultSource = fs.existsSync(resultUrl) ? fs.readFileSync(resultUrl, 'utf8') : '';

test('Question Bank is wired into Strix navigation and routing', () => {
  assert.match(appSource, /'question-bank': \['practice', \{ tab: 'bank' \}\]/);
  assert.match(practiceHubSource, /QuestionBank/);
  assert.match(practiceHubSource, /tab === 'bank'/);
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
  assert.match(screenSource, /\/api\/questions\?/);
  assert.match(screenSource, /showAnswer/);
  assert.match(resultSource, /Reveal/);
  assert.match(resultSource, /question\.correct/);
  assert.match(resultSource, /showAnswer && correctSet/);
});
