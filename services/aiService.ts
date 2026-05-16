import { UploadedImage } from '../types';
import { GoogleGenAI } from "@google/genai";
import type { GeminiChatModelId } from '../constants/geminiModels';

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

function truncateAsciiField(value: string, maxLen: number): string {
  if (value.length <= maxLen) return value;
  return value.slice(0, maxLen).replace(/\s+$/, '').trimEnd();
}

function normalizeStickerMetadata(parsed: StickerMetadata): StickerMetadata {
  const title_en = truncateAsciiField(sanitizeLineEnglishField(parsed.title_en), 40);
  const desc_en = truncateAsciiField(sanitizeLineEnglishField(parsed.desc_en), 160);
  return {
    ...parsed,
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
  model: GeminiChatModelId
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
    text: `You are a professional LINE Sticker creator and copywriter. 
    Please analyze the attached sticker images and generate a Title and Description for the LINE Creators Market.
    
    Requirements:
    1. Traditional Chinese title (title_zh): catchy, short (max 40 characters). Traditional Chinese (Taiwan style).
    2. Traditional Chinese description (desc_zh): usage scenarios or character personality (max 160 characters).
    3. English title (title_en) and English description (desc_en): LINE Creators Market only accepts HALF-WIDTH ASCII for English fields.
       Use ONLY: Latin letters A-Z and a-z, digits 0-9, spaces, and standard half-width punctuation/symbols (ASCII printable characters).
       Do NOT use full-width characters, CJK characters, emoji, accented Latin letters, or any character outside basic ASCII English keyboard text.
       Rewrite wording if needed so English stays plain ASCII while staying catchy (max 40 chars title_en, max 160 chars desc_en).
    4. The tone should be fun, appealing, and relevant to the visual style of the stickers.`
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
      title_zh: { type: "STRING", description: "Traditional Chinese Title (Max 40 chars)" },
      desc_zh: { type: "STRING", description: "Traditional Chinese Description (Max 160 chars)" },
      title_en: {
        type: "STRING",
        description:
          "English title max 40 chars. ASCII half-width only: A-Za-z0-9 spaces and basic punctuation; no full-width or non-ASCII.",
      },
      desc_en: {
        type: "STRING",
        description:
          "English description max 160 chars. ASCII half-width only: A-Za-z0-9 spaces and basic punctuation; no full-width or non-ASCII.",
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
      temperature: 0.7,
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");

  const parsed = JSON.parse(text) as StickerMetadata;
  return normalizeStickerMetadata(parsed);
};