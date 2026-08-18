import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const strixFormsUrl = new URL('../lib/cb/strix-forms.json', import.meta.url);
const strixFormsSourceUrl = new URL('../lib/cb/strixForms.ts', import.meta.url);
const routeSource = fs.readFileSync(new URL('../app/api/questions/route.ts', import.meta.url), 'utf8');
const sessionSource = fs.readFileSync(
  new URL('../components/sixteen/session/SessionContext.jsx', import.meta.url),
  'utf8',
);
const practiceSetupSource = fs.readFileSync(
  new URL('../components/sixteen/screens/PracticeSetup.jsx', import.meta.url),
  'utf8',
);
const officialForms = JSON.parse(
  fs.readFileSync(new URL('../lib/cb/official-forms.json', import.meta.url), 'utf8'),
);
const auditUrl = new URL('../docs/strix-test-1-audit.md', import.meta.url);
const auditTwoUrl = new URL('../docs/strix-test-2-audit.md', import.meta.url);
const auditThreeUrl = new URL('../docs/strix-test-3-audit.md', import.meta.url);

const MODULE_KEYS = ['m1', 'easy', 'hard'];
const EXPECTED_COUNTS = { rw: 27, math: 22 };
const EXPECTED_TESTS = ['1', '2', '3'];

// The single intentional answer-type deviation from Bluebook 11: Math hard
// module slot 2 (skill H.D., difficulty E) is a grid-in (SPR) in Bluebook 11,
// but the non-official pool contains no SPR item at H.D./E, so a same-skill,
// same-difficulty MCQ is used instead. Difficulty (criterion #4) is kept exact
// ahead of answer type (criterion #5). Documented in
// docs/strix-test-1-audit.md; pinned here so the exception stays intentional.
const INTENTIONAL_TYPE_EXCEPTIONS = { 'math.hard.1': '9db5b5c1' };

function bluebook11Ids(section) {
  const ids = new Set();
  for (const moduleKey of MODULE_KEYS) {
    for (const ref of officialForms['11'][section][moduleKey]) {
      if (typeof ref === 'string') {
        ids.add(ref);
      } else if (ref && typeof ref === 'object') {
        if (ref.questionId) ids.add(ref.questionId);
        if (ref.externalId) ids.add(ref.externalId);
      }
    }
  }
  return ids;
}

function allOfficialIds(section) {
  const ids = new Set();
  for (const form of Object.values(officialForms)) {
    for (const moduleKey of MODULE_KEYS) {
      for (const ref of form[section][moduleKey]) {
        if (typeof ref === 'string') {
          ids.add(ref);
        } else if (ref && typeof ref === 'object') {
          if (ref.questionId) ids.add(ref.questionId);
          if (ref.externalId) ids.add(ref.externalId);
        }
      }
    }
  }
  return ids;
}

function collectFormIds(form) {
  const ids = [];
  for (const section of ['rw', 'math']) {
    for (const moduleKey of MODULE_KEYS) {
      for (const id of form[section][moduleKey]) ids.push(id);
    }
  }
  return ids;
}

test('Strix tests 1, 2, and 3 exist as complete full SATs', () => {
  assert.equal(fs.existsSync(strixFormsUrl), true);
  const forms = JSON.parse(fs.readFileSync(strixFormsUrl, 'utf8'));

  for (const num of EXPECTED_TESTS) {
    const form = forms[num];
    assert.ok(form, `missing Strix Test ${num}`);
    for (const section of ['rw', 'math']) {
      for (const moduleKey of MODULE_KEYS) {
        assert.equal(form[section][moduleKey].length, EXPECTED_COUNTS[section]);
      }
    }
  }
});

test('Strix tests have no duplicate, overlapping, or official Bluebook question ids', () => {
  const forms = JSON.parse(fs.readFileSync(strixFormsUrl, 'utf8'));
  const seen = new Set();

  for (const num of EXPECTED_TESTS) {
    const ids = collectFormIds(forms[num]);
    assert.equal(new Set(ids).size, ids.length, `Strix Test ${num} has internal duplicates`);
    for (const section of ['rw', 'math']) {
      const official = allOfficialIds(section);
      for (const moduleKey of MODULE_KEYS) {
        for (const id of forms[num][section][moduleKey]) {
          assert.equal(typeof id, 'string');
          assert.equal(official.has(id), false, `test ${num} ${section} ${moduleKey} reuses official id ${id}`);
          assert.equal(seen.has(id), false, `test ${num} reuses ${id} from another Strix test`);
          seen.add(id);
        }
      }
    }
  }
});

