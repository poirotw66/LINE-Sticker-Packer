import { UploadedImage } from '../types';
import { GoogleGenAI } from "@google/genai";

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

/** Pass apiKey from context (user setting or build-time env). */
export const generateStickerMetadata = async (
  apiKey: string | null,
  selectedImages: UploadedImage[],
  mainImageId: string | null,
  tabImageBlob: Blob | null
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
    1. Title: Catchy, short (max 40 characters).
    2. Description: Explain the usage scenarios or the character's personality (max 160 characters).
    3. Output both Traditional Chinese (Taiwan style) and English.
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
      title_en: { type: "STRING", description: "English Title (Max 40 chars)" },
      desc_en: { type: "STRING", description: "English Description (Max 160 chars)" },
    },
    required: ["title_zh", "desc_zh", "title_en", "desc_en"],
  };

  // 3. Call API
  const response = await ai.models.generateContent({
    model: 'gemini-flash-latest', 
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

  return JSON.parse(text) as StickerMetadata;
};