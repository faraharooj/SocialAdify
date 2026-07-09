// D:\socialadify\frontend\src\components\ImageEditor.tsx
'use client';

import React, { useCallback } from 'react';
import {
  Tldraw,
  useEditor,
  getSvgAsImage,
  TLOnMountHandler,
  Editor,
} from 'tldraw';
import 'tldraw/tldraw.css';

// --- Icon Components ---
const DownloadIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

const CancelIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

interface ImageEditorProps {
  baseImage: string; // data URL or URL
  onFinishEditing: (editedImageDataUrl: string) => void;
  onClose: () => void;
}

// --- Custom UI overlay with buttons ---
const CustomEditorUI = ({ onFinishEditing, onClose }: { onFinishEditing: (dataUrl: string) => void; onClose: () => void; }) => {
  const editor = useEditor();

  const handleExport = async () => {
    if (!editor) return;
    const shapes = editor.getCurrentPageShapes();
    if (!shapes.length) return;

    const svgEl = await editor.getSvg(shapes);
    if (!svgEl) return;

    // ✅ FIX: serialize element
    const svgString = new XMLSerializer().serializeToString(svgEl);

    const blob = await getSvgAsImage(svgString, {
      type: 'png',
      quality: 1,
      width: 1024,
      height: 1024,
    });

    if (blob) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        onFinishEditing(dataUrl);
      };
      reader.readAsDataURL(blob);
    }
  };

  return (
    <div className="absolute top-2 right-2 flex gap-2 z-50">
      <button
        onClick={onClose}
        className="bg-gray-700 text-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-600 transition-colors flex items-center gap-2"
      >
        <CancelIcon /> Cancel
      </button>
      <button
        onClick={handleExport}
        className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-500 transition-colors flex items-center gap-2"
      >
        <DownloadIcon /> Finish & Export
      </button>
    </div>
  );
};

// --- Main ImageEditor ---
const ImageEditor: React.FC<ImageEditorProps> = ({ baseImage, onFinishEditing, onClose }) => {
  const handleMount: TLOnMountHandler = useCallback((editor: Editor) => {
    (async () => {
      // ✅ FIX: use putExternalContent instead of createExternalContent
      const blob = await (await fetch(baseImage)).blob();
      const file = new File([blob], 'base.png', { type: blob.type });

      await editor.putExternalContent({
        type: 'files',
        files: [file],
        point: { x: 0, y: 0 },
      });

      editor.zoomToFit();
      editor.resetZoom();
    })();
  }, [baseImage]);

  return (
    <div className="fixed inset-0 z-[100] bg-black bg-opacity-50">
      <div className="relative w-full h-full">
        <Tldraw onMount={handleMount}>
          <CustomEditorUI onFinishEditing={onFinishEditing} onClose={onClose} />
        </Tldraw>
      </div>
    </div>
  );
};

export default ImageEditor;
