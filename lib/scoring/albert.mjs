const TABLES = {
  rw: [
    [
      100, 100, 120, 140, 160, 170, 180, 190, 200, 200, 210, 210, 220, 230,
      240, 260, 270, 290, 310, 320, 340, 360, 370, 390, 410, 430, 440, 460,
    ],
    [
      100, 100, 100, 110, 110, 110, 120, 120, 120, 130, 130, 140, 150, 170,
      190, 190, 200, 210, 230, 240, 250, 260, 280, 290, 300, 310, 330, 340,
    ],
  ],
  math: [
    [
      100, 100, 120, 140, 160, 160, 180, 180, 200, 200, 210, 240, 260, 280,
      300, 320, 340, 360, 390, 410, 430, 450, 470,
    ],
    [
      100, 100, 100, 120, 120, 130, 150, 170, 170, 170, 190, 190, 200, 200,
      210, 230, 240, 260, 270, 290, 300, 320, 330,
    ],
  ],
};

const MODULE_ORDER = ['m1', 'm2'];
const CALIBRATION_BLEND = { rw: 6 / 11, math: 7 / 11 };
const CB_AVG_TABLES = {
  rw: [
    [200, 200], [207, 214], [207, 214], [207, 214], [207, 214], [207, 224],
    [210, 237], [211, 247], [217, 259], [221, 269], [229, 280], [236, 290],
    [244, 301], [251, 311], [260, 320], [270, 331], [286, 343], [304, 350],
    [317, 357], [327, 367], [334, 374], [341, 381], [350, 390], [357, 397],
    [364, 404], [371, 411], [379, 419], [384, 424], [393, 433], [403, 443],
    [411, 451], [419, 459], [426, 466], [433, 473], [443, 483], [453, 493],
    [463, 503], [471, 511], [479, 521], [484, 533], [490, 544], [497, 554],
    [509, 566], [517, 577], [527, 587], [537, 597], [547, 607], [557, 617],
    [570, 630], [583, 640], [593, 650], [604, 659], [614, 669], [629, 683],
    [639, 693], [651, 700], [667, 710], [681, 721], [691, 731], [703, 743],
    [713, 753], [724, 764], [739, 770], [749, 780], [764, 787], [779, 800],
    [797, 800],
  ],
  math: [
    [200, 200], [207, 217], [207, 220], [207, 227], [209, 236], [210, 247],
    [216, 259], [226, 271], [239, 293], [254, 316], [277, 337], [299, 347],
    [317, 357], [327, 367], [337, 377], [346, 386], [351, 391], [360, 400],
    [364, 404], [374, 414], [380, 420], [387, 427], [391, 431], [401, 441],
    [410, 450], [420, 460], [429, 469], [439, 479], [449, 491], [459, 504],
    [470, 516], [480, 526], [490, 536], [494, 554], [507, 567], [517, 577],
    [529, 589], [540, 600], [551, 611], [561, 621], [574, 634], [589, 649],
    [601, 661], [611, 671], [627, 687], [641, 701], [656, 716], [673, 733],
    [690, 750], [709, 767], [733, 777], [751, 787], [770, 799], [781, 800],
    [796, 800],
  ],
};

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function round10(n) {
  return Math.round(n / 10) * 10;
}

function normalizedRaw(stats, maxRaw) {
  const correct = Number.isFinite(stats?.correct) ? stats.correct : 0;
  const total = Number.isFinite(stats?.total) ? stats.total : 0;
  if (total <= 0) return 0;
  return clamp(Math.round((clamp(correct, 0, total) / total) * maxRaw), 0, maxRaw);
}

export function scoreAlbertSection(section, modules) {
  const tables = TABLES[section] || TABLES.rw;
  return tables.reduce((sum, table, idx) => {
    const raw = normalizedRaw(modules?.[idx], table.length - 1);
    return sum + table[raw];
  }, 0);
}

export function scoreAlbertTotal({ rw, math }) {
  return scoreAlbertSection('rw', rw) + scoreAlbertSection('math', math);
}

function aggregateStats(modules) {
  return (modules || []).reduce(
    (sum, m) => ({
      correct: sum.correct + (Number.isFinite(m?.correct) ? m.correct : 0),
      total: sum.total + (Number.isFinite(m?.total) ? m.total : 0),
    }),
    { correct: 0, total: 0 },
  );
}

function scoreCbAverageSection(section, modules) {
  const table = CB_AVG_TABLES[section] || CB_AVG_TABLES.rw;
  const stats = aggregateStats(modules);
  const pct = stats.total > 0 ? clamp(stats.correct, 0, stats.total) / stats.total : 0;
  const [lower, upper] = table[Math.round(pct * (table.length - 1))];
  return round10((lower + upper) / 2);
}

export function scoreCalibratedSection(section, modules) {
  const cbAverage = scoreCbAverageSection(section, modules);
  const albert = scoreAlbertSection(section, modules);
  const blend = CALIBRATION_BLEND[section] ?? CALIBRATION_BLEND.rw;
  return clamp(round10(cbAverage + (albert - cbAverage) * blend), 200, 800);
}

export function scoreCalibratedTotal({ rw, math }) {
  return scoreCalibratedSection('rw', rw) + scoreCalibratedSection('math', math);
}

export function moduleStatsFromQuestions(questions) {
  const stats = new Map(MODULE_ORDER.map((key) => [key, { correct: 0, total: 0 }]));
  for (const q of questions || []) {
    if (q?.pretest) continue;
    const key = q?.module === 'm1' ? 'm1' : 'm2';
    const entry = stats.get(key);
    entry.total += 1;
    if (q?.isCorrect) entry.correct += 1;
  }
  return MODULE_ORDER.map((key) => stats.get(key));
}

export function scoreAlbertSectionFromQuestions(section, questions) {
  return scoreAlbertSection(section, moduleStatsFromQuestions(questions));
}

export { TABLES as ALBERT_SAT_TABLES };
