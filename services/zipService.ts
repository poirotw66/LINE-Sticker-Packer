import JSZip from 'jszip';
import saveAs from 'file-saver';
import { AppState } from '../types';
import { LINE_SPECS } from '../constants';
import { processStickerImage } from './imageService';

export const generateAndDownloadZip = async (
  state: AppState
): Promise<void> => {
  const productType = state.productType ?? 'sticker';
  const specs = LINE_SPECS[productType];
  const contentSize = specs.content;

  const zip = new JSZip();
  const folderName = productType === 'emoticon' ? 'emoticon-pack' : 'sticker-pack';
  const folder = zip.folder(folderName);
  if (!folder) throw new Error("Failed to create zip folder");

  // 1. Content images: sticker 01.png–40.png (2-digit); emoticon 001.png–040.png (3-digit)
  const contentPadLength = productType === 'emoticon' ? 3 : 2;
  const contentPromises = state.selectedImageIds.map(async (id, index) => {
    const imgObj = state.uploadedImages.find((img) => img.id === id);
    if (!imgObj) return;
    const fileName = `${String(index + 1).padStart(contentPadLength, '0')}.png`;
    const blob = await processStickerImage(
      imgObj.url,
      contentSize.width,
      contentSize.height
    );
    folder.file(fileName, blob);
  });

  // 2. Main image (main.png): sticker only, 240×240
  const mainImagePromise =
    productType === 'sticker' && state.mainImageId
      ? (async () => {
          const imgObj = state.uploadedImages.find((img) => img.id === state.mainImageId);
          if (!imgObj) return;
          const blob = await processStickerImage(
            imgObj.url,
            LINE_SPECS.sticker.main.width,
            LINE_SPECS.sticker.main.height
          );
          folder.file('main.png', blob);
        })()
      : Promise.resolve();

  // 3. Tab image (tab.png): 96×74, same for both
  const tabImagePromise = state.tabImageBlob
    ? (async () => { folder.file('tab.png', state.tabImageBlob!); })()
    : Promise.resolve();

  await Promise.all([...contentPromises, mainImagePromise, tabImagePromise]);

  const content = await zip.generateAsync({ type: 'blob' });
  const zipFileName = productType === 'emoticon' ? 'line-emoticons-pack.zip' : 'line-stickers-pack.zip';
  saveAs(content, zipFileName);
};