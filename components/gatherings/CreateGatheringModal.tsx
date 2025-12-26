
import React, { useState, useRef } from 'react';
import { User, Gathering } from '../../types';
import { ICONS } from '../../constants';
import { uploadToCloudinary } from '../../services/cloudinary';

interface CreateGatheringModalProps {
  currentUser: User;
  onClose: () => void;
  onConfirm: (data: any, updateSeries?: boolean) => void;
  initialData?: Gathering;
}

export const CreateGatheringModal: React.FC<CreateGatheringModalProps> = ({ currentUser, onClose, onConfirm, initialData }) => {
  const [formData, setFormData] = useState(() => {
    if (initialData) {
      const d = new Date(initialData.date);
      // Format time as HH:MM safely
      const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      return {
        title: initialData.title,
        description: initialData.description,
        date: d.toISOString().split('T')[0],
        time: timeStr,
        location: initialData.location,
        type: initialData.type,
        category: initialData.category,
        coverUrl: initialData.coverUrl,
        maxAttendees: initialData.maxAttendees || 0,
        recurrence: initialData.recurrence || 'none'
      };
    }
    return {
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      type: 'physical' as 'physical' | 'virtual',
      category: 'Social' as 'Social' | 'Tech' | 'Gaming' | 'Nightlife' | 'Workshop',
      coverUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2000',
      maxAttendees: 0,
      recurrence: 'none' as 'none' | 'weekly' | 'monthly'
    };
  });

  const [isUploading, setIsUploading] = useState(false);
  const [updateSeries, setUpdateSeries] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setFormData(prev => ({ ...prev, coverUrl: url }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.date || !formData.time) return;
    // Combine date and time into ISO string
    const combinedDate = new Date(`${formData.date}T${formData.time}`);
    onConfirm({
      ...formData,
      maxAttendees: formData.maxAttendees > 0 ? parseInt(formData.maxAttendees as any) : null,
      date: combinedDate.toISOString()
    }, updateSeries);
  };

  const isEditing = !!initialData;
  const isRecurring = initialData?.recurrence && initialData.recurrence !== 'none';
  const isVideoCover = formData.coverUrl?.match(/\.(mp4|webm|mov)$/i) || formData.coverUrl?.includes('/video/upload/');

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-[3.5rem] p-10 shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-8 shrink-0">
           <div>
             <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none">{isEditing ? 'Update_Protocol' : 'Initiate_Gathering'}</h2>
             <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] font-mono mt-2">Protocol Layer v4.0</p>
           </div>
           <button onClick={onClose} className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all active:scale-90"><svg className="w-6 h-6 text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar scroll-container space-y-6 px-1">
           {/* Step 1: Visual & Core Info */}
           <div className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative h-48 w-full rounded-[2.5rem] overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer group border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition-colors"
              >
                 {isVideoCover ? (
                    <video 
                      src={formData.coverUrl} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100" 
                      muted loop autoPlay playsInline 
                    />
                 ) : (
                    <img src={formData.coverUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100" alt="" />
                 )}
                 
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-3 rounded-2xl shadow-lg flex items-center gap-3">
                       <ICONS.Create />
                       <span className="text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-white">{isUploading ? 'UPLOADING...' : 'CHANGE_MEDIA'}</span>
                    </div>
                 </div>
                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileUpload} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono ml-2">Protocol_Name</label>
                    <input 
                      type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                      placeholder="e.g. Neon Nights V..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-900 dark:text-white"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono ml-2">Classification</label>
                    <select 
                      value={formData.category} 
                      onChange={e => setFormData({...formData, category: e.target.value as any})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-900 dark:text-white"
                    >
                       <option value="Social">Social</option>
                       <option value="Tech">Tech</option>
                       <option value="Gaming">Gaming</option>
                       <option value="Nightlife">Nightlife</option>
                       <option value="Workshop">Workshop</option>
                    </select>
                 </div>
              </div>
           </div>

           {/* Step 2: Coordinates & Capacity */}
           <div className="space-y-4 pt-4 border-t border-slate-50 dark:border-slate-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono ml-2">Mode</label>
                    <div className="flex gap-2">
                        <button 
                        onClick={() => setFormData({...formData, type: 'physical'})}
                        className={`flex-1 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${formData.type === 'physical' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}
                        >
                        Geospatial
                        </button>
                        <button 
                        onClick={() => setFormData({...formData, type: 'virtual'})}
                        className={`flex-1 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${formData.type === 'virtual' ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}
                        >
                        Neural Link
                        </button>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono ml-2">Max Nodes (Capacity)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={formData.maxAttendees} 
                      onChange={e => {
                        const val = parseInt(e.target.value);
                        setFormData({...formData, maxAttendees: isNaN(val) ? 0 : val});
                      }}
                      placeholder="0 for unlimited"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-900 dark:text-white"
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono ml-2">Coordinates / URL</label>
                 <input 
                   type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}
                   placeholder={formData.type === 'physical' ? "London, UK..." : "https://meet.google.com/..."}
                   className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-900 dark:text-white"
                 />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono ml-2">Temporal_Day</label>
                    <input 
                      type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-900 dark:text-white"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono ml-2">Temporal_Tick</label>
                    <input 
                      type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-900 dark:text-white"
                    />
                 </div>
              </div>

              {!isEditing && (
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono ml-2">Recurrence Protocol</label>
                    <select 
                      value={formData.recurrence} 
                      onChange={e => setFormData({...formData, recurrence: e.target.value as any})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-900 dark:text-white"
                    >
                       <option value="none">Single Instance</option>
                       <option value="weekly">Weekly Loop (x4)</option>
                       <option value="monthly">Monthly Loop (x3)</option>
                    </select>
                </div>
              )}

              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono ml-2">Manifest</label>
                 <textarea 
                   value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                   placeholder="Brief description of the gathering..."
                   className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white dark:focus:bg-slate-700 transition-all resize-none h-32 text-slate-900 dark:text-white"
                 />
              </div>
           </div>
        </div>

        <div className="pt-8 border-t border-slate-50 dark:border-slate-800 mt-4 shrink-0 space-y-4">
           {isEditing && isRecurring && (
             <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl border border-indigo-100 dark:border-indigo-800">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white dark:bg-indigo-800 rounded-xl flex items-center justify-center text-indigo-500 dark:text-indigo-300 shadow-sm">
                    <ICONS.Temporal />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-mono">Recurrence_Detected</span>
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">Apply changes to entire series?</span>
                  </div>
               </div>
               <button 
                 onClick={() => setUpdateSeries(!updateSeries)}
                 className={`w-12 h-7 rounded-full p-1 transition-colors ${updateSeries ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
               >
                 <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${updateSeries ? 'translate-x-5' : 'translate-x-0'}`} />
               </button>
             </div>
           )}

           <button 
             onClick={handleSubmit}
             disabled={!formData.title || !formData.date || isUploading}
             className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.4em] shadow-xl hover:bg-indigo-600 dark:hover:bg-indigo-400 dark:hover:text-white transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
           >
             {isUploading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white dark:border-slate-900/30 dark:border-t-slate-900 rounded-full animate-spin" /> : <ICONS.Verified />}
             {isEditing ? (updateSeries ? 'UPDATE_SERIES' : 'UPDATE_INSTANCE') : 'BROADCAST_GATHERING'}
           </button>
        </div>
      </div>
    </div>
  );
};
