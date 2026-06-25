export const LIMITS = {
  lineMaxSentences: 2,
  lineMaxChars: 300,
  commentMaxChars: 500,
  bioMaxChars: 280,
  displayNameMaxChars: 50,
  usernameMin: 3,
  usernameMax: 20
} as const;

export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

/**
 * Count sentences in a string. A sentence is a run of text terminated by
 * one of . ! ? 。 ！ ？ … (covers Latin + CJK punctuation). Trailing text
 * without a terminator still counts as one sentence.
 */
export function countSentences(input: string): number {
  const text = input.trim();
  if (!text) return 0;

  // Collapse runs of terminators (e.g. "?!", "…") into a single boundary.
  const matches = text.match(/[^.!?。！？…]+(?:[.!?。！？…]+|$)/g);
  if (!matches) return 0;

  return matches.filter((s) => s.trim().length > 0).length;
}

export function isValidUsername(username: string): boolean {
  return USERNAME_REGEX.test(username);
}

export interface LineCheck {
  ok: boolean;
  reason?: 'empty' | 'too_many_sentences' | 'too_long';
}

export function checkLine(
  value: string,
  { required = true }: { required?: boolean } = {}
): LineCheck {
  const trimmed = value.trim();
  if (!trimmed) {
    return required ? { ok: false, reason: 'empty' } : { ok: true };
  }
  if (trimmed.length > LIMITS.lineMaxChars) {
    return { ok: false, reason: 'too_long' };
  }
  if (countSentences(trimmed) > LIMITS.lineMaxSentences) {
    return { ok: false, reason: 'too_many_sentences' };
  }
  return { ok: true };
}
