import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { UploadedImage, StickerCount, AppState, Step } from './types';
import { generateAndDownloadZip } from './services/zipService';

// Components
import { Button } from './components/Button';
import { Stepper } from './components/Layout/Stepper';
import { QuantityStep } from './components/Steps/QuantityStep';
import { UploadStep } from './components/Steps/UploadStep';
import { SelectionStep } from './components/Steps/SelectionStep';
import { EraserStep } from './components/Steps/EraserStep';
import { MainImageStep } from './components/Steps/MainImageStep';
import { TabImageStep } from './components/Steps/TabImageStep';
import { DownloadStep } from './components/Steps/DownloadStep';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const App = () => {
  const [state, setState] = useState<AppState>({
    step: Step.QUANTITY,
    targetCount: null,
    uploadedImages: [],
    selectedImageIds: [],
    mainImageId: null,
    tabImageBlob: null,
    isProcessing: false,
  });

  // --- Handlers ---

  const handleQuantitySelect = (count: StickerCount) => {
    setState(prev => ({ ...prev, targetCount: count, step: prev.step + 1 }));
  };

  const handleUpload = (newImages: UploadedImage[]) => {
    setState(prev => ({ 
      ...prev, 
      uploadedImages: [...prev.uploadedImages, ...newImages] 
    }));
  };

  const handleRemoveImage = (id: string) => {
    setState(prev => {
      const imgToRemove = prev.uploadedImages.find(img => img.id === id);
      if (imgToRemove) {
        URL.revokeObjectURL(imgToRemove.url); // Memory Cleanup
      }

      return {
        ...prev,
        uploadedImages: prev.uploadedImages.filter(img => img.id !== id),
        selectedImageIds: prev.selectedImageIds.filter(sid => sid !== id),
        mainImageId: prev.mainImageId === id ? null : prev.mainImageId
      };
    });
  };

  const handleSelectionChange = (ids: string[]) => {
    setState(prev => ({ ...prev, selectedImageIds: ids }));
  };

  // Called when user saves changes in EraserStep
  const handleImageUpdate = (id: string, newBlob: Blob) => {
    const newUrl = URL.createObjectURL(newBlob);
    
    setState(prev => {
      const newImages = prev.uploadedImages.map(img => {
        if (img.id === id) {
          // Revoke old URL to free memory
          URL.revokeObjectURL(img.url);
          return { ...img, url: newUrl, file: new File([newBlob], img.name, { type: 'image/png' }) };
        }
        return img;
      });
      return { ...prev, uploadedImages: newImages };
    });
  };

  const handleMainImageSelect = (id: string) => {
    setState(prev => ({ ...prev, mainImageId: id }));
  };

  const handleTabConfirm = (blob: Blob) => {
    setState(prev => ({ ...prev, tabImageBlob: blob }));
  };

  const handleDownload = async () => {
    setState(prev => ({ ...prev, isProcessing: true }));
    try {
      await generateAndDownloadZip(state);
    } catch (error) {
      console.error(error);
      alert("Failed to generate ZIP. Please try again.");
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  // --- Navigation & Validation ---

  const canProceed = () => {
    switch (state.step) {
      case Step.QUANTITY:
        return !!state.targetCount;
      case Step.UPLOAD:
        return state.targetCount && state.uploadedImages.length >= state.targetCount;
      case Step.SELECTION:
        return state.selectedImageIds.length === state.targetCount;
      // Eraser step is optional, user can just click next
      case Step.ERASER:
        return true;
      case Step.MAIN_IMAGE:
        return !!state.mainImageId;
      case Step.TAB_IMAGE:
        return !!state.tabImageBlob;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (canProceed()) {
      setState(prev => ({ ...prev, step: prev.step + 1 }));
    }
  };

  const prevStep = () => {
    setState(prev => ({ ...prev, step: Math.max(0, prev.step - 1) }));
  };

  // --- Render Step Content ---

  const renderStep = () => {
    switch (state.step) {
      case Step.QUANTITY:
        return <QuantityStep selected={state.targetCount} onSelect={handleQuantitySelect} />;
      
      case Step.UPLOAD:
        return (
          <UploadStep 
            uploadedImages={state.uploadedImages} 
            onUpload={handleUpload} 
            onRemove={handleRemoveImage}
            targetCount={state.targetCount!}
          />
        );

      case Step.SELECTION:
        return (
          <SelectionStep
            uploadedImages={state.uploadedImages}
            selectedIds={state.selectedImageIds}
            targetCount={state.targetCount!}
            onSelectionChange={handleSelectionChange}
          />
        );

      case Step.ERASER:
        // Only show images that have been selected for the set
        const selectedForEraser = state.selectedImageIds
          .map(id => state.uploadedImages.find(img => img.id === id)!)
          .filter(Boolean);
          
        return (
          <EraserStep 
            images={selectedForEraser}
            onUpdateImage={handleImageUpdate}
          />
        );

      case Step.MAIN_IMAGE:
        const selectedImages = state.selectedImageIds
          .map(id => state.uploadedImages.find(img => img.id === id)!)
          .filter(Boolean);
        
        return (
          <MainImageStep 
            images={selectedImages}
            selectedId={state.mainImageId}
            onSelect={handleMainImageSelect}
          />
        );

      case Step.TAB_IMAGE:
        const pool = state.selectedImageIds.length > 0 
          ? state.selectedImageIds.map(id => state.uploadedImages.find(i => i.id === id)!)
          : state.uploadedImages;

        return (
          <TabImageStep 
            images={pool.filter(Boolean)}
            onConfirm={handleTabConfirm}
            existingBlob={state.tabImageBlob}
          />
        );

      case Step.DOWNLOAD:
        const orderedImages = state.selectedImageIds
          .map(id => state.uploadedImages.find(i => i.id === id)!)
          .filter(Boolean);
          
        return (
          <DownloadStep 
            selectedImages={orderedImages}
            mainImageId={state.mainImageId}
            tabImageBlob={state.tabImageBlob}
            onDownload={handleDownload}
            isProcessing={state.isProcessing}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-green-600 text-white p-2 rounded-lg">
              <Package size={24} />
            </div>
            <h1 className="text-xl font-bold text-gray-800">LINE Sticker Packer</h1>
          </div>
          {state.targetCount && (
            <div className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              Target: {state.targetCount} stickers
            </div>
          )}
        </div>
      </header>

      {/* Progress */}
      <div className="bg-white border-b border-gray-200">
        <Stepper currentStep={state.step} />
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 min-h-[500px]">
          {renderStep()}
        </div>
      </main>

      {/* Footer / Navigation */}
      <footer className="bg-white border-t border-gray-200 p-4 sticky bottom-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Button 
            variant="secondary" 
            onClick={prevStep} 
            disabled={state.step === 0}
            className="w-32"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>

          {state.step < Step.DOWNLOAD && (
            <Button 
              variant="primary" 
              onClick={nextStep} 
              disabled={!canProceed()}
              className="w-32"
            >
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
};

// Helper Icon
const Package = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16.5 9.4 7.5 4.21" />
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

export default App;