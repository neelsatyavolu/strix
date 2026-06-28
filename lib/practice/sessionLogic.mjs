const DIFF_RANK = { E: 0, M: 1, H: 2 };

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
