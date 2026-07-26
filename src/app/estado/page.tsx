'use client';

import { useState, useEffect, useCallback } from 'react';
import { filesApi, FileData } from '@/lib/api';
import StorageBar from '@/components/StorageBar';

export default function EstadoPage() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [storageStats, setStorageStats] = useState<{ used: number; total: number; file_count: number } | null>(null);
  const [selectedFile, setSelectedFile] = useState<number | null>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [filesData, stats] = await Promise.all([
        filesApi.list(),
        filesApi.storageStats(),
      ]);
      setFiles(filesData);
      setStorageStats(stats);
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadVersions = async (fileId: number) => {
    setSelectedFile(fileId);
    try {
      const v = await filesApi.versions(fileId);
      setVersions(v);
    } catch (e) {
      console.error('Error loading versions:', e);
    }
  };

  const handleVerify = async (fileId: number) => {
    try {
      const result = await filesApi.verify(fileId);
      setVerifyResult(result);
      setTimeout(() => setVerifyResult(null), 5000);
    } catch (e: any) {
      alert(e.message || 'Error al verificar');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Estado y actividad</h2>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-4">Estado de guardado</h3>
            <div className="space-y-3">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-800">{file.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {file.synced ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Sincronizado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                        Pendiente
                      </span>
                    )}
                    <button
                      onClick={() => loadVersions(file.id)}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      Versiones
                    </button>
                    <button
                      onClick={() => handleVerify(file.id)}
                      className="text-gray-500 hover:text-gray-700 text-xs font-medium"
                    >
                      Verificar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedFile && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-800">
                  Historial de versiones - {files.find((f) => f.id === selectedFile)?.name}
                </h3>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {versions.length === 0 ? (
                <p className="text-gray-500 text-sm">No hay versiones disponibles</p>
              ) : (
                <div className="space-y-2">
                  {versions.map((v) => (
                    <div key={v.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="font-medium text-gray-800">Versión {v.version_number}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(v.created_at).toLocaleString('es')}
                        </p>
                      </div>
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Restaurar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {verifyResult && (
            <div className={`border rounded-lg p-4 ${
              verifyResult.integrity_ok
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <p className="font-medium">{verifyResult.message}</p>
            </div>
          )}

          {storageStats && (
            <StorageBar used={storageStats.used} total={storageStats.total} />
          )}
        </>
      )}
    </div>
  );
}
