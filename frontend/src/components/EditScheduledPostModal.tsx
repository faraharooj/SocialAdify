// D:/socialadify/frontend/src/components/EditScheduledPostModal.tsx
'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { ScheduledPost, UpdatePostPayload, updateScheduledPost } from '@/services/schedulerService';
import { useAuth } from '@/context/AuthContext';

// Icons
const LoadingSpinner = ({ className = "animate-spin h-5 w-5 text-white" }: {className?: string}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

interface EditScheduledPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: ScheduledPost | null;
  onPostUpdated: (updatedPost: ScheduledPost) => void; 
}

const EditScheduledPostModal: React.FC<EditScheduledPostModalProps> = ({ 
    isOpen, 
    onClose, 
    post,
    onPostUpdated 
}) => {
  const { token, logout } = useAuth();
  
  const [caption, setCaption] = useState('');
  const [scheduledDateTime, setScheduledDateTime] = useState(''); 
  const [targetPlatform, setTargetPlatform] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (post && isOpen) {
      setCaption(post.caption);
      
      const localDate = new Date(post.scheduled_at);
      const year = localDate.getFullYear();
      const month = String(localDate.getMonth() + 1).padStart(2, '0');
      const day = String(localDate.getDate()).padStart(2, '0');
      const hours = String(localDate.getHours()).padStart(2, '0');
      const minutes = String(localDate.getMinutes()).padStart(2, '0');
      
      const formattedLocalDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
      setScheduledDateTime(formattedLocalDateTime);
      
      setTargetPlatform(post.target_platform || '');
      setError(null);
      setSuccessMessage(null);
    }
  }, [post, isOpen]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !post) {
      setError("Authentication error or no post selected.");
      return;
    }
    if (!caption || !scheduledDateTime) {
        setError("Caption and schedule date/time are required.");
        return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    // --- THIS IS THE CORRECT FIX ---
    // new Date() correctly interprets the input string as local time.
    // .toISOString() correctly converts that local time to a UTC string.
    const scheduled_at_str = new Date(scheduledDateTime).toISOString();

    const payload: UpdatePostPayload = {
        caption,
        scheduled_at_str, // Use the corrected UTC string
        target_platform: targetPlatform || undefined,
    };

    try {
      const updatedPostData = await updateScheduledPost(token, post.id, payload);
      setSuccessMessage("Post updated successfully!");
      onPostUpdated(updatedPostData); 
      setTimeout(() => {
        onClose(); 
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update post.";
      setError(errorMessage);
      if (errorMessage.toLowerCase().includes("unauthorized")) logout();
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !post) return null;

  const inputBaseClass = "w-full px-4 py-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-orange-500 dark:focus:border-orange-400 outline-none transition text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 bg-white dark:bg-slate-700";
  const labelBaseClass = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 tracking-wide";


  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
      <div 
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg transform transition-all p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Edit Scheduled Post</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="editCaption" className={labelBaseClass}>Caption*</label>
            <textarea
              id="editCaption" value={caption} onChange={(e) => setCaption(e.target.value)}
              className={`${inputBaseClass} min-h-[100px]`}
              rows={4} required
            />
          </div>
          
          <div>
            <label htmlFor="editScheduledDateTime" className={labelBaseClass}>Schedule Date & Time*</label>
            <input 
              type="datetime-local" 
              id="editScheduledDateTime"
              value={scheduledDateTime}
              onChange={(e) => setScheduledDateTime(e.target.value)}
              className={inputBaseClass}
              required
              min={new Date().toISOString().slice(0, 16)} 
            />
          </div>

          <div>
            <label htmlFor="editTargetPlatform" className={labelBaseClass}>Target Platform (Optional)</label>
            <select id="editTargetPlatform" value={targetPlatform} onChange={(e) => setTargetPlatform(e.target.value)} className={inputBaseClass}>
              <option value="" className="bg-white dark:bg-slate-700">Select Platform (Future Feature)</option>
              <option value="Instagram" className="bg-white dark:bg-slate-700">Instagram</option>
              <option value="Facebook" className="bg-white dark:bg-slate-700">Facebook</option>
              <option value="Google Ads" className="bg-white dark:bg-slate-700">Google Ads</option>
            </select>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Platform-specific posting will be enabled later.</p>
          </div>
          
          {error && ( <div className="p-3 text-sm text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-800/30 rounded-md border border-red-200 dark:border-red-700">{error}</div> )}
          {successMessage && ( <div className="p-3 text-sm text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-800/30 rounded-md border border-green-200 dark:border-green-700">{successMessage}</div> )}

          <div className="flex items-center justify-end space-x-3 pt-3">
            <button 
                type="button" 
                onClick={onClose} 
                disabled={isLoading} 
                className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 dark:focus:ring-offset-slate-800 transition"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isLoading} 
              className="px-5 py-2.5 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 dark:focus:ring-offset-slate-800 transition shadow-sm disabled:opacity-70 flex items-center justify-center min-w-[150px]"
            >
              {isLoading ? <LoadingSpinner /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditScheduledPostModal;
