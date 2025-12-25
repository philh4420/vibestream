
import React, { useState } from 'react';
import { User, Region } from '../../types';
import { ICONS } from '../../constants';
import { SupportTicketModal } from './SupportTicketModal';

interface SupportPageProps {
  currentUser: User;
  locale: Region;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SupportPage: React.FC<SupportPageProps> = ({ currentUser, locale, addToast }) => {
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<string | null>(null);

  const faqs = [
    {
      id: 'privacy',
      q: 'How is my neural footprint encrypted?',
      a: 'All data packets are secured using AES-256-GCM encryption. Your personal biometric markers and direct messages are not accessible by Citadel Admins without explicit audit warrants.'
    },
    {
      id: 'billing',
      q: 'How do I upgrade my Trust Tier?',
      a: 'Trust Tiers (Alpha/Beta/Gamma) are assigned based on grid contribution and verification status. You can request a manual review via the "Account" settings.'
    },
    {
      id: 'technical',
      q: 'My live stream is experiencing high latency.',
      a: 'Ensure your local uplink has at least 10Mbps upload velocity. The grid automatically adjusts bitrate based on network congestion. Try switching regions in the main menu.'
    },
    {
      id: 'harassment',
      q: 'Reporting a rogue node.',
      a: 'Use the "Report" function directly on the user profile or specific signal. For immediate threats, initiate a Priority Ticket below.'
    }
  ];

  return (
    <div className="w-full max-w-[2400px] mx-auto pb-24 animate-in fade-in duration-700 space-y-8 px-4 md:px-8">
      
      {/* 1. Hero / Status HUD */}
      <div className="relative rounded-[3rem] bg-indigo-950 p-10 md:p-14 text-white shadow-2xl border border-white/10 overflow-hidden group">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 blur-[120px] rounded-full translate-x-1/4 -translate-y-1/4 group-hover:bg-indigo-400/30 transition-colors duration-1000" />
         <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 blur-[100px] rounded-full -translate-x-1/3 translate-y-1/3" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />

         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
            <div className="space-y-4 max-w-xl">
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                  <ICONS.Support />
                  <span className="text-[9px] font-black text-white uppercase tracking-[0.3em] font-mono">Grid_Support_v1.0</span>
               </div>
               <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none text-white">
                 System<br/><span className="text-indigo-300">Diagnostics</span>
               </h1>
               <p className="text-xs md:text-sm font-medium text-indigo-100/80 leading-relaxed max-w-sm">
                 Access the knowledge core or initialize a repair protocol. Our automated sentinels are online.
               </p>
            </div>

            {/* Status Indicators */}
            <div className="flex gap-4">
               <div className="px-6 py-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] flex flex-col items-center justify-center min-w-[100px]">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981] mb-2" />
                  <span className="text-[8px] font-black text-white uppercase tracking-widest font-mono">Grid_Online</span>
               </div>
               <div className="px-6 py-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] flex flex-col items-center justify-center min-w-[100px]">
                  <span className="text-xl font-black text-white leading-none">12ms</span>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono mt-1">Latency</span>
               </div>
            </div>
         </div>
      </div>

      {/* 2. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         {/* Left: Quick Actions */}
         <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
               <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-6">Direct_Uplink</h3>
               <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
                 Encountering a critical anomaly? Establish a direct line to Citadel Support for priority resolution.
               </p>
               <button 
                 onClick={() => setIsTicketModalOpen(true)}
                 className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-3"
               >
                 <ICONS.Create /> INITIALIZE_TICKET
               </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800">
               <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4">Community_Resources</h3>
               <div className="space-y-3">
                  {['Documentation', 'API Reference', 'System Status', 'Community Guidelines'].map(link => (
                    <button key={link} className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all group">
                       <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{link}</span>
                       <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  ))}
               </div>
            </div>
         </div>

         {/* Right: Knowledge Base */}
         <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-12 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4 mb-10">
               <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 dark:text-indigo-400">
                  <ICONS.Search />
               </div>
               <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Knowledge_Archives</h3>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] font-mono mt-1">Frequently Accessed Data</p>
               </div>
            </div>

            <div className="space-y-4">
               {faqs.map(faq => {
                 const isOpen = activeFaq === faq.id;
                 return (
                   <div 
                     key={faq.id} 
                     className={`rounded-[2rem] transition-all duration-500 border ${isOpen ? 'bg-slate-50 dark:bg-slate-800 border-indigo-100 dark:border-slate-700' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}
                   >
                      <button 
                        onClick={() => setActiveFaq(isOpen ? null : faq.id)}
                        className="w-full flex items-center justify-between p-6 text-left"
                      >
                         <span className={`text-xs md:text-sm font-black uppercase tracking-tight ${isOpen ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200'}`}>
                           {faq.q}
                         </span>
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isOpen ? 'bg-indigo-600 text-white rotate-180' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                         </div>
                      </button>
                      
                      <div className={`overflow-hidden transition-all duration-500 ease-out ${isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                         <div className="px-6 pb-6 pt-0">
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed border-t border-slate-200/50 dark:border-slate-700/50 pt-4">
                              {faq.a}
                            </p>
                         </div>
                      </div>
                   </div>
                 );
               })}
            </div>
         </div>

      </div>

      {isTicketModalOpen && (
        <SupportTicketModal 
          currentUser={currentUser} 
          onClose={() => setIsTicketModalOpen(false)} 
          addToast={addToast} 
        />
      )}

    </div>
  );
};
