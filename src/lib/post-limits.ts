/**
 * Post composition limits aligned with widely used social conventions
 * (same ballpark as Instagram: caption length, hashtag count, carousel size).
 * Media byte totals stay lower than Instagram — constrained by web upload / Server Actions.
 */
export const POST_LIMITS = {
  captionMaxChars: 2200,
  /** #hashtag tokens in the caption (Instagram allows up to 30). */
  maxHashtagTokens: 30,
  /** Photos/videos in one post (Instagram carousel = 10). */
  maxMediaItems: 10,
  /** Total bytes for all media — app limit, not Instagram’s. */
  maxMediaBytesTotal: 50 * 1024 * 1024,
  /** Unique @username mentions per post (after dedupe). */
  maxMentionUsernames: 20,
} as const;

/** Counts every `#tag` token (matches `parseHashtags` token shape). */
export function countHashtagTokens(text: string): number {
  const m = text.match(/#[\p{L}\p{N}_]+/gu);
  return m?.length ?? 0;
}
