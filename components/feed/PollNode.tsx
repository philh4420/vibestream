
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

  // Determine user's vote
  const userVoteId = userData && post.pollVoters ? post.pollVoters[userData.id] : null;
  const hasVoted = !!userVoteId;

  // Calculate percentages
  const totalVotes = useMemo(() => {
    if (!post.pollVotes) return 0;
    return Object.values(post.pollVotes).reduce((a, b) => a + b, 0);
  }, [post.pollVotes]);

  const handleVote = async (optionId: string) => {
    if (!userData || hasVoted || isVoting || !db) return;
    setIsVoting(true);

    try {
      const postRef = doc(db, 'posts', post.id);
      
      // Atomic Update: 
      // 1. Add user to pollVoters map
      // 2. Increment specific pollVotes option
      // 3. Increment total votes cache (optional but good for sorting)
      
      const updatePayload: any = {
        [`pollVoters.${userData.id}`]: optionId,
        [`pollVotes.${optionId}`]: increment(1),
        pollTotalVotes: increment(1)
      };

      await updateDoc(postRef, updatePayload);
      addToast("Consensus Registered", "success");
    } catch (e) {
      console.error(e);
      addToast("Vote Failed", "error");
    } finally {
      setIsVoting(false);
    }
  };

  if (!post.pollOptions || post.pollOptions.length === 0) return null;

  return (
    <div className="mt-4 mb-4 select-none">
      <div className="flex flex-col gap-3">
        {post.pollOptions.map((option) => {
          const votes = post.pollVotes?.[option.id] || 0;
          const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
          const isSelected = userVoteId === option.id;
          
          return (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              disabled={hasVoted || isVoting}
              className={`relative w-full h-14 rounded-2xl overflow-hidden transition-all duration-300 group ${
                hasVoted 
                  ? 'cursor-default' 
                  : 'cursor-pointer active:scale-[0.98] hover:shadow-md'
              }`}
            >
              {/* Background Bar (Vote Visual) */}
              <div 
                className={`absolute inset-y-0 left-0 transition-all duration-1000 ease-out ${
                  isSelected 
                    ? 'bg-indigo-500/20 dark:bg-indigo-500/30' 
                    : hasVoted 
                      ? 'bg-slate-200 dark:bg-slate-700' 
                      : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                }`}
                style={{ width: hasVoted ? `${percentage}%` : '100%' }} 
              />
              
              {/* Active User Vote Indicator Bar (Overlay for smoothness) */}
              {isSelected && (
                 <div 
                    className="absolute inset-y-0 left-0 bg-indigo-600 dark:bg-indigo-500 opacity-10" 
                    style={{ width: '100%' }}
                 />
              )}

              {/* Content Layer */}
              <div className="absolute inset-0 flex items-center justify-between px-5 z-10">
                <div className="flex items-center gap-3">
                   {isSelected && (
                     <div className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-sm">
                       <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                     </div>
                   )}
                   <span className={`text-sm font-black tracking-tight ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                     {option.text}
                   </span>
                </div>
                
                {hasVoted && (
                  <span className="text-xs font-black font-mono text-slate-500 dark:text-slate-400">
                    {percentage}%
                  </span>
                )}
              </div>
              
              {/* Unvoted Border Effect */}
              {!hasVoted && (
                 <div className="absolute inset-0 border-2 border-transparent group-hover:border-indigo-500/30 rounded-2xl transition-colors pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between px-2">
         <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
           {totalVotes.toLocaleString()} Votes
         </span>
         <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
           24H REMAINING
         </span>
      </div>
    </div>
  );
};
