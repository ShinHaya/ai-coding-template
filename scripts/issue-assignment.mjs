/** Agent runtimes that can be routed at orchestration time. */
export const AGENT_NAMES = new Map([
  ["claude", "Claude"],
  ["codex", "Codex"],
  ["gemini", "Gemini"],
  ["grok", "Grok"],
]);

export function normalize(value) {
  return typeof value === "string" ? value.trim() : "";
}

/** Canonical agent casing when known; otherwise the trimmed input. */
export function canonicalizeAgent(value) {
  const text = normalize(value);
  if (!text) return undefined;
  return AGENT_NAMES.get(text.toLowerCase()) ?? text;
}

export function isKnownAgent(value) {
  return AGENT_NAMES.has(normalize(value).toLowerCase());
}

export function isCanonicalDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}
