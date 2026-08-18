#!/usr/bin/env node
/**
 * Assemble a Strix test as a Bluebook form mirror from unused qbank items.
 * Usage: node scripts/build-strix-test-2.mjs <testNumber> [mirrorForm]
 * Example: node scripts/build-strix-test-2.mjs 4 10
 * Writes lib/cb/strix-forms.json, lib/cb/strix-mirrors.json, docs/strix-test-N-audit.md.
 */
import fs from "node:fs";
import path from "node:path";

const TEST_NUM = String(Number(process.argv[2] || 2));
const MIRROR = String(Number(process.argv[3] || 11));
if (!/^[1-9]\d*$/.test(TEST_NUM)) throw new Error(`bad test number: ${process.argv[2]}`);
if (!/^(10|11)$/.test(MIRROR)) throw new Error(`mirror must be 10 or 11, got ${process.argv[3]}`);

const ROOT = path.resolve(import.meta.dirname, "..");
const TMP = "/tmp/strix-tests";
const DETAIL_DIR = path.join(TMP, "details");
const LIST_URL =
  "https://qbank-api.collegeboard.org/msreportingquestionbank-prod/questionbank/digital/get-questions";
const DETAIL_URL =
  "https://qbank-api.collegeboard.org/msreportingquestionbank-prod/questionbank/digital/get-question";

const MODULES = ["m1", "easy", "hard"];
const CONCURRENCY = 6;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function postJson(url, body, attempt = 0) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (res.status === 429 || res.status >= 500) {
      if (attempt >= 6) throw new Error(`${res.status} after retries`);
      await sleep(800 * 2 ** attempt);
      return postJson(url, body, attempt + 1);
    }
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    return res.json();
  } catch (err) {
    if (attempt < 6 && /abort|network|fetch|ECONN|ETIMEDOUT/i.test(String(err))) {
      await sleep(800 * 2 ** attempt);
      return postJson(url, body, attempt + 1);
    }
    throw err;
  } finally {
    clearTimeout(t);
  }
}

function collectOfficialIds(official) {
  const ids = new Set();
  for (const form of Object.values(official)) {
    for (const sec of Object.values(form)) {
      for (const mod of Object.values(sec)) {
        for (const ref of mod) {
          if (typeof ref === "string") ids.add(ref);
          else {
            if (ref.questionId) ids.add(ref.questionId);
            if (ref.externalId) ids.add(ref.externalId);
          }
        }
      }
    }
  }
  return ids;
}

function collectStrixIds(strix, skipTest) {
  const ids = new Set();
  for (const [num, form] of Object.entries(strix)) {
    if (skipTest && num === String(skipTest)) continue;
    for (const sec of Object.values(form)) {
      for (const mod of Object.values(sec)) {
        for (const id of mod) ids.add(id);
      }
    }
  }
  return ids;
}

function stripHtml(html) {
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
  const text = stripHtml(html);
  const stimText = stripHtml(stim);
  return {
    type,
    hasDiagram: /<svg|<img/i.test(html),
    hasTable: /<table/i.test(html),
    paired: /text\s*1/i.test(html),
    notes: /following notes/i.test(html) || /while researching a topic/i.test(html),
    blank: /_{3,}|&nbsp;_{2,}|blank/i.test(html),
    textLen: text.length,
    stimLen: stimText.length,
    topic: topicKey(stimText || text),
  };
}

function topicKey(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 4)
    .slice(0, 24);
}

function topicOverlap(a, b) {
  if (!a.length || !b.length) return 0;
  const sb = new Set(b);
  let n = 0;
  for (const w of a) if (sb.has(w)) n++;
  return n / Math.min(a.length, b.length);
}

function formLabel(section, skill, info) {
  if (section === "math") return info.hasDiagram ? "diagram" : info.hasTable ? "table" : "none";
  if (info.paired || skill === "CTC") return "paired";
  if (info.notes || skill === "SYN") return "notes";
  if (info.blank || ["WIC", "TRA", "BOU", "FSS"].includes(skill)) return "blank/transition";
  return "single";
}

