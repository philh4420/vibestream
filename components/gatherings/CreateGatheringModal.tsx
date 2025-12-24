
import React, { useState, useRef } from 'react';
import { User, Gathering } from '../../types';
import { ICONS } from '../../constants';
import { uploadToCloudinary } from '../../services/cloudinary';

interface CreateGatheringModalProps {
  currentUser: User;
  onClose: () => void;
  onConfirm: (data: any) => void;
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
    });
  };

  const isEditing = !!initialData;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-xl rounded-[3.5rem] p-10 shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-8 shrink-0">
           <div>
             <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">{isEditing ? 'Update_Protocol' : 'Initiate_Gathering'}</h2>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono mt-2">Protocol Layer v4.0</p>
           </div>
           <button onClick={onClose} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all active:scale-90"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar scroll-container space-y-6 px-1">
           {/* Step 1: Visual & Core Info */}
           <div className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative h-48 w-full rounded-[2.5rem] overflow-hidden bg-slate-100 cursor-pointer group border-2 border-dashed border-slate-200 hover:border-indigo-400 transition-colors"
              >
                 <img src={formData.coverUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100" alt="" />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl shadow-lg flex items-center gap-3">
                       <ICONS.Create />
                       <span className="text-[9px] font-black uppercase tracking-widest text-slate-900">{isUploading ? 'UPLOADING...' : 'CHANGE_COVER'}</span>
                    </div>
                 </div>
                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono ml-2">Protocol_Name</label>
                    <input 
                      type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                      placeholder="e.g. Neon Nights V..."
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono ml-2">Classification</label>
                    <select 
                      value={formData.category} 
                      onChange={e => setFormData({...formData, category: e.target.value as any})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all"
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
           <div className="space-y-4 pt-4 border-t border-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono ml-2">Mode</label>
                    <div className="flex gap-2">
                        <button 
                        onClick={() => setFormData({...formData, type: 'physical'})}
                        className={`flex-1 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${formData.type === 'physical' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
                        >
                        Geospatial
                        </button>
                        <button 
                        onClick={() => setFormData({...formData, type: 'virtual'})}
                        className={`flex-1 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${formData.type === 'virtual' ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
                        >
                        Neural Link
                        </button>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono ml-2">Max Nodes (Capacity)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={formData.maxAttendees} 
                      onChange={e => setFormData({...formData, maxAttendees: parseInt(e.target.value)})}
                      placeholder="0 for unlimited"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all"
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono ml-2">Coordinates / URL</label>
                 <input 
                   type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}
                   placeholder={formData.type === 'physical' ? "London, UK..." : "https://meet.google.com/..."}
                   className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all"
                 />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono ml-2">Temporal_Day</label>
                    <input 
                      type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono ml-2">Temporal_Tick</label>
                    <input 
                      type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all"
                    />
                 </div>
              </div>

              {!isEditing && (
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono ml-2">Recurrence Protocol</label>
                    <select 
                      value={formData.recurrence} 
                      onChange={e => setFormData({...formData, recurrence: e.target.value as any})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all"
                    >
                       <option value="none">Single Instance</option>
                       <option value="weekly">Weekly Loop (x4)</option>
                       <option value="monthly">Monthly Loop (x3)</option>
                    </select>
                </div>
              )}

              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono ml-2">Manifest</label>
                 <textarea 
                   value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                   placeholder="Brief description of the gathering..."
                   className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all resize-none h-32"
                 />
              </div>
           </div>
        </div>

        <div className="pt-8 border-t border-slate-50 mt-4 shrink-0">
           <button 
             onClick={handleSubmit}
             disabled={!formData.title || !formData.date || isUploading}
             className="w-full py-5 bg-slate-900 text-white rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.4em] shadow-xl hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
           >
             {isUploading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ICONS.Verified />}
             {isEditing ? 'UPDATE_GATHERING' : 'BROADCAST_GATHERING'}
           </button>
        </div>
      </div>
    </div>
  );
};