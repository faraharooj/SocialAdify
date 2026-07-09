// D:\socialadify\frontend\src\components\EditProfileModal.tsx
'use client';

import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import Image from 'next/image'; 
import { UserPublic, UserProfileUpdateData, apiUpdateUserProfileText, apiUploadProfilePicture } from '@/services/authService';
import { useAuth } from '@/context/AuthContext'; 

const LoadingSpinner = () => ( <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>);
const UserCircleIconModal = ({ className = "w-24 h-24 text-slate-400" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" /></svg> );


interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserPublic | null;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const { token, fetchAndUpdateUser, logout } = useAuth(); 

  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [newEmail, setNewEmail] = useState(''); 
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [picturePreview, setPicturePreview] = useState<string | null>(null);
  
  const [isSavingText, setIsSavingText] = useState(false);
  const [isUploadingPic, setIsUploadingPic] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);


  useEffect(() => {
    if (currentUser) {
      setFirstname(currentUser.firstname || '');
      setLastname(currentUser.lastname || '');
      setNewEmail(currentUser.email || ''); 
      setPicturePreview(currentUser.profile_picture_url || null); 
    }
    if (!isOpen) { 
        setError(null);
        setSuccessMessage(null);
        setInfoMessage(null);
        setProfilePictureFile(null); 
    }
  }, [currentUser, isOpen]);

  const handlePictureChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if (file.size > 2 * 1024 * 1024) { 
            setError("Image size should not exceed 2MB.");
            setProfilePictureFile(null);
            setPicturePreview(currentUser?.profile_picture_url || null); 
            return;
        }
        if (!file.type.startsWith("image/")) {
            setError("Invalid file type. Please select an image.");
            setProfilePictureFile(null);
            setPicturePreview(currentUser?.profile_picture_url || null);
            return;
        }
        setProfilePictureFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPicturePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        setError(null); 
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setError("Authentication error. Please log in again.");
      logout();
      return;
    }
    setError(null); setSuccessMessage(null); setInfoMessage(null);

    // --- FIX: Mandatory Field Validation ---
    if (!firstname.trim() || !lastname.trim() || !newEmail.trim()) {
        setError("All fields (First Name, Last Name, Email) are required.");
        return;
    }
    
    // --- FIX: First Name Cannot Start with a Number ---
    if (/^\d/.test(firstname)) {
        setError("First Name cannot start with a number.");
        return;
    }
    // ---------------------------------------

    let profileUpdated = false;
    let emailChanged = false;

    const initialFirstname = currentUser?.firstname || '';
    const initialLastname = currentUser?.lastname || '';
    const initialEmail = currentUser?.email || '';

    const textData: UserProfileUpdateData = {};
    if (firstname !== initialFirstname) textData.firstname = firstname;
    if (lastname !== initialLastname) textData.lastname = lastname;
    if (newEmail && newEmail !== initialEmail) {
        textData.new_email = newEmail;
        emailChanged = true;
    }

    if (Object.keys(textData).length > 0) { 
        setIsSavingText(true);
        try {
            await apiUpdateUserProfileText(token, textData);
            profileUpdated = true;
        } catch (apiErr: unknown) {
            const msg = apiErr instanceof Error ? apiErr.message : "Failed to update profile information.";
            setError(msg);
            if(msg.toLowerCase().includes("unauthorized")) logout();
            setIsSavingText(false);
            return; 
        }
        setIsSavingText(false);
    }

    if (profilePictureFile) {
        setIsUploadingPic(true);
        try {
            await apiUploadProfilePicture(token, profilePictureFile);
            profileUpdated = true;
        } catch (apiErr: unknown) {
            const msg = apiErr instanceof Error ? apiErr.message : "Failed to upload profile picture.";
            setError(msg);
            if(msg.toLowerCase().includes("unauthorized")) logout();
            setIsUploadingPic(false);
            if(profileUpdated) await fetchAndUpdateUser();
            return; 
        }
        setIsUploadingPic(false);
    }

    if (profileUpdated) {
        let finalSuccessMessage = "Profile updated successfully!";
        if (emailChanged) {
            finalSuccessMessage += " Your email has changed. Please log out and log back in with your new email to update your session fully.";
            setInfoMessage("Email changed. Please re-login to apply fully."); 
        }
        setSuccessMessage(finalSuccessMessage);
        await fetchAndUpdateUser(); 
        setProfilePictureFile(null); 
        
        if (!emailChanged) { 
            setTimeout(() => {
                setSuccessMessage(null);
                onClose(); 
            }, 2500);
        } else {
             setTimeout(() => { 
                setSuccessMessage(null);
            }, 5000);
        }

    } else if (!profilePictureFile && Object.keys(textData).length === 0) { 
        setInfoMessage("No changes were submitted.");
         setTimeout(() => {
            setInfoMessage(null);
            onClose();
        }, 1500);
    }
  };

  if (!isOpen) return null;

  const isLoading = isSavingText || isUploadingPic;
  const inputClasses = "w-full px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-slate-800 placeholder-slate-500"; 

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-slate-800">Edit Profile</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex flex-col items-center space-y-3">
                <div className="w-28 h-28 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden ring-2 ring-indigo-300">
                    {picturePreview ? (
                        <Image src={picturePreview} alt="Profile Preview" width={112} height={112} className="object-cover w-full h-full" />
                    ) : (
                        <UserCircleIconModal className="w-20 h-20 text-slate-400" />
                    )}
                </div>
                <label htmlFor="profilePictureInput" className="cursor-pointer text-sm text-indigo-600 hover:text-indigo-500 font-medium py-1 px-3 border border-indigo-300 rounded-md hover:bg-indigo-50 transition-colors">
                    {profilePictureFile ? "Change Picture" : "Upload Picture"}
                </label>
                <input 
                    type="file" 
                    id="profilePictureInput" 
                    accept="image/png, image/jpeg, image/gif"
                    className="sr-only"
                    onChange={handlePictureChange}
                    disabled={isLoading}
                />
                {profilePictureFile && <p className="text-xs text-slate-500 truncate max-w-xs">{profilePictureFile.name}</p>}
            </div>

          <div>
            <label htmlFor="firstname" className="block text-sm font-medium text-slate-700 mb-1">First Name*</label>
            <input
              type="text" id="firstname" value={firstname}
              onChange={(e) => setFirstname(e.target.value)}
              className={inputClasses} 
              disabled={isLoading}
              required // HTML5 Validation
            />
          </div>
          <div>
            <label htmlFor="lastname" className="block text-sm font-medium text-slate-700 mb-1">Last Name*</label>
            <input
              type="text" id="lastname" value={lastname}
              onChange={(e) => setLastname(e.target.value)}
              className={inputClasses} 
              disabled={isLoading}
              required // HTML5 Validation
            />
          </div>
          <div>
            <label htmlFor="new_email" className="block text-sm font-medium text-slate-700 mb-1">Email Address*</label>
            <input
              type="email" id="new_email" value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className={inputClasses} 
              disabled={isLoading}
              placeholder="Enter new email"
              required // HTML5 Validation
            />
              <p className="mt-1 text-xs text-slate-500">If changed, you need to re-login.</p>
          </div>
          
          {error && ( <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md border border-red-200">{error}</div> )}
          {successMessage && ( <div className="p-3 text-sm text-green-700 bg-green-100 rounded-md border border-green-200">{successMessage}</div> )}
          {infoMessage && ( <div className="p-3 text-sm text-blue-700 bg-blue-100 rounded-md border border-blue-200">{infoMessage}</div> )}


          <div className="flex items-center justify-end space-x-3 pt-3">
            <button type="button" onClick={onClose} disabled={isLoading} className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 transition">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition shadow-sm disabled:opacity-70 flex items-center justify-center min-w-[120px]">
              {isLoading ? <LoadingSpinner /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;