async function loadLists() {
  const rwPath = path.join(TMP, "rw.json");
  const mathPath = path.join(TMP, "math.json");
  if (fs.existsSync(rwPath) && fs.existsSync(mathPath)) {
    return {
      rw: JSON.parse(fs.readFileSync(rwPath, "utf8")),
      math: JSON.parse(fs.readFileSync(mathPath, "utf8")),
    };
  }
  const [rw, math] = await Promise.all([
    postJson(LIST_URL, { asmtEventId: 99, test: 1, domain: "INI,CAS,EOI,SEC" }),
    postJson(LIST_URL, { asmtEventId: 99, test: 2, domain: "H,P,Q,S" }),
  ]);
  fs.mkdirSync(TMP, { recursive: true });
  fs.writeFileSync(rwPath, JSON.stringify(rw));
  fs.writeFileSync(mathPath, JSON.stringify(math));
  return { rw, math };
}

function indexItems(items) {
  const byQuestionId = new Map();
  const byExternalId = new Map();
  for (const it of items) {
    byQuestionId.set(it.questionId, it);
    if (it.external_id) byExternalId.set(it.external_id, it);
  }
  return { byQuestionId, byExternalId };
}

function resolveSource(section, ref, idx) {
  if (typeof ref === "string") {
    return idx.byQuestionId.get(ref) || idx.byExternalId.get(ref) || null;
  }
  const listed =
    (ref.questionId && idx.byQuestionId.get(ref.questionId)) ||
    (ref.externalId && idx.byExternalId.get(ref.externalId)) ||
    null;
  if (listed) return listed;
  if (!ref.externalId) return null;
  return {
    questionId: ref.questionId || ref.externalId,
    external_id: ref.externalId,
    skill_cd: ref.skill,
    difficulty: ref.difficulty,
    score_band_range_cd: null,
    primary_class_cd: ref.domain,
    section,
  };
}

function detailPath(questionId) {
  return path.join(DETAIL_DIR, `${questionId}.json`);
}

