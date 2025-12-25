
import React, { useState, useRef } from 'react';
import { User } from '../../types';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { collection, addDoc, serverTimestamp, query, where, getDocs, writeBatch, doc } = Firestore as any;
import { ICONS } from '../../constants';
import { uploadToCloudinary } from '../../services/cloudinary';

interface SupportTicketModalProps {
  currentUser: User;
  onClose: () => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SupportTicketModal: React.FC<SupportTicketModalProps> = ({ currentUser, onClose, addToast }) => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('technical');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      let attachmentUrl = null;
      if (attachment) {
        addToast("Encrypting Attachment...", "info");
        attachmentUrl = await uploadToCloudinary(attachment);
      }

      // 1. Create Ticket
      const ticketRef = await addDoc(collection(db, 'support_tickets'), {
        userId: currentUser.id,
        userName: currentUser.displayName,
        userEmail: currentUser.email || 'N/A',
        subject,
        description,
        category,
        attachmentUrl,
        status: 'open',
        priority: 'normal',
        createdAt: serverTimestamp()
      });

      // 2. Notify Admins
      const adminQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
      const adminSnap = await getDocs(adminQuery);

      if (!adminSnap.empty) {
        const batch = writeBatch(db);
        adminSnap.docs.forEach((adminDoc: any) => {
           // Don't notify self if admin creates a ticket (though rare)
           if (adminDoc.id === currentUser.id) return;

           const notifRef = doc(collection(db, 'notifications'));
           batch.set(notifRef, {
             type: 'system',
             fromUserId: currentUser.id,
             fromUserName: currentUser.displayName,
             fromUserAvatar: currentUser.avatarUrl,
             toUserId: adminDoc.id,
             targetId: ticketRef.id,
             text: `Support Request: "${subject}" [${category.toUpperCase()}]`,
             isRead: false,
             timestamp: serverTimestamp(),
             pulseFrequency: 'intensity'
           });
        });
        await batch.commit();
      }

      addToast("Ticket Successfully Logged", "success");
      onClose();
    } catch (error) {
      console.error(error);
      addToast("Failed to Initialize Protocol", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] p-8 md:p-10 shadow-2xl border border-white/20 dark:border-slate-800 animate-in zoom-in-95 duration-500 overflow-hidden flex flex-col">
        
        <div className="flex justify-between items-start mb-8 shrink-0">
           <div>
             <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none">New_Protocol</h2>
             <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] font-mono mt-2">Initialize Support Request</p>
           </div>
           <button onClick={onClose} className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all active:scale-90"><svg className="w-6 h-6 text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
           <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono ml-2">Signal_Classification</label>
              <div className="grid grid-cols-2 gap-3">
                 {['technical', 'account', 'billing', 'harassment'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${category === cat ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                    >
                      {cat}
                    </button>
                 ))}
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono ml-2">Subject_Header</label>
              <input 
                type="text" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of the anomaly..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
              />
           </div>

           <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono ml-2">Diagnostic_Log</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed description of the issue..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 resize-none h-32"
              />
           </div>

           <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono ml-2">Visual_Artifact (Optional)</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`w-full py-4 border-2 border-dashed rounded-2xl flex items-center justify-center cursor-pointer transition-all ${attachment ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400'}`}
              >
                 <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                 <span className={`text-[9px] font-black uppercase tracking-widest ${attachment ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    {attachment ? `ATTACHED: ${attachment.name.slice(0, 20)}...` : 'UPLOAD_SCREENSHOT'}
                 </span>
              </div>
           </div>

           <button 
             type="submit"
             disabled={isSubmitting || !subject || !description}
             className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] shadow-xl hover:bg-indigo-600 dark:hover:bg-indigo-400 dark:hover:text-white transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
           >
             {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white dark:border-slate-900/30 dark:border-t-slate-900 rounded-full animate-spin" /> : <ICONS.Verified />}
             TRANSMIT_TICKET
           </button>
        </form>
      </div>
    </div>
  );
};
