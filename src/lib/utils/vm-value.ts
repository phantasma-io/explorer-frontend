import type { VmValue } from "@/lib/types/api";

/**
 * The scalar content of a chain value, or `null` for an array or a struct.
 *
 * Callers that feed a URL, a label, or a number parse need a plain string; a struct has
 * no faithful string form, and stringifying one would put a JSON document where a URL is
 * expected. The full value stays available for structural rendering.
 */
export function vmValueText(value: VmValue | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}
