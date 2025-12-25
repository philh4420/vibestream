
import React from 'react';
import { ICONS } from '../../constants';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="w-full max-w-[2400px] mx-auto pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Hero Header */}
      <div className="relative rounded-[3rem] bg-slate-950 p-10 md:p-14 text-white shadow-2xl border border-white/10 overflow-hidden mb-10 group">
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3 group-hover:bg-emerald-500/20 transition-colors duration-1000" />
         <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full -translate-x-1/3 translate-y-1/3" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />

         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="space-y-4 max-w-2xl">
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                  <ICONS.Verified />
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em] font-mono">Protocol_Secure</span>
               </div>
               <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none text-white">
                 Privacy<br/><span className="text-slate-500">Manifest</span>
               </h1>
               <p className="text-xs md:text-sm font-medium text-slate-400 leading-relaxed max-w-lg">
                 Your neural footprint is encrypted by default. VibeStream adheres to the 2026 Global Data Sovereignty Accord (GDSA).
               </p>
            </div>
            
            <div className="px-8 py-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center min-w-[160px]">
               <div className="text-3xl font-black text-emerald-400 mb-1"><ICONS.Verified /></div>
               <span className="text-[8px] font-black text-white uppercase tracking-widest">End-to-End</span>
               <span className="text-[8px] font-black text-white/50 uppercase tracking-widest">Encryption</span>
            </div>
         </div>
      </div>

      {/* Content Grid (Static) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-8 md:p-10 hover:shadow-xl hover:border-emerald-200 dark:hover:border-emerald-900 transition-all duration-500 group relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10 text-6xl font-black text-slate-200 dark:text-slate-700 group-hover:text-emerald-100 dark:group-hover:text-emerald-900 transition-colors select-none">
               01
             </div>
             <div className="relative z-10">
               <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-4 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                 Data_Ingestion
               </h3>
               <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
                 We only intercept signals you explicitly broadcast. Passive biometric data (scroll velocity, dwell time) is processed locally on your node and never transmitted to the Core without consent.
               </p>
             </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-8 md:p-10 hover:shadow-xl hover:border-emerald-200 dark:hover:border-emerald-900 transition-all duration-500 group relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10 text-6xl font-black text-slate-200 dark:text-slate-700 group-hover:text-emerald-100 dark:group-hover:text-emerald-900 transition-colors select-none">
               02
             </div>
             <div className="relative z-10">
               <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-4 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                 Neural_Encryption
               </h3>
               <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
                 All direct messages and private cluster comms use AES-256-GCM encryption. Even Citadel Admins cannot decrypt your private handshake protocols.
               </p>
             </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-8 md:p-10 hover:shadow-xl hover:border-emerald-200 dark:hover:border-emerald-900 transition-all duration-500 group relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10 text-6xl font-black text-slate-200 dark:text-slate-700 group-hover:text-emerald-100 dark:group-hover:text-emerald-900 transition-colors select-none">
               03
             </div>
             <div className="relative z-10">
               <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-4 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                 Third_Party_Resonance
               </h3>
               <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
                 We maintain a strict isolation policy. Your identity hash is never leaked to advertising grids. External media (Cloudinary) is fetched via proxied, anonymized requests.
               </p>
             </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-8 md:p-10 hover:shadow-xl hover:border-emerald-200 dark:hover:border-emerald-900 transition-all duration-500 group relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10 text-6xl font-black text-slate-200 dark:text-slate-700 group-hover:text-emerald-100 dark:group-hover:text-emerald-900 transition-colors select-none">
               04
             </div>
             <div className="relative z-10">
               <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-4 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                 Right_To_Vanish
               </h3>
               <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
                 Initiate a "Purge Protocol" from your settings to instantly wipe all trace of your existence from our servers. This action is irreversible and cryptographically verified.
               </p>
             </div>
        </div>

      </div>

      {/* Footer Badge */}
      <div className="mt-12 text-center">
        <p className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.4em] font-mono">
          Last_Updated: 2026.04.12 • Hash: #8f92a
        </p>
      </div>
    </div>
  );
};
