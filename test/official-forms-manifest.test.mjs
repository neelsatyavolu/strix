import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const forms = JSON.parse(
  fs.readFileSync(new URL('../lib/cb/official-forms.json', import.meta.url), 'utf8'),
);

const MODULE_KEYS = ['m1', 'easy', 'hard'];
const EXPECTED_COUNTS = { rw: 27, math: 22 };

function moduleCounts(testNumber, section) {
  return Object.fromEntries(
    MODULE_KEYS.map((moduleKey) => [
      moduleKey,
      forms[String(testNumber)][section][moduleKey].length,
    ]),
  );
}

function directRefs(testNumber, section) {
  return MODULE_KEYS.flatMap((moduleKey) =>
    forms[String(testNumber)][section][moduleKey]
      .map((ref, index) => ({ moduleKey, index: index + 1, ref }))
      .filter(({ ref }) => typeof ref === 'object' && ref !== null),
  );
}

function completeTests() {
  return Object.keys(forms)
    .map(Number)
    .filter((testNumber) =>
      ['rw', 'math'].every((section) =>
        MODULE_KEYS.every(
          (moduleKey) =>
            forms[String(testNumber)][section][moduleKey].length === EXPECTED_COUNTS[section],
        ),
      ),
    )
    .sort((a, b) => a - b);
}

test('SAT5 R&W modules are fully captured from Bluebook result external ids', () => {
  assert.deepEqual(moduleCounts(5, 'rw'), { m1: 27, easy: 27, hard: 27 });

  const refs = directRefs(5, 'rw');
  assert.deepEqual(
    refs.map(({ moduleKey, index }) => `${moduleKey}:${index}`),
    ['m1:14', 'easy:10', 'hard:1', 'hard:3', 'hard:8', 'hard:17', 'hard:18', 'hard:27'],
  );
  assert.deepEqual(
    refs.map(({ ref }) => ref.externalId),
    [
      '90748ee0-e643-48d5-b69f-c05398fbe6c2',
      'a6385b4b-b8cf-418b-9278-2c54d29bf323',
      'c3016e8a-ac88-442b-a6fb-5d7c38fd985d',
      'd918a65d-69b8-4171-a9fa-7eba150b53c2',
      'b80c213c-8656-44b1-b75e-ecd8bccf950b',
      '4e4b82e7-8b5f-48a9-a90b-9ad75b202160',
      'e11b0a7d-989c-47e2-9ffa-1dcc9e9ed0e3',
      '34aff872-b9cb-4ea2-bfc3-bffd45b4eefb',
    ],
  );
  for (const { ref } of refs) {
    assert.match(ref.externalId, /^[0-9a-f-]{36}$/);
    assert.ok(ref.domain);
    assert.ok(ref.skill);
    assert.match(ref.difficulty, /^[EMH]$/);
  }
});

test('SAT6 R&W modules are fully captured from Bluebook result external ids', () => {
  assert.deepEqual(moduleCounts(6, 'rw'), { m1: 27, easy: 27, hard: 27 });

  const refs = directRefs(6, 'rw');
  assert.deepEqual(
    refs.map(({ moduleKey, index }) => `${moduleKey}:${index}`),
    ['m1:7', 'm1:21', 'easy:6', 'hard:1', 'hard:3', 'hard:14', 'hard:15', 'hard:24', 'hard:26'],
  );
  assert.deepEqual(
    refs.map(({ ref }) => ref.externalId),
    [
      'fd1938e8-849e-4140-a2f3-69ab96635439',
      'cb982f50-8fbc-48cf-b8f7-e644b13968a6',
      '20c3df3f-382e-4c94-a9fe-cb25acbae6b1',
      'f46e5ae7-df68-4fff-9fed-f7c1c9be6f1c',
      '38f9b682-b22b-4740-ad52-2d8ba39ce79f',
      '8b422b91-e8e0-4fa8-9042-bde638fd7c71',
      '33508a17-8255-4313-80e7-c1bf9cd505b3',
      '093a41fa-36ba-4d68-a521-381fa328114e',
      '476f7e8b-5191-4fec-b811-5afc910ecdb4',
    ],
  );
  for (const { ref } of refs) {
    assert.match(ref.externalId, /^[0-9a-f-]{36}$/);
    assert.ok(ref.domain);
    assert.ok(ref.skill);
    assert.match(ref.difficulty, /^[EMH]$/);
  }
});

test('only fully captured Bluebook forms are complete', () => {
  assert.deepEqual(completeTests(), [5, 6, 7, 9, 11]);
});

test('known unresolved R&W gaps stay visible', () => {
  assert.deepEqual(moduleCounts(8, 'rw'), { m1: 27, easy: 27, hard: 26 });
  assert.deepEqual(moduleCounts(10, 'rw'), { m1: 27, easy: 27, hard: 26 });
});
