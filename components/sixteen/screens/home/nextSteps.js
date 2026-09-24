import { dueLabel, plural, resumableLabel } from './helpers';

// Build the student's "Up next" candidates in priority order:
// resume > tutor assignments > due reviews > weakest skill > score estimate >
// keep going (or, for a brand-new student, a welcome step).
// The first step becomes the hero; later steps with a `chip` are shown as
// smaller secondary options. `act` supplies the handlers.
export function buildSteps({ resumable, assignments, reviewDue, focus, hasData, scores, firstName }, act) {
  const steps = [];

  if (resumable) {
    steps.push({
      key: 'resume',
      icon: 'rotate-ccw',
      title: 'Pick up where you left off',
      body: `${resumableLabel(resumable)} · ${resumable.answered} of ${resumable.total} answered`,
      cta: 'Resume',
      run: act.resume,
      secondary: { label: 'Discard', run: act.discard },
      chip: 'Resume session',
    });
  }

  if (assignments.length) {
    const first = assignments[0];
    const due = dueLabel(first.due_at);
    const one = assignments.length === 1;
    steps.push({
      key: 'assignments',
      icon: 'clipboard-list',
      title: one ? first.title : `${assignments.length} assignments from your tutor`,
      body: one
        ? [due, 'Assigned by your tutor'].filter(Boolean).join(' · ')
        : `Next up: ${first.title}${due ? ` · ${due.toLowerCase()}` : ''}`,
      cta: one ? 'Open assignment' : 'Open assignments',
      run: () => act.go('plan'),
      chip: plural(assignments.length, 'assignment'),
    });
  }

  if (reviewDue > 0) {
    steps.push({
      key: 'review',
      icon: 'repeat',
      title: `${plural(reviewDue, 'question')} due for review`,
      body: 'Revisit questions you missed, right when they are about to slip.',
      cta: 'Start review',
      run: () => act.go('review'),
      chip: `${plural(reviewDue, 'review')} due`,
    });
  }

  const weakest = focus[0];
  if (weakest) {
    steps.push({
      key: 'focus',
      icon: 'target',
      title: `Sharpen ${weakest.label}`,
      body: `Your recent accuracy here is ${weakest.accuracy ?? 0}%. A 10-question drill is the fastest way to lift it.`,
      cta: 'Practice this skill',
      run: () => act.launchFocus(weakest),
      chip: `Drill ${weakest.label}`,
    });
  }

  if (hasData && scores?.total == null) {
    const missing = scores?.rw != null ? 'Math' : scores?.math != null ? 'Reading & Writing' : null;
    steps.push({
      key: 'score',
      icon: 'gauge',
      title: missing ? 'Complete your score estimate' : 'Get your score estimate',
      body: missing
        ? `Finish a full ${missing} section to get your total on the 1600 scale.`
        : 'Finish a full Reading & Writing or Math section to see where you would land on the 1600 scale.',
      cta: 'Take a full section',
      run: () => act.go('practice', { tab: 'full' }),
      chip: 'Take a full section',
    });
  }

  if (hasData) {
    steps.push({
      key: 'drill',
      icon: 'play',
      title: 'Keep your momentum',
      body: 'Pick any topic and run a quick drill.',
      cta: 'Start a drill',
      run: () => act.go('practice', { tab: 'drill' }),
    });
  } else {
    steps.push({
      key: 'welcome',
      icon: 'sparkles',
      title: `Welcome, ${firstName}. Let's find your starting point.`,
      body: 'Start with a 10-question drill in any topic. We will track what you get right and point you to what to practice next.',
      cta: 'Start your first drill',
      run: () => act.go('practice', { tab: 'drill' }),
      secondary: { label: 'Take a full section', run: () => act.go('practice', { tab: 'full' }) },
    });
  }

  // Chip-only: the weekly plan (skipped when assignments already point there).
  if (hasData && !assignments.length) {
    steps.push({ key: 'plan', icon: 'calendar-days', chip: "This week's plan", run: () => act.go('plan') });
  }

  return steps;
}
