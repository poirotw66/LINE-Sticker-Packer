import React from 'react';
import { UploadedImage } from '../../types';
import { CheckCircle } from 'lucide-react';

interface MainImageStepProps {
  images: UploadedImage[]; // Only selected images passed here
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export const MainImageStep: React.FC<MainImageStepProps> = ({ images, selectedId, onSelect }) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Select Main Image</h2>
        <p className="text-gray-500 mt-2">
          This image will be the cover of your sticker pack (main.png).
          <br/>It will be resized to 240x240.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start justify-center mt-8">
        
        {/* Preview of Selected Main */}
        <div className="w-full md:w-1/3 flex flex-col items-center">
          <div className="bg-gray-100 p-6 rounded-2xl border-2 border-dashed border-gray-300 w-64 h-64 flex items-center justify-center">
            {selectedId ? (
              <img 
                src={images.find(i => i.id === selectedId)?.url} 
                className="max-w-full max-h-full object-contain"
                alt="Main Preview" 
              />
            ) : (
              <span className="text-gray-400">No selection</span>
            )}
          </div>
          <p className="mt-4 text-sm font-medium text-gray-500">Output Preview (240x240)</p>
        </div>

        {/* Selection Grid */}
        <div className="w-full md:w-2/3">
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
            {images.map((img) => (
              <button
                key={img.id}
                onClick={() => onSelect(img.id)}
                className={`
                  relative aspect-square rounded-xl border-2 transition-all p-2 bg-white
                  ${selectedId === img.id 
                    ? 'border-green-500 ring-2 ring-green-500 ring-offset-1' 
                    : 'border-gray-100 hover:border-gray-300'
                  }
                `}
              >
                <img src={img.url} alt="candidate" className="w-full h-full object-contain" />
                {selectedId === img.id && (
                  <div className="absolute top-1 right-1">
                    <CheckCircle className="w-5 h-5 text-green-600 bg-white rounded-full" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
