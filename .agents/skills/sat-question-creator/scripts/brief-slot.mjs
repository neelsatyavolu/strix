#!/usr/bin/env node
/**
 * Extract a structure-only brief from a Bluebook slot. Prints JSON to stdout.
 * Does not print official stem/passage/options.
 *
 * Usage:
 *   node scripts/brief-slot.mjs --test 11 --section rw --module m1 --q 7
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "../../../..");
const LIST =
  "https://qbank-api.collegeboard.org/msreportingquestionbank-prod/questionbank/digital/get-questions";
const DETAIL =
  "https://qbank-api.collegeboard.org/msreportingquestionbank-prod/questionbank/digital/get-question";

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

const test = String(arg("test", "11"));
const section = arg("section", "rw");
const moduleKey = arg("module", "m1");
const q = Number(arg("q", "1"));
if (!["rw", "math"].includes(section)) throw new Error("section must be rw|math");
if (!["m1", "easy", "hard"].includes(moduleKey)) throw new Error("module must be m1|easy|hard");
if (!Number.isInteger(q) || q < 1) throw new Error("q must be a 1-based slot");

const official = JSON.parse(
  fs.readFileSync(path.join(ROOT, "lib/cb/official-forms.json"), "utf8"),
);
const ref = official[test]?.[section]?.[moduleKey]?.[q - 1];
if (!ref) throw new Error(`no slot ${test} ${section} ${moduleKey} Q${q}`);

async function post(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

function strip(html) {
  return String(html || "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function classify(raw) {
  const type = raw?.type === "spr" ? "spr" : "mcq";
  const stem = String(raw?.stem || "");
  const stim = String(raw?.stimulus || "");
  const html = `${stim}\n${stem}`;
  const text = strip(html);
  return {
    type,
    wordCount: text.split(/\s+/).filter(Boolean).length,
    hasDiagram: /<svg|<img/i.test(html),
    hasTable: /<table/i.test(html),
    paired: /text\s*1/i.test(html),
    notes: /following notes|while researching a topic/i.test(html),
    blank: /_{3,}|most logical and precise word|which choice completes the text/i.test(html),
  };
}

function stimulusForm(skill, info) {
  if (info.paired || skill === "CTC") return "paired";
  if (info.notes || skill === "SYN") return "notes";
  if (info.hasDiagram) return "diagram";
  if (info.hasTable) return "table";
  if (info.blank || ["WIC", "TRA", "BOU", "FSS"].includes(skill)) return "blank";
  return "single";
}

const domain = section === "rw" ? "INI,CAS,EOI,SEC" : "H,P,Q,S";
const testCode = section === "rw" ? 1 : 2;
const cacheDir = path.join(ROOT, ".cache");
const cacheFile = path.join(cacheDir, `qbank-list-${section}.json`);
const list = fs.existsSync(cacheFile)
  ? JSON.parse(fs.readFileSync(cacheFile, "utf8"))
  : await post(LIST, { asmtEventId: 99, test: testCode, domain }).then((r) => {
      fs.mkdirSync(cacheDir, { recursive: true });
      fs.writeFileSync(cacheFile, JSON.stringify(r));
      return r;
    });
const id = typeof ref === "string" ? ref : ref.questionId || ref.externalId;
const stub =
  list.find((it) => it.questionId === id || it.external_id === id) ||
  (typeof ref === "object"
    ? {
        questionId: ref.questionId || ref.externalId,
        external_id: ref.externalId,
        skill_cd: ref.skill,
        difficulty: ref.difficulty,
        primary_class_cd: ref.domain,
        score_band_range_cd: null,
      }
    : null);
if (!stub?.external_id && !stub?.skill_cd) throw new Error(`slot not in qbank: ${id}`);

let info = { type: "mcq", wordCount: 0, hasDiagram: false, hasTable: false, paired: false, notes: false, blank: false };
if (!stub.external_id) throw new Error(`no external_id for ${id}; cannot brief structure`);
{
  const raw = await post(DETAIL, { external_id: stub.external_id });
  info = classify(raw);
}
if (!info.wordCount) throw new Error("extracted 0 words — CB payload shape changed; fix classify()");
if (!stub.skill_cd || !stub.difficulty) throw new Error("brief missing skill/difficulty; refusing to guess");

const brief = {
  mirrorForm: Number(test),
  section,
  moduleKey,
  slot: q,
  referenceQuestionId: stub.questionId || id,
  domain: stub.primary_class_cd,
  skill: stub.skill_cd,
  difficulty: stub.difficulty,
  band: stub.score_band_range_cd ?? null,
  type: info.type,
  stimulusForm: stimulusForm(stub.skill_cd, info),
  wordCountBand:
    info.wordCount < 40 ? "25-45" :
    info.wordCount < 70 ? "45-75" :
    info.wordCount < 110 ? "70-115" : "110-150",
  taskHint:
    stub.skill_cd === "CTC" ? "paired-relation" :
    stub.skill_cd === "SYN" ? "notes-to-goal" :
    stub.skill_cd === "WIC" ? "forced-sense-blank" :
    stub.skill_cd === "TRA" ? "logical-connector" :
    info.type === "spr" ? "numeric-entry" :
    "match-skill-construct",
  referenceUse: "structure-only",
};

process.stdout.write(`${JSON.stringify(brief, null, 2)}\n`);
