import DOMPurify from "isomorphic-dompurify";
import type { Choice, Question, QuestionStub, Section } from "./types";
import { domainLabel } from "./domains";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

// Sanitize CB-supplied HTML. Allow MathML (math content) and SVG, plus images
// (disclosed items render math as <img>). Everything dangerous is stripped.
export function clean(html: unknown): string {
  if (typeof html !== "string" || !html) return "";
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true, mathMl: true, svg: true },
    ADD_ATTR: ["alttext", "displaystyle", "mathvariant", "scriptlevel"],
  });
}

interface RawDetail {
  type?: string;
  stem?: string;
  stimulus?: string;
  rationale?: string;
  answerOptions?: Array<{ id: string; content: string }>;
  keys?: string[];
  correct_answer?: string[];
}

/** Normalize a qbank (external_id) detail response into our Question shape. */
export function normalizeQbank(raw: RawDetail, stub: QuestionStub): Question {
  const type = raw.type === "spr" ? "spr" : "mcq";
  const options = Array.isArray(raw.answerOptions) ? raw.answerOptions : [];

  const choices: Choice[] = options.map((o, i) => ({
    id: o.id,
    letter: LETTERS[i] ?? String(i + 1),
    html: clean(o.content),
  }));

  const correctIds = Array.isArray(raw.keys) ? raw.keys : [];
  let correct: string[];
  if (type === "spr") {
    correct = correctIds; // literal accepted answers
  } else if (Array.isArray(raw.correct_answer) && raw.correct_answer.length) {
    correct = raw.correct_answer;
  } else {
    // derive letters from option ids
    correct = correctIds
      .map((id) => choices.find((c) => c.id === id)?.letter)
      .filter((x): x is string => Boolean(x));
  }

  return {
    id: stub.externalId ?? stub.questionId,
    source: "qbank",
    section: stub.section,
    domain: stub.domain,
    domainLabel: stub.domainLabel,
    skill: stub.skill,
    skillLabel: stub.skillLabel,
    difficulty: stub.difficulty,
    type,
    stemHtml: clean(raw.stem),
    stimulusHtml: raw.stimulus ? clean(raw.stimulus) : null,
    choices,
    correct,
    correctIds: type === "mcq" ? correctIds : [],
    rationaleHtml: clean(raw.rationale),
  };
}

interface RawDisclosed {
  item_id?: string;
  section?: string;
  prompt?: string;
  answer?: {
    style?: string;
    choices?: Record<string, { body?: string }>;
    correct_choice?: string;
    rationale?: string;
  };
}

/** Normalize a disclosed (ibn) item from saic.collegeboard.org. */
export function normalizeDisclosed(
  raw: RawDisclosed,
  stub: QuestionStub,
  section: Section,
): Question {
  const choicesObj = raw.answer?.choices ?? {};
  const order = ["a", "b", "c", "d", "e", "f"];
  const choices: Choice[] = order
    .filter((k) => choicesObj[k])
    .map((k, i) => ({
      id: k,
      letter: LETTERS[i] ?? k.toUpperCase(),
      html: clean(choicesObj[k]?.body),
    }));
  const correctKey = (raw.answer?.correct_choice ?? "").toLowerCase();
  const correctLetter = LETTERS[order.indexOf(correctKey)] ?? correctKey.toUpperCase();

  return {
    id: stub.ibn ?? stub.questionId,
    source: "disclosed",
    section,
    domain: stub.domain,
    domainLabel: stub.domainLabel,
    skill: stub.skill,
    skillLabel: stub.skillLabel,
    difficulty: stub.difficulty,
    type: "mcq",
    stemHtml: clean(raw.prompt),
    stimulusHtml: null,
    choices,
    correct: correctKey ? [correctLetter] : [],
    correctIds: correctKey ? [correctKey] : [],
    rationaleHtml: clean(raw.answer?.rationale),
  };
}

// Helper used by the list endpoint mapper.
export function stubFrom(item: Record<string, unknown>, section: Section): QuestionStub {
  const domain = String(item.primary_class_cd ?? "");
  return {
    questionId: String(item.questionId ?? ""),
    externalId: (item.external_id as string) ?? null,
    ibn: (item.ibn as string) ?? null,
    section,
    domain,
    domainLabel: domainLabel(section, domain),
    skill: String(item.skill_cd ?? ""),
    skillLabel: String(item.skill_desc ?? ""),
    difficulty: (["E", "M", "H"].includes(String(item.difficulty))
      ? item.difficulty
      : "M") as Question["difficulty"],
  };
}
