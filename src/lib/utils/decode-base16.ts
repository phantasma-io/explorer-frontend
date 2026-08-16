const utf8Decoder =
  typeof TextDecoder !== "undefined" ? new TextDecoder("utf-8", { fatal: true }) : null;

export const decodeBase16 = (hex: string) => {
  if (!hex) {
    return "";
  }
  const cleaned = hex.length % 2 === 0 ? hex : `0${hex}`;
  const pairs = cleaned.match(/.{1,2}/g);
  if (!pairs) {
    return "";
  }
  const bytes = Uint8Array.from(pairs.map((byte) => parseInt(byte, 16)));
  // Payloads are UTF-8 text on the wire; decode strictly so multi-byte characters
  // survive, and fall back to a per-byte mapping for non-UTF-8 binary content.
  if (utf8Decoder) {
    try {
      return utf8Decoder.decode(bytes);
    } catch {
      // Not valid UTF-8; fall through to the byte-wise view.
    }
  }
  return Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
};
