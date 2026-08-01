/**
 * A value decoded from chain storage.
 *
 * VM values are dynamically typed, so the API answers the plain JSON value and the shape
 * itself says which of the three it is. Scalars stay strings on purpose: chain numbers
 * are big integers and JSON numbers lose precision above 2^53, and byte values arrive as
 * hex. Narrow with `typeof value === "string"` / `Array.isArray(value)` before any string
 * operation.
 */
export type VmValue = string | VmValue[] | { [field: string]: VmValue };
