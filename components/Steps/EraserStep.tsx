import React, { useState, useRef, useEffect, useCallback } from 'react';
import { UploadedImage } from '../../types';
import { Eraser, Undo, Save, AlertCircle, Paintbrush, ZoomIn, ZoomOut, Pipette } from 'lucide-react';

type Tool = 'eraser' | 'brush';

function rgbaToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b]
    .map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0'))
    .join('');
}

function parseHexToColor(input: string): string | null {
  const s = input.trim().replace(/^#/, '');
  if (!/^[0-9A-Fa-f]{1,6}$/.test(s)) return null;
  const padded = s.padEnd(6, '0').slice(0, 6);
  return '#' + padded;
}

const CANVAS_BACKGROUNDS = [
  { id: 'checkerboard', label: 'Checkerboard', type: 'checkerboard' as const },
  { id: 'white', label: 'White', type: 'solid' as const, color: '#ffffff' },
  { id: 'black', label: 'Black', type: 'solid' as const, color: '#000000' },
  { id: 'light', label: 'Light gray', type: 'solid' as const, color: '#e5e7eb' },
  { id: 'dark', label: 'Dark gray', type: 'solid' as const, color: '#374151' },
] as const;

interface EraserStepProps {
  images: UploadedImage[];
  onUpdateImage: (id: string, newBlob: Blob) => void;
}

export const EraserStep: React.FC<EraserStepProps> = ({ images, onUpdateImage }) => {
  const [selectedId, setSelectedId] = useState<string>(images[0]?.id || '');
  const [tool, setTool] = useState<Tool>('eraser');
  const [brushSize, setBrushSize] = useState(20);
  const [brushColor, setBrushColor] = useState('#000000');
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [cursorStyle, setCursorStyle] = useState<{ x: number; y: number; radiusPx: number; tool: Tool } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number } | null>(null);
  const [canvasBackground, setCanvasBackground] = useState<string>(CANVAS_BACKGROUNDS[0].id);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [isEyedropperMode, setIsEyedropperMode] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedImage = images.find(i => i.id === selectedId);

  const ZOOM_MIN = 0.25;
  const ZOOM_MAX = 3;
  const ZOOM_STEP = 0.25;

  // Load image onto canvas; reset zoom when image changes
  useEffect(() => {
    if (!selectedImage || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setZoom(1);
    setCanvasSize(null);

    const img = new Image();
    img.src = selectedImage.url;
    img.onload = () => {
      // Set canvas size to match image natural size for max quality
      canvas.width = img.width;
      canvas.height = img.height;
      setCanvasSize({ width: img.width, height: img.height });

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

  // Update circular cursor position and size (in screen pixels) when over canvas
  const updateCursor = (e: React.MouseEvent<HTMLCanvasElement>) => {
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
      tool,
    });
  };

  const hideCursor = () => setCursorStyle(null);

  const applyStroke = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  const sampleColorAt = useCallback((canvasX: number, canvasY: number): void => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const x = Math.floor(Math.max(0, Math.min(canvasRef.current.width - 1, canvasX)));
    const y = Math.floor(Math.max(0, Math.min(canvasRef.current.height - 1, canvasY)));
    const [r, g, b] = Array.from(ctx.getImageData(x, y, 1, 1).data);
    setBrushColor(rgbaToHex(r, g, b));
    setIsEyedropperMode(false);
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (isEyedropperMode) {
      const { x, y } = getCoordinates(e);
      sampleColorAt(x, y);
      return;
    }
    setIsDrawing(true);
    setHasUnsavedChanges(true);
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = brushColor;
      }
      applyStroke(ctx, x, y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (isEyedropperMode || !isDrawing || !canvasRef.current) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = brushColor;
      }
      applyStroke(ctx, x, y);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    draw(e);
    updateCursor(e);
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

  const saveFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSave = () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob((blob) => {
      if (blob && selectedId) {
        if (saveFeedbackTimeoutRef.current) clearTimeout(saveFeedbackTimeoutRef.current);
        onUpdateImage(selectedId, blob);
        setHasUnsavedChanges(false);
        setSaveFeedback(true);
        saveFeedbackTimeoutRef.current = setTimeout(() => {
          setSaveFeedback(false);
          saveFeedbackTimeoutRef.current = null;
        }, 1500);
      }
    }, 'image/png');
  };

  return (
    <div className="space-y-6 animate-fadeIn h-[calc(100vh-250px)] min-h-[500px] flex flex-col">
      <div className="text-center shrink-0">
        <h2 className="text-2xl font-bold text-gray-800">Touch Up & Erase</h2>
        <p className="text-gray-500 mt-1 text-sm">
          Select an image to touch up. Use the eraser to make areas transparent, or the brush to fill in colors.
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
           
           {/* Toolbar: tools can wrap into multiple rows so no horizontal scroll is needed */}
           <div className="bg-white p-3 border-b flex flex-wrap items-center gap-3 shadow-sm z-10 min-h-[3.25rem]">
              <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-3 gap-y-2 pr-2">
                 {/* Tool switch: Eraser / Brush */}
                 <div className="flex rounded-lg border border-gray-200 overflow-hidden flex-shrink-0">
                   <button
                     type="button"
                     onClick={() => setTool('eraser')}
                     className={`flex items-center gap-1 px-2 py-1.5 text-sm font-medium transition-colors ${tool === 'eraser' ? 'bg-gray-200 text-gray-900' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                   >
                     <Eraser className="w-4 h-4" /> Eraser
                   </button>
                   <button
                     type="button"
                     onClick={() => setTool('brush')}
                     className={`flex items-center gap-1 px-2 py-1.5 text-sm font-medium transition-colors ${tool === 'brush' ? 'bg-gray-200 text-gray-900' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                   >
                     <Paintbrush className="w-4 h-4" /> Brush
                   </button>
                 </div>

                 {tool === 'brush' && (
                   <div className="flex items-center gap-1.5 flex-shrink-0">
                     <span className="text-xs font-bold text-gray-500 uppercase hidden sm:inline">Color</span>
                     <button
                       type="button"
                       onClick={() => setColorPickerOpen((o) => !o)}
                       className="w-7 h-7 rounded border-2 border-gray-300 flex-shrink-0 shadow-sm hover:border-gray-400 transition-colors"
                       style={{ backgroundColor: brushColor }}
                       title="Brush color"
                     />
                   </div>
                 )}

                 <div className="flex items-center gap-1.5 flex-shrink-0">
                    {tool === 'eraser' ? <Eraser className="w-4 h-4 text-gray-600 flex-shrink-0" /> : <Paintbrush className="w-4 h-4 text-gray-600 flex-shrink-0" />}
                    <span className="text-xs font-bold text-gray-500 uppercase hidden sm:inline">Size</span>
                    <input 
                      type="range" 
                      min="1" 
                      max="100" 
                      value={brushSize} 
                      onChange={(e) => setBrushSize(parseInt(e.target.value))}
                      className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer flex-shrink-0"
                    />
                    <div 
                      className="w-5 h-5 rounded-full border border-gray-300 flex-shrink-0"
                      style={{
                        width: Math.min(brushSize / 2, 20),
                        height: Math.min(brushSize / 2, 20),
                        backgroundColor: tool === 'brush' ? brushColor : 'rgb(156, 163, 175)',
                      }}
                    />
                 </div>

                 <div className="h-5 w-px bg-gray-200 flex-shrink-0 hidden sm:block" />

                 {/* Zoom */}
                 <div className="flex items-center gap-0.5 flex-shrink-0">
                   <button
                     type="button"
                     onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))}
                     className="p-1 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                     disabled={zoom <= ZOOM_MIN}
                     title="Zoom out"
                   >
                     <ZoomOut className="w-4 h-4" />
                   </button>
                   <span className="text-xs font-medium text-gray-600 min-w-[2.5rem] text-center">
                     {Math.round(zoom * 100)}%
                   </span>
                   <button
                     type="button"
                     onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))}
                     className="p-1 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                     disabled={zoom >= ZOOM_MAX}
                     title="Zoom in"
                   >
                     <ZoomIn className="w-4 h-4" />
                   </button>
                 </div>

                 <div className="h-5 w-px bg-gray-200 flex-shrink-0 hidden sm:block" />

                 {/* Background swatches only (no label to save space) */}
                 <div className="flex rounded-lg border border-gray-200 p-0.5 bg-white flex-shrink-0" title="Background">
                   {CANVAS_BACKGROUNDS.map((bg) => (
                     <button
                       key={bg.id}
                       type="button"
                       onClick={() => setCanvasBackground(bg.id)}
                       title={bg.label}
                       className={`rounded-md p-0.5 border-2 transition-all ${
                         canvasBackground === bg.id ? 'border-gray-700 shadow-sm' : 'border-transparent hover:border-gray-300'
                       }`}
                     >
                       {bg.type === 'checkerboard' ? (
                         <span
                           className="block w-5 h-5 rounded-sm"
                           style={{
                             backgroundImage: `
                               linear-gradient(45deg, #e5e7eb 25%, transparent 25%),
                               linear-gradient(-45deg, #e5e7eb 25%, transparent 25%),
                               linear-gradient(45deg, transparent 75%, #e5e7eb 75%),
                               linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)
                             `,
                             backgroundSize: '5px 5px',
                             backgroundPosition: '0 0, 0 2.5px, 2.5px -2.5px, -2.5px 0',
                             backgroundColor: '#d1d5db',
                           }}
                         />
                       ) : (
                         <span
                           className="block w-5 h-5 rounded-sm border border-gray-300"
                           style={{ backgroundColor: bg.color }}
                         />
                       )}
                     </button>
                   ))}
                 </div>

                 <div className="h-5 w-px bg-gray-200 flex-shrink-0 hidden sm:block" />

                 <button 
                   onClick={handleUndo}
                   disabled={history.length <= 1}
                   className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                 >
                   <Undo className="w-4 h-4" /> Undo
                 </button>
              </div>

              <div className="flex-shrink-0 flex items-center gap-2">
                {saveFeedback && (
                  <span className="text-sm font-medium text-green-600 animate-fadeIn">Saved</span>
                )}
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
                  <Save className="w-4 h-4" /> Save
                </button>
              </div>
           </div>

           {tool === 'brush' && colorPickerOpen && (
             <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-4 z-10">
               <div className="flex items-center gap-3">
                 <div
                   className="w-8 h-8 rounded border-2 border-gray-300 shadow-sm"
                   style={{ backgroundColor: brushColor }}
                 />
                 <div className="flex items-center gap-2">
                   <label className="text-xs text-gray-500 flex-shrink-0">Hex</label>
                   <input
                     type="text"
                     value={brushColor}
                     onChange={(e) => {
                       const next = parseHexToColor(e.target.value);
                       if (next) setBrushColor(next);
                     }}
                     className="px-2 py-1 text-sm border border-gray-300 rounded font-mono w-28"
                     placeholder="#000000"
                   />
                 </div>
               </div>
               <div className="flex items-center gap-2">
                 <button
                   type="button"
                   onClick={() => {
                     setColorPickerOpen(false);
                     setIsEyedropperMode(true);
                   }}
                   className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                 >
                   <Pipette className="w-4 h-4" />
                   Pick from image
                 </button>
                 <input
                   type="color"
                   value={brushColor}
                   onChange={(e) => setBrushColor(e.target.value)}
                   className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0"
                   title="Open system color picker"
                 />
                 <button
                   type="button"
                   onClick={() => setColorPickerOpen(false)}
                   className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                 >
                   Close
                 </button>
               </div>
             </div>
           )}

           {/* Eyedropper mode hint */}
           {isEyedropperMode && selectedImage && (
             <div className="bg-blue-600 text-white text-sm font-medium py-1.5 px-3 text-center shrink-0">
               Click on the image to pick a color
             </div>
           )}

           {/* Canvas Container: switchable background to verify transparency */}
           <div 
             ref={containerRef}
             className="flex-1 overflow-auto flex items-center justify-center p-4 relative min-h-0"
             style={(() => {
               const preset = CANVAS_BACKGROUNDS.find((b) => b.id === canvasBackground);
               if (preset?.type === 'solid' && preset.color) {
                 return { backgroundColor: preset.color };
               }
               return {
                 backgroundImage: `
                   linear-gradient(45deg, #e5e7eb 25%, transparent 25%),
                   linear-gradient(-45deg, #e5e7eb 25%, transparent 25%),
                   linear-gradient(45deg, transparent 75%, #e5e7eb 75%),
                   linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)
                 `,
                 backgroundSize: '16px 16px',
                 backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                 backgroundColor: '#d1d5db',
               };
             })()}
           >
              {selectedImage ? (
                <>
                  <div
                    className="touch-none select-none inline-block origin-center"
                    style={{
                      width: canvasSize ? canvasSize.width * zoom : 0,
                      height: canvasSize ? canvasSize.height * zoom : 0,
                      minWidth: 0,
                      minHeight: 0,
                    }}
                  >
                    <canvas
                      ref={canvasRef}
                      onMouseDown={startDrawing}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseUp={stopDrawing}
                      onMouseLeave={() => { stopDrawing(); hideCursor(); }}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="block w-full h-full"
                      style={{
                        cursor: isEyedropperMode ? 'crosshair' : cursorStyle ? 'none' : 'crosshair',
                        boxShadow: '0 0 0 2px rgba(0,0,0,0.15), 0 0 0 4px rgba(255,255,255,0.6)',
                        borderRadius: '2px',
                      }}
                    />
                  </div>
                  {/* Circular cursor showing current brush size; hide when picking color */}
                  {cursorStyle && !isEyedropperMode && (
                    <div
                      className="pointer-events-none absolute rounded-full border-2 border-gray-600"
                      style={{
                        left: cursorStyle.x,
                        top: cursorStyle.y,
                        width: cursorStyle.radiusPx * 2,
                        height: cursorStyle.radiusPx * 2,
                        marginLeft: -cursorStyle.radiusPx,
                        marginTop: -cursorStyle.radiusPx,
                        backgroundColor: cursorStyle.tool === 'brush' ? brushColor : 'transparent',
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