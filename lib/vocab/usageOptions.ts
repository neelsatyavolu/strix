import type { VocabEntry } from "./types";

/** Normalize for comparison (trim + collapse space). */
export function normPassage(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

function shuffleInPlace<T>(a: T[], rng: () => number): void {
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
}

function pickN<T>(pool: T[], n: number, rng: () => number): T[] {
  const a = [...pool];
  shuffleInPlace(a, rng);
  return a.slice(0, Math.min(n, a.length));
}

function unique(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of list) {
    const k = normPassage(s).toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(normPassage(s));
  }
  return out;
}

function fixArticles(s: string): string {
  return s
    .replace(/\b([Aa])\s+([aeiouAEIOU][A-Za-z\-]*)/g, "an $2")
    .replace(/\b([Aa])n\s+([bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ][A-Za-z\-]*)/g, "a $2");
}

type Pos = "adj" | "verb" | "noun" | "adv" | "phrase";

function guessPos(word: string, definition: string): Pos {
  const d = definition.toLowerCase();
  const w = word.toLowerCase();
  if (w.includes(" ") || w.includes("-")) {
    if (w.endsWith("ly")) return "adv";
    return "phrase";
  }
  if (w.endsWith("ly")) return "adv";
  if (d.startsWith("to ") || d.startsWith("make ") || d.startsWith("cause ")) return "verb";
  if (
    d.startsWith("the ") ||
    d.startsWith("a ") ||
    d.startsWith("an ") ||
    d.includes("the quality") ||
    d.includes("the state") ||
    d.includes("the act") ||
    d.includes("a person")
  ) {
    return "noun";
  }
  if (w.endsWith("tion") || w.endsWith("ness") || w.endsWith("ity") || w.endsWith("ment") || w.endsWith("ance") || w.endsWith("ence")) {
    return "noun";
  }
  if (w.endsWith("ate") || w.endsWith("ize") || w.endsWith("ify") || w.endsWith("en")) return "verb";
  return "adj";
}

function wl(word: string): string {
  return word.toLowerCase();
}

/**
 * Safe correct variants: rewrites of the bank correctPassage only.
 * Never invent generic verb frames (those produced false-corrects like "vacate damage").
 * Swaps subjects/settings/connectors while keeping the target word and its usage intact.
 */
