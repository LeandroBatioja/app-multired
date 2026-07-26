'use client';

import { useEffect, useState } from 'react';
import { useFiles } from '@/context/FilesContext';
import FileCard from '@/components/FileCard';
import FolderCard from '@/components/FolderCard';
import UploadButton from '@/components/UploadButton';
import StorageBar from '@/components/StorageBar';
import NewFolderModal from '@/components/NewFolderModal';

export default function Home() {
  const {
    files, folders, loading, currentFolderId, storageStats,
    loadFiles, loadFolders, loadStorageStats, goBack,
  } = useFiles();
  const [showNewFolder, setShowNewFolder] = useState(false);

  useEffect(() => {
    loadFiles(currentFolderId);
    loadFolders(currentFolderId);
  }, [currentFolderId, loadFiles, loadFolders]);

  useEffect(() => {
    loadStorageStats();
  }, [loadStorageStats]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {currentFolderId !== null && (
            <button
              onClick={goBack}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Mis archivos</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewFolder(true)}
            className="inline-flex items-center gap-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nueva carpeta
          </button>
          <UploadButton />
        </div>
      </div>

      {showNewFolder && (
        <NewFolderModal onClose={() => setShowNewFolder(false)} />
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {folders.length > 0 && (
            <section>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Carpetas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {folders.map((folder) => (
                  <FolderCard key={folder.id} folder={folder} />
                ))}
              </div>
            </section>
          )}

          {files.length > 0 && (
            <section>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Archivos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {files.map((file) => (
                  <FileCard key={file.id} file={file} />
                ))}
              </div>
            </section>
          )}

          {folders.length === 0 && files.length === 0 && (
            <div className="text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400 text-lg">No hay archivos aún</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Sube tu primer archivo o crea una carpeta</p>
            </div>
          )}
        </>
      )}

      {storageStats && (
        <StorageBar used={storageStats.used} total={storageStats.total} />
      )}
    </div>
  );
}
