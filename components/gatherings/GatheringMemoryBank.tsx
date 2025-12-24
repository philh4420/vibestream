
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp 
} = Firestore as any;
import { User, Gathering } from '../../types';
import { ICONS } from '../../constants';
import { uploadToCloudinary } from '../../services/cloudinary';

interface GatheringMemoryBankProps {
  gathering: Gathering;
  currentUser: User;
  isAttendee: boolean;
  isOrganizer: boolean;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

interface Memory {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  timestamp: any;
}

export const GatheringMemoryBank: React.FC<GatheringMemoryBankProps> = ({ 
  gathering, 
  currentUser, 
  isAttendee, 
  isOrganizer,
  addToast
}) => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLocked, setIsLocked] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Time Lock Logic
  useEffect(() => {
    const checkLock = () => {
      const now = new Date();
      const eventDate = new Date(gathering.date);
      
      if (now >= eventDate) {
        setIsLocked(false);
      } else {
        setIsLocked(true);
        const diff = eventDate.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
      }
    };

    checkLock();
    const interval = setInterval(checkLock, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [gathering.date]);

  // Sync Memories
  useEffect(() => {
    if (!db || !gathering.id) return;
    
    const q = query(
      collection(db, 'gatherings', gathering.id, 'memories'),
      orderBy('timestamp', 'desc')
    );

    const unsub = onSnapshot(q, (snap: any) => {
      setMemories(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Memory)));
    });

    return () => unsub();
  }, [gathering.id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      addToast("Memory too large (Max 20MB)", "error");
      return;
    }

    setIsUploading(true);
    addToast("Encrypting memory fragment...", "info");

    try {
      const url = await uploadToCloudinary(file);
      await addDoc(collection(db, 'gatherings', gathering.id, 'memories'), {
        authorId: currentUser.id,
        authorName: currentUser.displayName,
        authorAvatar: currentUser.avatarUrl,
        mediaUrl: url,
        mediaType: file.type.startsWith('video/') ? 'video' : 'image',
        timestamp: serverTimestamp()
      });
      addToast("Memory Secured in Bank", "success");
    } catch (err) {
      console.error(err);
      addToast("Upload Protocol Failed", "error");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (isLocked) {
    return (
      <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-center border border-white/10 relative overflow-hidden group">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full" />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6 border border-white/10 shadow-lg">
            <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h3 className="text-2xl font-black text-white uppercase tracking-widest italic mb-2">Memory_Bank_Locked</h3>
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-[0.2em] mb-6">
            Protocol activates in: <span className="text-indigo-400 font-bold">{timeRemaining}</span>
          </p>
          <div className="px-6 py-3 bg-white/5 rounded-xl border border-white/5 text-[9px] font-black text-slate-500 uppercase tracking-widest">
            Awaiting Event Start
          </div>
        </div>
      </div>
    );
  }

  const canUpload = isAttendee || isOrganizer;

  return (
    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-10 shadow-sm relative overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <ICONS.Saved />
            </div>
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] font-mono">Archive_Access</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Memory_Bank</h3>
        </div>

        {canUpload && (
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.3em] shadow-lg hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
          >
            {isUploading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            )}
            INJECT_MEMORY
          </button>
        )}
      </div>

      {/* Grid */}
      {memories.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {memories.map((mem) => (
            <div 
              key={mem.id}
              onClick={() => setSelectedMemory(mem)}
              className="aspect-square rounded-2xl overflow-hidden relative group cursor-pointer border border-slate-100 bg-slate-50"
            >
              {mem.mediaType === 'video' ? (
                <video src={mem.mediaUrl} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
              ) : (
                <img src={mem.mediaUrl} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-transform duration-700 group-hover:scale-110" alt="" />
              )}
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                <div className="flex items-center gap-2">
                  <img src={mem.authorAvatar} className="w-5 h-5 rounded-full border border-white/50" alt="" />
                  <span className="text-[8px] font-black text-white uppercase tracking-widest truncate">{mem.authorName}</span>
                </div>
              </div>

              {mem.mediaType === 'video' && (
                <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-md rounded-md p-1">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
            <ICONS.Create />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono">Bank_Empty</p>
          <p className="text-[9px] text-slate-300 font-bold mt-1">Be the first to synchronize a visual fragment.</p>
        </div>
      )}

      {/* Lightbox */}
      {selectedMemory && (
        <div className="fixed inset-0 z-[5000] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute top-6 right-6 z-20">
            <button onClick={() => setSelectedMemory(null)} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="relative w-full max-w-5xl h-full flex flex-col items-center justify-center">
            {selectedMemory.mediaType === 'video' ? (
              <video src={selectedMemory.mediaUrl} controls autoPlay className="max-w-full max-h-[80vh] rounded-[2rem] shadow-2xl" />
            ) : (
              <img src={selectedMemory.mediaUrl} className="max-w-full max-h-[80vh] rounded-[2rem] shadow-2xl" alt="" />
            )}

            <div className="mt-6 flex items-center gap-4 bg-white/10 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10">
              <img src={selectedMemory.authorAvatar} className="w-10 h-10 rounded-xl object-cover border border-white/20" alt="" />
              <div>
                <p className="text-sm font-black text-white uppercase tracking-tight">{selectedMemory.authorName}</p>
                <p className="text-[9px] font-mono text-white/50 uppercase tracking-widest">
                  Uploaded: {selectedMemory.timestamp?.toDate().toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*,video/*" 
        onChange={handleFileUpload} 
      />
    </div>
  );
};
