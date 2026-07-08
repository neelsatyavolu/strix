import "server-only";
import type { Question, Section } from "./types";
import { getQuestion, getQuestionByExternalId, listStubs, stubId } from "./client";
import { getOfficialQuestionByExternalId } from "./officialForms";

// Resolve a question id (qbank external_id, disclosed ibn, or CB questionId)
// to a full normalized Question. Shared by the questions API (direct lookup)
// and the grading API. Official-form manifests are checked first so result-only
// external ids resolve; then the section stub lists; then a direct detail fetch.
export async function findQuestionById(
  id: string,
  section?: Section,
): Promise<Question | null> {
  const needle = id.trim();
  if (!needle) return null;

  const officialQuestion = await getOfficialQuestionByExternalId(needle, section);
  if (officialQuestion) return officialQuestion;

  const sections: Section[] = section ? [section] : ["rw", "math"];
  for (const candidate of sections) {
    const stubs = await listStubs(candidate);
    const stub = stubs.find((s) =>
      s.questionId === needle ||
      s.externalId === needle ||
      s.ibn === needle ||
      stubId(s) === needle,
    );
    if (stub) return getQuestion(stub);
  }

  return section ? getQuestionByExternalId(needle, section) : null;
}
