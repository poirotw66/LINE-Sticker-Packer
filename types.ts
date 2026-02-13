export type StickerCount = 8 | 16 | 24 | 32 | 40;

export interface UploadedImage {
  id: string;
  url: string;
  file: File;
  name: string;
}

export interface AppState {
  step: number;
  targetCount: StickerCount | null;
  uploadedImages: UploadedImage[];
  selectedImageIds: string[]; // Ordered list of IDs for the sticker set
  mainImageId: string | null;
  tabImageBlob: Blob | null; // The processed tab image
  isProcessing: boolean;
}

export enum Step {
  QUANTITY = 0,
  UPLOAD = 1,
  SELECTION = 2,
  MAIN_IMAGE = 3,
  TAB_IMAGE = 4,
  DOWNLOAD = 5
}

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}
