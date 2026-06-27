export function moduleRoutingStats(questions, responses, pretestIds = [], isCorrect) {
  const pretest = new Set(pretestIds);
  const scored = questions.filter((q) => !pretest.has(q.id));
  return {
    correct: scored.filter((q) => isCorrect(q, responses[q.id])).length,
    total: scored.length,
  };
}

export function moduleSubmitDisabled({ isDrill, blocked }) {
  return !!isDrill && !!blocked;
}

export function questionViewForSection(section) {
  return section === 'math' ? 'math-question' : 'rw-question';
}

export function moduleTimerSeconds(section) {
  return section === 'math' ? 35 * 60 : 32 * 60;
}
