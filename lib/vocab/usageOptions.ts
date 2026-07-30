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
 * Extra correct-use sentences. NEVER quote the dictionary definition —
 * the student must infer meaning from context alone.
 */
function generatedCorrect(word: string, pos: Pos): string[] {
  const w = wl(word);
  const out: string[] = [];

  if (pos === "verb" || pos === "phrase") {
    out.push(
      `Independent labs helped ${w} the original claim with measurements of their own.`,
      `New safety rules were designed to ${w} the risk of accidents at the plant.`,
      `Editors worked overnight to ${w} errors that had slipped into the first edition.`,
      `The team refused to ${w} the decision until every stakeholder had been heard.`,
      `Field researchers tried to ${w} the gap between the two earlier surveys.`,
      `Critics argue that only careful data can ${w} such a sweeping conclusion.`,
      `Officials moved quickly to ${w} the problem before it spread to neighboring districts.`,
      `She tried to ${w} the dispute by proposing a compromise neither side had considered.`,
    );
  } else if (pos === "noun") {
    out.push(
      `There was a clear ${w} between the two maps, suggesting different survey methods.`,
      `Without that ${w}, the rest of the argument would not have been persuasive.`,
      `The study’s main ${w} was that early exposure improved later reading scores.`,
      `Despite a ${w} of reliable data, the panel still hesitated to issue a firm recommendation.`,
      `The report opens with a brief ${w} of the experiment’s design and limitations.`,
      `His sudden ${w} surprised colleagues who had expected a longer silence.`,
      `A second ${w} in the archive confirmed what the first letter only hinted at.`,
      `Readers noticed the ${w} only after comparing both drafts side by side.`,
    );
  } else if (pos === "adv") {
    out.push(
      `The results ${w} supported the hypothesis once the outliers were removed.`,
      `She spoke ${w}, never raising her voice even when the debate grew heated.`,
      `The species appears only ${w} along the coast, not in every survey year.`,
      `Judges weighed the testimony ${w}, careful not to overstate what it proved.`,
      `The signal changed ${w} enough that a single snapshot would have missed it.`,
      `He answered ${w}, choosing each word as if the room were taking notes.`,
    );
  } else {
    out.push(
      `Critics called the mission statement ${w} because it never defined success.`,
      `What seemed like a ${w} detail later proved essential to the timeline.`,
      `Her ${w} response left little doubt about where she stood on the proposal.`,
      `The path through the mountains was an ${w} climb that took days of skilled work.`,
      `After months of ${w} labor, the climbers finally reached the ridge above the storm.`,
      `A ${w} claim in this paper would not survive peer review without better evidence.`,
      `Readers found the tone ${w}, especially in the final paragraph’s careful hedging.`,
      `The landscape looked almost ${w} in the early light, quiet and barely disturbed.`,
      `His ${w} refusal to consider alternatives weakened the paper’s credibility.`,
      `The sample was deliberately ${w}, including both rural and urban schools.`,
    );
  }

  return unique(out.map((s) => fixArticles(s)));
}

/**
 * Incorrect-use sentences (wrong meaning, opposite, or wrong POS).
 * NEVER quote the dictionary definition.
 */
function generatedWrong(word: string, pos: Pos): string[] {
  const w = wl(word);
  const W = word;
  const frames: string[] = [
    `The instructions were so ${w} that every step was numbered and impossible to misread.`,
    `After the full archive was published, nothing about the episode remained ${w}.`,
    `In the kitchen, a ${w} pinch of salt is defined as exactly one gram on a digital scale.`,
    `Engineers measured the bridge’s ${w} in meters and found it 214.6 meters long.`,
    `Please ${w} the window before you leave so the rain does not get in.`,
    `They packed a spare ${w} in the trunk next to the tire and jumper cables.`,
    `The paint color “${W} Mist” is a standard beige sold in every hardware aisle.`,
    `She filed the forms under “${w}” as if it were a department code, not a concept.`,
    `After lunch the staff agreed to ${w} the chairs into neat rows for the next panel.`,
    `The software will ${w} your password by turning every character into the same emoji.`,
    `To ${w} the budget, accountants printed extra copies and stacked them on the table.`,
    `Parents described the toddler’s ${w} tantrum as calm, quiet, and easy to redirect.`,
    `The lab labeled the sample ${w} after it crystallized into a single pure solid.`,
    `Astronomers call a star ${w} when its brightness never changes across decades.`,
    `City hall issued a ${w} license that only certified the applicant’s favorite color.`,
    `The glossary defined ${w} as “see page 2,” then never mentioned it again.`,
    `A ${w} crowd of two people filled the stadium according to the official count.`,
    `To ${w} the experiment, the team powered down the machine and left for lunch.`,
    `His ${w} explanation listed steps 1–5 with diagrams and a glossary for every term.`,
    `She gave a ${w} answer — “yes” — then left without another word.`,
    `The crisis was ${w} the moment it started: already fully resolved before anyone noticed.`,
    `They scheduled a ${w} holiday that lasted from noon until noon with no interruption.`,
    `Investors sought ${w} returns of exactly zero in a guaranteed flat market.`,
    `Biologists call a forest ${w} when every tree is the same species and the same age.`,
    `The update was ${w}: it fixed nothing and removed the only feature people used.`,
    `Programmers tried to ${w} the crash by closing the laptop and going to lunch.`,
    `Students completed a ${w} worksheet that asked only for their name written once.`,
    `The lecture was ${w}: it covered every theorem with full proofs on the board.`,
    `Judges called the ruling ${w} because it carefully weighed both sides and cited law.`,
    `The river ran ${w} after engineers straightened every bend into a concrete channel.`,
  ];

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

  return unique(frames.map((s) => fixArticles(s)));
}

/** Strip options that leak dictionary wording or meta-definition language. */
function rejectsDefinitionLeak(passage: string, definition: string): boolean {
  const p = passage.toLowerCase();
  const d = definition.toLowerCase().replace(/\.$/, "").trim();
  if (d.length >= 12 && p.includes(d)) return true;
  // long contiguous chunk of definition
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
  return false;
}

/** All passages that count as correct uses for scoring. */
export function correctPool(entry: VocabEntry): string[] {
  const pos = guessPos(entry.word, entry.definition);
  const raw = unique([entry.correctPassage, ...generatedCorrect(entry.word, pos)]);
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
  let guard = 0;
  while (chosenWrongs.length < 3 && guard < 12) {
    guard += 1;
    const filler = fixArticles(
      `Here “${wl(entry.word)}” appears only as a brand name on a water-bottle label (${guard}).`,
    );
    if (
      !rejectsDefinitionLeak(filler, entry.definition) &&
      !chosenWrongs.some((w) => normPassage(w).toLowerCase() === normPassage(filler).toLowerCase())
    ) {
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
