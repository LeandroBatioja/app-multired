'use client';

import { useState, useEffect, useCallback } from 'react';
import { filesApi, FileData } from '@/lib/api';
import BackupStatus from '@/components/BackupStatus';

export default function RespaldoPage() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await filesApi.list();
      setFiles(data);
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const backedUp = files.filter((f) => f.backup_locations >= 2).length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Respaldo y disponibilidad</h2>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="font-medium text-gray-800 dark:text-gray-100 mb-4">Estado del respaldo multired</h3>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-medium text-gray-800 dark:text-gray-100">
              {backedUp} de {files.length} archivos respaldados
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tus archivos están seguros en múltiples ubicaciones
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-700 dark:text-gray-200">Estado por archivo</h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {files.map((file) => (
              <div key={file.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium text-gray-800 dark:text-gray-100">{file.name}</span>
                </div>
                <BackupStatus locations={file.backup_locations} />
              </div>
            ))}
            {files.length === 0 && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No hay archivos para respaldar
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
