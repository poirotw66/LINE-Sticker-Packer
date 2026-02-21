import React, { useState, useMemo, useEffect } from 'react';
import { UploadedImage, ProductType } from '../../types';
import { Download, CheckCircle, Package, Smartphone, List, Sparkles, Copy, Loader2, Settings } from 'lucide-react';
import { Button } from '../Button';
import { generateStickerMetadata, StickerMetadata } from '../../services/aiService';
import { useApiKey } from '../../contexts/ApiKeyContext';

interface DownloadStepProps {
  productType: ProductType;
  selectedImages: UploadedImage[];
  mainImageId: string | null;
  tabImageBlob: Blob | null;
  onDownload: () => void;
  isProcessing: boolean;
  downloadError?: string | null;
  onOpenSettings?: () => void;
}

const COPY_FEEDBACK_MS = 2000;

export const DownloadStep: React.FC<DownloadStepProps> = ({
  productType,
  selectedImages,
  mainImageId,
  tabImageBlob,
  onDownload,
  isProcessing,
  downloadError,
  onOpenSettings
}) => {
  const isSticker = productType === 'sticker';
  const { apiKey: apiKeyFromContext } = useApiKey();
  const [viewMode, setViewMode] = useState<'list' | 'preview'>('list');
  const [aiMetadata, setAiMetadata] = useState<StickerMetadata | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<'zh' | 'en' | null>(null);
  const hasApiKey = !!apiKeyFromContext;

  const mainImage = selectedImages.find(img => img.id === mainImageId);
  const tabImageUrl = useMemo(
    () => (tabImageBlob ? URL.createObjectURL(tabImageBlob) : null),
    [tabImageBlob]
  );
  useEffect(() => {
    return () => {
      if (tabImageUrl) URL.revokeObjectURL(tabImageUrl);
    };
  }, [tabImageUrl]);

  const handleGenerateAI = async () => {
    setIsAiLoading(true);
    setAiError(null);
    try {
      const data = await generateStickerMetadata(apiKeyFromContext, selectedImages, mainImageId, tabImageBlob);
      setAiMetadata(data);
    } catch (err: unknown) {
      console.error(err);
      setAiError(err instanceof Error ? err.message : 'Failed to generate metadata');
    } finally {
      setIsAiLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: 'zh' | 'en') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      window.setTimeout(() => setCopiedField(null), COPY_FEEDBACK_MS);
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn text-center pb-12">
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 max-w-2xl mx-auto">
        <div className="flex justify-center mb-4">
          <div className="bg-green-100 p-4 rounded-full">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-green-800">Ready to Package!</h2>
        <p className="text-green-700 mt-2 text-sm md:text-base">
          {isSticker ? 'Your stickers are sorted, resized, and named correctly.' : 'Your emoticons are sorted, resized, and named correctly.'}
        </p>
      </div>

      {/* View Toggle */}
      <div className="flex justify-center gap-2">
        <button 
          onClick={() => setViewMode('list')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          <List className="w-4 h-4" /> File List
        </button>
        <button 
          onClick={() => setViewMode('preview')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${viewMode === 'preview' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          <Smartphone className="w-4 h-4" /> Chat Simulation
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start justify-center text-left max-w-6xl mx-auto">
        
        {/* Left Column: View Area */}
        <div className="w-full lg:w-1/2">
          {viewMode === 'list' ? (
            <div className="grid grid-cols-1 gap-4">
              {isSticker && (
                <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {mainImage ? (
                      <img src={mainImage.url} alt="Main" className="w-16 h-16 object-contain bg-gray-50 rounded" />
                    ) : (
                      <span className="text-red-500 text-sm">Missing</span>
                    )}
                    <div>
                      <p className="font-bold text-gray-700">Main Image</p>
                      <p className="text-sm font-mono text-gray-500">main.png (240x240)</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Image Summary */}
              <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {tabImageUrl ? (
                    <img src={tabImageUrl} alt="Tab" className="w-16 h-12 object-contain bg-gray-50 rounded" />
                  ) : (
                    <span className="text-red-500 text-sm">Missing</span>
                  )}
                  <div>
                     <p className="font-bold text-gray-700">Tab Image</p>
                     <p className="text-sm font-mono text-gray-500">tab.png (96x74)</p>
                  </div>
                </div>
              </div>

              {/* Content Summary */}
              <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                     <Package className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-700">{isSticker ? 'Stickers' : 'Emoticons'}</p>
                    <p className="text-sm font-mono text-gray-500">01.png - {String(selectedImages.length).padStart(2,'0')}.png</p>
                    <p className="text-xs text-gray-400 mt-1">{selectedImages.length} items</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Chat Simulator */
            <div className="mx-auto w-full max-w-sm bg-[#8cabd9] rounded-3xl border-4 border-gray-800 overflow-hidden shadow-2xl h-[500px] flex flex-col">
              {/* Mock Header */}
              <div className="bg-[#2a384f] p-3 flex items-center justify-between text-white">
                 <div className="text-sm font-bold">Sticker Preview</div>
                 <div className="w-4 h-4 rounded-full bg-green-500"></div>
              </div>
              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                 {selectedImages.map((img, i) => (
                    <div key={img.id} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                      {i % 2 !== 0 && (
                        <div className="w-8 h-8 rounded-full bg-gray-300 mr-2 self-start flex-shrink-0" />
                      )}
                      <div className="max-w-[70%]">
                        <img 
                          src={img.url} 
                          className="w-24 h-24 object-contain"
                          alt="sticker" 
                        />
                      </div>
                    </div>
                 ))}
              </div>
              {/* Fake Input */}
              <div className="bg-white p-2 border-t flex items-center gap-2">
                <div className="bg-gray-100 flex-1 h-8 rounded-full"></div>
                {tabImageUrl && <img src={tabImageUrl} className="w-6 h-6 opacity-50 grayscale" />}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI & Download */}
        <div className="w-full lg:w-1/2 space-y-6">
          
          {/* AI Generator Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6 shadow-sm">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                 <Sparkles className="w-5 h-5 text-indigo-500" />
                 AI Info Generator
               </h3>
               {hasApiKey ? (
                 <button
                  onClick={handleGenerateAI}
                  disabled={isAiLoading}
                  className="text-xs font-bold bg-indigo-600 text-white px-3 py-1.5 rounded-full hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1 transition-colors"
                 >
                   {isAiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                   {isAiLoading ? 'Analyzing...' : 'Generate Text'}
                 </button>
               ) : (
                 <button
                   type="button"
                   onClick={onOpenSettings}
                   className="text-xs text-red-600 bg-red-50 px-2 py-1.5 rounded border border-red-200 hover:bg-red-100 flex items-center gap-1"
                 >
                   <Settings className="w-3 h-3" /> Add API Key
                 </button>
               )}
             </div>

             <p className="text-xs text-indigo-700/70 mb-4">
               Uses <strong>Gemini 2.5 Flash</strong> to analyze your stickers and generate a Title & Description.
             </p>

             {aiError && (
               <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg mb-4">
                 {aiError}
               </div>
             )}

             {aiMetadata ? (
               <div className="space-y-4">
                 {/* Chinese Block */}
                 <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-gray-500 uppercase">Traditional Chinese</span>
                      <button onClick={() => copyToClipboard(aiMetadata.title_zh + "\n" + aiMetadata.desc_zh, 'zh')} className="text-gray-400 hover:text-indigo-600 flex items-center gap-1" title="Copy">
                      <Copy className="w-3 h-3" />
                      {copiedField === 'zh' && <span className="text-[10px] text-green-600 font-medium">Copied!</span>}
                    </button>
                    </div>
                    <div className="mb-2">
                      <label className="text-[10px] text-gray-400 block">Title</label>
                      <input readOnly value={aiMetadata.title_zh} className="w-full text-sm font-medium text-gray-800 bg-transparent outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 block">Description</label>
                      <textarea readOnly rows={2} value={aiMetadata.desc_zh} className="w-full text-xs text-gray-600 bg-transparent outline-none resize-none" />
                    </div>
                 </div>

                 {/* English Block */}
                 <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-gray-500 uppercase">English</span>
                      <button onClick={() => copyToClipboard(aiMetadata.title_en + "\n" + aiMetadata.desc_en, 'en')} className="text-gray-400 hover:text-indigo-600 flex items-center gap-1" title="Copy">
                      <Copy className="w-3 h-3" />
                      {copiedField === 'en' && <span className="text-[10px] text-green-600 font-medium">Copied!</span>}
                    </button>
                    </div>
                    <div className="mb-2">
                      <label className="text-[10px] text-gray-400 block">Title</label>
                      <input readOnly value={aiMetadata.title_en} className="w-full text-sm font-medium text-gray-800 bg-transparent outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 block">Description</label>
                      <textarea readOnly rows={2} value={aiMetadata.desc_en} className="w-full text-xs text-gray-600 bg-transparent outline-none resize-none" />
                    </div>
                 </div>
               </div>
             ) : (
               <div className="h-32 flex items-center justify-center text-center p-4 border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50/50">
                 <p className="text-xs text-indigo-400">
                   Click "Generate Text" to let AI suggest titles and descriptions for your stickers.
                 </p>
               </div>
             )}
          </div>

          <div className="pt-4 border-t">
            {downloadError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                <span role="alert">{downloadError}</span>
              </div>
            )}
            <Button 
              onClick={onDownload} 
              variant="primary" 
              fullWidth
              className="text-lg py-4 shadow-xl hover:shadow-2xl hover:-translate-y-1"
              disabled={isProcessing}
            >
              {isProcessing ? 'Generating ZIP...' : 'Download ZIP Package'}
              {!isProcessing && <Download className="w-6 h-6 ml-2" />}
            </Button>
            <p className="mt-4 text-xs text-gray-400 text-center">
              {isSticker ? 'Downloads line-stickers-pack.zip' : 'Downloads line-emoticons-pack.zip'} for LINE Creators Market.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};