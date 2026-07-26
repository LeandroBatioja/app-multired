'use client';

import { useState, useRef, useEffect } from 'react';
import { useFiles } from '@/context/FilesContext';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

export default function UploadButton() {
  const { uploadFile } = useFiles();
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<'success' | 'error' | 'storage-full' | 'file-too-big' | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (feedback === 'success') {
      const t = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = Math.round(file.size / (1024 * 1024));
      setFeedback('file-too-big');
      setErrorMsg(`El archivo pesa ${sizeMB} MB. El tamaño máximo permitido es 100 MB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);
    setFeedback(null);
    setErrorMsg('');

    try {
      await uploadFile(file);
      setFeedback('success');
    } catch (err: any) {
      if (err.status === 413) {
        setFeedback('storage-full');
        setErrorMsg(err.message || 'Límite de almacenamiento alcanzado');
      } else {
        setErrorMsg(err.message || 'Error al subir');
        setFeedback('error');
        setTimeout(() => setFeedback(null), 4000);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        id="file-upload"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {uploading ? (
          <>
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Subiendo...
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Subir archivo
          </>
        )}
      </button>
      <p className="text-xs text-gray-400 mt-1">Tamaño máximo: 100 MB</p>

      {feedback === 'success' && (
        <div className="absolute top-full left-0 mt-2 bg-green-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in z-50">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Guardado de forma segura
        </div>
      )}

      {feedback === 'error' && (
        <div className="absolute top-full left-0 mt-2 bg-red-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in z-50">
          {errorMsg}
        </div>
      )}

      {feedback === 'storage-full' && (
        <div className="absolute top-full left-0 mt-2 bg-red-600 text-white text-sm px-4 py-3 rounded-lg shadow-lg animate-fade-in z-50 max-w-sm">
          <div className="flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-medium">Almacenamiento lleno</p>
              <p className="text-red-200 text-xs mt-1">{errorMsg}</p>
            </div>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="mt-2 text-xs text-red-200 hover:text-white underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {feedback === 'file-too-big' && (
        <div className="absolute top-full left-0 mt-2 bg-amber-600 text-white text-sm px-4 py-3 rounded-lg shadow-lg animate-fade-in z-50 max-w-sm">
          <div className="flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-medium">Archivo muy grande</p>
              <p className="text-amber-200 text-xs mt-1">{errorMsg}</p>
            </div>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="mt-2 text-xs text-amber-200 hover:text-white underline"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}
