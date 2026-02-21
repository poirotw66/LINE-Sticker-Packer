import React, { useState, useRef, useEffect } from 'react';
import { UploadedImage } from '../../types';
import { Move, ZoomIn, RefreshCw } from 'lucide-react';
import { TAB_SPEC } from '../../constants';

interface TabImageStepProps {
  images: UploadedImage[];
  onConfirm: (blob: Blob) => void;
  existingBlob: Blob | null;
}

export const TabImageStep: React.FC<TabImageStepProps> = ({ images, onConfirm, existingBlob }) => {
  const [selectedSourceId, setSelectedSourceId] = useState<string>(images[0]?.id || '');
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const imageRef = useRef<HTMLImageElement>(null);

  // Constants for crop box (display size)
  const DISPLAY_SCALE = 3; 
  const CROP_W = TAB_SPEC.width * DISPLAY_SCALE; // 288
  const CROP_H = TAB_SPEC.height * DISPLAY_SCALE; // 222

  useEffect(() => {
    if (existingBlob) {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(existingBlob);
      });
    }
    return () => {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [existingBlob]);

  // --- Improved Dragging Logic (Global Event Listeners) ---

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // Prevent image dragging default behavior
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  useEffect(() => {
    const handleWindowMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
      
      setPosition({
        x: clientX - dragStart.x,
        y: clientY - dragStart.y
      });
    };

    const handleWindowUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleWindowMove);
      window.addEventListener('mouseup', handleWindowUp);
      window.addEventListener('touchmove', handleWindowMove);
      window.addEventListener('touchend', handleWindowUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleWindowMove);
      window.removeEventListener('mouseup', handleWindowUp);
      window.removeEventListener('touchmove', handleWindowMove);
      window.removeEventListener('touchend', handleWindowUp);
    };
  }, [isDragging, dragStart]);


  const generateCrop = async () => {
    if (!imageRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = TAB_SPEC.width;
    canvas.height = TAB_SPEC.height;
    const ctx = canvas.getContext('2d');
    
    if (ctx && imageRef.current) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const img = imageRef.current;
      
      const outputScale = 1 / DISPLAY_SCALE;
      const drawX = position.x * outputScale;
      const drawY = position.y * outputScale;
      const drawW = img.width * scale * outputScale;
      const drawH = img.height * scale * outputScale;

      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      canvas.toBlob((blob) => {
        if (blob) {
          onConfirm(blob);
          setPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(blob);
          });
        }
      }, 'image/png');
    }
  };

  // Reset position when image changes
  useEffect(() => {
    setPosition({ x: 0, y: 0 });
    setScale(1);
  }, [selectedSourceId]);

  const selectedImage = images.find(i => i.id === selectedSourceId);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Create Chat Tab Image</h2>
        <p className="text-gray-500 mt-2">
          Crop one of your stickers to be the small icon (96x74) used in the chat tab.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 mt-6">
        {/* Source Selector */}
        <div className="lg:w-1/4 h-96 overflow-y-auto border rounded-xl p-2 bg-white scrollbar-thin">
          <p className="text-xs font-bold text-gray-400 uppercase mb-2 px-2">Select Source</p>
          <div className="grid grid-cols-3 lg:grid-cols-2 gap-2">
            {images.map(img => (
              <button 
                key={img.id}
                onClick={() => setSelectedSourceId(img.id)}
                className={`p-1 rounded border-2 ${selectedSourceId === img.id ? 'border-green-500 bg-green-50' : 'border-transparent hover:border-gray-200'}`}
              >
                <img src={img.url} className="w-full h-auto" alt="thumb" />
              </button>
            ))}
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col items-center">
          <div 
            className="relative overflow-hidden bg-gray-100 border-2 border-gray-300 shadow-inner group"
            style={{ width: CROP_W, height: CROP_H, cursor: isDragging ? 'grabbing' : 'grab' }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
          >
            {selectedImage && (
              <img 
                ref={imageRef}
                src={selectedImage.url}
                alt="Crop Target"
                draggable={false}
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transformOrigin: 'top left',
                  maxWidth: 'none',
                  pointerEvents: 'none' // Let events pass to container
                }}
              />
            )}
            
            {/* Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none border border-black/10 grid grid-cols-3 grid-rows-3 z-10">
              <div className="border-r border-b border-black/10"></div>
              <div className="border-r border-b border-black/10"></div>
              <div className="border-b border-black/10"></div>
              <div className="border-r border-b border-black/10"></div>
              <div className="border-r border-b border-black/10"></div>
              <div className="border-b border-black/10"></div>
              <div className="border-r border-black/10"></div>
              <div className="border-r border-black/10"></div>
              <div></div>
            </div>
            
            {!isDragging && (
               <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                  <Move className="text-white/80 w-8 h-8 drop-shadow-md" />
               </div>
            )}

            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded pointer-events-none z-20">
              Tab Preview Area
            </div>
          </div>

          {/* Controls */}
          <div className="w-full max-w-md mt-6 space-y-4 px-4">
            <div className="flex items-center gap-4">
              <ZoomIn className="text-gray-500 w-5 h-5" />
              <input 
                type="range" 
                min="0.1" 
                max="3" 
                step="0.1" 
                value={scale} 
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs font-mono w-10 text-right">{scale.toFixed(1)}x</span>
            </div>
            
            <div className="flex justify-center gap-4">
               <button 
                onClick={() => { setScale(1); setPosition({x:0, y:0}); }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <RefreshCw className="w-4 h-4" /> Reset
              </button>
              <button 
                onClick={generateCrop}
                className="px-6 py-2 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 shadow-sm"
              >
                Generate Preview
              </button>
            </div>
          </div>
        </div>

        {/* Result Preview */}
        <div className="lg:w-1/4 flex flex-col items-center justify-start border-l pl-4">
          <p className="text-sm font-bold text-gray-500 mb-4">Actual Output (96x74)</p>
          {previewUrl ? (
            <div className="p-4 bg-gray-200 rounded-lg border border-gray-300">
              <img src={previewUrl} alt="Result" style={{ width: 96, height: 74 }} className="bg-white" />
            </div>
          ) : (
            <div className="w-24 h-20 bg-gray-100 rounded border border-dashed flex items-center justify-center text-gray-400 text-xs text-center">
              Click Generate
            </div>
          )}
          <p className="mt-4 text-xs text-gray-400 text-center">
            This is how it will look in the LINE sticker shop tab.
          </p>
        </div>
      </div>
    </div>
  );
};