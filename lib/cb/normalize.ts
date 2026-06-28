import sanitizeHtml from "sanitize-html";
import type { Choice, Question, QuestionStub, Section } from "./types";
import { domainLabel } from "./domains";
import { expandMfenced } from "./mfenced";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

// MathML + SVG element sets (CB renders math as inline MathML, sometimes SVG;
// disclosed items render math as <img>). sanitize-html is pure-JS (no jsdom),
// so it loads in the Vercel serverless runtime — unlike DOMPurify+jsdom.
const MATHML_TAGS = ["math","semantics","annotation","annotation-xml","mrow","mi","mn","mo","ms","mtext","mspace","mglyph","msup","msub","msubsup","mfrac","msqrt","mroot","mfenced","mtable","mtr","mtd","mlabeledtr","munder","mover","munderover","mmultiscripts","mprescripts","none","mstyle","mpadded","mphantom","menclose","maction"];
const SVG_TAGS = ["svg","g","path","rect","circle","ellipse","line","polygon","polyline","text","tspan","defs","use","symbol","marker","title","desc","clipPath","linearGradient","radialGradient","stop"];

const SANITIZE_OPTS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p","span","div","br","b","strong","i","em","u","s","sub","sup","mark","small","wbr",
    "ul","ol","li","dl","dt","dd","blockquote","pre","code","hr",
    "h1","h2","h3","h4","h5","h6",
    "table","thead","tbody","tfoot","tr","td","th","caption","col","colgroup",
    "figure","figcaption","img","a","abbr",
    ...MATHML_TAGS, ...SVG_TAGS,
  ],
  allowedAttributes: {
    "*": ["class","style","id","dir","lang",
      "alttext","displaystyle","mathvariant","scriptlevel","columnalign","rowalign","columnspacing","rowspacing","columnlines","rowlines","columnspan","rowspan","colspan","align","fence","separator","stretchy","symmetric","largeop","movablelimits","accent","accentunder","open","close","notation","linethickness","width","height","depth","mathsize","mathcolor","mathbackground","form","lspace","rspace","display"],
    a: ["href","name","target","rel"],
    img: ["src","alt","width","height","title"],
    svg: ["xmlns","xmlns:xlink","version","viewBox","width","height","fill","preserveAspectRatio","role","aria-label"],
    path: ["d","fill","stroke","stroke-width","stroke-linecap","stroke-linejoin","transform","opacity"],
    g: ["fill","stroke","stroke-width","transform","opacity"],
    rect: ["x","y","width","height","rx","ry","fill","stroke","stroke-width","transform","opacity"],
    circle: ["cx","cy","r","fill","stroke","stroke-width","opacity"],
    ellipse: ["cx","cy","rx","ry","fill","stroke","stroke-width"],
    line: ["x1","y1","x2","y2","stroke","stroke-width","stroke-linecap","stroke-linejoin","stroke-miterlimit"],
    polygon: ["points","fill","stroke","stroke-width","stroke-linejoin","stroke-miterlimit"],
    polyline: ["points","fill","stroke","stroke-width","stroke-linejoin","stroke-miterlimit"],
    text: ["x","y","fill","font-size","font-family","font-weight","text-anchor","transform"],
    tspan: ["x","y","dx","dy","fill"],
    use: ["href","xlink:href","x","y","width","height","transform"],
    stop: ["offset","stop-color","stop-opacity"],
    linearGradient: ["id","x1","y1","x2","y2","gradientUnits","gradientTransform"],
    radialGradient: ["id","cx","cy","r","fx","fy","gradientUnits"],
  },
  allowedSchemes: ["http","https","data","mailto"],
  allowedSchemesByTag: { img: ["http","https","data"] },
  // MathML/SVG attribute names are case-sensitive (viewBox, preserveAspectRatio).
  parser: { lowerCaseTags: false, lowerCaseAttributeNames: false },
};

// Sanitize CB-supplied HTML — allow MathML/SVG/basic formatting, strip the rest.
// <mfenced> survives sanitization but isn't rendered by MathML Core (current
// Chrome/Safari), so expand it to <mrow>+<mo> form to keep fences visible.
export function clean(html: unknown): string {
  if (typeof html !== "string" || !html) return "";
  return expandMfenced(sanitizeHtml(html, SANITIZE_OPTS));
}

