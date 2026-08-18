#!/usr/bin/env node
/**
 * Assert an item can load as lib/cb/types.ts Question.
 * Usage: node scripts/validate-item.mjs item.json
 * Exits 1 with reasons.
 */
import fs from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/validate-item.mjs item.json");
  process.exit(2);
}

const q = JSON.parse(fs.readFileSync(file, "utf8"));
const RW = {
  CAS: ["WIC", "TSP", "CTC"],
  INI: ["CID", "COE", "INF"],
  SEC: ["BOU", "FSS"],
  EOI: ["TRA", "SYN"],
};
const e = [];
const ok = (c, m) => {
  if (!c) e.push(m);
};

ok(["rw", "math"].includes(q.section), "section must be rw|math");
ok(["mcq", "spr"].includes(q.type), "type must be mcq|spr");
ok(["E", "M", "H"].includes(q.difficulty), "difficulty must be E|M|H");
ok(q.source === "strix", "source must be strix");
ok(typeof q.stemHtml === "string" && q.stemHtml.trim(), "stemHtml required");
ok(q.stimulusHtml == null || typeof q.stimulusHtml === "string", "stimulusHtml must be string or null");
ok(Array.isArray(q.correct) && q.correct.length > 0, "correct must be non-empty");

if (q.section === "rw") {
  ok(Object.hasOwn(RW, q.domain), `rw domain must be ${Object.keys(RW).join("|")}`);
  ok(RW[q.domain]?.includes(q.skill), `skill ${q.skill} not under domain ${q.domain}`);
} else if (q.section === "math") {
  ok(["H", "P", "Q", "S"].includes(q.domain), "math domain must be H|P|Q|S");
  ok(typeof q.skill === "string" && q.skill.startsWith(`${q.domain}.`), `math skill ${q.skill} must start with ${q.domain}.`);
}

if (q.type === "mcq") {
  const letters = (q.choices || []).map((c) => c.letter);
  const ids = (q.choices || []).map((c) => c.id);
  ok(q.choices?.length === 4, "mcq needs 4 choices");
  ok(letters.join(",") === "A,B,C,D", "letters must be A,B,C,D in order");
  ok(new Set(ids).size === 4, "choice ids must be unique");
  ok(q.correct.every((l) => letters.includes(l)), "correct letter not in choices");
  ok((q.correctIds || []).every((i) => ids.includes(i)), "correctId not in choices");
  ok(q.correct.length === (q.correctIds || []).length, "correct/correctIds length mismatch");
  q.correct.forEach((l, i) =>
    ok(q.choices[letters.indexOf(l)]?.id === q.correctIds?.[i], `correct[${i}] letter and id disagree`),
  );
  ok(Object.keys(q.distractors || {}).length === 3, "3 tagged distractors required");
} else {
  ok((q.choices || []).length === 0 && (q.correctIds || []).length === 0, "spr: choices/correctIds empty");
  for (const s of q.correct) {
    ok(
      /^-?(\d+(\.\d*)?|\.\d+|\d+\/\d+)$/.test(s) && s.length <= (s.startsWith("-") ? 6 : 5),
      `spr string not Bluebook-legal: ${s}`,
    );
    ok(!/\s/.test(s), `spr: mixed numbers / spaces not accepted: ${s}`);
  }
}

if (q.verification?.status === "verified") {
  ok(q.verification.blindSolve != null, "verified item missing blindSolve");
}

if (e.length) {
  console.error(e.join("\n"));
  process.exit(1);
}
console.log("ok");
