export const decodeBase16 = (hex: string) => {
  if (!hex) {
    return "";
  }
  const cleaned = hex.length % 2 === 0 ? hex : `0${hex}`;
  const bytes = cleaned.match(/.{1,2}/g);
  if (!bytes) {
    return "";
  }
  try {
    return decodeURIComponent(
      bytes
        .map((byte) => String.fromCharCode(parseInt(byte, 16)))
        .join(""),
    );
  } catch {
    return bytes
      .map((byte) => String.fromCharCode(parseInt(byte, 16)))
      .join("");
  }
};