test('Strix full SAT source is wired through the question API and session runtime', () => {
  assert.equal(fs.existsSync(strixFormsSourceUrl), true);
  const strixFormsSource = fs.readFileSync(strixFormsSourceUrl, 'utf8');

  assert.match(strixFormsSource, /getStrixModule/);
  assert.match(routeSource, /getStrixModule/);
  assert.match(routeSource, /mode:\s*z\.enum\(\["drill", "module", "official", "strix"\]\)/);
  assert.match(sessionSource, /strixTest/);
  assert.match(sessionSource, /fetchStrixModule/);
});

test('Practice Setup exposes every Strix test as a full SAT option', () => {
  assert.match(practiceSetupSource, /strix-forms\.json/);
  assert.match(practiceSetupSource, /Start Strix Test \$\{strixTest\}/);
  assert.match(practiceSetupSource, /bluebookTest:\s*null/);
  const forms = JSON.parse(fs.readFileSync(strixFormsUrl, 'utf8'));
  for (const num of Object.keys(forms)) {
    assert.match(practiceSetupSource, /STRIX_TEST_OPTIONS/);
    assert.equal(EXPECTED_TESTS.includes(num), true, `unexpected Strix test ${num} not covered by picker test`);
  }
});

test('Strix tests never reuse a Bluebook 11 question id', () => {
  const forms = JSON.parse(fs.readFileSync(strixFormsUrl, 'utf8'));
  for (const num of EXPECTED_TESTS) {
    for (const section of ['rw', 'math']) {
      const bb11 = bluebook11Ids(section);
      for (const moduleKey of MODULE_KEYS) {
        for (const id of forms[num][section][moduleKey]) {
          assert.equal(bb11.has(id), false, `test ${num} ${section} ${moduleKey} reuses Bluebook 11 id ${id}`);
        }
      }
    }
  }
});

test('Strix Test 1 pins its single intentional answer-type exception', () => {
  const forms = JSON.parse(fs.readFileSync(strixFormsUrl, 'utf8'));
  for (const [loc, id] of Object.entries(INTENTIONAL_TYPE_EXCEPTIONS)) {
    const [section, moduleKey, idx] = loc.split('.');
    assert.equal(
      forms['1'][section][moduleKey][Number(idx)],
      id,
      `expected documented exception ${id} at ${loc}`,
    );
  }
});

test('Strix Test 1 audit doc exists and enumerates the documented exceptions', () => {
  assert.equal(fs.existsSync(auditUrl), true);
  const audit = fs.readFileSync(auditUrl, 'utf8');
  assert.match(audit, /## Exceptions/);
  // the one answer-type exception: Math hard Q2 (H.D./E), grid-in -> MCQ
  assert.match(audit, /grid-in → MCQ/);
  assert.match(audit, /9db5b5c1/);
  // the three stimulus-form (figure) exceptions are enumerated
  assert.match(audit, /diagram → none/);
});

test('Strix Test 2 audit doc exists and records leftover type/form exceptions', () => {
  assert.equal(fs.existsSync(auditTwoUrl), true);
  const audit = fs.readFileSync(auditTwoUrl, 'utf8');
  assert.match(audit, /## Exceptions/);
  assert.match(audit, /4fb8adf7/);
  assert.match(audit, /answer type: spr → mcq/);
  assert.match(audit, /diagram → none/);
});

test('Strix Test 3 audit doc exists', () => {
  assert.equal(fs.existsSync(auditThreeUrl), true);
  const audit = fs.readFileSync(auditThreeUrl, 'utf8');
  assert.match(audit, /## Exceptions/);
  assert.match(audit, /147 questions/);
  assert.match(audit, /Strix Tests 1 and 2/);
});
