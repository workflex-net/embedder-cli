// Text replacement

export interface MatchResult {
  index: number;
  line: number;
  column: number;
  match: string;
}

export function findUniqueMatch(
  content: string,
  searchText: string,
): MatchResult | null {
  const index = content.indexOf(searchText);
  if (index === -1) return null;

  // Check uniqueness - no second occurrence
  const secondIndex = content.indexOf(searchText, index + 1);
  if (secondIndex !== -1) return null;

  // Calculate line and column
  const beforeMatch = content.slice(0, index);
  const lines = beforeMatch.split("\n");
  const line = lines.length;
  const column = (lines[lines.length - 1]?.length ?? 0) + 1;

  return { index, line, column, match: searchText };
}

/** Replace text in content (jKA) */
export function jKA(
  content: string,
  searchText: string,
  replacement: string,
): { result: string; replaced: boolean } {
  const match = findUniqueMatch(content, searchText);
  if (!match) {
    return { result: content, replaced: false };
  }

  const result =
    content.slice(0, match.index) +
    replacement +
    content.slice(match.index + searchText.length);

  return { result, replaced: true };
}
export const replaceText = jKA;

export default { replaceText, findUniqueMatch };
