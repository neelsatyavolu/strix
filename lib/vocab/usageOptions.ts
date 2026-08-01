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
 * Incorrect-use sentences — same academic register, clear wrong meaning.
 * Prefer reverse sense / wrong role, NOT cartoon absurds (no trunk/paint/emoji jokes).
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
    );
  } else if (pos === "adv") {
    frames.push(
      `The results ${w} contradicted the hypothesis while the authors claimed full support.`,
      `She spoke ${w}, shouting over every speaker and refusing to let anyone finish.`,
      `The species appears ${w} in every habitat on every continent with no exceptions.`,
      `Judges weighed the testimony ${w}, announcing a verdict before any witness spoke.`,
      `He answered ${w}, repeating random numbers that had no connection to the question.`,
      `The signal changed ${w} by remaining perfectly flat for the entire observation period.`,
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
  // Reject cartoon distractors if any remain in bank
  if (
    /\btrunk\b/.test(p) && /\bspare\b/.test(p) ||
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
 * Bank correctPassage only — generic templates (e.g. "to ${word} environmental damage")
 * are often false-correct for verbs like vacate/conjecture and must not be scored correct.
 */
export function correctPool(entry: VocabEntry): string[] {
  const raw = unique([entry.correctPassage]);
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
 * Never includes the dictionary definition in any option.
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
  let chosenWrongs = pickN(wrongPoolFiltered, 3, rng);
  // Prefer bank wrongs when available (usually higher quality after review)
  const bankWrongs = entry.wrongPassages.filter(
    (w) =>
      !rejectsDefinitionLeak(w, entry.definition) &&
      normPassage(w).toLowerCase() !== normPassage(correctPassage).toLowerCase(),
  );
  if (bankWrongs.length >= 3) {
    chosenWrongs = pickN(bankWrongs, 3, rng);
  } else if (bankWrongs.length > 0) {
    const rest = wrongPoolFiltered.filter((w) => !bankWrongs.includes(w as typeof bankWrongs[0]));
    chosenWrongs = [...pickN(bankWrongs, bankWrongs.length, rng), ...pickN(rest, 3 - bankWrongs.length, rng)].slice(0, 3);
  }

  let guard = 0;
  while (chosenWrongs.length < 3 && guard < 12) {
    guard += 1;
    const pos = guessPos(entry.word, entry.definition);
    const extra = generatedWrong(entry.word, pos);
    const cand = pickN(extra, 1, rng)[0];
    if (
      cand &&
      !rejectsDefinitionLeak(cand, entry.definition) &&
      !chosenWrongs.some((w) => normPassage(w).toLowerCase() === normPassage(cand).toLowerCase())
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
