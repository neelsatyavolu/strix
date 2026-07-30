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
    if (w.startsWith("stave ") || w.startsWith("to ")) return "phrase";
    return w.endsWith("ed") || w.endsWith("ing") ? "adj" : "phrase";
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

/** Extra correct-use sentences (in addition to the curated bank passage). */
function generatedCorrect(word: string, definition: string, pos: Pos): string[] {
  const w = wl(word);
  const d = definition.replace(/\.$/, "");
  const out: string[] = [];

  if (pos === "verb" || pos === "phrase") {
    out.push(
      `In context, scholars ${w} a claim only when the evidence is strong enough to support it.`,
      `The reform was designed to ${w} the risk, which matches the sense “${d}.”`,
      `Careful editors asked the author to ${w} the wording so the argument would hold.`,
      `Field teams worked to ${w} the gap between the two measurements before publishing.`,
      `The committee refused to ${w} the decision until every stakeholder had been heard.`,
    );
  } else if (pos === "noun") {
    out.push(
      `There was a clear ${w} in the data: the pattern matched the idea of “${d}.”`,
      `The report’s main ${w} was easy to miss unless you read the methods section carefully.`,
      `Historians still debate the ${w} of the treaty, especially what “${d}” meant in practice.`,
      `Without that ${w}, the rest of the argument would not have been persuasive.`,
      `The study opens by defining ${w} as “${d},” then shows how it appears in the corpus.`,
    );
  } else if (pos === "adv") {
    out.push(
      `The results ${w} supported the hypothesis once the outliers were removed.`,
      `She spoke ${w}, in a manner consistent with “${d}.”`,
      `The pattern appears only ${w} in the archive, not in every decade alike.`,
      `Judges weighed the testimony ${w}, careful not to overstate what it proved.`,
      `The signal changed ${w} enough that a single snapshot would have missed it.`,
    );
  } else {
    // adjective (default)
    out.push(
      `The plan was ${w} in exactly the sense of “${d}.”`,
      `Critics called the wording ${w} because it fit the meaning “${d}.”`,
      `What looked like a ${w} detail later proved essential to the timeline.`,
      `Her ${w} response left little doubt about how the term applies here.`,
      `The landscape felt almost ${w} that morning — a fair use of the word’s sense.`,
      `A ${w} claim in this field is one that is genuinely “${d}.”`,
      `Readers found the tone ${w}, which tracks the definition “${d}.”`,
    );
  }

  return unique(out.map((s) => fixArticles(s)));
}

