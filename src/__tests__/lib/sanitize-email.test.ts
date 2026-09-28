import { describe, it, expect } from "vitest";
import { sanitizeEmailHtml } from "@/lib/sanitize";

describe("sanitizeEmailHtml (Story 17.5 AC2)", () => {
  it("strips <script> tags and their content", () => {
    expect(
      sanitizeEmailHtml('<p>Hi</p><script>alert("x")</script><p>Bye</p>')
    ).toBe("<p>Hi</p><p>Bye</p>");
  });

  it("strips script variants (uppercase, attributes, unclosed)", () => {
    expect(sanitizeEmailHtml('<SCRIPT SRC="x.js"></SCRIPT>ok')).toBe("ok");
    expect(
      sanitizeEmailHtml('<script type="text/javascript">evil()</script>ok')
    ).toBe("ok");
    expect(sanitizeEmailHtml("ok<script>never closed")).toBe("ok");
  });

  it("strips on* event handler attributes but keeps the tag", () => {
    expect(sanitizeEmailHtml('<p onclick="x()">Hi</p>')).toBe("<p>Hi</p>");
    expect(
      sanitizeEmailHtml('<img src="https://x.com/a.png" onerror="x()">')
    ).toBe('<img src="https://x.com/a.png">');
  });

  it("preserves strong, links, and paragraph structure", () => {
    expect(
      sanitizeEmailHtml(
        '<p>Hello <strong>world</strong> — <a href="https://example.com">click</a></p>'
      )
    ).toBe(
      '<p>Hello <strong>world</strong> — <a href="https://example.com">click</a></p>'
    );
  });

  it("drops iframe/object/embed including content", () => {
    expect(sanitizeEmailHtml('a<iframe src="https://x.com"></iframe>b')).toBe(
      "ab"
    );
    expect(sanitizeEmailHtml('a<object data="x">fallback</object>b')).toBe(
      "ab"
    );
    expect(sanitizeEmailHtml('a<embed src="x">b')).toBe("ab");
  });

  it("neutralizes javascript: hrefs (keeps link text) incl. entity obfuscation", () => {
    expect(sanitizeEmailHtml('<a href="javascript:alert(1)">x</a>')).toBe(
      "<a>x</a>"
    );
    expect(sanitizeEmailHtml('<a href="&#106;avascript:alert(1)">x</a>')).toBe(
      "<a>x</a>"
    );
    expect(sanitizeEmailHtml('<a href="mailto:a@b.com">x</a>')).toBe(
      '<a href="mailto:a@b.com">x</a>'
    );
  });

  it("drops style elements, style attributes, and link tags", () => {
    expect(sanitizeEmailHtml("<style>p{color:red}</style><p>t</p>")).toBe(
      "<p>t</p>"
    );
    expect(sanitizeEmailHtml('<p style="color:red">t</p>')).toBe("<p>t</p>");
    expect(
      sanitizeEmailHtml('<link rel="stylesheet" href="https://x.com/a.css">t')
    ).toBe("t");
  });

  it("keeps safe images, lists, and plain text untouched", () => {
    expect(
      sanitizeEmailHtml(
        '<img src="https://x.com/a.png" alt="pic"><ul><li>one</li></ul>'
      )
    ).toBe('<img src="https://x.com/a.png" alt="pic"><ul><li>one</li></ul>');
    expect(sanitizeEmailHtml("just text, no tags")).toBe("just text, no tags");
  });

  it("returns empty string for empty/non-string input", () => {
    expect(sanitizeEmailHtml("")).toBe("");
    expect(sanitizeEmailHtml(undefined as unknown as string)).toBe("");
  });

  it("degrades nested-tag junk without leaving executable markup", () => {
    const out = sanitizeEmailHtml("<scr<script>ipt>alert(1)</script>done");
    expect(out).not.toContain("<script");
    expect(out).not.toMatch(/\son\w+=/i);
  });
});
