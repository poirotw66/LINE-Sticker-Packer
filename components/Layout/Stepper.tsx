import React from 'react';
import { STEPS_LABELS } from '../../constants';
import { ProductType } from '../../types';
import { Check } from 'lucide-react';

interface StepperProps {
  currentStep: number;
  productType: ProductType | null;
}

/** For emoticon we skip MAIN_IMAGE, so map raw step to display index (0..6). */
function getDisplayStep(step: number, productType: ProductType | null): number {
  if (productType === 'emoticon' && step > 5) return step - 1;
  return step;
}

export const Stepper: React.FC<StepperProps> = ({ currentStep, productType }) => {
  const labels = productType ? STEPS_LABELS[productType] : STEPS_LABELS.sticker;
  const displayStep = getDisplayStep(currentStep, productType);
  const total = labels.length;

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative max-w-4xl mx-auto px-4">
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10" />
        <div
          className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-green-500 -z-10 transition-all duration-500"
          style={{ width: `${total > 1 ? (displayStep / (total - 1)) * 100 : 0}%` }}
        />

        {labels.map((label, index) => {
          const isCompleted = index < displayStep;
          const isCurrent = index === displayStep;

          return (
            <div key={index} className="flex flex-col items-center">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300
                  ${isCompleted ? 'bg-green-500 text-white' : ''}
                  ${isCurrent ? 'bg-white border-2 border-green-500 text-green-600 scale-125' : ''}
                  ${!isCompleted && !isCurrent ? 'bg-white border-2 border-gray-300 text-gray-400' : ''}
                `}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : index + 1}
              </div>
              <span
                className={`
                  absolute top-10 text-xs font-medium w-24 text-center transition-colors
                  ${isCurrent ? 'text-green-700 font-bold' : 'text-gray-400'}
                  ${isCurrent || isCompleted ? 'opacity-100' : 'opacity-0 md:opacity-100'}
                `}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