/** Extra incorrect-use sentences (wrong meaning / POS / opposite). */
function generatedWrong(word: string, definition: string, pos: Pos): string[] {
  const w = wl(word);
  const W = word;
  const frames: string[] = [
    // Opposite / ironic
    `The instructions were so ${w} that every step was numbered, illustrated, and impossible to misread.`,
    `After the full archive was published, nothing about the episode remained ${w}.`,
    `He felt ${w} only in the sense that he was completely certain and free of doubt.`,
    // Wrong domain / physical
    `In the kitchen, a ${w} pinch of salt is defined as exactly one gram on a digital scale.`,
    `Engineers measured the bridge’s ${w} in meters and found it 214.6 meters long.`,
    `Please ${w} the window before you leave so the rain does not get in.`,
    `They packed a spare ${w} in the trunk next to the tire and jumper cables.`,
    `The paint color “${W} Mist” is a standard beige sold in every hardware aisle.`,
    `She filed the forms under “${w}” as if it were a department code, not a concept.`,
    // Wrong POS / nonsense action
    `After lunch the staff agreed to ${w} the chairs into neat rows for the next panel.`,
    `The software will ${w} your password by turning every character into the same emoji.`,
    `To ${w} the budget, accountants printed extra copies and stacked them on the table.`,
    // Social / tone mismatch
    `Parents described the toddler’s ${w} tantrum as calm, quiet, and easy to redirect.`,
    `His ${w} smile suggested he had forgotten every detail of their shared past.`,
    // Science-y wrong
    `The lab labeled the sample ${w} after it crystallized into a single pure solid.`,
    `Astronomers call a star ${w} when its brightness never changes across decades.`,
    // Institutional wrong
    `City hall issued a ${w} license that only certified the applicant’s favorite color.`,
    `The glossary defined ${w} as “see page 2,” then never mentioned it again.`,
    // Quantity / scale joke
    `A ${w} crowd of two people filled the stadium according to the official count.`,
    `Only a ${w} fraction of the pie remained — specifically seven-eighths of it.`,
    // Process wrong
    `To ${w} the experiment, the team powered down the machine and left for lunch.`,
    `The protocol said to ${w} the sample by storing it in a clearly labeled sealed vial.`,
    // Communication wrong
    `His ${w} explanation listed steps 1–5 with diagrams and a glossary for every term.`,
    `She gave a ${w} answer — “yes” — then left without another word.`,
    // Time wrong
    `The crisis was ${w} the moment it started: already fully resolved before anyone noticed.`,
    `They scheduled a ${w} holiday that lasted from noon until noon with no interruption.`,
    // Money / status
    `Investors sought ${w} returns of exactly zero in a guaranteed flat market.`,
    `A ${w} budget is one where every dollar is already spent and no contingency remains.`,
    // Nature
    `Biologists call a forest ${w} when every tree is the same species and the same age.`,
    `The river ran ${w} after engineers straightened every bend into a concrete channel.`,
    // Tech
    `The update was ${w}: it fixed nothing and removed the only feature people used.`,
    `Programmers tried to ${w} the crash by closing the laptop and going to lunch.`,
    // Learning
    `Students completed a ${w} worksheet that asked only for their name written once.`,
    `The lecture was ${w}: it covered every theorem with full proofs on the board.`,
    // Ethics
    `Her ${w} honesty included inventing quotes whenever sources were hard to find.`,
    `Judges called the ruling ${w} because it carefully weighed both sides and cited law.`,
  ];

  // POS-targeted extras
  if (pos === "verb" || pos === "phrase") {
    frames.push(
      `The chef decided to ${w} the soup so it would taste exactly the same as before.`,
      `They hoped to ${w} attendance by cancelling the event and locking the building.`,
      `She tried to ${w} the locked door with a polite thank-you note slipped underneath.`,
    );
  } else if (pos === "noun") {
    frames.push(
      `He stored the ${w} on a shelf next to the spare batteries and packing tape.`,
      `The recipe called for one ${w} of flour, which the author equated with “about a cup.”`,
      `In the report, “${W}” was written where a numeric measurement should have been.`,
    );
  } else if (pos === "adv") {
    frames.push(
      `She answered ${w} by remaining silent for the entire interview.`,
      `The machine ran ${w} until the breaker tripped from a sustained overload.`,
      `They voted ${w}: every hand went up on the first call with no discussion.`,
    );
  } else {
    frames.push(
      `The plan was ${w} because every risk had already been eliminated and every owner named.`,
      `Critics praised the ${w} ending for resolving every subplot in the first ten minutes.`,
      `A ${w} claim in this brochure means “guaranteed and free of all uncertainty.”`,
    );
  }

  // Avoid accidental near-corrects that just restate the definition positively with no misuse —
  // these frames intentionally reverse, reify, or mis-POS the word.
  return unique(frames.map((s) => fixArticles(s)));
}

/** All passages that count as correct uses for scoring. */
export function correctPool(entry: VocabEntry): string[] {
  const pos = guessPos(entry.word, entry.definition);
  return unique([entry.correctPassage, ...generatedCorrect(entry.word, entry.definition, pos)]);
}

/** All passages that are incorrect uses (for sampling distractors). */
export function wrongPool(entry: VocabEntry): string[] {
  const pos = guessPos(entry.word, entry.definition);
  return unique([...entry.wrongPassages, ...generatedWrong(entry.word, entry.definition, pos)]);
}

export function isCorrectUsage(entry: VocabEntry, passage: string): boolean {
  const p = normPassage(passage).toLowerCase();
  return correctPool(entry).some((c) => normPassage(c).toLowerCase() === p);
}

/**
 * Fresh multiple-choice set: 1 correct + 3 wrongs, shuffled.
 * Call on every practice appearance so retries never reuse the same quartet.
 */
export function buildUsageOptions(
  entry: VocabEntry,
  rng: () => number = Math.random,
): { passages: string[]; correctIndex: number; correctPassage: string } {
  const corrects = correctPool(entry);
  const wrongs = wrongPool(entry);
  const correctPassage = pickN(corrects, 1, rng)[0] ?? entry.correctPassage;
  // Exclude any wrong that equals the chosen correct
  const wrongPoolFiltered = wrongs.filter(
    (w) => normPassage(w).toLowerCase() !== normPassage(correctPassage).toLowerCase(),
  );
  let chosenWrongs = pickN(wrongPoolFiltered, 3, rng);
  // Pad if pool is thin
  let guard = 0;
  while (chosenWrongs.length < 3 && guard < 10) {
    guard += 1;
    const filler = fixArticles(
      `Here “${wl(entry.word)}” is used only as a brand name on a water-bottle label, not with its usual meaning (${guard}).`,
    );
    if (!chosenWrongs.some((w) => normPassage(w).toLowerCase() === normPassage(filler).toLowerCase())) {
      chosenWrongs.push(filler);
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
