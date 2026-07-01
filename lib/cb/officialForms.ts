import "server-only";
import type { Difficulty, Question, QuestionStub, Section } from "./types";
import { listStubs, getQuestion } from "./client";
import { domainLabel } from "./domains";
import formsJson from "./official-forms.json";

// Official Bluebook practice tests, reconstructed from real forms. The manifest
// holds each test's question ids in published order, per section and per module
// slot (Module 1, the easier Module 2A, the harder Module 2B). Most entries are
// CB qbank `questionId`s; entries captured from Bluebook results may use a
// direct `externalId` plus metadata. Content is still fetched live through the
// same pipeline as everything else — we store only the ordering and metadata
// needed to fetch result-only ids.
export type OfficialModuleKey = "m1" | "easy" | "hard";

interface OfficialExternalQuestionRef {
  externalId: string;
  questionId?: string;
  domain: string;
  domainLabel?: string;
  skill: string;
  skillLabel?: string;
  difficulty: Difficulty;
}

type OfficialQuestionRef = string | OfficialExternalQuestionRef;

type FormManifest = Record<
  string,
  Record<Section, Record<OfficialModuleKey, OfficialQuestionRef[]>>
>;

const FORMS = formsJson as unknown as FormManifest;
const EXPECTED_MODULE_SIZE: Record<Section, number> = { rw: 27, math: 22 };

function refId(ref: OfficialQuestionRef): string {
  return typeof ref === "string" ? ref : ref.externalId;
}

function isPlaceholderId(id: string): boolean {
  return /^(?:xyz|abcd)\d+$/i.test(id);
}

// A form is playable only if every module (M1 / 2A / 2B) is populated for both
// sections. Partially-captured tests stay out of the picker so a routed student
// can never hit a short module.
function isComplete(test: string): boolean {
  const f = FORMS[test];
  if (!f) return false;
  return (["rw", "math"] as const).every((sec) =>
    (["m1", "easy", "hard"] as const).every((m) => {
      const refs = f[sec]?.[m] ?? [];
      return (
        refs.length === EXPECTED_MODULE_SIZE[sec] &&
        refs.every((ref) => !isPlaceholderId(refId(ref)))
      );
    }),
  );
}

function stubFromRef(
  ref: OfficialQuestionRef,
  section: Section,
  byQuestionId: Map<string, QuestionStub>,
  byExternalId: Map<string, QuestionStub>,
): QuestionStub | null {
  if (typeof ref === "string") {
    return byQuestionId.get(ref) ?? byExternalId.get(ref) ?? null;
  }

  const indexed = byExternalId.get(ref.externalId);
  if (indexed) return indexed;

  return {
    questionId: ref.questionId ?? ref.externalId,
    externalId: ref.externalId,
    ibn: null,
    section,
    domain: ref.domain,
    domainLabel: ref.domainLabel ?? domainLabel(section, ref.domain),
    skill: ref.skill,
    skillLabel: ref.skillLabel ?? ref.skill,
    difficulty: ref.difficulty,
  };
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
 * test's published order. Resolves normal manifest `questionId`s against the
 * live qbank stub list, builds lightweight stubs for direct result `externalId`
 * entries, then fetches each question's content. Ids that don't resolve or fail
 * to fetch are skipped, preserving the order of the rest — the real adaptive
 * routing still chooses m1 → easy|hard.
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
  const byExternalId = new Map<string, QuestionStub>();
  for (const s of stubs) {
    byQid.set(s.questionId, s);
    if (s.externalId) byExternalId.set(s.externalId, s);
  }
  const picked = ids
    .map((ref) => stubFromRef(ref, section, byQid, byExternalId))
    .filter((s): s is QuestionStub => !!s);
  const fetched = await Promise.all(picked.map((s) => getQuestion(s)));
  return fetched.filter((q): q is Question => !!q && !!q.stemHtml);
}
