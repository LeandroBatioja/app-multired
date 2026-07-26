'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { filesApi } from '@/lib/api';

interface FilePreviewProps {
  fileId: number;
  fileName: string;
  extension: string | null;
  onClose: () => void;
}

const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];

export default function FilePreview({ fileId, fileName, extension, onClose }: FilePreviewProps) {
  const ext = extension?.toLowerCase() || '';
  const isImage = imageExtensions.includes(ext);
  const isPdf = ext === 'pdf';
  const isDocx = ext === 'docx';
  const isExcel = ext === 'xlsx' || ext === 'xls';
  const previewUrl = filesApi.getPreviewUrl(fileId);
  const downloadUrl = filesApi.getDownloadUrl(fileId);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-gray-800 dark:text-gray-100 truncate pr-4">{fileName}</h3>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={downloadUrl}
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Descargar
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-50 dark:bg-gray-900 min-h-[400px]">
          {isImage ? (
            <img
              src={previewUrl}
              alt={fileName}
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm"
            />
          ) : isPdf ? (
            <iframe
              src={previewUrl}
              className="w-full h-[70vh] rounded-lg border border-gray-200 dark:border-gray-600"
              title={fileName}
            />
          ) : isDocx ? (
            <DocxPreview url={previewUrl} />
          ) : isExcel ? (
            <ExcelPreview url={previewUrl} />
          ) : (
            <div className="text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-1">Vista previa no disponible</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">Este tipo de archivo no se puede previsualizar en el navegador</p>
              <a
                href={downloadUrl}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Descargar para abrir
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DocxPreview({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Error al descargar');
        const blob = await res.blob();
        const buffer = await blob.arrayBuffer();

        if (cancelled) return;

        const docx = await import('docx-preview');
        if (cancelled) return;

        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          await docx.renderAsync(buffer, containerRef.current);
        }
        if (!cancelled) setLoading(false);
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    render();
    return () => { cancelled = true; };
  }, [url]);

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 mb-2">No se pudo cargar la vista previa del documento</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm">Intenta descargar el archivo para verlo</p>
      </div>
    );
  }

  return (
    <div className="w-full max-h-[70vh] overflow-auto">
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mr-3" />
          <span className="text-gray-500 dark:text-gray-400">Cargando documento...</span>
        </div>
      )}
      <div
        ref={containerRef}
        className={`docx-preview bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm ${loading ? 'hidden' : ''}`}
        style={{ fontSize: '14px', lineHeight: '1.6' }}
      />
    </div>
  );
}

function ExcelPreview({ url }: { url: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [html, setHtml] = useState('');
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const workbookRef = useRef<any>(null);

  const renderSheet = useCallback((workbook: any, index: number) => {
    const name = workbook.SheetNames[index];
    if (!name) return;
    const sheet = workbook.Sheets[name];
    const newHtml = workbook.utils.sheet_to_html(sheet);
    setHtml(newHtml);
    setActiveSheet(index);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Error al descargar');
        const blob = await res.blob();
        const buffer = await blob.arrayBuffer();

        if (cancelled) return;

        const XLSX = await import('xlsx');
        if (cancelled) return;

        const workbook = XLSX.read(buffer, { type: 'array' });
        if (cancelled) return;

        workbookRef.current = workbook;
        setSheetNames(workbook.SheetNames);
        renderSheet(workbook, 0);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    render();
    return () => { cancelled = true; };
  }, [url, renderSheet]);

  const handleSheetChange = (index: number) => {
    if (workbookRef.current) {
      renderSheet(workbookRef.current, index);
    }
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 mb-2">No se pudo cargar la vista previa de la hoja de cálculo</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm">Intenta descargar el archivo para verlo</p>
      </div>
    );
  }

  return (
    <div className="w-full max-h-[70vh] overflow-auto">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mr-3" />
          <span className="text-gray-500 dark:text-gray-400">Cargando hoja de cálculo...</span>
        </div>
      ) : (
        <>
          {sheetNames.length > 1 && (
            <div className="flex gap-1 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2 overflow-x-auto">
              {sheetNames.map((name, i) => (
                <button
                  key={i}
                  onClick={() => handleSheetChange(i)}
                  className={`px-3 py-1 text-sm rounded-md whitespace-nowrap transition-colors ${
                    i === activeSheet
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
          <div
            className="excel-preview bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-auto"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </>
      )}
    </div>
  );
}
