import { StickerCount } from './types';

export const STICKER_COUNTS: StickerCount[] = [8, 16, 24, 32, 40];

export const LINE_SPECS = {
  sticker: { width: 320, height: 320 }, // Safe size (max is 370x320)
  main: { width: 240, height: 240 },
  tab: { width: 96, height: 74 },
};

export const STEPS_LABELS = [
  "Select Quantity",
  "Upload Images",
  "Sort Stickers",
  "Touch Up",     // New Label
  "Pick Main Image",
  "Crop Tab Image",
  "Download"
];