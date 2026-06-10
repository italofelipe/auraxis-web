import type { InsightItem } from "~/features/ai-insights/contracts/ai-insight";

/** Average adult reading speed (words per minute) used for the badge. */
const WORDS_PER_MINUTE = 200;

/** A single inline text segment, optionally emphasised (bold). */
export interface InlineSegment {
  readonly text: string;
  readonly bold: boolean;
}

/**
 * Counts whitespace-delimited words in a string.
 *
 * @param text Source text.
 * @returns Word count (0 for empty/whitespace).
 */
const countWords = (text: string): number => {
  const trimmed = text.trim();
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
};

/**
 * Estimates how many minutes it takes to read a set of insight items.
 *
 * Sums the words across every item's title and message and divides by an
 * average reading speed, rounding to the nearest minute (never below 1 when
 * there is any text).
 *
 * @param items Insight items rendered in a section.
 * @returns Estimated reading time in whole minutes (minimum 1 when non-empty).
 */
export const estimateReadingMinutes = (items: readonly InsightItem[]): number => {
  const words = items.reduce(
    (total, item) => total + countWords(item.title) + countWords(item.message),
    0,
  );
  if (words === 0) {
    return 0;
  }
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
};

/**
 * Splits a (possibly markdown) message into display paragraphs.
 *
 * Paragraphs are separated by one or more blank lines; single newlines inside a
 * paragraph are preserved as-is so the renderer can keep soft breaks.
 *
 * @param message Insight message text.
 * @returns Non-empty trimmed paragraphs (always at least one when there is text).
 */
export const splitParagraphs = (message: string): string[] => {
  return message
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
};

/**
 * Parses inline `**bold**` markdown emphasis into renderable segments.
 *
 * Avoids any HTML injection: the caller renders each segment as plain text
 * inside a `<strong>` or text node, so untrusted content is never set as HTML.
 *
 * @param text Paragraph text possibly containing `**bold**` spans.
 * @returns Ordered segments with a `bold` flag.
 */
export const parseInlineEmphasis = (text: string): InlineSegment[] => {
  const segments: InlineSegment[] = [];
  const pattern = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), bold: false });
    }
    segments.push({ text: match[1] ?? "", bold: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), bold: false });
  }

  return segments.length > 0 ? segments : [{ text, bold: false }];
};
