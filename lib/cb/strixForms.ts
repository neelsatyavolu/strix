import "server-only";
import type { Question, QuestionStub, Section } from "./types";
import { getQuestion, listStubs } from "./client";
import strixFormsJson from "./strix-forms.json";

export type StrixModuleKey = "m1" | "easy" | "hard";

type StrixFormManifest = Record<
  string,
  Record<Section, Record<StrixModuleKey, string[]>>
>;

const FORMS = strixFormsJson as StrixFormManifest;

export const STRIX_TESTS: number[] = Object.keys(FORMS)
  .map(Number)
  .sort((a, b) => a - b);

export function isStrixTest(test: number): boolean {
  return Boolean(FORMS[String(test)]);
}

function byQuestionId(stubs: QuestionStub[]): Map<string, QuestionStub> {
  return new Map(stubs.map((stub) => [stub.questionId, stub]));
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

  const stubs = await listStubs(section);
  const index = byQuestionId(stubs);
  const picked = ids
    .map((id) => index.get(id))
    .filter((stub): stub is QuestionStub => Boolean(stub));
  const fetched = await Promise.all(picked.map((stub) => getQuestion(stub)));
  return fetched.filter((question): question is Question => Boolean(question?.stemHtml));
}
