// Deterministic study reads — the always-on fallback when no AI provider is
// connected. Each returns the parsed-insight shape { summary, strength, focus, actions }.

import { recentAcc } from '@/components/sixteen/stats/shared';

function rank(pool) {
  const eligible = pool.filter((c) => c.done >= 5);
  return [...(eligible.length ? eligible : pool)].sort((a, b) => recentAcc(b) - recentAcc(a));
}

// Best/worst over one section's categories.
export function sectionBaseline(sectionLabel, cats) {
  const pool = (cats ?? []).filter((c) => c.done > 0);
  if (!pool.length) return null;
  const ranked = rank(pool);
  const best = ranked[0];
  const worst = ranked[ranked.length - 1];
  const total = pool.reduce((a, c) => a + c.done, 0);
  const same = best.id === worst.id;
  return {
    summary: same
      ? `You've answered ${total} ${sectionLabel} questions so far, all in ${best.label} (${recentAcc(best)}%). Practice the other categories to round out your profile.`
      : `You've answered ${total} ${sectionLabel} questions. Lately you're strongest in ${best.label} (${recentAcc(best)}%) and weakest in ${worst.label} (${recentAcc(worst)}%).`,
    strength: `${best.label} — ${recentAcc(best)}% recently across ${best.done} question${best.done === 1 ? '' : 's'}.`,
    focus: same ? '' : `${worst.label} — ${recentAcc(worst)}%. Put your next sessions here.`,
    actions: same
      ? ['Practice categories you haven\'t tried yet']
      : [`Drill ${worst.label} questions`, `Review the ones you missed in ${worst.label}`],
  };
}

// Best/worst across both sections, for the Overview tab.
export function overallBaseline(allCats) {
  const pool = (allCats ?? []).filter((c) => c.done > 0);
  if (!pool.length) return null;
  const ranked = rank(pool);
  const best = ranked[0];
  const worst = ranked[ranked.length - 1];
  const total = pool.reduce((a, c) => a + c.done, 0);
  const same = best.key === worst.key;
  return {
    summary: `You've answered ${total} question${total === 1 ? '' : 's'} across ${pool.length} skill area${pool.length === 1 ? '' : 's'}.`,
    strength: `${best.label} — ${recentAcc(best)}% recently.`,
    focus: same ? '' : `${worst.label} — ${recentAcc(worst)}%. This is where the most points are.`,
    actions: same
      ? ['Try a drill in a different skill to round out your profile']
      : [`Drill ${worst.label} questions`, 'Take a full-length section to update your score estimate'],
  };
}

// Payload fed to the AI for a list of categories.
export function topicsPayload(cats) {
  return (cats ?? [])
    .filter((c) => c.done > 0)
    .map((c) => ({ topic: c.label, answered: c.done, accuracy: c.accuracy, recentAccuracy: c.recentAccuracy }));
}

export const RECENCY_NOTE =
  'recentAccuracy weights recent attempts more heavily — prioritize it over all-time accuracy when recommending focus areas.';
