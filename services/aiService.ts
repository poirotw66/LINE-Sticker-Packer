import { UploadedImage, ProductType } from '../types';
import { GoogleGenAI } from "@google/genai";
import type { GeminiChatModelId } from '../constants/geminiModels';

const TITLE_MAX_LEN = 40;
const DESC_MAX_LEN = 160;

function buildMetadataPrompt(productType: ProductType, stickerCount: number): string {
  const productLabel = productType === 'sticker' ? 'sticker pack (貼圖)' : 'emoticon pack (表情貼)';

  return `You are an expert copywriter for LINE Creators Market (${productLabel}).

Analyze the attached images (main cover first, then sample ${productType === 'sticker' ? 'stickers' : 'emoticons'}) and write listing copy that helps users discover and understand this set.

## Step 1 — Visual analysis (internal)
Identify: main character or motif, art style, color mood, recurring emotions/actions, and 2–3 chat situations where these images fit (e.g. greeting, thanks, tired, cheering up).

## Step 2 — Write four fields (JSON only)

### title_zh (max ${TITLE_MAX_LEN} characters)
- Traditional Chinese (Taiwan). Must read naturally in Taiwan usage.
- Short, memorable, searchable. Prefer character name + vibe, or a catchy theme phrase.
- No emoji, no line breaks, no quotes wrapping the whole title.
- Do not mention "LINE", "貼圖", "表情貼", or sticker count.

### desc_zh (max ${DESC_MAX_LEN} characters)
- Traditional Chinese (Taiwan).
- 1–2 sentences: who/what this set is, personality or tone, and when friends would send these (concrete chat moments).
- Warm, friendly, not overly salesy. No emoji, no line breaks.

### title_en (max ${TITLE_MAX_LEN} characters)
- LINE English listing accepts HALF-WIDTH ASCII ONLY: A–Z, a–z, 0–9, spaces, and basic punctuation (. , ! ? ' - &).
- Same concept as title_zh, localized naturally (not a literal translation if awkward).
- No emoji, no full-width characters, no accented letters, no CJK.

### desc_en (max ${DESC_MAX_LEN} characters)
- Same ASCII-only rules as title_en.
- Same concept as desc_zh: character/theme + usage scenarios in plain English.
- No emoji, no line breaks.

## Hard rules
- Stay faithful to what you see; do not invent characters or themes not shown.
- Count characters before finalizing; stay within limits.
- zh and en pairs should match in meaning but read naturally in each language.
- Avoid copyrighted brand names, celebrity names, and misleading claims.
- This pack has ${stickerCount} images; do not list image numbers or filenames.

Return JSON with keys: title_zh, desc_zh, title_en, desc_en.`;
}

function collapseSingleLine(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim();
}

function truncateField(value: string, maxLen: number): string {
  if (value.length <= maxLen) return value;
  return value.slice(0, maxLen).replace(/\s+$/, '').trimEnd();
}

// Helper to convert blob URL to base64 string
const urlToBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/png;base64,")
      resolve(base64String.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export interface StickerMetadata {
  title_zh: string;
  desc_zh: string;
  title_en: string;
  desc_en: string;
}

/** LINE Creators Market English fields: half-width alphanumeric + half-width symbols only (ASCII printable). */
function sanitizeLineEnglishField(raw: string): string {
  const nfkc = raw.normalize('NFKC');
  const asciiPrintable = nfkc.replace(/[^\x20-\x7E]/g, '');
  return asciiPrintable.replace(/\s+/g, ' ').trim();
}

function normalizeStickerMetadata(parsed: StickerMetadata): StickerMetadata {
  const title_zh = truncateField(collapseSingleLine(parsed.title_zh), TITLE_MAX_LEN);
  const desc_zh = truncateField(collapseSingleLine(parsed.desc_zh), DESC_MAX_LEN);
  const title_en = truncateField(sanitizeLineEnglishField(parsed.title_en), TITLE_MAX_LEN);
  const desc_en = truncateField(sanitizeLineEnglishField(parsed.desc_en), DESC_MAX_LEN);
  return {
    title_zh: title_zh.length > 0 ? title_zh : '貼圖',
    desc_zh,
    title_en: title_en.length > 0 ? title_en : 'Sticker Pack',
    desc_en,
  };
}

/** Pass apiKey from context (user setting or build-time env). */
export const generateStickerMetadata = async (
  apiKey: string | null,
  selectedImages: UploadedImage[],
  mainImageId: string | null,
  tabImageBlob: Blob | null,
  model: GeminiChatModelId,
  productType: ProductType = 'sticker'
): Promise<StickerMetadata> => {
  const key = apiKey || (typeof process !== 'undefined' && process.env?.API_KEY) || (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY);
  if (!key) {
    throw new Error("API key is missing. Add it in Settings or set GEMINI_API_KEY in .env for local dev.");
  }

  const ai = new GoogleGenAI({ apiKey: key });

  // 1. Prepare Content
  const parts: any[] = [];

  // Add Prompt
  parts.push({
    text: buildMetadataPrompt(productType, selectedImages.length),
  });

  // Helper to add image part
  const addImagePart = async (url: string, label: string) => {
    const b64 = await urlToBase64(url);
    parts.push({ text: `[Image: ${label}]` });
    parts.push({
      inlineData: {
        mimeType: 'image/png',
        data: b64
      }
    });
  };

  // Main Image
  const mainImg = selectedImages.find(i => i.id === mainImageId);
  if (mainImg) {
    await addImagePart(mainImg.url, "Main Cover Image");
  }

  // Random 4 stickers for context
  const stickersToAnalyze = selectedImages.slice(0, 4);
  for (let i = 0; i < stickersToAnalyze.length; i++) {
    await addImagePart(stickersToAnalyze[i].url, `Sticker Example ${i+1}`);
  }

  // 2. Define Schema manually using string literals for types to avoid Enum import issues
  const schema = {
    type: "OBJECT",
    properties: {
      title_zh: {
        type: "STRING",
        description: `Traditional Chinese (Taiwan) title, max ${TITLE_MAX_LEN} chars. Memorable, no emoji, no LINE/product meta words.`,
      },
      desc_zh: {
        type: "STRING",
        description: `Traditional Chinese (Taiwan) description, max ${DESC_MAX_LEN} chars. Character/theme plus 2-3 chat use cases.`,
      },
      title_en: {
        type: "STRING",
        description: `English title max ${TITLE_MAX_LEN} chars. ASCII half-width only (A-Za-z0-9 and basic punctuation).`,
      },
      desc_en: {
        type: "STRING",
        description: `English description max ${DESC_MAX_LEN} chars. ASCII half-width only; same meaning as desc_zh.`,
      },
    },
    required: ["title_zh", "desc_zh", "title_en", "desc_en"],
  };

  // 3. Call API
  const response = await ai.models.generateContent({
    model,
    contents: {
      role: 'user',
      parts: parts
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.5,
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");

  const parsed = JSON.parse(text) as StickerMetadata;
  return normalizeStickerMetadata(parsed);
};