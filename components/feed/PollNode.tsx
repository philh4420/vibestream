import React, { useState, useMemo } from 'react';
import { Post, User } from '../../types';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { doc, updateDoc, increment } = Firestore as any;

interface PollNodeProps {
  post: Post;
  userData: User | null;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const PollNode: React.FC<PollNodeProps> = ({ post, userData, addToast }) => {
  const [isVoting, setIsVoting] = useState(false);

  const userVoteId = userData && post.pollVoters ? post.pollVoters[userData.id] : null;
  const hasVoted = !!userVoteId;

  const totalVotes = useMemo(() => {
    if (!post.pollVotes) return 0;
    return Object.values(post.pollVotes).reduce((a, b) => a + b, 0);
  }, [post.pollVotes]);

  const handleVote = async (optionId: string) => {
    if (!userData || hasVoted || isVoting || !db) return;
    setIsVoting(true);

    try {
      const postRef = doc(db, 'posts', post.id);
      const updatePayload: any = {
        [`pollVoters.${userData.id}`]: optionId,
        [`pollVotes.${optionId}`]: increment(1),
        pollTotalVotes: increment(1)
      };

      await updateDoc(postRef, updatePayload);
      addToast("Consensus Registered", "success");
      if (window.navigator?.vibrate) window.navigator.vibrate(20);
    } catch (e) {
      addToast("Vote Failed", "error");
    } finally {
      setIsVoting(false);
    }
  };

  if (!post.pollOptions || post.pollOptions.length === 0) return null;

  return (
    <div className="mt-6 mb-2 space-y-4 px-1 select-none">
      <div className="flex flex-col gap-3.5">
        {post.pollOptions.map((option) => {
          const votes = post.pollVotes?.[option.id] || 0;
          const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
          const isSelected = userVoteId === option.id;
          
          return (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              disabled={hasVoted || isVoting}
              className={`relative w-full h-16 rounded-[1.6rem] overflow-hidden transition-all duration-500 group ${
                hasVoted 
                  ? 'cursor-default' 
                  : 'cursor-pointer active:scale-[0.98] hover:shadow-[0_10px_25px_-5px_rgba(99,102,241,0.1)]'
              }`}
            >
              {/* Fill Track */}
              <div 
                className={`absolute inset-0 bg-slate-50 dark:bg-slate-800/40 transition-colors ${!hasVoted && 'group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/10'}`}
              />

              {/* Progress Bar (Vote Visual) */}
              <div 
                className={`absolute inset-y-0 left-0 transition-all duration-1000 cubic-bezier(0.2, 1, 0.2, 1) ${
                  isSelected 
                    ? 'bg-indigo-500/30 dark:bg-indigo-400/20' 
                    : hasVoted 
                      ? 'bg-slate-200/50 dark:bg-slate-800/60' 
                      : 'bg-transparent'
                }`}
                style={{ width: hasVoted ? `${percentage}%` : '0%' }} 
              />
              
              {/* Selected Aura */}
              {isSelected && (
                 <div className="absolute inset-y-0 left-0 w-1.5 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)] z-20" />
              )}

              {/* Interaction Label */}
              <div className="absolute inset-0 flex items-center justify-between px-6 z-10">
                <div className="flex items-center gap-4">
                   <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all duration-500 ${
                     isSelected 
                        ? 'bg-indigo-600 border-indigo-500 text-white scale-110 shadow-lg' 
                        : hasVoted 
                          ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-40' 
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 group-hover:border-indigo-300'
                   }`}>
                      {isSelected ? (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                      )}
                   </div>
                   <span className={`text-sm font-black uppercase tracking-tight transition-colors ${isSelected ? 'text-indigo-900 dark:text-indigo-300' : hasVoted ? 'text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200 group-hover:text-indigo-600'}`}>
                     {option.text}
                   </span>
                </div>
                
                {hasVoted && (
                  <span className={`text-[10px] font-black font-mono tracking-widest ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600'}`}>
                    {percentage}%
                  </span>
                )}
              </div>
              
              {/* Border Overlay */}
              <div className={`absolute inset-0 border-2 rounded-[1.6rem] transition-colors duration-500 pointer-events-none ${isSelected ? 'border-indigo-500/20' : 'border-transparent'}`} />
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between px-4 pt-2">
         <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.25em] font-mono">
              {totalVotes.toLocaleString()} CONVERGENCE_NODES
            </span>
         </div>
         <span className="text-[8px] font-black text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-md uppercase tracking-widest">
           SIGNAL_ACTIVE
         </span>
      </div>
    </div>
  );
};