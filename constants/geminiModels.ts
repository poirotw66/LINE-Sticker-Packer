/** Gemini model IDs used for sticker metadata generation. */

export const DEFAULT_GEMINI_MODEL = 'gemini-flash-lite-latest' as const;

export const GEMINI_MODEL_OPTIONS = [
  { id: 'gemini-flash-lite-latest' as const, label: 'Gemini Flash Lite (latest)' },
  { id: 'gemini-flash-latest' as const, label: 'Gemini Flash (latest)' },
] as const;

export type GeminiChatModelId = (typeof GEMINI_MODEL_OPTIONS)[number]['id'];

export function isGeminiChatModelId(value: string): value is GeminiChatModelId {
  return GEMINI_MODEL_OPTIONS.some((o) => o.id === value);
}
