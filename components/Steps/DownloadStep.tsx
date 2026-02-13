import React, { useState } from 'react';
import { UploadedImage } from '../../types';
import { Download, CheckCircle, Package, Smartphone, List } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'list' | 'preview'>('list');
  const mainImage = selectedImages.find(img => img.id === mainImageId);
  const tabImageUrl = tabImageBlob ? URL.createObjectURL(tabImageBlob) : null;

  return (
    <div className="space-y-8 animate-fadeIn text-center">
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 max-w-2xl mx-auto">
        <div className="flex justify-center mb-4">
          <div className="bg-green-100 p-4 rounded-full">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-green-800">Ready to Package!</h2>
        <p className="text-green-700 mt-2 text-sm md:text-base">
          Your stickers are sorted, resized, and named correctly.
        </p>
      </div>

      {/* View Toggle */}
      <div className="flex justify-center gap-2">
        <button 
          onClick={() => setViewMode('list')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          <List className="w-4 h-4" /> File List
        </button>
        <button 
          onClick={() => setViewMode('preview')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${viewMode === 'preview' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          <Smartphone className="w-4 h-4" /> Chat Simulation
        </button>
      </div>

      {viewMode === 'list' ? (
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
      ) : (
        /* Chat Simulator */
        <div className="max-w-sm mx-auto bg-[#8cabd9] rounded-3xl border-4 border-gray-800 overflow-hidden shadow-2xl h-[500px] flex flex-col">
          {/* Mock Header */}
          <div className="bg-[#2a384f] p-3 flex items-center justify-between text-white">
             <div className="text-sm font-bold">Sticker Preview</div>
             <div className="w-4 h-4 rounded-full bg-green-500"></div>
          </div>
          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
             {selectedImages.map((img, i) => (
                <div key={img.id} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                  {i % 2 !== 0 && (
                    <div className="w-8 h-8 rounded-full bg-gray-300 mr-2 self-start flex-shrink-0" />
                  )}
                  <div className="max-w-[70%]">
                    <img 
                      src={img.url} 
                      className="w-24 h-24 object-contain" // Stickers usually display slightly smaller in chat
                      alt="sticker" 
                    />
                  </div>
                </div>
             ))}
          </div>
          {/* Fake Input */}
          <div className="bg-white p-2 border-t flex items-center gap-2">
            <div className="bg-gray-100 flex-1 h-8 rounded-full"></div>
            {tabImageUrl && <img src={tabImageUrl} className="w-6 h-6 opacity-50 grayscale" />}
          </div>
        </div>
      )}

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
          Downloads a .zip file compliant with LINE Creators Market.
        </p>
      </div>
    </div>
  );
};