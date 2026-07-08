import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Guards the answer-leak fix: question payloads served to test-takers must be
// auth-gated and sanitized, with the key disclosed only via the grading route.

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8');
const questionsRoute = read('../app/api/questions/route.ts');
const gradeRoute = read('../app/api/questions/grade/route.ts');
const sanitizeSource = read('../lib/cb/sanitize.ts');
const sessionsRoute = read('../app/api/sessions/route.ts');
const sessionContext = read('../components/sixteen/session/SessionContext.jsx');

test('questions API requires a signed-in user', () => {
  assert.match(questionsRoute, /auth\.getUser\(\)/);
  assert.match(questionsRoute, /Not signed in/);
  assert.match(questionsRoute, /status:\s*401/);
});

test('every questions payload is sanitized before it leaves the server', () => {
  assert.match(questionsRoute, /sanitizeQuestion\(question\)/);
  const sanitizedLists = questionsRoute.match(/sanitizeQuestions\(questions\)/g) || [];
  assert.equal(sanitizedLists.length >= 3, true, 'official, strix and drawn modules must all sanitize');
  assert.match(sanitizeSource, /delete pub\.correct/);
  assert.match(sanitizeSource, /delete pub\.correctIds/);
  assert.match(sanitizeSource, /delete pub\.rationaleHtml/);
});

test('grade route requires auth and reveals the key only on commit or solve', () => {
  assert.match(gradeRoute, /auth\.getUser\(\)/);
  assert.match(gradeRoute, /reveal \|\| correct === true/);
});

test('sessions save re-grades server-side from the cached key', () => {
  assert.match(sessionsRoute, /getQuestionIfCached/);
  assert.match(sessionsRoute, /isValueCorrect/);
});

test('client grades committed answers through the grading endpoint', () => {
  assert.match(sessionContext, /\/api\/questions\/grade/);
  assert.match(sessionContext, /withAnswerKeys/);
  assert.match(sessionContext, /enqueuePendingSession/);
  assert.match(sessionContext, /flushPendingSessions/);
});
