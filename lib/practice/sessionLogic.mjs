const DIFF_RANK = { E: 0, M: 1, H: 2 };

export const SAT_MODULE_DOMAIN_RANGES = {
  rw: [
    { code: 'CAS', min: 7, max: 7 },
    { code: 'INI', min: 6, max: 7 },
    { code: 'SEC', min: 6, max: 7 },
    { code: 'EOI', min: 4, max: 6 },
  ],
  math: [
    { code: 'H', min: 7, max: 7 },
    { code: 'P', min: 7, max: 7 },
    { code: 'Q', min: 3, max: 3 },
    { code: 'S', min: 3, max: 3 },
  ],
};

export function allocateDomainCounts(ranges, total) {
  const counts = {};
  for (const r of ranges) counts[r.code] = r.min;
  let rem = total - ranges.reduce((sum, r) => sum + r.min, 0);
  while (rem > 0) {
    const open = ranges.filter((r) => counts[r.code] < r.max);
    if (!open.length) break;
    const pick = open[Math.floor(Math.random() * open.length)];
    counts[pick.code] += 1;
    rem -= 1;
  }
  while (rem < 0) {
    const open = ranges.filter((r) => counts[r.code] > r.min);
    if (!open.length) break;
    const pick = open[Math.floor(Math.random() * open.length)];
    counts[pick.code] -= 1;
    rem += 1;
  }
  return counts;
}

function isPretestQuestion(q, pretestIds) {
  return !!q?.pretest || pretestIds.has(q.id);
}

export function arrangeMathQuestions(questions) {
  return questions
    .map((q, index) => ({ q, index }))
    .sort((a, b) => (DIFF_RANK[a.q.difficulty] ?? 1) - (DIFF_RANK[b.q.difficulty] ?? 1) || a.index - b.index)
    .map(({ q }) => q);
}

export function modulePretestIds(questions, limit = 2) {
  return questions
    .filter((q) => q?.pretest)
    .slice(0, limit)
    .map((q) => q.id);
}

/**
 * @param {Array<{ id: string, type?: string, stemHtml?: unknown }>} questions
 * @param {{ limit?: number, sprTarget?: number | null }} opts
 */
export function selectPretestQuestions(questions, { limit = 2, sprTarget = null } = {}) {
  const valid = questions.filter((q) => q?.stemHtml);
  if (sprTarget == null) return valid.slice(0, limit);

  const selected = [];
  const used = new Set();
  const take = (predicate, count) => {
    for (const q of valid) {
      if (selected.length >= limit || count <= 0) break;
      if (used.has(q.id) || !predicate(q)) continue;
      selected.push(q);
      used.add(q.id);
      count -= 1;
    }
  };

  take((q) => q.type === 'spr', sprTarget);
  take((q) => q.type !== 'spr', limit - selected.length);
  take(() => true, limit - selected.length);
  return selected;
}

export function moduleRoutingStats(questions, responses, pretestIds = [], isCorrect) {
  const pretest = new Set(pretestIds);
  const scored = questions.filter((q) => !isPretestQuestion(q, pretest));
  return {
    correct: scored.filter((q) => isCorrect(q, responses[q.id])).length,
    total: scored.length,
  };
}

export function moduleSubmitDisabled({ isDrill, blocked }) {
  return !!isDrill && !!blocked;
}

export function moduleReviewAction({ isDrill, blocked }) {
  return moduleSubmitDisabled({ isDrill, blocked }) ? 'blocked' : 'review';
}

export function questionViewForSection(section) {
  return section === 'math' ? 'math-question' : 'rw-question';
}

export function moduleTimerSeconds(section) {
  return section === 'math' ? 35 * 60 : 32 * 60;
}

export function moduleTimerIsRunning({ status, timing, hasQuestion }) {
  return timing !== 'untimed' && status === 'active' && !!hasQuestion;
}

export function moduleTimerResetKey({ section, moduleKey }) {
  return `${section || 'unknown'}:${moduleKey || 'none'}`;
}

export function examBreakCanBegin({ seconds, status, starting }) {
  return seconds <= 0 && status !== 'loading' && !starting;
}

export function isSectionEstimateMode(mode) {
  return mode === 'mock-full' || mode === 'mock-exam';
}