function paraphrasedCorrects(entry: VocabEntry): string[] {
  const base = normPassage(entry.correctPassage);
  const wordRe = new RegExp(`\\b${escapeRegExp(entry.word)}\\b`, "i");
  if (!wordRe.test(base)) return [base];

  // Pairs: only swap non-target content. Applied one-at-a-time and in combinations.
  const swaps: [RegExp, string][] = [
    [/\bResearchers\b/g, "Historians"],
    [/\bHistorians\b/g, "Scholars"],
    [/\bScholars\b/g, "Analysts"],
    [/\bscientists\b/g, "researchers"],
    [/\bInvestigators\b/g, "Auditors"],
    [/\bEditors\b/g, "Reviewers"],
    [/\bReviewers\b/g, "Critics"],
    [/\bCritics\b/g, "Commentators"],
    [/\bOfficials\b/g, "Administrators"],
    [/\bThe committee\b/g, "The panel"],
    [/\bThe panel\b/g, "The board"],
    [/\bThe board\b/g, "The council"],
    [/\bcommittee\b/g, "commission"],
    [/\bstudents\b/g, "participants"],
    [/\btenants\b/g, "residents"],
    [/\bTenants\b/g, "Occupants"],
    [/\bbuilding\b/g, "complex"],
    [/\boffice\b/g, "suite"],
    [/\bstudy\b/g, "report"],
    [/\breport\b/g, "analysis"],
    [/\bpaper\b/g, "article"],
    [/\barticle\b/g, "essay"],
    [/\btrial\b/g, "experiment"],
    [/\bexperiment\b/g, "trial"],
    [/\bcity\b/g, "district"],
    [/\bregion\b/g, "province"],
    [/\bschool\b/g, "campus"],
    [/\bschools\b/g, "campuses"],
    [/\bdecades\b/g, "years"],
    [/\byears\b/g, "months"],
    [/\bwithin thirty days\b/gi, "within two weeks"],
    [/\bwithin two weeks\b/gi, "by the end of the month"],
    [/\beventually\b/gi, "ultimately"],
    [/\bultimately\b/gi, "in the end"],
    [/\bquickly\b/gi, "promptly"],
    [/\bcarefully\b/gi, "methodically"],
    [/\bDespite\b/g, "In spite of"],
    [/\bAlthough\b/g, "Even though"],
    [/\bHowever,\b/g, "Still,"],
    [/\bAfter\b/g, "Following"],
    [/\bBefore\b/g, "Prior to"],
    [/\bOnce\b/g, "After"],
    [/\bseveral\b/g, "multiple"],
    [/\bmany\b/g, "numerous"],
    [/\bimportant\b/g, "significant"],
    [/\bsignificant\b/g, "substantial"],
  ];

  const out: string[] = [base];
  for (const [re, rep] of swaps) {
    if (!re.test(base)) continue;
    // reset lastIndex for global regex
    re.lastIndex = 0;
    const next = fixArticles(base.replace(re, rep));
    if (next !== base && wordRe.test(next)) out.push(next);
  }

  // Light framing wrappers (keep original clause; still clearly correct use)
  const lower = base.charAt(0).toLowerCase() + base.slice(1);
  const framed = [
    `In a later account, ${lower}`,
    `A follow-up note added that ${lower}`,
    `Field notes recorded that ${lower}`,
  ];
  for (const f of framed) {
    if (wordRe.test(f) && f.length < 220) out.push(fixArticles(f));
  }

  // Apply two sequential swaps for more diversity
  for (let i = 0; i < swaps.length; i += 1) {
    const [re1, rep1] = swaps[i];
    re1.lastIndex = 0;
    if (!re1.test(base)) continue;
    re1.lastIndex = 0;
    const mid = base.replace(re1, rep1);
    for (let j = i + 1; j < Math.min(i + 6, swaps.length); j += 1) {
      const [re2, rep2] = swaps[j];
      re2.lastIndex = 0;
      if (!re2.test(mid)) continue;
      re2.lastIndex = 0;
      const next = fixArticles(mid.replace(re2, rep2));
      if (next !== base && wordRe.test(next)) out.push(next);
    }
  }

  return unique(out).slice(0, 12);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Incorrect-use sentences — same academic register, clear wrong meaning.
 * Prefer reverse sense / wrong role, NOT cartoon absurds.
 * NEVER quote the dictionary definition.
 */
function generatedWrong(word: string, pos: Pos): string[] {
  const w = wl(word);
  const frames: string[] = [];

  if (pos === "verb" || pos === "phrase") {
    frames.push(
      `The new policy will ${w} the problem by making it twice as severe and harder to reverse.`,
      `Editors chose to ${w} the article by deleting every citation that supported its claim.`,
      `She tried to ${w} trust by repeating a rumor she knew was false.`,
      `Managers hoped to ${w} morale by freezing raises and cutting staff without explanation.`,
      `The team moved to ${w} the dispute by refusing to meet with the other side at all.`,
      `Researchers will ${w} the hypothesis by discarding the only data that tested it.`,
      `Officials planned to ${w} attendance by canceling the event and locking the doors.`,
      `He hoped to ${w} the criticism by ignoring every request for clarification.`,
      `The board voted to ${w} the reform by postponing it indefinitely without debate.`,
      `Critics said the update would ${w} safety by removing the only working alarm system.`,
      `They tried to ${w} the shortage by destroying the remaining inventory overnight.`,
      `Leaders moved to ${w} confidence by publishing every private message without context.`,
      `The agency hoped to ${w} the error by reprinting the same mistaken figures.`,
      `She planned to ${w} the delay by adding three more approval stages.`,
      `The lab will ${w} the sample by leaving it unlabeled on a warm shelf.`,
    );
  } else if (pos === "noun") {
    frames.push(
      `There was a ${w} of evidence: every measurement contradicted every other measurement.`,
      `Without any ${w} whatever, the paper still claimed absolute certainty.`,
      `The report’s main ${w} was that nothing interesting had occurred and no claim was made.`,
      `Historians praised the ${w} of the treaty while admitting no treaty had been signed.`,
      `A second ${w} in the archive showed only blank pages with no text at all.`,
      `Readers found the ${w} so precise that it left the argument completely unsupported.`,
      `The study opens with a ${w} that lists no methods, no data, and no conclusions.`,
      `His sudden ${w} was expected; everyone had scheduled it months in advance.`,
      `They measured the ${w} with a ruler and reported it as exactly one centimeter.`,
      `Investors sought a pure ${w} return of zero in a deliberately flat market.`,
      `She filed the form under “${w}” as if it were only a department code.`,
      `The recipe called for one ${w} of flour, printed as if it were a unit of measure.`,
    );
  } else if (pos === "adv") {
    frames.push(
      `The results ${w} contradicted the hypothesis while the authors claimed full support.`,
      `She spoke ${w}, shouting over every speaker and refusing to let anyone finish.`,
      `The species appears ${w} in every habitat on every continent with no exceptions.`,
      `Judges weighed the testimony ${w}, announcing a verdict before any witness spoke.`,
      `He answered ${w}, repeating random numbers that had no connection to the question.`,
      `The signal changed ${w} by remaining perfectly flat for the entire observation period.`,
      `They negotiated ${w} by slamming the table and ending talks after one sentence.`,
      `The data ${w} supported every claim while failing every independent check.`,
    );
  } else {
    // adjective
    frames.push(
      `The plan was so ${w} that every risk had already been eliminated and every step numbered.`,
      `Critics called the wording ${w} because it was crystal clear and left no ambiguity.`,
      `What seemed like a ${w} detail was actually the only point everyone already agreed on.`,
      `Her ${w} response was a long silence that never stated a position at all.`,
      `Building the bridge was a ${w} task completed in ten effortless minutes by one worker.`,
      `A ${w} claim of that kind would be accepted without any evidence or review.`,
      `Readers found the tone ${w} in the sense that it was loud, extreme, and never careful.`,
      `The landscape looked ${w} under neon signs, traffic, and continuous construction noise.`,
      `His ${w} refusal to consider alternatives actually welcomed every competing theory.`,
      `The sample was deliberately ${w}: every school was identical in size, location, and funding.`,
      `The instructions were so ${w} that first-time readers finished them without a single question.`,
      `After the full archive was published, nothing about the episode remained ${w}.`,
      `They described the empty warehouse as ${w} once every shelf was packed to capacity.`,
      `A ${w} schedule listed exact times for each meeting through the entire month.`,
    );
  }

  return unique(frames.map((s) => fixArticles(s)));
}

/** Strip options that leak dictionary wording or meta-definition language. */
function rejectsDefinitionLeak(passage: string, definition: string): boolean {
  const p = passage.toLowerCase();
  const d = definition.toLowerCase().replace(/\.$/, "").trim();
  if (d.length >= 12 && p.includes(d)) return true;
  if (d.length >= 20) {
    const chunk = d.slice(0, Math.min(28, d.length));
    if (chunk.length >= 12 && p.includes(chunk)) return true;
  }
  if (
    /\bdefinition\b/.test(p) ||
    /\bmeans\b/.test(p) ||
    /\bsense of\b/.test(p) ||
    /\bsense “/.test(p) ||
    /\bdefined as\b/.test(p) ||
    /\bdictionary\b/.test(p) ||
    /\bmeaning “/.test(p) ||
    /\btracks the definition\b/.test(p)
  ) {
    return true;
  }
  if (
    (/\btrunk\b/.test(p) && /\bspare\b/.test(p)) ||
    /\bpaint color\b/.test(p) ||
    /\bemoji\b/.test(p) ||
    /\bfavorite color\b/.test(p) ||
    /\bwater-bottle\b/.test(p) ||
    /\bhardware aisle\b/.test(p)
  ) {
    return true;
  }
  return false;
}

/**
 * Passages that count as correct uses for scoring.
 * Bank correctPassage + safe paraphrases of it only (never generic verb templates).
 */
export function correctPool(entry: VocabEntry): string[] {
  const raw = unique(paraphrasedCorrects(entry));
  const filtered = raw.filter((s) => !rejectsDefinitionLeak(s, entry.definition));
  return filtered.length > 0 ? filtered : [entry.correctPassage];
}

/** All passages that are incorrect uses (for sampling distractors). */
export function wrongPool(entry: VocabEntry): string[] {
  const pos = guessPos(entry.word, entry.definition);
  const raw = unique([...entry.wrongPassages, ...generatedWrong(entry.word, pos)]);
  return raw.filter((s) => !rejectsDefinitionLeak(s, entry.definition));
}

export function isCorrectUsage(entry: VocabEntry, passage: string): boolean {
  const p = normPassage(passage).toLowerCase();
  return correctPool(entry).some((c) => normPassage(c).toLowerCase() === p);
}

/**
 * Fresh multiple-choice set: 1 correct + 3 wrongs, shuffled.
 * Samples from full pools so each attempt can differ (not the same 4 lines every time).
 */
export function buildUsageOptions(
  entry: VocabEntry,
  rng: () => number = Math.random,
): { passages: string[]; correctIndex: number; correctPassage: string } {
  const corrects = correctPool(entry);
  const wrongs = wrongPool(entry);
  const correctPassage = pickN(corrects, 1, rng)[0] ?? entry.correctPassage;

  const wrongPoolFiltered = wrongs.filter(
    (w) => normPassage(w).toLowerCase() !== normPassage(correctPassage).toLowerCase(),
  );

  // Mix bank + generated so sets vary across attempts (never lock to the same 3 bank wrongs).
  const bankWrongs = entry.wrongPassages.filter(
    (w) =>
      !rejectsDefinitionLeak(w, entry.definition) &&
      normPassage(w).toLowerCase() !== normPassage(correctPassage).toLowerCase(),
  );
  const generatedOnly = wrongPoolFiltered.filter(
    (w) => !bankWrongs.some((b) => normPassage(b).toLowerCase() === normPassage(w).toLowerCase()),
  );

  let chosenWrongs: string[] = [];
  // Prefer 1 bank wrong when available, then fill from full remaining pool
  if (bankWrongs.length > 0) {
    chosenWrongs.push(...pickN(bankWrongs, 1, rng));
  }
  const remaining = wrongPoolFiltered.filter(
    (w) => !chosenWrongs.some((c) => normPassage(c).toLowerCase() === normPassage(w).toLowerCase()),
  );
  chosenWrongs.push(...pickN(remaining.length > 0 ? remaining : generatedOnly, 3 - chosenWrongs.length, rng));

  let guard = 0;
  while (chosenWrongs.length < 3 && guard < 16) {
    guard += 1;
    const pos = guessPos(entry.word, entry.definition);
    const cand = pickN(generatedWrong(entry.word, pos), 1, rng)[0];
    if (
      cand &&
      !rejectsDefinitionLeak(cand, entry.definition) &&
      !chosenWrongs.some((w) => normPassage(w).toLowerCase() === normPassage(cand).toLowerCase()) &&
      normPassage(cand).toLowerCase() !== normPassage(correctPassage).toLowerCase()
    ) {
      chosenWrongs.push(cand);
    }
  }
  chosenWrongs = chosenWrongs.slice(0, 3);

  const passages = [correctPassage, ...chosenWrongs];
  shuffleInPlace(passages, rng);
  const correctIndex = passages.findIndex(
    (p) => normPassage(p).toLowerCase() === normPassage(correctPassage).toLowerCase(),
  );

  return {
    passages,
    correctIndex: correctIndex >= 0 ? correctIndex : 0,
    correctPassage,
  };
}
