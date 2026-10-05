// Narration timing for the showcase player. There is no audio yet, so a clock paced like a
// bedtime reader drives the caption highlight and page turns.

const BASE_WORDS_PER_SECOND = 2.6;
/** Pause after the last word before the page turns. */
export const PAGE_HOLD_MS = 1800;

/** Narration slows as energy falls: 100% at energy 1.0 down to 80% at 0.1 (PLAN.md §6.2). */
export function narrationRate(energy: number): number {
  const e = Math.min(1, Math.max(0.1, energy));
  return 0.8 + ((e - 0.1) / 0.9) * 0.2;
}

export function wordsPerSecond(energy: number): number {
  return BASE_WORDS_PER_SECOND * narrationRate(energy);
}

export function splitWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

/** Time to read the page's words, not counting the hold. */
export function readingMs(text: string, energy: number): number {
  return (splitWords(text).length / wordsPerSecond(energy)) * 1000;
}

/** Total time a page stays up before auto-advancing. */
export function pageMs(text: string, energy: number): number {
  return readingMs(text, energy) + PAGE_HOLD_MS;
}

/** Index of the word being "read" at `elapsedMs`; equals the word count once reading is done. */
export function wordIndexAt(text: string, energy: number, elapsedMs: number): number {
  const count = splitWords(text).length;
  return Math.min(count, Math.floor((elapsedMs / 1000) * wordsPerSecond(energy)));
}
