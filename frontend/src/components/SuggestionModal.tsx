   // D:\socialadify\frontend\src\components\SuggestionModal.tsx
   'use client';

   import React from 'react';

   interface AISuggestion {
     ad_id: string;
     suggestion: string | string[];
   }

   interface SuggestionModalProps {
     isOpen: boolean;
     onClose: () => void;
     suggestionData: AISuggestion | null;
     isLoading: boolean;
     error: string | null;
   }

   const SuggestionModal: React.FC<SuggestionModalProps> = ({
     isOpen,
     onClose,
     suggestionData,
     isLoading,
     error,
   }) => {
     // Log when the component renders and what its isOpen prop is
     console.log(`SuggestionModal: Rendering. isOpen = ${isOpen}, isLoading = ${isLoading}, error = ${error}, suggestionData:`, suggestionData);

     if (!isOpen) {
       console.log("SuggestionModal: isOpen is false, returning null.");
       return null;
     }

     const formatSuggestion = (suggestionInput: string | string[]): React.ReactNode => {
       // ... (keep existing formatSuggestion logic from the artifact)
       let suggestionsToDisplay: string[] = [];
       if (Array.isArray(suggestionInput)) {
         suggestionsToDisplay = suggestionInput.map(item => String(item));
       } else if (typeof suggestionInput === 'string') {
         try {
           const parsed = JSON.parse(suggestionInput.replace(/'/g, '"'));
           if (Array.isArray(parsed)) {
             suggestionsToDisplay = parsed.map(item => String(item));
           } else {
             suggestionsToDisplay = [suggestionInput];
           }
         } catch (e) {
           console.warn("SuggestionModal: Failed to parse suggestion string as JSON array, treating as single string.", e);
           suggestionsToDisplay = [suggestionInput];
         }
       }
       if (suggestionsToDisplay.length > 0) {
         return (
           <ul className="list-disc list-inside space-y-2 text-gray-600">
             {suggestionsToDisplay.map((item, index) => (
               <li key={index}>{item}</li>
             ))}
           </ul>
         );
       }
       return <p className="text-gray-600">No specific suggestions available.</p>;
     };

     console.log("SuggestionModal: isOpen is true, rendering modal structure.");
     return (
       <div
         className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm transition-opacity duration-300 ease-in-out"
         onClick={onClose}
       >
         <div
           className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300 ease-in-out scale-100 p-6 md:p-8"
           onClick={(e) => e.stopPropagation()}
         >
           <div className="flex justify-between items-center mb-6">
             <h2 className="text-xl font-semibold text-gray-800">
               AI Optimization Suggestions
             </h2>
             <button
               onClick={onClose}
               className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
               aria-label="Close modal"
             >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
             </button>
           </div>

           {isLoading && (
             <div className="py-8 text-center">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
               <p className="mt-4 text-gray-600">Generating suggestions...</p>
             </div>
           )}

           {error && !isLoading && (
             <div className="p-4 text-sm text-blue-700 bg-red-100 rounded-lg shadow" role="alert">
               <p className="font-semibold">Suggestions Unavailable:</p>
               <p>{error}</p>
             </div>
           )}

           {!isLoading && !error && suggestionData && suggestionData.suggestion && (
             <div>
               <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg max-h-60 overflow-y-auto">
                 {formatSuggestion(suggestionData.suggestion)}
               </div>
             </div>
           )}
            {!isLoading && !error && (!suggestionData || !suggestionData.suggestion) && (
               <p className="text-gray-500 text-center py-8">No suggestion data available.</p>
           )}

           <div className="mt-8 text-right">
             <button
               onClick={onClose}
               className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors shadow-sm"
             >
               Close
             </button>
           </div>
         </div>
       </div>
     );
   };

   export default SuggestionModal;
   