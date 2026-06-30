import "server-only";
import type { Question, QuestionStub, Section } from "./types";
import { listStubs, getQuestion } from "./client";
import formsJson from "./official-forms.json";

// Official Bluebook practice tests, reconstructed from real forms. The manifest
// holds each test's question ids in published order, per section and per module
// slot (Module 1, the easier Module 2A, the harder Module 2B). The ids are real
// CB qbank `questionId`s (verified ~99.8% resolvable); content is fetched live
// through the same pipeline as everything else — we store only the ordering.
export type OfficialModuleKey = "m1" | "easy" | "hard";

type FormManifest = Record<
  string,
  Record<Section, Record<OfficialModuleKey, string[]>>
>;

const FORMS = formsJson as FormManifest;

// A form is playable only if every module (M1 / 2A / 2B) is populated for both
// sections — a partially-captured test (e.g. one still missing its hard module)
// stays out of the picker so a routed student can never hit an empty module.
function isComplete(test: string): boolean {
  const f = FORMS[test];
  if (!f) return false;
  return (["rw", "math"] as const).every((sec) =>
    (["m1", "easy", "hard"] as const).every((m) => (f[sec]?.[m]?.length ?? 0) > 0),
  );
}

/** Available (complete) Bluebook test numbers, highest first (default play order). */
export const OFFICIAL_TESTS: number[] = Object.keys(FORMS)
  .filter(isComplete)
  .map(Number)
  .sort((a, b) => b - a);

export function isOfficialTest(test: number): boolean {
  return isComplete(String(test));
}

/**
 * Load one module of an official Bluebook form as real CB questions, in the
 * test's published order. Resolves the manifest's `questionId`s against the live
 * qbank stub list, then fetches each question's content. Ids that don't resolve
 * or fail to fetch (e.g. an undisclosed pretest slot) are skipped, preserving the
 * order of the rest — the real adaptive routing still chooses m1 → easy|hard.
 */
export async function getOfficialModule(
  test: number,
  section: Section,
  moduleKey: OfficialModuleKey,
): Promise<Question[]> {
  const ids = FORMS[String(test)]?.[section]?.[moduleKey];
  if (!ids?.length) {
    throw new Error(`No official form for test ${test} ${section} ${moduleKey}`);
  }
  const stubs = await listStubs(section);
  const byQid = new Map<string, QuestionStub>();
  for (const s of stubs) byQid.set(s.questionId, s);
  const picked = ids
    .map((qid) => byQid.get(qid))
    .filter((s): s is QuestionStub => !!s);
  const fetched = await Promise.all(picked.map((s) => getQuestion(s)));
  return fetched.filter((q): q is Question => !!q && !!q.stemHtml);
}
