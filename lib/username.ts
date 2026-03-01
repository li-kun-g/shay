export function normalizeUsername(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "");
}
