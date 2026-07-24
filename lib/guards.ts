/** Shared by every module that narrows an `unknown` API response before use. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
