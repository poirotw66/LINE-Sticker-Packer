import React from 'react';
import { UploadedImage } from '../../types';
import { Download, CheckCircle, Package } from 'lucide-react';
import { Button } from '../Button';

interface DownloadStepProps {
  selectedImages: UploadedImage[]; // The ordered list
  mainImageId: string | null;
  tabImageBlob: Blob | null;
  onDownload: () => void;
  isProcessing: boolean;
}

export const DownloadStep: React.FC<DownloadStepProps> = ({ 
  selectedImages, 
  mainImageId, 
  tabImageBlob, 
  onDownload,
  isProcessing
}) => {
  const mainImage = selectedImages.find(img => img.id === mainImageId);
  const tabImageUrl = tabImageBlob ? URL.createObjectURL(tabImageBlob) : null;

  return (
    <div className="space-y-8 animate-fadeIn text-center">
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8 max-w-2xl mx-auto">
        <div className="flex justify-center mb-4">
          <div className="bg-green-100 p-4 rounded-full">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-green-800">Ready to Package!</h2>
        <p className="text-green-700 mt-2">
          Your stickers are sorted, resized, and named correctly according to LINE guidelines.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
        {/* Main Image Summary */}
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <h3 className="font-bold text-gray-700 mb-2 border-b pb-2">Main Image</h3>
          <div className="flex items-center gap-4">
            {mainImage ? (
              <img src={mainImage.url} alt="Main" className="w-16 h-16 object-contain bg-gray-50 rounded" />
            ) : (
              <span className="text-red-500 text-sm">Missing</span>
            )}
            <div>
              <p className="text-sm font-mono text-gray-500">main.png</p>
              <p className="text-xs text-gray-400">240 x 240</p>
            </div>
          </div>
        </div>

        {/* Tab Image Summary */}
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <h3 className="font-bold text-gray-700 mb-2 border-b pb-2">Tab Image</h3>
          <div className="flex items-center gap-4">
            {tabImageUrl ? (
              <img src={tabImageUrl} alt="Tab" className="w-16 h-12 object-contain bg-gray-50 rounded" />
            ) : (
              <span className="text-red-500 text-sm">Missing</span>
            )}
            <div>
              <p className="text-sm font-mono text-gray-500">tab.png</p>
              <p className="text-xs text-gray-400">96 x 74</p>
            </div>
          </div>
        </div>

        {/* Stickers Summary */}
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <h3 className="font-bold text-gray-700 mb-2 border-b pb-2">Stickers</h3>
          <div className="flex items-center gap-4">
            <Package className="w-10 h-10 text-gray-400" />
            <div>
              <p className="text-sm font-bold text-gray-800">{selectedImages.length} items</p>
              <p className="text-xs text-gray-400">01.png - {selectedImages.length}.png</p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-8">
        <Button 
          onClick={onDownload} 
          variant="primary" 
          className="mx-auto text-lg px-12 py-4 shadow-xl hover:shadow-2xl hover:-translate-y-1"
          disabled={isProcessing}
        >
          {isProcessing ? 'Generating ZIP...' : 'Download ZIP Package'}
          {!isProcessing && <Download className="w-6 h-6 ml-2" />}
        </Button>
        <p className="mt-4 text-sm text-gray-400">
          Downloads a .zip file containing all formatted images.
        </p>
      </div>
    </div>
  );
};