function readDetail(questionId) {
  const p = detailPath(questionId);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

async function fetchDetail(item) {
  const cached = readDetail(item.questionId);
  if (cached) return cached;
  if (!item.external_id) return null;
  const raw = await postJson(DETAIL_URL, { external_id: item.external_id });
  const info = classify(raw);
  const rec = {
    questionId: item.questionId,
    external_id: item.external_id,
    skill: item.skill_cd,
    difficulty: item.difficulty,
    band: item.score_band_range_cd,
    domain: item.primary_class_cd,
    ...info,
  };
  fs.mkdirSync(DETAIL_DIR, { recursive: true });
  fs.writeFileSync(detailPath(item.questionId), JSON.stringify(rec));
  return rec;
}

async function fetchAll(items, label) {
  fs.mkdirSync(DETAIL_DIR, { recursive: true });
  const pending = items.filter((it) => it.external_id && !fs.existsSync(detailPath(it.questionId)));
  console.log(`${label}: ${items.length} needed, ${pending.length} to fetch`);
  let done = 0;
  let i = 0;
  async function worker() {
    while (i < pending.length) {
      const item = pending[i++];
      try {
        await fetchDetail(item);
      } catch (err) {
        console.warn("fetch fail", item.questionId, err.message);
      }
      done++;
      if (done % 50 === 0 || done === pending.length) {
        console.log(`  ${label} ${done}/${pending.length}`);
      }
      await sleep(40);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
}

function scoreCandidate(slot, orig, cand, usedTopics) {
  if (!cand) return { score: -1e9, reasons: ["no detail"] };
  let score = 0;
  const reasons = [];
  if (cand.skill !== slot.skill) return { score: -1e9, reasons: ["skill"] };
  if (cand.difficulty !== slot.diff) return { score: -1e9, reasons: ["diff"] };

  // Type quantity (MCQ vs SPR) outranks staying on the exact 1–7 band.
  const typeOk = cand.type === orig.type;
  if (typeOk) {
    score += 220;
    reasons.push("type");
  } else {
    score -= 220;
    reasons.push(`${orig.type}→${cand.type}`);
  }

  const bandGap = Math.abs((cand.band ?? 4) - (orig.band ?? slot.band ?? 4));
  score -= bandGap * 35;
  if (bandGap === 0) reasons.push("band");
  else reasons.push(`bandΔ${bandGap}`);

  if (cand.hasDiagram === orig.hasDiagram) score += 50;
  else {
    score -= 50;
    reasons.push(orig.hasDiagram ? "diagram→none" : "none→diagram");
  }
  if (cand.hasTable === orig.hasTable) score += 18;
  else score -= 10;

  if (slot.section === "rw") {
    if (cand.paired === orig.paired) score += 30;
    else score -= 50;
    if (cand.notes === orig.notes) score += 30;
    else score -= 50;
    if (cand.blank === orig.blank) score += 8;
  }

  // Within the same band/type, closer content length is the "feel" signal.
  const lenGap = Math.abs((cand.textLen || 0) - (orig.textLen || 0));
  score -= Math.min(45, lenGap / 35);
  reasons.push(`lenΔ${lenGap}`);

  const overlap = Math.max(...usedTopics.map((t) => topicOverlap(cand.topic, t)), 0);
  if (overlap >= 0.45) {
    score -= 50;
    reasons.push(`dup${overlap.toFixed(2)}`);
  }

  return { score, reasons, bandGap, typeOk, overlap };
}

function pickSlots({ official, lists, excluded }) {
  const bySec = {
    rw: indexItems(lists.rw),
    math: indexItems(lists.math),
  };
  const used = new Set();
  const usedTopics = [];
  const form = { rw: { m1: [], easy: [], hard: [] }, math: { m1: [], easy: [], hard: [] } };
  const slots = [];

  for (const section of ["rw", "math"]) {
    const idx = bySec[section];
    for (const mk of MODULES) {
      official[MIRROR][section][mk].forEach((ref, i) => {
        const src = resolveSource(section, ref, idx);
        if (!src) {
          const id = typeof ref === "string" ? ref : ref.questionId || ref.externalId;
          throw new Error(`BB${MIRROR} missing from list ${section} ${mk} Q${i + 1} ${id}`);
        }
        const orig = readDetail(src.questionId);
        if (!orig) throw new Error(`BB${MIRROR} detail missing ${src.questionId}`);
        slots.push({
          section,
          mk,
          i: i + 1,
          skill: src.skill_cd,
          diff: src.difficulty,
          band: src.score_band_range_cd,
          domain: src.primary_class_cd,
          src,
          orig,
        });
      });
    }
  }

  const livePool = (slot) =>
    lists[slot.section].filter((it) => {
      if (!it.external_id) return false;
      if (excluded.has(it.questionId) || excluded.has(it.external_id)) return false;
      if (used.has(it.questionId)) return false;
      return it.skill_cd === slot.skill && it.difficulty === slot.diff;
    });

  function constraintScore(slot) {
    const pool = livePool(slot).map((it) => readDetail(it.questionId)).filter(Boolean);
    const typeHits = pool.filter((c) => c.type === slot.orig.type);
    const formHits = typeHits.filter((c) => c.hasDiagram === slot.orig.hasDiagram);
    return {
      typeHits: typeHits.length,
      formHits: formHits.length,
      sprNeed: slot.orig.type === "spr" ? 0 : 1,
      figNeed: slot.orig.hasDiagram ? 0 : 1,
    };
  }

  // Assign scarcest SPR / figure slots first so common MCQ slots cannot eat them.
  const order = slots
    .map((slot, idx) => ({ slot, idx, c: constraintScore(slot) }))
    .sort((a, b) => {
      if (a.c.sprNeed !== b.c.sprNeed) return a.c.sprNeed - b.c.sprNeed;
      if (a.c.figNeed !== b.c.figNeed) return a.c.figNeed - b.c.figNeed;
      if (a.c.formHits !== b.c.formHits) return a.c.formHits - b.c.formHits;
      if (a.c.typeHits !== b.c.typeHits) return a.c.typeHits - b.c.typeHits;
      return a.idx - b.idx;
    });

  const picks = new Map();
  for (const { slot } of order) {
    const ranked = livePool(slot)
      .map((it) => {
        const cand = readDetail(it.questionId);
        const s = scoreCandidate(slot, slot.orig, cand, usedTopics);
        return { it, cand, ...s };
      })
      .filter((r) => r.cand)
      .sort((a, b) => b.score - a.score || a.it.questionId.localeCompare(b.it.questionId));

    const pick = ranked[0];
    if (!pick) {
      const origId = `strix-${TEST_NUM}-${slot.section}-${slot.mk}-${slot.i}`;
      picks.set(`${slot.section}.${slot.mk}.${slot.i}`, {
        it: { questionId: origId },
        cand: {
          type: slot.orig.type,
          hasDiagram: slot.orig.hasDiagram,
          hasTable: slot.orig.hasTable,
          band: slot.orig.band,
          topic: [],
          textLen: slot.orig.textLen,
        },
        score: 0,
        reasons: ["original-item"],
        bandGap: 0,
        typeOk: true,
        original: true,
      });
      continue;
    }
    used.add(pick.it.questionId);
    if (pick.cand.topic?.length) usedTopics.push(pick.cand.topic);
    picks.set(`${slot.section}.${slot.mk}.${slot.i}`, pick);
  }

  const audit = [];
  for (const slot of slots) {
    const pick = picks.get(`${slot.section}.${slot.mk}.${slot.i}`);
    form[slot.section][slot.mk].push(pick.it.questionId);
    const diffs = [];
    if (pick.original) diffs.push("original item: unused pool empty at skill+difficulty");
    if (pick.cand.type !== slot.orig.type) diffs.push(`answer type: ${slot.orig.type} → ${pick.cand.type}`);
    if (pick.cand.hasDiagram !== slot.orig.hasDiagram) {
      diffs.push(`stimulus form: ${slot.orig.hasDiagram ? "diagram" : "none"} → ${pick.cand.hasDiagram ? "diagram" : "none"}`);
    }
    if (!pick.original && pick.bandGap !== 0) diffs.push(`band: ${slot.orig.band} → ${pick.cand.band}`);
    audit.push({
      section: slot.section,
      mk: slot.mk,
      i: slot.i,
      skill: slot.skill,
      diff: slot.diff,
      band: slot.orig.band,
      chosenBand: pick.cand.band,
      sourceId: slot.src.questionId,
      chosen: pick.it.questionId,
      type: `${slot.orig.type}→${pick.cand.type}`,
      fig: `${slot.orig.hasDiagram ? "Y" : "N"}→${pick.cand.hasDiagram ? "Y" : "N"}`,
      form: formLabel(slot.section, slot.skill, pick.cand),
      origForm: formLabel(slot.section, slot.skill, slot.orig),
      origLen: slot.orig.textLen,
      chosenLen: pick.cand.textLen,
      diffs,
      reasons: pick.reasons,
    });
  }
  return { form, audit };
}

function skillCounts(audit, section, mk) {
  const map = new Map();
  for (const row of audit) {
    if (row.section !== section || row.mk !== mk) continue;
    map.set(row.skill, (map.get(row.skill) || 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, n]) => `${k}×${n}`)
    .join(", ");
}

function writeAudit(audit) {
  const others = Object.keys(strix)
    .filter((n) => n !== TEST_NUM)
    .sort((a, b) => Number(a) - Number(b));
  const otherLabel = others.length
    ? `official Bluebook forms 5–11 and Strix Test ${others.join(", ")}`
    : "official Bluebook forms 5–11";
  const exceptions = audit.filter((r) => r.diffs.length);
  const rwBandExact = audit.filter((r) => r.section === "rw" && r.band === r.chosenBand).length;
  const typeOk = audit.filter((r) => r.type.split("→")[0] === r.type.split("→")[1]).length;
  const lines = [];
  lines.push(`# Strix Test ${TEST_NUM} — Semantic Matching Audit`);
  lines.push("");
  lines.push(`_Generated as a Bluebook ${MIRROR}-shaped full SAT. Questions are unused by ${otherLabel}._`);
  lines.push("");
  lines.push("## Goal");
  lines.push("");
  lines.push(`Strix Test ${TEST_NUM} mirrors Bluebook Practice Test ${MIRROR} slot-for-slot: same section/module order, same CB domain and skill, same E/M/H tag, and the same finer \`score_band_range_cd\` (1–7) whenever the unused pool allows. Within a band, the picker prefers the same answer type (MCQ vs SPR), the same stimulus form (diagram / paired texts / research notes), and the closest content length so difficulty is not judged from the E/M/H letter alone.`);
  lines.push("");
  lines.push("## Sources & method");
  lines.push("");
  lines.push("- Live College Board qbank (`get-questions` + `get-question`).");
  lines.push(`- Pool = fetchable \`external_id\` items **not** in ${otherLabel}.`);
  lines.push("- Priority: unused → same skill + difficulty → same answer type (MCQ vs SPR) → nearest score band → same stimulus form → nearest content length → avoid near-duplicate topics inside this test.");
  lines.push("");
  lines.push("## Result summary");
  lines.push("");
  lines.push(`- **147 questions, all unique**, none in Bluebook 5–11${others.length ? ` or Strix Test ${others.join("/")}` : ""}.`);
  lines.push("- Counts exact: R&W 27 / 27 / 27 (M1 / easy / hard), Math 22 / 22 / 22.");
  lines.push(`- Domain, skill and difficulty match the Bluebook ${MIRROR} slot exactly for all 147 questions.`);
  lines.push(`- Score band matches on **${audit.filter((r) => r.band === r.chosenBand).length} / 147** slots (R&W ${rwBandExact}/81).`);
  lines.push(`- Answer type matches on **${typeOk} / 147** slots.`);
  lines.push(`- Documented exceptions below the skill+difficulty bar: **${exceptions.length}**.`);
  lines.push("");
  lines.push("## Exceptions");
  lines.push("");
  if (!exceptions.length) {
    lines.push("_None. Every slot kept skill, difficulty, answer type, and diagram form._");
  } else {
    lines.push(`| Slot | Skill / Diff | BB${MIRROR} original | Chosen | What differs | Why |`);
    lines.push("|---|---|---|---|---|---|");
    for (const r of exceptions) {
      lines.push(
        `| ${r.section} · ${r.mk} · Q${r.i} | ${r.skill} / ${r.diff} | \`${r.sourceId}\` | \`${r.chosen}\` | **${r.diffs.join("; ")}** | Unused pool at this skill+difficulty has no closer match. Type outranks exact band. |`,
      );
    }
  }
  lines.push("");
  lines.push("## Per-module skill counts");
  lines.push("");
  lines.push("**Reading & Writing**");
  lines.push("");
  for (const mk of MODULES) {
    lines.push(`- ${mk} — 27 questions: ${skillCounts(audit, "rw", mk)}`);
  }
  lines.push("");
  lines.push("**Math**");
  lines.push("");
  for (const mk of MODULES) {
    lines.push(`- ${mk} — 22 questions: ${skillCounts(audit, "math", mk)}`);
  }
  lines.push("");
  lines.push("## Full slot-by-slot mapping");
  lines.push("");
  lines.push(`IDs are CB \`questionId\`s. "→" is Bluebook ${MIRROR} original → Strix Test ${TEST_NUM} replacement.`);
  lines.push("");

  const titles = {
    rw: "Reading & Writing",
    math: "Math",
    m1: "Module 1",
    easy: "Module 2 — easy",
    hard: "Module 2 — hard",
  };
  for (const section of ["rw", "math"]) {
    lines.push(`### ${titles[section]}`);
    lines.push("");
    for (const mk of MODULES) {
      lines.push(`#### ${titles[mk]}`);
      lines.push("");
      if (section === "rw") {
        lines.push(`| # | Skill | Diff | Band | BB${MIRROR} → Strix | Form |`);
        lines.push("|--:|---|:--:|:--:|---|---|");
        for (const r of audit.filter((x) => x.section === section && x.mk === mk)) {
          const band = r.band === r.chosenBand ? String(r.band) : `${r.band}→${r.chosenBand}`;
          lines.push(`| ${r.i} | ${r.skill} | ${r.diff} | ${band} | \`${r.sourceId}\` → \`${r.chosen}\` | ${r.form} |`);
        }
      } else {
        lines.push(`| # | Skill | Diff | Band | BB${MIRROR} → Strix | Type | Fig |`);
        lines.push("|--:|---|:--:|:--:|---|:--:|:--:|");
        for (const r of audit.filter((x) => x.section === section && x.mk === mk)) {
          const warn = r.diffs.length ? " ⚠" : "";
          const band = r.band === r.chosenBand ? String(r.band) : `${r.band}→${r.chosenBand}`;
          lines.push(`| ${r.i} | ${r.skill} | ${r.diff} | ${band} | \`${r.sourceId}\` → \`${r.chosen}\`${warn} | ${r.type} | ${r.fig} |`);
        }
      }
      lines.push("");
    }
  }
  const out = path.join(ROOT, `docs/strix-test-${TEST_NUM}-audit.md`);
  fs.writeFileSync(out, lines.join("\n"));
  return out;
}

const lists = await loadLists();
const official = JSON.parse(fs.readFileSync(path.join(ROOT, "lib/cb/official-forms.json"), "utf8"));
const strix = JSON.parse(fs.readFileSync(path.join(ROOT, "lib/cb/strix-forms.json"), "utf8"));
const excluded = new Set([...collectOfficialIds(official), ...collectStrixIds(strix, TEST_NUM)]);

const byId = {
  rw: indexItems(lists.rw),
  math: indexItems(lists.math),
};

const sourceItems = [];
const neededKeys = new Set();
for (const section of ["rw", "math"]) {
  for (const mk of MODULES) {
    for (const ref of official[MIRROR][section][mk]) {
      const src = resolveSource(section, ref, byId[section]);
      const id = typeof ref === "string" ? ref : ref.questionId || ref.externalId;
      if (!src) throw new Error(`BB${MIRROR} not in list ${section} ${id}`);
      sourceItems.push(src);
      neededKeys.add(`${section}:${src.skill_cd}:${src.difficulty}`);
    }
  }
}

const candidateItems = [];
for (const section of ["rw", "math"]) {
  for (const it of lists[section]) {
    if (!it.external_id) continue;
    if (excluded.has(it.questionId) || excluded.has(it.external_id)) continue;
    const key = `${section}:${it.skill_cd}:${it.difficulty}`;
    if (neededKeys.has(key)) candidateItems.push(it);
  }
}

await fetchAll(sourceItems, `bb${MIRROR}`);
await fetchAll(candidateItems, "candidates");

const { form, audit } = pickSlots({ official, lists, excluded });
strix[TEST_NUM] = form;
fs.writeFileSync(path.join(ROOT, "lib/cb/strix-forms.json"), JSON.stringify(strix));
const mirrorsPath = path.join(ROOT, "lib/cb/strix-mirrors.json");
const mirrors = fs.existsSync(mirrorsPath)
  ? JSON.parse(fs.readFileSync(mirrorsPath, "utf8"))
  : { "1": 11, "2": 11, "3": 11 };
mirrors[TEST_NUM] = Number(MIRROR);
fs.writeFileSync(mirrorsPath, `${JSON.stringify(mirrors, null, 2)}\n`);
const auditPath = writeAudit(audit);
const exceptions = audit.filter((r) => r.diffs.length);
console.log(`wrote form ${TEST_NUM} +`, auditPath);
console.log("exceptions", exceptions.length);
for (const r of exceptions) {
  console.log(`  ${r.section}.${r.mk}.Q${r.i} ${r.skill} ${r.diff}`, r.diffs.join("; "), r.sourceId, "→", r.chosen);
}
