import { describe, expect, it } from "vitest";
import { decodeBase16 } from "@/lib/utils/decode-base16";

describe("decodeBase16", () => {
  it("decodes ASCII payloads", () => {
    // "PGL2.0.5" — the common wallet payload seen on live transactions.
    expect(decodeBase16("50474C322E302E35")).toBe("PGL2.0.5");
  });

  it("decodes multi-byte UTF-8 text instead of mojibake", () => {
    // "Привет" encoded as UTF-8; the previous implementation rendered the raw
    // latin-1 bytes ("ÐŸÑ€Ð¸Ð²ÐµÑ‚") because it never ran a UTF-8 decode.
    expect(decodeBase16("D09FD180D0B8D0B2D0B5D182")).toBe("Привет");
  });

  it("pads odd-length input with a leading zero", () => {
    // "141" is read as 0x01 0x41 ->  "A".
    expect(decodeBase16("141")).toBe("A");
  });

  it("falls back to a byte-wise view for invalid UTF-8", () => {
    // 0xFF alone is not valid UTF-8; the fallback keeps the byte visible.
    expect(decodeBase16("FF")).toBe("ÿ");
  });

  it("returns an empty string for empty input", () => {
    expect(decodeBase16("")).toBe("");
  });
});
