// The one place for AWS region, Bedrock model IDs and Polly voices (PLAN.md §0.2, decision D-012).
// Checked against the Bedrock model cards and Polly docs on 2026-10-07.

export const AWS_REGION = 'us-east-1';

/**
 * Bedrock models. Nova 2 Lite has no in-Region capacity in us-east-1, so we call it through the
 * US geo inference profile (`us.` prefix).
 */
export const BEDROCK_MODELS = {
  /** Story bible, page text and choice branches. */
  story: 'us.amazon.nova-2-lite-v1:0',
  /** Reads the child's drawing and returns a character sheet. */
  drawingVision: 'us.amazon.nova-2-lite-v1:0',
} as const;

/**
 * Polly narration. Neural, not generative: generative voices can't return speech marks,
 * and the captions highlight words from them.
 */
export const POLLY_ENGINE = 'neural';

export type NarratorId = 'willow' | 'arlo' | 'juniper';

/** App narrator names → Polly en-US voices. */
export const NARRATOR_VOICES: Record<NarratorId, string> = {
  willow: 'Ruth',
  arlo: 'Matthew',
  juniper: 'Danielle',
};

/** Prosody rate for page energy: 100% at full energy down to 80% when the story is nearly asleep. */
export function narrationRatePercent(energy: number): number {
  const e = Math.min(1, Math.max(0.1, energy));
  return Math.round(80 + ((e - 0.1) / 0.9) * 20);
}
