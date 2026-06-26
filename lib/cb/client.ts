import "server-only";
import type { Difficulty, Question, QuestionStub, Section } from "./types";
import {
  SAT_ASMT_EVENT_ID,
  TEST_CODE,
  allDomainCodes,
} from "./domains";
import { normalizeQbank, normalizeDisclosed, stubFrom } from "./normalize";

const BASE =
  "https://qbank-api.collegeboard.org/msreportingquestionbank-prod/questionbank/digital";
const LIST_URL = `${BASE}/get-questions`;
const DETAIL_URL = `${BASE}/get-question`;
const DISCLOSED_URL = (ibn: string) =>
  `https://saic.collegeboard.org/disclosed/${ibn}.json`;

const REQUEST_TIMEOUT_MS = 12_000;

// ---- in-memory caches (per warm server instance) ---------------------------
const LIST_TTL = 60 * 60 * 1000; // 1h
const Q_TTL = 24 * 60 * 60 * 1000; // 24h
const listCache = new Map<string, { at: number; data: QuestionStub[] }>();
const qCache = new Map<string, { at: number; data: Question }>();

function fresh<T>(entry: { at: number; data: T } | undefined, ttl: number): T | null {
  if (!entry) return null;
  return Date.now() - entry.at < ttl ? entry.data : null;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`CB API ${res.status} for ${url}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

async function getJson<T>(url: string): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    if (!res.ok) throw new Error(`CB API ${res.status} for ${url}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

/** List question stubs for a section, optionally filtered to specific domains. */
export async function listStubs(
  section: Section,
  domainCodes?: string[],
): Promise<QuestionStub[]> {
  const codes = domainCodes?.length ? domainCodes : allDomainCodes(section);
  const key = `${section}:${[...codes].sort().join(",")}`;
  const cached = fresh(listCache.get(key), LIST_TTL);
  if (cached) return cached;

  const raw = await postJson<Array<Record<string, unknown>>>(LIST_URL, {
    asmtEventId: SAT_ASMT_EVENT_ID,
    test: TEST_CODE[section],
    domain: codes.join(","),
  });
  const stubs = (Array.isArray(raw) ? raw : []).map((it) => stubFrom(it, section));
  listCache.set(key, { at: Date.now(), data: stubs });
  return stubs;
}

/** Fetch + normalize a single question by its stub. */
export async function getQuestion(stub: QuestionStub): Promise<Question | null> {
  const id = stub.externalId ?? stub.ibn ?? stub.questionId;
  const cached = fresh(qCache.get(id), Q_TTL);
  if (cached) return cached;

  try {
    let q: Question;
    if (stub.externalId) {
      const raw = await postJson<Record<string, unknown>>(DETAIL_URL, {
        external_id: stub.externalId,
      });
      q = normalizeQbank(raw, stub);
    } else if (stub.ibn) {
      const raw = await getJson<Record<string, unknown>>(DISCLOSED_URL(stub.ibn));
      q = normalizeDisclosed(raw, stub, stub.section);
    } else {
      return null;
    }
    qCache.set(id, { at: Date.now(), data: q });
    return q;
  } catch {
    return null;
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface DrawOptions {
  section: Section;
  /** CB domain codes; omit for all domains in the section. */
  domains?: string[];
  difficulty?: Difficulty | null;
  limit: number;
  /** Prefer qbank (external_id) items; disclosed items render math as images. */
  preferQbank?: boolean;
}

/** Draw a normalized set of questions matching the given filters. */
export async function drawQuestions(opts: DrawOptions): Promise<Question[]> {
  const { section, domains, difficulty, limit, preferQbank = true } = opts;
  let stubs = await listStubs(section, domains);
  if (difficulty) stubs = stubs.filter((s) => s.difficulty === difficulty);
  if (preferQbank) stubs = stubs.filter((s) => s.externalId);

  const picked = shuffle(stubs).slice(0, Math.max(0, limit) * 2); // overdraw for failures
  const out: Question[] = [];
  for (const stub of picked) {
    if (out.length >= limit) break;
    const q = await getQuestion(stub);
    if (q && q.stemHtml) out.push(q);
  }
  return out;
}

/** Fetch a single question by external_id (used for resume / direct lookup). */
export async function getQuestionByExternalId(
  externalId: string,
  section: Section,
): Promise<Question | null> {
  return getQuestion({
    questionId: externalId,
    externalId,
    ibn: null,
    section,
    domain: "",
    domainLabel: "",
    skill: "",
    skillLabel: "",
    difficulty: "M",
  });
}
