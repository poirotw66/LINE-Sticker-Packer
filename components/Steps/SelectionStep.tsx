import React from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent 
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { UploadedImage, StickerCount } from '../../types';
import { Check, GripVertical } from 'lucide-react';

// --- Sortable Item Component ---
interface SortablePhotoProps {
  id: string;
  url: string;
  index: number;
  selected: boolean;
  onRemove: () => void;
}

const SortablePhoto: React.FC<SortablePhotoProps> = ({ id, url, index, selected, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`relative aspect-square bg-white rounded-xl border-2 overflow-hidden shadow-sm group ${selected ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-200'}`}
    >
      <div className="absolute top-2 left-2 z-10 bg-gray-800/70 text-white text-xs px-2 py-0.5 rounded-md backdrop-blur-sm">
        #{String(index + 1).padStart(2, '0')}
      </div>
      
      {/* Drag Handle */}
      <div 
        {...attributes} 
        {...listeners} 
        className="absolute top-2 right-2 z-10 p-1 bg-white/80 rounded cursor-grab hover:bg-white text-gray-500"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      <img src={url} alt="sticker" className="w-full h-full object-contain p-2" />
    </div>
  );
};

// --- Main Selection Component ---

interface SelectionStepProps {
  uploadedImages: UploadedImage[];
  selectedIds: string[];
  targetCount: StickerCount;
  onSelectionChange: (ids: string[]) => void;
}

export const SelectionStep: React.FC<SelectionStepProps> = ({
  uploadedImages,
  selectedIds,
  targetCount,
  onSelectionChange
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Logic: 
  // 1. Show the list of "Selected" items which are sortable.
  // 2. Below, show "Available" items pool. Click to add to selection.

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = selectedIds.indexOf(active.id as string);
      const newIndex = selectedIds.indexOf(over.id as string);
      onSelectionChange(arrayMove(selectedIds, oldIndex, newIndex));
    }
  };

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(sid => sid !== id));
    } else {
      if (selectedIds.length < targetCount) {
        onSelectionChange([...selectedIds, id]);
      }
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Organize Your Sticker Set</h2>
        <p className="text-gray-500 mt-2">
          Selected: <span className={`${selectedIds.length === targetCount ? 'text-green-600 font-bold' : 'text-red-500'}`}>{selectedIds.length}</span> / {targetCount}
        </p>
        <p className="text-sm text-gray-400">Drag to reorder. This order determines the file names (01.png, 02.png...)</p>
      </div>

      {/* Selected Zone (Sortable) */}
      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Final Set Order</h3>
        
        {selectedIds.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-xl">
            Select images from below to add them here
          </div>
        ) : (
          <DndContext 
            sensors={sensors} 
            collisionDetection={closestCenter} 
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={selectedIds} 
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {selectedIds.map((id, index) => {
                  const img = uploadedImages.find(i => i.id === id);
                  if (!img) return null;
                  return (
                    <SortablePhoto 
                      key={id} 
                      id={id} 
                      url={img.url} 
                      index={index} 
                      selected={true}
                      onRemove={() => toggleSelection(id)}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Available Pool */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Available Images</h3>
        <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-3">
          {uploadedImages.map((img) => {
            const isSelected = selectedIds.includes(img.id);
            return (
              <div 
                key={img.id}
                onClick={() => toggleSelection(img.id)}
                className={`
                  relative aspect-square rounded-lg cursor-pointer overflow-hidden border-2 transition-all
                  ${isSelected 
                    ? 'border-green-500 opacity-40 grayscale' 
                    : 'border-transparent hover:border-gray-300 shadow-sm bg-white'
                  }
                `}
              >
                <img src={img.url} alt="available" className="w-full h-full object-contain p-1" />
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-600 font-bold" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};