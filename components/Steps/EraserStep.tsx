import React, { useState, useRef, useEffect } from 'react';
import { UploadedImage } from '../../types';
import { Eraser, Undo, Save, ZoomIn, AlertCircle } from 'lucide-react';

interface EraserStepProps {
  images: UploadedImage[];
  onUpdateImage: (id: string, newBlob: Blob) => void;
}

export const EraserStep: React.FC<EraserStepProps> = ({ images, onUpdateImage }) => {
  const [selectedId, setSelectedId] = useState<string>(images[0]?.id || '');
  const [brushSize, setBrushSize] = useState(20);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [cursorStyle, setCursorStyle] = useState<{ x: number; y: number; radiusPx: number } | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedImage = images.find(i => i.id === selectedId);

  // Load image onto canvas
  useEffect(() => {
    if (!selectedImage || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = selectedImage.url;
    img.onload = () => {
      // Set canvas size to match image natural size for max quality
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      // Save initial state to history
      setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
      setHasUnsavedChanges(false);
    };
  }, [selectedId]);

  // Handle Eraser Logic
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate scaling factor between display size (CSS) and actual size (Attribute)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  // Update circular eraser cursor position and size (in screen pixels) when over canvas
  const updateEraserCursor = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !containerRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    const scale = rect.width / canvas.width;
    const radiusPx = (brushSize / 2) * scale;
    setCursorStyle({
      x: e.clientX - containerRect.left,
      y: e.clientY - containerRect.top,
      radiusPx: Math.max(4, radiusPx),
    });
  };

  const hideEraserCursor = () => setCursorStyle(null);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    setHasUnsavedChanges(true);
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.globalCompositeOperation = 'destination-out'; // This makes it an eraser (transparency)
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    draw(e);
    updateEraserCursor(e);
  };

  const stopDrawing = () => {
    if (isDrawing && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        // Save state for Undo
        const newState = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
        setHistory(prev => [...prev.slice(-9), newState]); // Keep last 10 steps
      }
    }
    setIsDrawing(false);
  };

  const handleUndo = () => {
    if (history.length <= 1 || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      const newHistory = [...history];
      newHistory.pop(); // Remove current state
      const previousState = newHistory[newHistory.length - 1];
      ctx.putImageData(previousState, 0, 0);
      setHistory(newHistory);
    }
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob((blob) => {
      if (blob && selectedId) {
        onUpdateImage(selectedId, blob);
        setHasUnsavedChanges(false);
        // Visual feedback could go here
      }
    }, 'image/png');
  };

  return (
    <div className="space-y-6 animate-fadeIn h-[calc(100vh-250px)] min-h-[500px] flex flex-col">
      <div className="text-center shrink-0">
        <h2 className="text-2xl font-bold text-gray-800">Touch Up & Erase</h2>
        <p className="text-gray-500 mt-1 text-sm">
          Select an image to remove unwanted borders or specks. Use the eraser tool to make areas transparent.
        </p>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Sidebar: Image List */}
        <div className="w-24 md:w-32 overflow-y-auto border-r pr-2 shrink-0 scrollbar-thin">
           <div className="space-y-2">
             {images.map((img, idx) => (
               <button
                 key={img.id}
                 onClick={() => {
                   if (hasUnsavedChanges) {
                     if (confirm("You have unsaved changes. Discard them?")) {
                        setSelectedId(img.id);
                     }
                   } else {
                     setSelectedId(img.id);
                   }
                 }}
                 className={`
                   relative w-full aspect-square rounded-lg border-2 transition-all p-1
                   ${selectedId === img.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}
                 `}
               >
                 <span className="absolute top-0 left-0 bg-gray-800/60 text-white text-[10px] px-1 rounded-br">{String(idx + 1).padStart(2, '0')}</span>
                 <img src={img.url} alt="thumb" className="w-full h-full object-contain" />
               </button>
             ))}
           </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col bg-gray-50 rounded-xl border border-gray-200 overflow-hidden relative">
           
           {/* Toolbar */}
           <div className="bg-white p-3 border-b flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                    <Eraser className="w-5 h-5 text-gray-600" />
                    <span className="text-xs font-bold text-gray-500 uppercase">Size</span>
                    <input 
                      type="range" 
                      min="5" 
                      max="100" 
                      value={brushSize} 
                      onChange={(e) => setBrushSize(parseInt(e.target.value))}
                      className="w-24 md:w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div 
                      className="w-6 h-6 rounded-full border border-gray-300 bg-gray-400 flex-shrink-0"
                      style={{ width: brushSize / 2, height: brushSize / 2, maxHeight: 24, maxWidth: 24 }}
                    />
                 </div>
                 
                 <div className="h-6 w-px bg-gray-200 mx-2"></div>

                 <button 
                   onClick={handleUndo}
                   disabled={history.length <= 1}
                   className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                 >
                   <Undo className="w-4 h-4" /> Undo
                 </button>
              </div>

              <button 
                onClick={handleSave}
                disabled={!hasUnsavedChanges}
                className={`
                  flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all
                  ${hasUnsavedChanges 
                    ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
                `}
              >
                <Save className="w-4 h-4" /> Save Changes
              </button>
           </div>

           {/* Canvas Container: checkerboard = non-image (transparent) area; canvas has border to separate image */}
           <div 
             ref={containerRef}
             className="flex-1 overflow-auto flex items-center justify-center p-4 relative min-h-0"
             style={{
                backgroundImage: `
                  linear-gradient(45deg, #e5e7eb 25%, transparent 25%), 
                  linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), 
                  linear-gradient(45deg, transparent 75%, #e5e7eb 75%), 
                  linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)
                `,
                backgroundSize: '16px 16px',
                backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                backgroundColor: '#d1d5db',
             }}
           >
              {selectedImage ? (
                <>
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={stopDrawing}
                    onMouseLeave={() => { stopDrawing(); hideEraserCursor(); }}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="max-w-full max-h-full touch-none select-none"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      cursor: cursorStyle ? 'none' : 'crosshair',
                      boxShadow: '0 0 0 2px rgba(0,0,0,0.15), 0 0 0 4px rgba(255,255,255,0.6)',
                      borderRadius: '2px',
                    }}
                  />
                  {/* Circular eraser cursor showing current brush size */}
                  {cursorStyle && (
                    <div
                      className="pointer-events-none absolute border-2 border-gray-600 rounded-full bg-transparent"
                      style={{
                        left: cursorStyle.x,
                        top: cursorStyle.y,
                        width: cursorStyle.radiusPx * 2,
                        height: cursorStyle.radiusPx * 2,
                        marginLeft: -cursorStyle.radiusPx,
                        marginTop: -cursorStyle.radiusPx,
                      }}
                    />
                  )}
                </>
              ) : (
                <div className="text-gray-400 flex flex-col items-center">
                  <AlertCircle className="w-8 h-8 mb-2" />
                  <p>No image selected</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};