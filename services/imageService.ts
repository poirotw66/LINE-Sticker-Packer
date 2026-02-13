/**
 * Loads an image from a URL
 */
export const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
  });
};

/**
 * Resizes an image to fit within dimensions (contain), maintaining aspect ratio,
 * centered on a transparent background.
 */
export const processStickerImage = async (
  imageUrl: string, 
  width: number, 
  height: number
): Promise<Blob> => {
  const img = await loadImage(imageUrl);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Could not get canvas context');

  // Calculate scaling to "contain"
  const scale = Math.min(width / img.width, height / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  const x = (width - w) / 2;
  const y = (height - h) / 2;

  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(img, x, y, w, h);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas to Blob failed'));
    }, 'image/png');
  });
};

/**
 * Crops an image based on provided coordinates from the cropper UI.
 */
export const cropImage = async (
  image: HTMLImageElement,
  cropX: number,
  cropY: number,
  cropWidth: number,
  cropHeight: number,
  outputWidth: number,
  outputHeight: number
): Promise<Blob> => {
  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Could not get canvas context');

  // Draw the cropped area onto the new canvas, scaling it to the output size
  ctx.drawImage(
    image,
    cropX, cropY, cropWidth, cropHeight, // Source
    0, 0, outputWidth, outputHeight      // Destination
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas to Blob failed'));
    }, 'image/png');
  });
};
