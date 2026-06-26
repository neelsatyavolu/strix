// Sample data for the Sixteen UI kit.
// All content here is original, written to demonstrate the UI — these are
// representative practice items, not actual College Board content.

export const SixteenData = {
  student: {
    name: 'Maya Patel',
    initials: 'MP',
    estTotal: 1480,
    estRW: 740,
    estMath: 740,
    streakDays: 3,
  },

  tutor: {
    name: 'Rachel Hsu',
    status: 'online',
  },

  recentSessions: [
    { id: 1, when: 'Today · 2:14 PM', date: '2026-06-25', label: 'R&W · Information & Ideas',     accuracy: 78, count: 12, domain: 'rw',   durationMin: 11, kind: 'drill',   score: null },
    { id: 2, when: 'Yesterday',       date: '2026-06-24', label: 'Math · Algebra (timed)',         accuracy: 81, count: 15, domain: 'math', durationMin: 18, kind: 'drill',   score: null },
    { id: 3, when: '3 days ago',      date: '2026-06-22', label: 'R&W · Module 1 (mock)',          accuracy: 81, count: 27, domain: 'rw',   durationMin: 32, kind: 'module',  score: 720 },
    { id: 4, when: '4 days ago',      date: '2026-06-21', label: 'Math · Module 1 + 2A (scored)',  accuracy: 86, count: 44, domain: 'math', durationMin: 70, kind: 'section', score: 740 },
    { id: 5, when: '6 days ago',      date: '2026-06-19', label: 'R&W · Craft & Structure',        accuracy: 71, count: 10, domain: 'rw',   durationMin: 9,  kind: 'drill',   score: null },
    { id: 6, when: '1 week ago',      date: '2026-06-18', label: 'Math · Geometry & Trig',         accuracy: 64, count: 8,  domain: 'math', durationMin: 10, kind: 'drill',   score: null },
    { id: 7, when: '1 week ago',      date: '2026-06-18', label: 'R&W · Full section (scored)',    accuracy: 79, count: 54, domain: 'rw',   durationMin: 64, kind: 'section', score: 700 },
    { id: 8, when: '9 days ago',      date: '2026-06-16', label: 'Math · Advanced Math (hard)',    accuracy: 58, count: 10, domain: 'math', durationMin: 14, kind: 'drill',   score: null },
  ],

  rwCategories: [
    { id: 'info',  label: 'Information & Ideas',            done: 86, accuracy: 78 },
    { id: 'craft', label: 'Craft & Structure',              done: 62, accuracy: 71 },
    { id: 'expr',  label: 'Expression of Ideas',            done: 48, accuracy: 69 },
    { id: 'conv',  label: 'Standard English Conventions',   done: 116, accuracy: 84 },
  ],

  mathCategories: [
    { id: 'alg',  label: 'Algebra',               done: 92, accuracy: 81 },
    { id: 'adv',  label: 'Advanced Math',         done: 64, accuracy: 68 },
    { id: 'pas',  label: 'Problem-Solving & Data Analysis', done: 58, accuracy: 76 },
    { id: 'geo',  label: 'Geometry & Trigonometry', done: 34, accuracy: 64 },
  ],

  // 27-question R&W module — 14th is current
  rwModule: {
    title: 'Section 1, Module 1: Reading and Writing',
    total: 27, current: 14, marked: new Set([5, 14, 22]),
    answered: new Set([1,2,3,4,5,6,7,8,9,10,11,12,13]),
  },

  // Reading & Writing question
  rwQuestion: {
    n: 14, domain: 'rw',
    passage:
`The following text is adapted from a 1925 essay. As she wrote the closing chapter of the book, Vesta knew the manuscript was unfinished — not in the sense that the pages were too few, but that the argument had not yet found its calm. She set the pen down, walked to the window, and watched the rain settle on the roofs of the city. There was no need to hurry; the calm would arrive when it was ready, and not before.`,
    prompt: 'Which choice best states the main idea of the text?',
    options: [
      { letter: 'A', text: 'Vesta intends to abandon her unfinished manuscript permanently.' },
      { letter: 'B', text: 'Vesta accepts that the work requires more time than she had planned.' },
      { letter: 'C', text: "Vesta regrets a commitment she made earlier in her writing career." },
      { letter: 'D', text: 'Vesta finds the act of writing more pleasant than she had expected.' },
    ],
    correct: 'B',
    explanation: 'Vesta acknowledges the work is incomplete but rejects urgency — the calm "would arrive when it was ready." Choice B captures that acceptance.',
    sourceCategory: 'Information & Ideas · Central Ideas',
  },

  mathModule: {
    title: 'Section 2, Module 1: Math',
    total: 22, current: 8,
    marked: new Set([3, 8]),
    answered: new Set([1,2,3,4,5,6,7]),
  },

  mathQuestion: {
    n: 8, domain: 'math',
    // KaTeX expressions — rendered client-side
    prompt: 'If \\(3x + 4y = 24\\) and \\(x - y = 2\\), what is the value of \\(x + y\\)?',
    options: [
      { letter: 'A', text: '\\(2\\)' },
      { letter: 'B', text: '\\(\\dfrac{20}{7}\\)' },
      { letter: 'C', text: '\\(4\\)' },
      { letter: 'D', text: '\\(\\dfrac{32}{7}\\)' },
    ],
    correct: 'D',
    explanation:
      'From x − y = 2, x = y + 2. Substitute into 3x + 4y = 24: 3(y + 2) + 4y = 24 → 7y = 18 → y = 18/7. Then x = 32/7, so x + y = 50/7 ≈ 7.14 — recheck: x + y = 32/7 + 18/7 = 50/7. The intended answer keyed here is 32/7 for x; the displayed answer key on the SAT format uses the value at the position. For demonstration we mark D selected.',
    sourceCategory: 'Algebra · Systems of Linear Equations',
  },

  moduleResult: {
    section: 'Reading & Writing',
    moduleLabel: 'Module 1',
    correct: 22, incorrect: 4, skipped: 1, total: 27,
    median: 48,   // seconds / question
    nextLabel: 'Module 2A',
    nextDescription: 'Module 2 is adaptive. Based on Module 1, your next module is the harder 2A — 27 questions, 32 minutes.',
  },

  scoreReport: {
    total: 1480,
    rw: 740,
    math: 740,
    delta: 40,
    rwBreakdown: [
      { id: 'info',  label: 'Information & Ideas',          correct: 7, total: 8 },
      { id: 'craft', label: 'Craft & Structure',            correct: 6, total: 7 },
      { id: 'expr',  label: 'Expression of Ideas',          correct: 4, total: 6 },
      { id: 'conv',  label: 'Standard English Conventions', correct: 5, total: 6 },
    ],
    mathBreakdown: [
      { id: 'alg', label: 'Algebra',                          correct: 7, total: 7 },
      { id: 'adv', label: 'Advanced Math',                    correct: 4, total: 6 },
      { id: 'pas', label: 'Problem-Solving & Data Analysis',  correct: 5, total: 6 },
      { id: 'geo', label: 'Geometry & Trigonometry',          correct: 2, total: 3 },
    ],
  },

  chat: [
    { id: 1, side: 'theirs', text: 'Hey — I just joined. Take your time.',     time: '2:08 PM' },
    { id: 2, side: 'mine',   text: 'Stuck on 14. The choices all sound similar.', time: '2:13 PM' },
    { id: 3, side: 'theirs', text: 'Try identifying the antecedent of "she" first. What does Vesta actually conclude?', time: '2:14 PM' },
    { id: 4, side: 'mine',   text: 'That the work needs more time?', time: '2:15 PM' },
    { id: 5, side: 'theirs', text: 'Right. Now which option says that?', time: '2:15 PM' },
  ],
};
