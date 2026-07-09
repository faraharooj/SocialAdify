// D:\socialadify\frontend\src\components\ChangePasswordModal.tsx
'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import { apiChangePassword, ChangePasswordData } from '@/services/authService';
import { useAuth } from '@/context/AuthContext';

const LoadingSpinner = () => ( <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>);

// Combined Password Hint and Validation Display Component
const PasswordHintAndValidation = ({ password, showDetails }: { password?: string; showDetails?: boolean }) => {
    const criteria = [
        { label: "At least 8 characters", met: (password?.length || 0) >= 8 },
        { label: "One uppercase letter", met: /[A-Z]/.test(password || '') },
        { label: "One lowercase letter", met: /[a-z]/.test(password || '') },
        { label: "One digit", met: /[0-9]/.test(password || '') },
        { label: "One special character (e.g. !@#$)", met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password || '') }
    ];

    if (!showDetails && password && password.length > 0 && !criteria.every(c => c.met)) {
        // If not showing details, but there's text and it's not fully valid, show a generic hint
        return <p className="mt-1.5 text-xs text-slate-500">Password must meet complexity requirements.</p>;
    }
    if (!showDetails && (!password || password.length === 0)) {
         return <p className="mt-1.5 text-xs text-slate-500">Min. 8 chars, incl. uppercase, lowercase, digit, special char.</p>;
    }


    // Show detailed list only when showDetails is true (e.g., on focus or if there's an error)
    return (
        <div className="mt-2 space-y-0.5 text-xs">
            {criteria.map(criterion => (
                <p key={criterion.label} className={`flex items-center ${criterion.met ? 'text-green-600' : 'text-slate-500'}`}>
                    {criterion.met ? 
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 mr-1 flex-shrink-0"><path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" /></svg> :
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 mr-1 flex-shrink-0"><path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" /></svg>
                    }
                    {criterion.label}
                </p>
            ))}
        </div>
    );
};


interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const { token, logout } = useAuth(); 
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isNewPasswordValid, setIsNewPasswordValid] = useState(false);
  const [showPasswordHints, setShowPasswordHints] = useState(false);


  useEffect(() => {
    if (!isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setError(null);
      setSuccessMessage(null);
      setIsNewPasswordValid(false);
      setShowPasswordHints(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const validations = {
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      lowercase: /[a-z]/.test(newPassword),
      digit: /[0-9]/.test(newPassword),
      specialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(newPassword),
    };
    setIsNewPasswordValid(Object.values(validations).every(Boolean));
  }, [newPassword]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!token) {
      setError("Authentication error. Please log in again.");
      logout(); 
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("New passwords do not match.");
      setShowPasswordHints(true); // Show hints if there's an error
      return;
    }
    if (!isNewPasswordValid) {
      setError("New password does not meet all complexity requirements.");
      setShowPasswordHints(true); // Show hints if there's an error
      return;
    }

    setIsLoading(true);
    const payload: ChangePasswordData = { current_password: currentPassword, new_password: newPassword };

    try {
      const response = await apiChangePassword(token, payload);
      setSuccessMessage(response.message + " You will be logged out for security.");
      setTimeout(() => {
        onClose(); 
        logout(); // Force logout after successful password change
      }, 3500);
    } catch (apiErr: unknown) {
      const msg = apiErr instanceof Error ? apiErr.message : "Failed to change password.";
      setError(msg);
      setShowPasswordHints(true); // Show hints on API error too
      if (msg.toLowerCase().includes("unauthorized")) {
        logout(); 
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputBaseClasses = "w-full px-4 py-2.5 border rounded-lg shadow-sm outline-none transition text-slate-800 placeholder-slate-500";
  const defaultBorder = "border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500";
  const validBorder = "border-green-500 focus:ring-2 focus:ring-green-500 focus:border-green-500";
  const errorBorder = "border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500";

  const newPasswordInputClasses = `${inputBaseClasses} ${
    newPassword.length > 0 && !isNewPasswordValid && showPasswordHints ? errorBorder : (isNewPasswordValid ? validBorder : defaultBorder)
  }`;
  const confirmPasswordInputClasses = `${inputBaseClasses} ${
    confirmNewPassword.length > 0 && newPassword !== confirmNewPassword && showPasswordHints ? errorBorder : (newPassword === confirmNewPassword && newPassword.length > 0 && isNewPasswordValid ? validBorder : defaultBorder)
  }`;


  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-slate-800">Change Password</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
            <input
              type="password" id="currentPassword" value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={`${inputBaseClasses} ${defaultBorder}`}
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="newPasswordModal" className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
            <input
              type="password" id="newPasswordModal" value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onFocus={() => setShowPasswordHints(true)}
              // onBlur={() => setShowPasswordHints(false)} // Optionally hide hints on blur if valid
              className={newPasswordInputClasses}
              required
              disabled={isLoading}
            />
            <PasswordHintAndValidation password={newPassword} showDetails={showPasswordHints || (newPassword.length > 0 && !isNewPasswordValid)} />
          </div>
          <div>
            <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
            <input
              type="password" id="confirmNewPassword" value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              onFocus={() => setShowPasswordHints(true)}
              className={confirmPasswordInputClasses}
              required
              disabled={isLoading}
            />
          </div>
          
          {error && ( <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md border border-red-200">{error}</div> )}
          {successMessage && ( <div className="p-3 text-sm text-green-700 bg-green-100 rounded-md border border-green-200">{successMessage}</div> )}

          <div className="flex items-center justify-end space-x-3 pt-3">
            <button type="button" onClick={onClose} disabled={isLoading} className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 transition">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isLoading || !isNewPasswordValid || newPassword !== confirmNewPassword || !currentPassword} 
              className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition shadow-sm disabled:opacity-70 flex items-center justify-center min-w-[140px]"
            >
              {isLoading ? <LoadingSpinner /> : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
