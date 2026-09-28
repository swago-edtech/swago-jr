export const HOW_TO_PLAY_TITLE_PLACEHOLDER = "{title}";

// Header text on /how-to-play/<slug> when the admin leaves the description empty.
export const DEFAULT_HOW_TO_PLAY_DESCRIPTION =
  "Not sure how to start?\nWatch the quick {title} demo and see how easy it is to play.";

/** The admin description, or the default when empty. Still contains the {title} placeholder. */
export function getHowToPlayDescriptionTemplate(description: string | null | undefined): string {
  return description?.trim() || DEFAULT_HOW_TO_PLAY_DESCRIPTION;
}

/** Resolves the how-to-play description (falling back to the default) and fills in {title}. */
export function getHowToPlayDescription(description: string | null | undefined, title: string): string {
  return getHowToPlayDescriptionTemplate(description).split(HOW_TO_PLAY_TITLE_PLACEHOLDER).join(title);
}

/**
 * Splits a description (before or after {title} substitution) on its first line break: the first line is the highlighted
 * heading, the rest is body text. Text without a line break is returned as body only.
 */
export function splitHowToPlayDescription(text: string): { heading: string; body: string } {
  const normalized = text.replace(/\r\n?/g, "\n").trim();
  const breakAt = normalized.indexOf("\n");
  if (breakAt === -1) return { heading: "", body: normalized };
  return {
    heading: normalized.slice(0, breakAt).trim(),
    body: normalized.slice(breakAt + 1).trim(),
  };
}
