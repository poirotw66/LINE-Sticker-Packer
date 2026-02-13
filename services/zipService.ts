import JSZip from 'jszip';
import saveAs from 'file-saver';
import { AppState, UploadedImage } from '../types';
import { LINE_SPECS } from '../constants';
import { processStickerImage } from './imageService';

export const generateAndDownloadZip = async (
  state: AppState
): Promise<void> => {
  const zip = new JSZip();
  const folder = zip.folder('sticker-pack');
  
  if (!folder) throw new Error("Failed to create zip folder");

  // 1. Process Stickers (01.png - XX.png)
  const stickerPromises = state.selectedImageIds.map(async (id, index) => {
    const imgObj = state.uploadedImages.find(img => img.id === id);
    if (!imgObj) return;

    // Pad filename: 1 -> 01, 10 -> 10
    const fileName = `${String(index + 1).padStart(2, '0')}.png`;
    
    // Resize to 320x320 (Contain)
    const blob = await processStickerImage(
      imgObj.url, 
      LINE_SPECS.sticker.width, 
      LINE_SPECS.sticker.height
    );
    folder.file(fileName, blob);
  });

  // 2. Process Main Image (main.png)
  const mainImagePromise = (async () => {
    if (!state.mainImageId) return;
    const imgObj = state.uploadedImages.find(img => img.id === state.mainImageId);
    if (!imgObj) return;

    const blob = await processStickerImage(
      imgObj.url,
      LINE_SPECS.main.width,
      LINE_SPECS.main.height
    );
    folder.file('main.png', blob);
  })();

  // 3. Process Tab Image (tab.png)
  const tabImagePromise = (async () => {
    if (state.tabImageBlob) {
      folder.file('tab.png', state.tabImageBlob);
    }
  })();

  await Promise.all([...stickerPromises, mainImagePromise, tabImagePromise]);

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, 'line-stickers-pack.zip');
};