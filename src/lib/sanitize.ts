/**
 * Email HTML sanitization — isomorphic, dependency-free.
 *
 * Story 17.5: founder-authored broadcast bodies intentionally contain HTML
 * (textarea placeholder), so wholesale escaping is wrong (Standing Decision
 * B8). Instead this mirrors DOMPurify's documented tight allow-list recipe
 * (ALLOWED_TAGS + ALLOWED_ATTR narrowing, URI scheme validation, on*
 * forbidden) without adding a dependency — no new deps per project rules,
 * and the compose preview (Client Component) must import it without pulling
 * in server-only chains.
 *
 * Conservative choices (documented, not accidental):
 * - `style` elements AND `style` attributes are dropped. A tokenizer cannot
 *   parse CSS safely (url()/expression() vectors); semantic tags carry the
 *   formatting instead.
 * - `href`/`src` allow http/https/mailto/tel + relative URLs; `img[src]`
 *   additionally allows data:image/* (embedded images). Entity-obfuscated
 *   schemes (e.g. &#106;avascript:) are decoded before the scheme check.
 * - Comments are left untouched (no AC requirement; Outlook conditionals
 *   keep working; embedded tags inside comments are still neutralized by
 *   the tag pass).
 */

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "hr",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "pre",
  "code",
  "ul",
  "ol",
  "li",
  "a",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "td",
  "th",
  "img",
  "div",
  "span",
]);

const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ["href", "title", "target"],
  img: ["src", "alt", "width", "height"],
  td: ["colspan", "rowspan"],
  th: ["colspan", "rowspan"],
  table: ["border", "cellpadding", "cellspacing", "width"],
};

// Elements whose content is never legitimate body content — drop tag AND
// everything up to the matching close tag. (Non-void elements only; the
// void dangerous element `embed` lives in DROP_TAG_ONLY below — an unclosed
// <embed> must not swallow the rest of the document.)
const DROP_WITH_CONTENT = new Set([
  "script",
  "iframe",
  "object",
  "style",
  "title",
  "applet",
]);

// Void/head leftovers — drop the tag, no content to skip.
const DROP_TAG_ONLY = new Set(["link", "meta", "base", "embed"]);

// Matches open/close tags; the attribute clause tolerates `>` inside quoted
// values. Deliberately does not match `<!...>` (doctype/comments pass
// through untouched).
const TAG_RE = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^>"'])*)\/?>/g;

const ATTR_RE =
  /([a-zA-Z_:][a-zA-Z0-9_:.\-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`=<>`]+)))?/g;

function decodeEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/&#([0-9]+);/g, (_, dec: string) =>
      String.fromCharCode(parseInt(dec, 10))
    )
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"');
}

function isSafeUri(value: string, allowDataImage: boolean): boolean {
  // Strip whitespace/control chars (obfuscation: "java\tscript:") then read
  // the scheme, if any. No scheme (relative URL, anchor, empty) is safe.
  const norm = decodeEntities(value)
    .replace(/[\s\u0000-\u001f]+/g, "")
    .toLowerCase();
  const schemeMatch = /^([a-z][a-z0-9+.-]*):/.exec(norm);
  if (!schemeMatch) return true;
  const scheme = schemeMatch[1];
  if (
    scheme === "http" ||
    scheme === "https" ||
    scheme === "mailto" ||
    scheme === "tel"
  ) {
    return true;
  }
  if (allowDataImage && scheme === "data" && norm.startsWith("data:image/")) {
    return true;
  }
  return false;
}

function filterAttrs(tag: string, rawAttrs: string): string {
  const allowed = ALLOWED_ATTRS[tag];
  if (!allowed) return "";
  let out = "";
  ATTR_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = ATTR_RE.exec(rawAttrs)) !== null) {
    const name = m[1].toLowerCase();
    // Event handlers are never allowed (defense in depth — the allow lists
    // contain no on* names anyway). Inline style is dropped, see module note.
    if (name.startsWith("on") || name === "style") continue;
    if (!allowed.includes(name)) continue;
    const value = m[2] ?? m[3] ?? m[4] ?? "";
    if (
      (name === "href" || name === "src") &&
      !isSafeUri(value, tag === "img")
    ) {
      continue;
    }
    out += ` ${name}="${value.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}"`;
  }
  return out;
}

/**
 * Sanitize founder-authored HTML for the broadcast send path and preview.
 * Same helper for both sinks (Story 17.5 AC3) — preview can never diverge
 * from send.
 */
export function sanitizeEmailHtml(html: string): string {
  if (typeof html !== "string" || html.length === 0) return "";
  let out = "";
  let lastIndex = 0;
  TAG_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TAG_RE.exec(html)) !== null) {
    const [full, slash, rawName, rawAttrs] = match;
    const name = rawName.toLowerCase();
    out += html.slice(lastIndex, match.index);
    lastIndex = match.index + full.length;

    if (DROP_WITH_CONTENT.has(name)) {
      if (slash) continue; // stray close tag — drop it
      // Skip to the matching close tag (case-insensitive) or end of input.
      const closeRe = new RegExp(`</${name}\\s*>`, "gi");
      closeRe.lastIndex = lastIndex;
      const close = closeRe.exec(html);
      lastIndex = close ? close.index + close[0].length : html.length;
      TAG_RE.lastIndex = lastIndex;
      continue;
    }
    if (DROP_TAG_ONLY.has(name)) continue;
    if (!ALLOWED_TAGS.has(name)) continue; // strip tag, keep content
    if (slash) {
      out += `</${name}>`;
      continue;
    }
    out += `<${name}${filterAttrs(name, rawAttrs)}>`;
  }
  out += html.slice(lastIndex);
  return out;
}
