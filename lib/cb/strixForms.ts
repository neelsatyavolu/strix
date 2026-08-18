import "server-only";
import type { Question, QuestionStub, Section } from "./types";
import { getQuestion, listStubs } from "./client";
import { clean } from "./normalize";
import strixFormsJson from "./strix-forms.json";
import strixOriginalsJson from "./strix-originals.json";

export type StrixModuleKey = "m1" | "easy" | "hard";

type StrixFormManifest = Record<
  string,
  Record<Section, Record<StrixModuleKey, string[]>>
>;

type OriginalRecord = Question & {
  verification?: { status?: string };
};

const FORMS = strixFormsJson as StrixFormManifest;
const ORIGINALS = strixOriginalsJson as Record<string, OriginalRecord>;

export const STRIX_TESTS: number[] = Object.keys(FORMS)
  .map(Number)
  .sort((a, b) => a - b);

export function isStrixTest(test: number): boolean {
  return Boolean(FORMS[String(test)]);
}

function byQuestionId(stubs: QuestionStub[]): Map<string, QuestionStub> {
  return new Map(stubs.map((stub) => [stub.questionId, stub]));
}

export function isStrixOriginalId(id: string): boolean {
  return Boolean(ORIGINALS[id]);
}

function serveOriginal(raw: OriginalRecord): Question {
  return {
    id: raw.id,
    source: "strix",
    section: raw.section,
    domain: raw.domain,
    domainLabel: raw.domainLabel,
    skill: raw.skill,
    skillLabel: raw.skillLabel,
    difficulty: raw.difficulty,
    type: raw.type,
    stemHtml: clean(raw.stemHtml),
    stimulusHtml: raw.stimulusHtml ? clean(raw.stimulusHtml) : null,
    choices: (raw.choices || []).map((choice) => ({
      id: choice.id,
      letter: choice.letter,
      html: clean(choice.html),
    })),
    correct: raw.correct,
    correctIds: raw.type === "mcq" ? raw.correctIds : [],
    rationaleHtml: clean(raw.rationaleHtml),
  };
}

export async function getStrixModule(
  test: number,
  section: Section,
  moduleKey: StrixModuleKey,
): Promise<Question[]> {
  const ids = FORMS[String(test)]?.[section]?.[moduleKey];
  if (!ids?.length) {
    throw new Error(`No Strix test for ${test} ${section} ${moduleKey}`);
  }

  const qbankIds = ids.filter((id) => !ORIGINALS[id]);
  const stubs = qbankIds.length ? await listStubs(section) : [];
  const index = byQuestionId(stubs);
  const loaded = new Map<string, Question>();
  await Promise.all(
    qbankIds.map(async (id) => {
      const stub = index.get(id);
      if (!stub) throw new Error(`Strix ${test} missing qbank item ${id}`);
      const question = await getQuestion(stub);
      if (!question?.stemHtml) throw new Error(`Strix ${test} failed to load ${id}`);
      loaded.set(id, question);
    }),
  );

  return ids.map((id) => {
    if (ORIGINALS[id]) return serveOriginal(ORIGINALS[id]);
    const question = loaded.get(id);
    if (!question) throw new Error(`Strix ${test} missing ${id}`);
    return question;
  });
}
