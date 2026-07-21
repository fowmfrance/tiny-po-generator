/**
 * Capitalize the first letter of each word, lowercase the rest.
 * Handles compound names with hyphens (e.g., "jean-pierre" → "Jean-Pierre").
 * Porté de fleuron (src/utils/toProperCase.ts) — même comportement partout.
 */
export function toProperCase(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/(^|[\s\-'])(\S)/g, (_match, separator, char) => separator + char.toUpperCase());
}
