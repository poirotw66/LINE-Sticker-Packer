import React from 'react';
import { STICKER_COUNTS } from '../../constants';
import { StickerCount } from '../../types';
import { CheckCircle } from 'lucide-react';

interface QuantityStepProps {
  selected: StickerCount | null;
  onSelect: (count: StickerCount) => void;
}

export const QuantityStep: React.FC<QuantityStepProps> = ({ selected, onSelect }) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Select Sticker Set Size</h2>
        <p className="text-gray-500 mt-2">How many stickers do you plan to publish?</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {STICKER_COUNTS.map((count) => (
          <button
            key={count}
            onClick={() => onSelect(count)}
            className={`
              relative p-6 rounded-xl border-2 transition-all duration-200
              flex flex-col items-center justify-center gap-2
              ${selected === count 
                ? 'border-green-500 bg-green-50 text-green-700 ring-2 ring-green-500 ring-offset-2' 
                : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-md'
              }
            `}
          >
            <span className="text-4xl font-bold">{count}</span>
            <span className="text-sm font-medium uppercase tracking-wider">Stickers</span>
            
            {selected === count && (
              <div className="absolute top-2 right-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
