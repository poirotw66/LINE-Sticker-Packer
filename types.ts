export type StickerCount = 8 | 16 | 24 | 32 | 40;

/** Sticker pack (貼圖) vs Emoticon pack (表情貼). */
export type ProductType = 'sticker' | 'emoticon';

export interface UploadedImage {
  id: string;
  url: string;
  file: File;
  name: string;
}

export interface AppState {
  step: number;
  productType: ProductType | null;
  targetCount: StickerCount | null;
  uploadedImages: UploadedImage[];
  selectedImageIds: string[];
  mainImageId: string | null; // Only used for sticker (貼圖)
  tabImageBlob: Blob | null;
  isProcessing: boolean;
}

export enum Step {
  PRODUCT_TYPE = 0,
  QUANTITY = 1,
  UPLOAD = 2,
  SELECTION = 3,
  ERASER = 4,
  MAIN_IMAGE = 5,
  TAB_IMAGE = 6,
  DOWNLOAD = 7,
}

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}