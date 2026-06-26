import type { Section, Difficulty } from "./types";

// College Board content domains, keyed by CB primary_class_cd.
export const RW_DOMAINS: Record<string, string> = {
  INI: "Information and Ideas",
  CAS: "Craft and Structure",
  EOI: "Expression of Ideas",
  SEC: "Standard English Conventions",
};

export const MATH_DOMAINS: Record<string, string> = {
  H: "Algebra",
  P: "Advanced Math",
  Q: "Problem-Solving and Data Analysis",
  S: "Geometry and Trigonometry",
};

export function domainsFor(section: Section): Record<string, string> {
  return section === "rw" ? RW_DOMAINS : MATH_DOMAINS;
}

export function domainLabel(section: Section, code: string): string {
  return domainsFor(section)[code] ?? code;
}

export function allDomainCodes(section: Section): string[] {
  return Object.keys(domainsFor(section));
}

// The design's category ids (data.js) -> CB domain codes.
export const CATEGORY_TO_DOMAIN: Record<string, string> = {
  // RW
  info: "INI",
  craft: "CAS",
  expr: "EOI",
  conv: "SEC",
  // Math
  alg: "H",
  adv: "P",
  pas: "Q",
  geo: "S",
};

export const DOMAIN_TO_CATEGORY: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_TO_DOMAIN).map(([k, v]) => [v, k]),
);

// CB asmtEventId for the SAT (vs PSAT variants).
export const SAT_ASMT_EVENT_ID = 99;

// CB `test` codes.
export const TEST_CODE: Record<Section, number> = { rw: 1, math: 2 };

export const DIFFICULTIES: Difficulty[] = ["E", "M", "H"];

export function isDifficulty(v: string): v is Difficulty {
  return v === "E" || v === "M" || v === "H";
}
