import React, { useRef, useCallback } from 'react';
import { UploadCloud, Trash2, AlertCircle, FolderOpen } from 'lucide-react';
import { UploadedImage, StickerCount } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { collectImageFilesFromDataTransfer } from '../../utils/collectDroppedImageFiles';

function sortImageFiles(files: File[]): File[] {
  return [...files].sort((a, b) => {
    const pa = (a as File & { webkitRelativePath?: string }).webkitRelativePath ?? a.name;
    const pb = (b as File & { webkitRelativePath?: string }).webkitRelativePath ?? b.name;
    return pa.localeCompare(pb, undefined, { sensitivity: 'base', numeric: true });
  });
}

interface UploadStepProps {
  uploadedImages: UploadedImage[];
  onUpload: (newImages: UploadedImage[]) => void;
  onRemove: (id: string) => void;
  targetCount: StickerCount;
}

export const UploadStep: React.FC<UploadStepProps> = ({ 
  uploadedImages, 
  onUpload, 
  onRemove,
  targetCount
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    (files: File[]) => {
      const validFiles = sortImageFiles(files.filter((f) => f.type.startsWith('image/')));
      const newImages: UploadedImage[] = validFiles.map((file) => ({
        id: uuidv4(),
        url: URL.createObjectURL(file),
        file,
        name: file.name,
      }));
      onUpload(newImages);
    },
    [onUpload]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
    e.target.value = '';
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const files = await collectImageFilesFromDataTransfer(e.dataTransfer);
      if (files.length > 0) processFiles(files);
    },
    [processFiles]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const remaining = Math.max(0, targetCount - uploadedImages.length);
  const isEnough = uploadedImages.length >= targetCount;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Upload Your Artwork</h2>
        <p className="text-gray-500 mt-2">
          Target: <span className="font-bold text-green-600">{targetCount}</span> stickers. 
          {uploadedImages.length > 0 && (
            <span className="ml-2 text-sm">
              (Current: {uploadedImages.length})
            </span>
          )}
        </p>
      </div>

      {/* Drop Zone */}
      <div 
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center justify-center hover:border-green-500 hover:bg-green-50 transition-colors group"
      >
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center cursor-pointer bg-transparent border-0 p-0 text-inherit"
        >
          <UploadCloud className="w-12 h-12 text-gray-400 group-hover:text-green-500 mb-4 transition-colors" />
          <p className="text-lg font-medium text-gray-700">Click or drag images here</p>
          <p className="text-sm text-gray-400 mt-1">PNG, JPG — drag a folder to add all images inside (including subfolders).</p>
        </button>
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-sm font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200 hover:bg-green-100"
          >
            Choose files
          </button>
          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            className="text-sm font-medium text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 inline-flex items-center gap-1.5"
          >
            <FolderOpen className="w-4 h-4" />
            Choose folder
          </button>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          multiple 
          accept="image/*"
          onChange={handleFileChange}
        />
        <input
          type="file"
          ref={folderInputRef}
          className="hidden"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          {...({ webkitdirectory: '', directory: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      </div>

      {/* Warning if not enough */}
      {!isEnough && uploadedImages.length > 0 && (
        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-4 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <span>You need {remaining} more images to proceed properly.</span>
        </div>
      )}

      {/* Preview Grid */}
      {uploadedImages.length > 0 && (
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 mt-8">
          {uploadedImages.map((img) => (
            <div key={img.id} className="relative group aspect-square bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <img src={img.url} alt="preview" className="w-full h-full object-contain p-2" />
              <button 
                onClick={(e) => { e.stopPropagation(); onRemove(img.id); }}
                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
