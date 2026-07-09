// D:\socialadify\frontend\src\context\ImageContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the shape of the context's state
interface ImageContextType {
    sharedImage: File | null;
    setSharedImage: (image: File | null) => void;
}

// Create the context with a default undefined value
const ImageContext = createContext<ImageContextType | undefined>(undefined);

// Create the provider component
export const ImageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [sharedImage, setSharedImage] = useState<File | null>(null);

    return (
        <ImageContext.Provider value={{ sharedImage, setSharedImage }}>
            {children}
        </ImageContext.Provider>
    );
};

// Create a custom hook for easy access to the context
export const useImageContext = (): ImageContextType => {
    const context = useContext(ImageContext);
    if (context === undefined) {
        throw new Error('useImageContext must be used within an ImageProvider');
    }
    return context;
};