interface RawDetail {
  type?: string;
  stem?: string;
  stimulus?: string;
  rationale?: string;
  answerOptions?: Array<{ id: string; content: string }>;
  keys?: string[];
  correct_answer?: string[];
}

/** Normalize a qbank (external_id) detail response into our Question shape. */
export function normalizeQbank(raw: RawDetail, stub: QuestionStub): Question {
  const type = raw.type === "spr" ? "spr" : "mcq";
  const options = Array.isArray(raw.answerOptions) ? raw.answerOptions : [];

  const choices: Choice[] = options.map((o, i) => ({
    id: o.id,
    letter: LETTERS[i] ?? String(i + 1),
    html: clean(o.content),
  }));

  const correctIds = Array.isArray(raw.keys) ? raw.keys : [];
  let correct: string[];
  if (type === "spr") {
    correct = correctIds; // literal accepted answers
  } else if (Array.isArray(raw.correct_answer) && raw.correct_answer.length) {
    correct = raw.correct_answer;
  } else {
    // derive letters from option ids
    correct = correctIds
      .map((id) => choices.find((c) => c.id === id)?.letter)
      .filter((x): x is string => Boolean(x));
  }

  return {
    id: stub.externalId ?? stub.questionId,
    source: "qbank",
    section: stub.section,
    domain: stub.domain,
    domainLabel: stub.domainLabel,
    skill: stub.skill,
    skillLabel: stub.skillLabel,
    difficulty: stub.difficulty,
    type,
    stemHtml: clean(raw.stem),
    stimulusHtml: raw.stimulus ? clean(raw.stimulus) : null,
    choices,
    correct,
    correctIds: type === "mcq" ? correctIds : [],
    rationaleHtml: clean(raw.rationale),
  };
}

interface RawDisclosed {
  item_id?: string;
  section?: string;
  prompt?: string;
  answer?: {
    style?: string;
    choices?: Record<string, { body?: string }>;
    correct_choice?: string;
    rationale?: string;
  };
}

/** Normalize a disclosed (ibn) item from saic.collegeboard.org. */
export function normalizeDisclosed(
  raw: RawDisclosed,
  stub: QuestionStub,
  section: Section,
): Question {
  const choicesObj = raw.answer?.choices ?? {};
  const order = ["a", "b", "c", "d", "e", "f"];
  const choices: Choice[] = order
    .filter((k) => choicesObj[k])
    .map((k, i) => ({
      id: k,
      letter: LETTERS[i] ?? k.toUpperCase(),
      html: clean(choicesObj[k]?.body),
    }));
  const correctKey = (raw.answer?.correct_choice ?? "").toLowerCase();
  const correctLetter = LETTERS[order.indexOf(correctKey)] ?? correctKey.toUpperCase();

  return {
    id: stub.ibn ?? stub.questionId,
    source: "disclosed",
    section,
    domain: stub.domain,
    domainLabel: stub.domainLabel,
    skill: stub.skill,
    skillLabel: stub.skillLabel,
    difficulty: stub.difficulty,
    type: "mcq",
    stemHtml: clean(raw.prompt),
    stimulusHtml: null,
    choices,
    correct: correctKey ? [correctLetter] : [],
    correctIds: correctKey ? [correctKey] : [],
    rationaleHtml: clean(raw.answer?.rationale),
  };
}

// Helper used by the list endpoint mapper.
export function stubFrom(item: Record<string, unknown>, section: Section): QuestionStub {
  const domain = String(item.primary_class_cd ?? "");
  return {
    questionId: String(item.questionId ?? ""),
    externalId: (item.external_id as string) ?? null,
    ibn: (item.ibn as string) ?? null,
    section,
    domain,
    domainLabel: domainLabel(section, domain),
    skill: String(item.skill_cd ?? ""),
    skillLabel: String(item.skill_desc ?? ""),
    difficulty: (["E", "M", "H"].includes(String(item.difficulty))
      ? item.difficulty
      : "M") as Question["difficulty"],
  };
}
