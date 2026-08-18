#!/usr/bin/env node
/**
 * Emit the verifier's view of an item (no key, rationale, or distractor tags).
 * Usage: node scripts/blind-view.mjs item.json
 */
import fs from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/blind-view.mjs item.json");
  process.exit(2);
}

const item = JSON.parse(fs.readFileSync(file, "utf8"));
const { id, section, type, stemHtml, stimulusHtml, choices } = item;
process.stdout.write(
  `${JSON.stringify(
    {
      id,
      section,
      type,
      stemHtml,
      stimulusHtml,
      choices: (choices || []).map(({ id: choiceId, letter, html }) => ({
        id: choiceId,
        letter,
        html,
      })),
    },
    null,
    2,
  )}\n`,
);
