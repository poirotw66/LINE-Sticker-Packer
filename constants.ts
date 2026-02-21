import { StickerCount, ProductType } from './types';

export const STICKER_COUNTS: StickerCount[] = [8, 16, 24, 32, 40];

/** Tab image: same for both product types (96×74). */
export const TAB_SPEC = { width: 96, height: 74 } as const;

/** Content/main dimensions per product type. */
export const LINE_SPECS = {
  sticker: {
    content: { width: 320, height: 320 },
    main: { width: 240, height: 240 },
  },
  emoticon: {
    content: { width: 180, height: 180 },
  },
} as const;

/** Step labels for Stepper; emoticon skips "Pick Main Image". */
export const STEPS_LABELS: Record<ProductType, string[]> = {
  sticker: [
    'Select Type',
    'Select Quantity',
    'Upload Images',
    'Sort Stickers',
    'Touch Up',
    'Pick Main Image',
    'Crop Tab Image',
    'Download',
  ],
  emoticon: [
    'Select Type',
    'Select Quantity',
    'Upload Images',
    'Sort Emoticons',
    'Touch Up',
    'Crop Tab Image',
    'Download',
  ],
};