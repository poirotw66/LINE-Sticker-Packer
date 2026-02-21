import React from 'react';
import { ProductType } from '../../types';
import { Smile, Image } from 'lucide-react';

interface ProductTypeStepProps {
  selected: ProductType | null;
  onSelect: (type: ProductType) => void;
}

export const ProductTypeStep: React.FC<ProductTypeStepProps> = ({ selected, onSelect }) => {
  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Choose Product Type</h2>
        <p className="text-gray-500 mt-2">LINE Creators Market supports stickers and emoticons with different image specs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Sticker (貼圖) */}
        <button
          type="button"
          onClick={() => onSelect('sticker')}
          className={`
            p-8 rounded-2xl border-2 text-left transition-all duration-200
            flex flex-col gap-4
            ${selected === 'sticker'
              ? 'border-green-500 bg-green-50 ring-2 ring-green-500 ring-offset-2'
              : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-lg'
            }
          `}
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-100">
              <Image className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Sticker</h3>
              <p className="text-xs text-gray-500">貼圖</p>
            </div>
          </div>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Content: 8–40 images, 320×320px</li>
            <li>• Main image: 1, 240×240px</li>
            <li>• Tab image: 1, 96×74px</li>
          </ul>
        </button>

        {/* Emoticon (表情貼) */}
        <button
          type="button"
          onClick={() => onSelect('emoticon')}
          className={`
            p-8 rounded-2xl border-2 text-left transition-all duration-200
            flex flex-col gap-4
            ${selected === 'emoticon'
              ? 'border-green-500 bg-green-50 ring-2 ring-green-500 ring-offset-2'
              : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-lg'
            }
          `}
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-100">
              <Smile className="w-8 h-8 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Emoticon</h3>
              <p className="text-xs text-gray-500">表情貼</p>
            </div>
          </div>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Content: 8–40 images, 180×180px</li>
            <li>• Tab image: 1, 96×74px</li>
          </ul>
        </button>
      </div>
    </div>
  );
};
