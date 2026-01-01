/**
 * Emoji Scoring Configuration for Matti & Opvoedmaatje
 * 
 * Maps emoji selections to numeric scores for analytics tracking.
 * Frontend shows emoji's, backend stores numbers.
 */

export interface EmojiScore {
  emoji: string;
  label: string;
  score: number;
  description?: string;
}

export interface ChangeEmoji {
  emoji: string;
  label: string;
  delta: number;
  description?: string;
}

/**
 * Initial emotion scale (for first-time theme assessment)
 * Used when asking: "Hoe gaat het met [thema]?"
 */
export const EMOTION_SCALE: EmojiScore[] = [
  {
    emoji: '😄',
    label: 'Goed',
    score: 2,
    description: 'Gebruiker voelt zich goed over dit thema',
  },
  {
    emoji: '🙂',
    label: 'Oké',
    score: 4,
    description: 'Gebruiker voelt zich oké, geen grote problemen',
  },
  {
    emoji: '😐',
    label: 'Niet zo',
    score: 6,
    description: 'Gebruiker heeft wat moeite met dit thema',
  },
  {
    emoji: '😟',
    label: 'Slecht',
    score: 8,
    description: 'Gebruiker heeft duidelijke problemen',
  },
  {
    emoji: '😢',
    label: 'Heel slecht',
    score: 10,
    description: 'Gebruiker heeft ernstige problemen',
  },
];

/**
 * Change scale (for follow-up assessment)
 * Used when asking: "Vorige keer was het [emoji]. Hoe gaat het nu?"
 */
export const CHANGE_SCALE: ChangeEmoji[] = [
  {
    emoji: '👍👍',
    label: 'Veel beter',
    delta: -4,
    description: 'Significante verbetering',
  },
  {
    emoji: '👍',
    label: 'Beetje beter',
    delta: -2,
    description: 'Lichte verbetering',
  },
  {
    emoji: '👌',
    label: 'Hetzelfde',
    delta: 0,
    description: 'Geen verandering',
  },
  {
    emoji: '👎',
    label: 'Beetje slechter',
    delta: +2,
    description: 'Lichte verslechtering',
  },
  {
    emoji: '👎👎',
    label: 'Veel slechter',
    delta: +4,
    description: 'Significante verslechtering',
  },
];

/**
 * Alternative: Thumbs scale (simpler, for younger users)
 */
export const THUMBS_SCALE: EmojiScore[] = [
  { emoji: '👍👍', label: 'Super', score: 2 },
  { emoji: '👍', label: 'Goed', score: 4 },
  { emoji: '👌', label: 'Oké', score: 6 },
  { emoji: '👎', label: 'Niet goed', score: 8 },
  { emoji: '👎👎', label: 'Heel slecht', score: 10 },
];

/**
 * Alternative: Heart scale (for positive themes like "relatie met ouders")
 */
export const HEART_SCALE: EmojiScore[] = [
  { emoji: '💚💚', label: 'Heel goed', score: 2 },
  { emoji: '💚', label: 'Goed', score: 4 },
  { emoji: '💛', label: 'Oké', score: 6 },
  { emoji: '🧡', label: 'Niet zo', score: 8 },
  { emoji: '❤️', label: 'Slecht', score: 10 },
];

/**
 * Mapping objects for quick lookups
 */
export const EMOJI_TO_SCORE: Record<string, number> = Object.fromEntries(
  EMOTION_SCALE.map(item => [item.emoji, item.score])
);

export const CHANGE_EMOJI_TO_DELTA: Record<string, number> = Object.fromEntries(
  CHANGE_SCALE.map(item => [item.emoji, item.delta])
);

/**
 * Convert emoji to numeric score
 */
export function emojiToScore(emoji: string): number {
  return EMOJI_TO_SCORE[emoji] || 5; // Default to middle score if unknown
}

/**
 * Convert numeric score to closest emoji
 */
export function scoreToEmoji(score: number): string {
  if (score <= 2) return '😄';
  if (score <= 4) return '🙂';
  if (score <= 6) return '😐';
  if (score <= 8) return '😟';
  return '😢';
}

/**
 * Get emoji label for display
 */
export function getEmojiLabel(emoji: string): string {
  const item = EMOTION_SCALE.find(e => e.emoji === emoji);
  return item?.label || emoji;
}

/**
 * Calculate improvement percentage from emoji scores
 */
export function calculateImprovement(startEmoji: string, currentEmoji: string): number {
  const startScore = emojiToScore(startEmoji);
  const currentScore = emojiToScore(currentEmoji);
  
  if (startScore === 0) return 0;
  
  return Math.round(((startScore - currentScore) / startScore) * 100);
}

/**
 * Apply change emoji to existing score
 */
export function applyChange(currentScore: number, changeEmoji: string): number {
  const delta = CHANGE_EMOJI_TO_DELTA[changeEmoji] || 0;
  return Math.max(1, Math.min(10, currentScore + delta));
}

/**
 * Validate emoji is in allowed set
 */
export function isValidEmoji(emoji: string): boolean {
  return emoji in EMOJI_TO_SCORE || emoji in CHANGE_EMOJI_TO_DELTA;
}

/**
 * Get emoji scale based on user age (recommendation)
 */
export function getRecommendedScale(age: number): EmojiScore[] {
  if (age < 13) return THUMBS_SCALE; // Younger kids: simpler
  if (age < 18) return EMOTION_SCALE; // Teens: emotion faces
  return EMOTION_SCALE; // Adults: also emotion faces
}

/**
 * Format emoji score for display in conversation
 */
export function formatEmojiScore(emoji: string): string {
  const label = getEmojiLabel(emoji);
  return `${emoji} ${label}`;
}
