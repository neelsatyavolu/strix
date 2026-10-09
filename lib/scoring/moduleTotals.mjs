// Official Digital SAT module length. Question-bank modules aim for the same
// size but can come back short; Bluebook and Strix forms are this long.
export const OFFICIAL_MODULE_SIZE = { rw: 27, math: 22 };

function isFixedForm(config) {
  return typeof config?.bluebookTest === 'number' || typeof config?.strixTest === 'number';
}

/**
 * Full module correct/total for a scaled section.
 *
 * Skipped questions are not stored, so counting only persisted answers treats
 * a 20/27 as 20/20 and inflates the later rescore. `config.moduleScores` is the
 * served length (skips included) saved at submit. Fixed forms saved before that
 * field existed are padded up to the official length — those modules are never
 * shorter than that when they load.
 *
 * Reported totals can only add implied skips. They cannot shrink below the
 * number of answers actually stored, or grow past the official module length.
 *
 * @param {{ section: 'rw' | 'math', config?: object | null, answers?: Array<{ module?: string | null, isCorrect?: boolean }> }} opts
 * @returns {Array<{ correct: number, total: number }>}
 */
export function moduleTotalsForScore({ section, config, answers }) {
  const expected = OFFICIAL_MODULE_SIZE[section] ?? OFFICIAL_MODULE_SIZE.rw;
  const buckets = [
    { correct: 0, total: 0 },
    { correct: 0, total: 0 },
  ];
  for (const answer of answers || []) {
    const idx = answer?.module === 'm1' ? 0 : 1;
    buckets[idx].total += 1;
    if (answer?.isCorrect) buckets[idx].correct += 1;
  }

  const reported = Array.isArray(config?.moduleScores) ? config.moduleScores : null;
  const fixed = isFixedForm(config);
  const any = buckets.some((b) => b.total > 0);

  return buckets.map((got, i) => {
    let total = got.total;
    const rep = reported?.[i]?.total;
    if (Number.isInteger(rep) && rep >= got.total && rep <= expected) {
      total = rep;
    } else if (fixed && any && total < expected) {
      total = expected;
    }
    return { correct: Math.min(got.correct, total), total };
  });
}
