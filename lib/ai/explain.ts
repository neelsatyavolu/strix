// Prompt construction for the per-question "explain my mistake" tutor. The app
// already shows College Board's official rationale; this adds a personalized
// explanation that speaks to the specific answer the student picked.

type Choice = { letter?: string; html?: string };

export type ExplainQuestion = {
  stemHtml?: string;
  choices?: Choice[];
  correct?: string | string[];
  type?: string;
  domainLabel?: string;
  skillLabel?: string;
};

function stripHtml(html: string | undefined): string {
  return String(html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

const SYSTEM = [
  "You are an expert, encouraging SAT tutor.",
  "A student just got a practice question wrong. Explain it in plain language so they actually understand it next time.",
  "Structure your reply in 3 short parts, no headers:",
  "1) Why the correct answer is right.",
  "2) Specifically why the answer the student chose is tempting but wrong.",
  "3) One concrete takeaway or strategy for this question type.",
  "Be concise (under ~180 words), warm, and direct. Do not use markdown headers or bullet symbols.",
].join(" ");

export function buildExplainPrompt(
  q: ExplainQuestion,
  studentValue: string | null,
): { system: string; messages: { role: "user"; content: string }[] } {
  const correct = Array.isArray(q.correct) ? q.correct.join(", ") : (q.correct ?? "");
  const choices = (q.choices ?? [])
    .map((c) => `${c.letter ?? "?"}. ${stripHtml(c.html)}`)
    .join("\n");

  const parts = [
    q.domainLabel ? `Topic: ${q.domainLabel}${q.skillLabel ? ` — ${q.skillLabel}` : ""}` : "",
    `Question: ${stripHtml(q.stemHtml)}`,
    choices ? `Answer choices:\n${choices}` : "",
    `Correct answer: ${correct || "(unknown)"}`,
    `The student chose: ${studentValue ? studentValue : "(left it blank)"}`,
  ].filter(Boolean);

  return {
    system: SYSTEM,
    messages: [{ role: "user", content: parts.join("\n\n") }],
  };
}
