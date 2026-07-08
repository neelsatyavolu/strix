// Answer grading shared by the client session and the server grade/save routes,
// so one definition of "correct" applies everywhere.

export function normalizeSpr(s) {
  return String(s ?? '').trim().replace(/\s+/g, '').toLowerCase();
}

/**
 * True when `value` answers `question` correctly.
 * @param {{ type?: string, correct?: string[] }} question
 * @param {string | null | undefined} value mcq letter (A–D) or spr literal
 * @returns {boolean}
 */
export function isValueCorrect(question, value) {
  if (value == null || String(value).trim() === '') return false;
  if (question.type === 'spr') {
    const given = normalizeSpr(value);
    return !!given && (question.correct || []).some((k) => normalizeSpr(k) === given);
  }
  return (question.correct || []).includes(value);
}

/**
 * True when the question object carries its answer key (server-side questions
 * and review snapshots do; sanitized client payloads don't until revealed).
 * @param {{ correct?: string[] }} question
 * @returns {boolean}
 */
export function questionHasKey(question) {
  return Array.isArray(question?.correct) && question.correct.length > 0;
}
