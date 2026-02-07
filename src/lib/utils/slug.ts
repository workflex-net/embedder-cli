// Slug generation

export const adjectives: string[] = [
  "bold", "bright", "calm", "cool", "crisp",
  "dark", "deep", "eager", "fair", "fast",
  "firm", "glad", "grand", "keen", "kind",
  "light", "loud", "mild", "neat", "nice",
  "pale", "pure", "quick", "rare", "rich",
  "safe", "sharp", "slim", "soft", "tall",
  "thin", "warm", "wide", "wild", "wise",
];

export const nouns: string[] = [
  "ant", "bear", "bird", "cat", "crow",
  "deer", "dove", "duck", "elk", "fish",
  "fox", "frog", "goat", "hawk", "hare",
  "jay", "lark", "lion", "lynx", "mole",
  "moth", "newt", "owl", "pike", "puma",
  "ram", "seal", "slug", "swan", "toad",
  "vole", "wasp", "wolf", "wren", "yak",
];

/** Generate a human-readable slug (JJB) */
export function JJB(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${adj}-${noun}-${num}`;
}
export const generateSlug = JJB;

export default { generateSlug, adjectives, nouns };
