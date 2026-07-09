// D:\socialadify\frontend\src\components\DeleteAccountModal.tsx
'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import { apiDeleteAccount, DeleteAccountData } from '@/services/authService';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const LoadingSpinner = () => ( <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>);
const AlertTriangleIcon = ({ className = "w-6 h-6 text-red-500" }: {className?: string}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
);


interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ isOpen, onClose }) => {
  const { token, logout } = useAuth(); 
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setCurrentPassword('');
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!token) {
      setError("Authentication error. Please log in again.");
      logout(); 
      return;
    }
    if (!currentPassword) {
        setError("Please enter your current password to confirm deletion.");
        return;
    }

    setIsLoading(true);
    const payload: DeleteAccountData = { password: currentPassword };

    try {
      const response = await apiDeleteAccount(token, payload);
      setSuccessMessage(response.message + " You will be logged out.");
      setTimeout(() => {
        logout(); // Log out the user from AuthContext
        router.push('/signup?accountDeleted=true'); // Redirect to signup or a dedicated "goodbye" page
      }, 3000);
    } catch (apiErr: unknown) {
      const msg = apiErr instanceof Error ? apiErr.message : "Failed to delete account.";
      setError(msg);
      if (msg.toLowerCase().includes("unauthorized")) {
        logout(); 
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputClasses = "w-full px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition text-slate-800 placeholder-slate-500";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center mb-6">
          <AlertTriangleIcon className="w-12 h-12 text-red-500 mb-3"/>
          <h2 className="text-xl font-bold text-slate-800">Delete Your Account?</h2>
          <p className="text-sm text-slate-600 mt-2">
            This action is permanent and cannot be undone. All your data, including saved captions and profile information, will be permanently erased.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="deleteConfirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
                Enter Current Password to Confirm
            </label>
            <input
              type="password" id="deleteConfirmPassword" value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClasses}
              required
              disabled={isLoading}
              placeholder="Your current password"
            />
          </div>
          
          {error && ( <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md border border-red-200">{error}</div> )}
          {successMessage && ( <div className="p-3 text-sm text-green-700 bg-green-100 rounded-md border border-green-200">{successMessage}</div> )}

          <div className="flex items-center justify-end space-x-3 pt-3">
            <button 
                type="button" 
                onClick={onClose} 
                disabled={isLoading} 
                className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 transition"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isLoading || !currentPassword} 
              className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center min-w-[180px]"
            >
              {isLoading ? <LoadingSpinner /> : 'Delete My Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
