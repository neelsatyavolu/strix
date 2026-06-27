// Expand MathML <mfenced> into explicit <mrow><mo>…</mo>…<mo>…</mo></mrow>.
//
// CB renders function/grouping notation as <mfenced> (e.g. f(x) arrives as
// <mfenced><mi>x</mi></mfenced>, |x| as <mfenced open="|" close="|">…). The
// <mfenced> element was dropped from MathML Core, which is what current Chrome
// and Safari implement, so the fences it synthesizes (parentheses, brackets,
// bars) silently disappear — turning "f(x)" into "fx". Rewriting <mfenced> into
// the equivalent <mrow>+<mo> form (per the MathML 3 definition) renders fences
// correctly everywhere.

// Read an attribute value from an mfenced tag's attribute string (double- or
// single-quoted). Returns undefined when the attribute is absent.
function readAttr(attrs: string, name: string): string | undefined {
  const m = attrs.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i"));
  if (!m) return undefined;
  return m[1] ?? m[2] ?? "";
}

function escapeText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Split <mfenced> inner HTML into its top-level child elements. Whitespace and
// text between elements is ignored, matching the MathML content model.
function topLevelChildren(inner: string): string[] {
  const tag = /<\/?[a-zA-Z][\w-]*\b[^>]*?(\/?)>/g;
  const kids: string[] = [];
  let depth = 0;
  let start = -1;
  let m: RegExpExecArray | null;
  while ((m = tag.exec(inner))) {
    const isClose = m[0].startsWith("</");
    const isSelfClosing = m[1] === "/";
    if (isSelfClosing) {
      if (depth === 0) kids.push(m[0]);
    } else if (isClose) {
      depth--;
      if (depth === 0 && start >= 0) {
        kids.push(inner.slice(start, m.index + m[0].length));
        start = -1;
      }
    } else {
      if (depth === 0) start = m.index;
      depth++;
    }
  }
  return kids;
}

function expandOne(attrs: string, inner: string): string {
  // MathML 3 defaults: open="(", close=")", separators=",". An explicit empty
  // attribute (open="") means "no fence", so only an absent attribute defaults.
  const openAttr = readAttr(attrs, "open");
  const closeAttr = readAttr(attrs, "close");
  const sepAttr = readAttr(attrs, "separators");
  const open = openAttr === undefined ? "(" : openAttr;
  const close = closeAttr === undefined ? ")" : closeAttr;
  const seps = (sepAttr === undefined ? "," : sepAttr).replace(/\s+/g, "");

  const openMo = open ? `<mo>${escapeText(open)}</mo>` : "";
  const closeMo = close ? `<mo>${escapeText(close)}</mo>` : "";

  const kids = topLevelChildren(inner);
  let body: string;
  if (kids.length <= 1) {
    body = inner; // single child (the common case) — keep content verbatim
  } else {
    body = kids
      .map((kid, i) => {
        if (i === 0) return kid;
        const sep = seps.length ? seps[Math.min(i - 1, seps.length - 1)] : "";
        return (sep ? `<mo>${escapeText(sep)}</mo>` : "") + kid;
      })
      .join("");
  }
  return `<mrow>${openMo}${body}${closeMo}</mrow>`;
}

// Innermost <mfenced> (one whose content holds no further <mfenced>). Expanding
// these in a loop unwinds nesting from the inside out.
const INNERMOST =
  /<mfenced\b([^>]*)>((?:(?!<mfenced\b)(?!<\/mfenced>)[\s\S])*?)<\/mfenced>/i;

export function expandMfenced(html: string): string {
  if (typeof html !== "string" || !html.includes("<mfenced")) return html;
  let out = html;
  for (let guard = 0; guard < 1000 && INNERMOST.test(out); guard++) {
    out = out.replace(INNERMOST, (_full, attrs: string, inner: string) =>
      expandOne(attrs, inner),
    );
  }
  return out;
}
