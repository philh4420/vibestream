import React, { useState, useRef, useEffect } from 'react';
import { User } from '../../types';
import { ICONS } from '../../constants';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { collection, addDoc, serverTimestamp } = Firestore as any;
import { uploadToCloudinary } from '../../services/cloudinary';
import { EmojiPicker } from '../ui/EmojiPicker';
import { GiphyPicker } from '../ui/GiphyPicker';
import { GiphyGif } from '../../services/giphy';

interface CreateSignalBoxProps {
  userData: User | null;
  onOpen?: (initialAction?: 'media' | 'gif') => void; // Kept for compatibility if needed
  onFileSelect?: (file: File) => void;
}

export const CreateSignalBox: React.FC<CreateSignalBoxProps> = ({ userData, onOpen }) => {
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  
  // Attachments
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [selectedGif, setSelectedGif] = useState<GiphyGif | null>(null);
  
  // Pickers
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFocus = () => {
    setIsExpanded(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
      
      // Generate previews
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setMediaPreviews(prev => [...prev, ...newPreviews]);
      
      // Clear GIF if regular media is selected (mutually exclusive usually for simplicity)
      setSelectedGif(null);
      setIsExpanded(true);
    }
  };

  const removeMedia = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeGif = () => {
    setSelectedGif(null);
  };

  const handleGifSelect = (gif: GiphyGif) => {
    setSelectedGif(gif);
    setShowGifPicker(false);
    // Clear other media
    setSelectedFiles([]);
    setMediaPreviews([]);
    setIsExpanded(true);
  };

  const handleEmojiSelect = (emoji: string) => {
    setContent(prev => prev + emoji);
    // Keep picker open or close it? Let's keep it open for multiple
  };

  const handlePost = async () => {
    if ((!content.trim() && selectedFiles.length === 0 && !selectedGif) || !userData || !db) return;

    setIsPosting(true);
    const mediaItems: { type: 'image' | 'video'; url: string }[] = [];

    try {
      // 1. Upload Files
      if (selectedFiles.length > 0) {
        window.dispatchEvent(new CustomEvent('vibe-toast', { detail: { msg: `Uploading ${selectedFiles.length} artifacts...`, type: 'info' } }));
        const uploadPromises = selectedFiles.map(file => uploadToCloudinary(file));
        const urls = await Promise.all(uploadPromises);
        
        urls.forEach((url, index) => {
          mediaItems.push({
            type: selectedFiles[index].type.startsWith('video/') ? 'video' : 'image',
            url: url
          });
        });
      }

      // 2. Handle GIF
      if (selectedGif) {
        mediaItems.push({
          type: 'image',
          url: selectedGif.images.original.url
        });
      }

      // 3. Create Post
      await addDoc(collection(db, 'posts'), {
        authorId: userData.id,
        authorName: userData.displayName,
        authorAvatar: userData.avatarUrl,
        content: content.trim(),
        contentLengthTier: content.length > 280 ? 'deep' : 'standard',
        media: mediaItems,
        likes: 0,
        comments: 0,
        shares: 0,
        createdAt: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        timestamp: serverTimestamp(),
        likedBy: []
      });

      // 4. Reset
      setContent('');
      setSelectedFiles([]);
      setMediaPreviews([]);
      setSelectedGif(null);
      setIsExpanded(false);
      setShowEmojiPicker(false);
      setShowGifPicker(false);
      
      window.dispatchEvent(new CustomEvent('vibe-toast', { detail: { msg: "Signal Broadcasted Successfully", type: 'success' } }));

    } catch (error) {
      console.error(error);
      window.dispatchEvent(new CustomEvent('vibe-toast', { detail: { msg: "Broadcast Failed: Uplink Error", type: 'error' } }));
    } finally {
      setIsPosting(false);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  return (
    <div className={`bg-white dark:bg-slate-900 border-precision rounded-[3rem] p-6 md:p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.08)] transition-all duration-500 group relative z-20 ${isExpanded ? 'ring-2 ring-indigo-500/20' : ''}`}>
      
      {/* Top Input Area */}
      <div className="flex gap-6">
        <div className="relative shrink-0">
          <img 
            src={userData?.avatarUrl} 
            className="w-12 h-12 md:w-16 md:h-16 rounded-[1.4rem] object-cover shadow-md ring-1 ring-slate-100 dark:ring-slate-800" 
            alt="My Node" 
          />
          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse shadow-sm" />
        </div>
        
        <div className="flex-1 pt-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={handleFocus}
            placeholder={`Initiate a new signal, ${userData?.displayName.split(' ')[0]}...`}
            className="w-full bg-transparent border-none text-slate-900 dark:text-white font-medium text-lg placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-0 resize-none overflow-hidden min-h-[60px]"
            rows={1}
          />
        </div>
      </div>

      {/* Media Previews */}
      {(mediaPreviews.length > 0 || selectedGif) && (
        <div className="mt-6 mb-4 pl-[calc(4rem+1.5rem)]">
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
            {mediaPreviews.map((url, idx) => (
              <div key={idx} className="relative shrink-0 group/media">
                <img src={url} className="h-32 w-32 object-cover rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm" alt="Preview" />
                <button 
                  onClick={() => removeMedia(idx)}
                  className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md hover:bg-rose-600 transition-all opacity-0 group-hover/media:opacity-100"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
            {selectedGif && (
              <div className="relative shrink-0 group/media">
                <img src={selectedGif.images.fixed_height.url} className="h-32 w-auto object-cover rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm" alt="GIF" />
                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">GIF</div>
                <button 
                  onClick={removeGif}
                  className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md hover:bg-rose-600 transition-all opacity-0 group-hover/media:opacity-100"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Toolbar (Visible on Expand) */}
      {isExpanded && (
        <div className="mt-4 pl-[calc(4rem+1.5rem)] flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
          
          <div className="flex items-center gap-1">
            {/* Media Upload */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              title="Upload Media"
            >
              <div className="scale-90"><ICONS.Create /></div>
            </button>
            
            {/* GIF Picker */}
            <button 
              onClick={() => { setShowGifPicker(!showGifPicker); setShowEmojiPicker(false); }}
              className={`p-2.5 rounded-xl transition-colors ${showGifPicker ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400' : 'hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
              title="Add GIF"
            >
              <span className="text-[10px] font-black font-mono">GIF</span>
            </button>

            {/* Emoji Picker */}
            <button 
              onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); }}
              className={`p-2.5 rounded-xl transition-colors ${showEmojiPicker ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400' : 'hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
              title="Add Emoji"
            >
              <span className="text-xl leading-none">😊</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
             {content.length > 280 && (
                <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest font-mono">Deep_Signal</span>
             )}
             
             <button 
                onClick={handlePost}
                disabled={isPosting || (!content.trim() && selectedFiles.length === 0 && !selectedGif)}
                className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 dark:hover:bg-indigo-400 dark:hover:text-white transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
             >
                {isPosting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    SENDING...
                  </>
                ) : (
                  <>
                    BROADCAST
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  </>
                )}
             </button>
          </div>
        </div>
      )}

      {/* FIXED PICKERS (Z-Index fix for clipping issues) */}
      {(showEmojiPicker || showGifPicker) && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-transparent" onClick={() => { setShowEmojiPicker(false); setShowGifPicker(false); }} />
          <div className="relative animate-in zoom-in-95 duration-300">
            {showEmojiPicker && <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />}
            {showGifPicker && <GiphyPicker onSelect={handleGifSelect} onClose={() => setShowGifPicker(false)} />}
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        multiple 
        accept="image/*,video/*" 
        onChange={handleFileSelect} 
      />
    </div>
  );
};