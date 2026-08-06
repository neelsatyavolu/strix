// Answer grading shared by the client session and the server grade/save routes,
// so one definition of "correct" applies everywhere.

export function normalizeSpr(s) {
  return String(s ?? '').trim().replace(/\s+/g, '').toLowerCase();
}

/**
 * Parse an SPR answer into a finite number when it is a pure integer, decimal,
 * or simple a/b fraction. Returns null for non-numeric forms.
 * @param {string | null | undefined} s
 * @returns {number | null}
 */
export function parseSprNumber(s) {
  const n = normalizeSpr(s);
  if (!n) return null;
  // a/b (optional leading minus on the numerator)
  const frac = n.match(/^(-?\d+)\/(\d+)$/);
  if (frac) {
    const den = Number(frac[2]);
    if (!den) return null;
    const v = Number(frac[1]) / den;
    return Number.isFinite(v) ? v : null;
  }
  // Integer or decimal, including leading-dot forms like ".48"
  if (/^-?(?:\d+\.?\d*|\.\d+)$/.test(n)) {
    const v = Number(n);
    return Number.isFinite(v) ? v : null;
  }
  return null;
}

/**
 * True when two SPR literals match as strings (after normalize) or as numbers
 * (so 0.48 ≡ .48 ≡ 12/25 when those are the accepted key forms).
 * @param {string} given
 * @param {string} key
 * @returns {boolean}
 */
export function sprsMatch(given, key) {
  const a = normalizeSpr(given);
  const b = normalizeSpr(key);
  if (!a || !b) return false;
  if (a === b) return true;
  const na = parseSprNumber(a);
  const nb = parseSprNumber(b);
  if (na == null || nb == null) return false;
  const scale = Math.max(1, Math.abs(na), Math.abs(nb));
  return Math.abs(na - nb) <= 1e-9 * scale;
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
    const keys = question.correct || [];
    return keys.some((k) => sprsMatch(value, k));
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
